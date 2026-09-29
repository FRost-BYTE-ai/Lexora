"""
Lexora Core Chatbot Engine
==========================
Integrates:
1. Multi-Corpus Hybrid RAG (Constitution, BNS, BNSS, BSA, Tamil Nadu Law)
2. Advanced Legal Query Understanding Layer
3. Dense (E5) + Sparse (BM25 token hash) + RRF Reranking + Metadata Filtering
4. Evidence Sufficiency Validation & Hallucination Guard
5. Natural Adaptive Legal Response Generation
6. Multi-Turn Session Memory & Strict Consultation Isolation
7. Voice & Document Analysis Endpoints
"""

import os
import sys
import time
import json
import re
import uuid
import torch
from threading import Thread

# Fix Windows console UTF-8 output encoding
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, SparseVector

from chatbot.query_understanding import understand_query
from chatbot.evidence_validator import EvidenceValidator
from chatbot.larv import larv_engine
from chatbot.response_formatter import clean_llm_response, build_system_prompt
from chatbot.session_manager import SessionManager
from chatbot.document_analyzer import DocumentAnalyzer



class LexoraChatbot:
    def __init__(self, config=None):
        self.config = config or {}
        
        # Load Embedding Model
        t0 = time.time()
        print("Loading SentenceTransformer embedding model (intfloat/multilingual-e5-small)...")
        self.embed_model = SentenceTransformer("intfloat/multilingual-e5-small", device='cpu')
        print(f"Loaded Embedding Model in {time.time()-t0:.2f}s")
        
        # Initialize Qdrant Client
        self.qdrant_path = r"C:\Lexora\data\rag\qdrant"
        self.qdrant = QdrantClient(path=self.qdrant_path)
        
        # Available Corpora
        self.available_collections = ["constitution", "bns", "bnss", "bsa", "tamilnadu", "supreme_court_judgments"]
        
        # Load LLM
        t0 = time.time()
        self.base_model_id = r"C:\Lexora\models\qwen3-0.6b-base"
        print("Loading Qwen tokenizer and base model...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_id)
        
        if self.config.get("use_lora", False):
            print("Loading LoRA adapter...")
            base_model = AutoModelForCausalLM.from_pretrained(
                self.base_model_id,
                device_map="cpu",
                torch_dtype=torch.float32
            )
            try:
                from peft import PeftModel
                self.model = PeftModel.from_pretrained(base_model, r"C:\Lexora\models\qwen3-0.6b-lora-pilot")
                self.lora_active = True
            except Exception as e:
                raise RuntimeError(f"Failed to load LoRA adapter. Halting to avoid silent fallback. Error: {e}")
        else:
            self.lora_active = False
            self.model = AutoModelForCausalLM.from_pretrained(
                self.base_model_id,
                device_map="cpu",
                torch_dtype=torch.float32
            )
        print(f"Loaded LLM in {time.time()-t0:.2f}s")
        
        # Session Manager & Supporting Modules
        self.session_manager = SessionManager()
        self.evidence_validator = EvidenceValidator(rrf_threshold=0.007)
        self.doc_analyzer = DocumentAnalyzer()
        self.larv = larv_engine
        # Configurable ablation flag
        self.use_larv = self.config.get("use_larv", os.environ.get("USE_LARV", "true").lower() == "true")


    def start_consultation(self, title: str = "New Legal Consultation") -> str:
        """Initializes a new isolated consultation session."""
        return self.session_manager.create_session(title=title)

    def get_sparse_vector(self, text: str) -> SparseVector:
        """Generates deterministic sparse vector representations for BM25/keyword retrieval."""
        from chatbot.sparse_utils import compute_sparse_vector
        indices, values = compute_sparse_vector(text)
        return SparseVector(indices=indices, values=values)

    def retrieve_from_corpus(self, collection_name: str, query_dense: list, query_sparse: SparseVector, filters: dict, limit: int = 10):
        """Executes filtered or unfiltered hybrid retrieval on a single Qdrant collection."""
        try:
            if not self.qdrant.collection_exists(collection_name=collection_name):
                return [], []
        except Exception:
            return [], []

        q_filter = None
        conds = []
        
        # Apply Collection-specific metadata filters
        if collection_name == "constitution" and filters.get("article_number"):
            conds.append(FieldCondition(key="article_number", match=MatchValue(value=filters["article_number"])))
            if filters.get("clause"):
                conds.append(FieldCondition(key="clause", match=MatchValue(value=filters["clause"])))
            if filters.get("subclause"):
                conds.append(FieldCondition(key="subclause", match=MatchValue(value=filters["subclause"])))
        elif collection_name in ["bns", "bnss", "bsa", "tamilnadu"] and filters.get("section_number"):
            conds.append(FieldCondition(key="section_number", match=MatchValue(value=filters["section_number"])))

        if conds:
            q_filter = Filter(must=conds)

        try:
            dense_res = self.qdrant.query_points(
                collection_name=collection_name,
                query=query_dense,
                using="",
                limit=limit,
                query_filter=q_filter
            ).points
        except Exception as e:
            dense_res = []

        try:
            sparse_res = self.qdrant.query_points(
                collection_name=collection_name,
                query=query_sparse,
                using="text_sparse",
                limit=limit,
                query_filter=q_filter
            ).points
        except Exception as e:
            sparse_res = []

        return dense_res, sparse_res

    def execute_multi_corpus_retrieval(self, query_plan: dict):
        """
        Performs multi-corpus retrieval (Dense E5 + Sparse BM25) -> RRF Fusion -> LARV Candidate Ranking.
        Returns:
            final_docs: list of top candidate records
            rrf_scores: dict mapping doc.id -> rrf score
            larv_diagnostics: list of LARV scoring explanations
        """
        retrieval_query = query_plan["retrieval_query"]
        target_corpora = query_plan["selected_corpora"]
        filters = query_plan.get("filters", {})
        
        # Dense & Sparse Query Embeddings
        q_dense = self.embed_model.encode("query: " + retrieval_query, convert_to_numpy=True).tolist()
        q_sparse = self.get_sparse_vector(retrieval_query)
        
        all_dense = []
        all_sparse = []
        
        # Candidate depth configurable via larv_config.json
        candidate_limit = self.larv.config.get("top_k_candidates", 30) // max(len(target_corpora), 1)
        candidate_limit = max(candidate_limit, 8)

        for corpus in target_corpora:
            d_res, s_res = self.retrieve_from_corpus(corpus, q_dense, q_sparse, filters, limit=candidate_limit)
            all_dense.extend(d_res)
            all_sparse.extend(s_res)
            
        # Reciprocal Rank Fusion (RRF) (k=60)
        scores = {}
        docs = {}
        
        for rk, r in enumerate(all_dense, 1):
            rid = str(r.id)
            scores[rid] = scores.get(rid, 0) + 1.0 / (60 + rk)
            docs[rid] = r
            
        for rk, r in enumerate(all_sparse, 1):
            rid = str(r.id)
            scores[rid] = scores.get(rid, 0) + 1.0 / (60 + rk)
            docs[rid] = r
            
        rrf_ranked_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        rrf_candidates = [docs[i] for i in rrf_ranked_ids[:self.larv.config.get("top_k_candidates", 30)]]
        
        larv_diagnostics = []

        if self.use_larv and self.larv.config.get("enabled", True):
            # Domain-specific LARV ranking
            domain = query_plan.get("domain", "legal")
            ranked_results = self.larv.rank(
                query_plan=query_plan,
                candidates=rrf_candidates,
                domain=domain,
                jurisdiction=query_plan.get("jurisdiction"),
                rrf_scores=scores,
                top_k=self.larv.config.get("final_evidence_k", 5)
            )
            top_docs = [r[0] for r in ranked_results]
            larv_diagnostics = [
                {
                    "id": str(r[0].id),
                    "document_title": r[0].payload.get("document_title", r[0].payload.get("act_name", r[0].payload.get("case_name", ""))),
                    "article_or_section": f"Article {r[0].payload.get('article_number')}" if r[0].payload.get("article_number") else (f"Section {r[0].payload.get('section_number')}" if r[0].payload.get("section_number") else (r[0].payload.get("citation", "Judgment"))),
                    "rrf_score": round(scores.get(str(r[0].id), 0.0), 6),
                    "larv_score": r[1]["larv_score"],
                    "components": r[1]["components"],
                    "rank_reason": r[1]["rank_reason"],
                    "potential_conflict": r[1]["potential_conflict"],
                    "source_authority": r[0].payload.get("source_authority", "Official Source")
                }
                for r in ranked_results
            ]
        else:
            # Baseline RRF fallback
            top_docs = rrf_candidates[:self.larv.config.get("final_evidence_k", 5)]

        return top_docs, scores, larv_diagnostics


    def format_evidence_and_sources(self, top_docs: list):
        """Constructs evidence context string and structured source metadata for UI inspection."""
        evidence_text = ""
        source_metadata = []
        
        for doc in top_docs:
            p = doc.payload
            doc_type = p.get("document_type", "Act")
            doc_title = p.get("document_title", p.get("act_name", p.get("case_name", "Statute")))
            authority = p.get("source_authority", "Official Indian Legal Source")
            url = p.get("canonical_source_url") or p.get("source_url", "")
            
            if doc_type == "judgment" or "case_name" in p or "judgment" in str(p.get("record_id", "")):
                c_name = p.get("case_name", "Landmark Judgment")
                cit = p.get("citation", "")
                court = p.get("court", "Supreme Court of India")
                provisions = ", ".join(p.get("legal_provisions", []))
                holdings = " | ".join(p.get("holdings", [])) if isinstance(p.get("holdings"), list) else p.get("holdings", "")
                ratio = " | ".join(p.get("ratio", [])) if isinstance(p.get("ratio"), list) else p.get("ratio", "")
                text = p.get("text", "")
                
                evidence_text += f"[Judicial Precedent: {c_name} | Citation: {cit} | Court: {court} | Provisions Interpreted: {provisions} | Key Holding: {holdings}]\n{text}\nRatio Decidendi: {ratio}\n\n"
                source_metadata.append({
                    "act_name": court,
                    "article_or_section": cit if cit else "Judicial Precedent",
                    "heading": c_name,
                    "document_title": f"{c_name} {cit}",
                    "authority": authority,
                    "url": url,
                    "is_official": True,
                    "text_excerpt": text[:400] + "..." if len(text) > 400 else text
                })
            elif "Constitution" in doc_type or "constitution" in p.get("record_id", ""):
                art_num = p.get("article_number", "")
                heading = p.get("heading") or p.get("article_title") or f"Article {art_num}"
                text = p.get("text", "")
                evidence_text += f"[Document: {doc_title} | Article: {art_num} | Heading: {heading}]\n{text}\n\n"
                source_metadata.append({
                    "act_name": "Constitution of India",
                    "article_or_section": f"Article {art_num}" if art_num else "Preamble/Part",
                    "heading": heading,
                    "document_title": doc_title,
                    "authority": authority,
                    "url": url,
                    "is_official": True,
                    "text_excerpt": text[:300] + "..." if len(text) > 300 else text
                })
            else:
                sec_num = p.get("section_number", "")
                sec_heading = p.get("section_heading") or f"Section {sec_num}"
                text = p.get("text", "")
                evidence_text += f"[Document: {doc_title} | Section: {sec_num} | Heading: {sec_heading}]\n{text}\n\n"
                source_metadata.append({
                    "act_name": doc_title,
                    "article_or_section": f"Section {sec_num}" if sec_num else "Statutory Provision",
                    "heading": sec_heading,
                    "document_title": doc_title,
                    "authority": authority,
                    "url": url,
                    "is_official": True,
                    "text_excerpt": text[:300] + "..." if len(text) > 300 else text
                })
                
        return evidence_text, source_metadata

    def process_message(self, conv_id: str, user_message: str, language: str = None, jurisdiction: str = None) -> dict:
        """
        Main query processing method.
        Handles text messages, voice transcripts, and document inquiries.
        """
        metrics = {}
        t_start = time.time()
        
        # 1. Retrieve or Create Consultation Session
        session = self.session_manager.get_session(conv_id)
        conv_context = session.get_conversation_context()
        
        # 2. Query Understanding Layer
        t_understand = time.time()
        query_plan = understand_query(user_message, session_turns=session.turns, explicit_lang=language, explicit_jurisdiction=jurisdiction)
        metrics["query_understanding_time"] = time.time() - t_understand
        
        # 3. Scope Gate
        if query_plan["legal_scope"] == "CASUAL":
            lower_msg = user_message.lower().strip()
            cleaned_lower = re.sub(r'[^\w\s]', '', lower_msg).strip()
            
            if "who are you" in cleaned_lower or "who r u" in cleaned_lower:
                response = "I'm Lexora, a Tamil-first legal and citizen assistance platform. I can help you understand legal information, search laws, analyze documents, find government schemes, explore cases, and more."
            elif "what can you do" in cleaned_lower or "features" in cleaned_lower or "capabilities" in cleaned_lower:
                response = "I can help you search Indian statutory laws (BNS, BNSS, BSA, Constitution, Tamil Nadu laws), find official government schemes, explore legal cases, analyze and extract uploaded documents or camera scans, draft complaints and legal notices, and provide bilingual voice consultations in English and Tamil."
            elif "good morning" in cleaned_lower:
                response = "Good morning! How can I help?"
            elif "good afternoon" in cleaned_lower:
                response = "Good afternoon! How can I help?"
            elif "good evening" in cleaned_lower:
                response = "Good evening! How can I help?"
            elif cleaned_lower in ["hello", "vanakkam", "namaste"]:
                response = "Hello! 👋 What can I help you with today?"
            else:
                response = "Hi! 👋 I'm Lexora. What would you like to do?"
                
            metrics["total_time"] = time.time() - t_start
            session.add_turn("user", user_message, {"scope": "CASUAL", "query_plan": query_plan})
            session.add_turn("assistant", response, {"scope": "CASUAL"})
            return {
                "response": response,
                "metrics": metrics,
                "scope": "CASUAL",
                "query_plan": query_plan,
                "retrieved_records": 0,
                "source_metadata": [],
                "evidence_passed": ""
            }

        if query_plan["legal_scope"] == "NON_LEGAL":
            response = "I only help with legal queries."
            metrics["total_time"] = time.time() - t_start
            session.add_turn("user", user_message, {"scope": "NON_LEGAL"})
            session.add_turn("assistant", response, {"scope": "NON_LEGAL"})
            return {
                "response": response,
                "metrics": metrics,
                "scope": "NON_LEGAL",
                "query_plan": query_plan,
                "retrieved_records": 0,
                "source_metadata": [],
                "evidence_passed": ""
            }
            
        if query_plan["legal_scope"] == "AMBIGUOUS":
            response = "Could you please specify the factual situation or legal issue you would like information on?"
            metrics["total_time"] = time.time() - t_start
            session.add_turn("user", user_message, {"scope": "AMBIGUOUS"})
            session.add_turn("assistant", response, {"scope": "AMBIGUOUS"})
            return {
                "response": response,
                "metrics": metrics,
                "scope": "AMBIGUOUS",
                "query_plan": query_plan,
                "retrieved_records": 0,
                "source_metadata": [],
                "evidence_passed": ""
            }
            
        # 4. Multi-Corpus Hybrid Retrieval
        t_ret = time.time()
        top_docs, rrf_scores, larv_diagnostics = self.execute_multi_corpus_retrieval(query_plan)
        metrics["retrieval_time"] = time.time() - t_ret
        
        # 5. Evidence Sufficiency Validation
        is_sufficient, reason = self.evidence_validator.validate_retrieval(query_plan, top_docs, rrf_scores)
        evidence_text, source_metadata = self.format_evidence_and_sources(top_docs)

        
        # Inject Session Document text if uploaded
        doc_text = session.get_documents_text()
        if doc_text:
            evidence_text = f"Uploaded Consultation Documents:\n{doc_text}\n\nAuthoritative Statutory Evidence:\n{evidence_text}"

        if not is_sufficient:
            response = self.evidence_validator.build_insufficient_response(query_plan, reason)
            metrics["total_time"] = time.time() - t_start
            session.add_turn("user", user_message, {"scope": "LEGAL", "sufficient": False, "query_plan": query_plan, "larv_diagnostics": larv_diagnostics})
            session.add_turn("assistant", response, {"scope": "LEGAL", "sufficient": False})
            return {
                "response": response,
                "metrics": metrics,
                "scope": "LEGAL",
                "query_plan": query_plan,
                "retrieved_records": len(top_docs),
                "source_metadata": source_metadata,
                "evidence_passed": evidence_text,
                "evidence_sufficient": False,
                "reason": reason,
                "larv_diagnostics": larv_diagnostics
            }

            
        # 6. Prompt Construction
        t_prompt = time.time()
        system_prompt = build_system_prompt(query_plan)
        user_prompt = f"Authoritative Legal Evidence:\n{evidence_text}\n\nUser Question: {user_message}"
        
        messages = [
            {"role": "system", "content": system_prompt}
        ] + conv_context + [
            {"role": "user", "content": user_prompt}
        ]
        
        prompt_text = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer([prompt_text], return_tensors="pt").to("cpu")
        metrics["prompt_construction_time"] = time.time() - t_prompt
        
        # 7. LLM Generation
        t_gen_start = time.time()
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=256,
                do_sample=False,
                eos_token_id=[151643, 151645],
                pad_token_id=151643
            )
        
        gen_tokens = outputs[0][inputs["input_ids"].shape[1]:]
        generated_text = self.tokenizer.decode(gen_tokens, skip_special_tokens=True)
        gen_time = time.time() - t_gen_start
        metrics["generation_time"] = gen_time
        metrics["tokens_generated"] = len(gen_tokens)
        metrics["generation_speed_tok_s"] = round(len(gen_tokens) / max(gen_time, 0.001), 2)
        metrics["total_time"] = time.time() - t_start
        
        cleaned_response = clean_llm_response(generated_text)
        
        # Post-generation Hallucination Verification
        guarded_response, has_fabrication, fabricated_items = self.evidence_validator.guard_hallucination(
            cleaned_response, evidence_text, query_plan=query_plan
        )
        
        # 8. Record in Session Memory
        is_sufficient = not has_fabrication
        session.add_turn("user", user_message, {"scope": "LEGAL", "sufficient": is_sufficient, "query_plan": query_plan, "larv_diagnostics": larv_diagnostics})
        session.add_turn("assistant", guarded_response, {"scope": "LEGAL", "sufficient": is_sufficient, "sources": len(source_metadata)})
        
        return {
            "response": guarded_response,
            "metrics": metrics,
            "scope": "LEGAL",
            "query_plan": query_plan,
            "retrieved_records": len(top_docs),
            "source_metadata": source_metadata,
            "evidence_passed": evidence_text,
            "evidence_sufficient": is_sufficient,
            "fabricated_items": fabricated_items,
            "larv_diagnostics": larv_diagnostics
        }


    def process_voice_message(self, conv_id: str, transcript: str, language: str = None, jurisdiction: str = None) -> dict:
        """Processes voice queries through the exact same legal intelligence pipeline."""
        result = self.process_message(conv_id, transcript, language=language, jurisdiction=jurisdiction)
        result["is_voice"] = True
        
        # Natural spoken voice summary
        full_resp = result.get("response", "")
        scope = result.get("scope", "LEGAL")
        sources = result.get("source_metadata", [])
        
        if scope == "CASUAL":
            voice_summary = full_resp
        elif scope == "NON_LEGAL":
            voice_summary = "I only help with legal queries."
        elif sources and len(full_resp) > 200:
            first_sentence = full_resp.split(".")[0].strip()
            voice_summary = f"{first_sentence}. I have displayed the detailed statutory provisions and authoritative citations on your screen."
        else:
            voice_summary = full_resp
            
        result["voice_summary"] = voice_summary
        return result

    def upload_document(self, conv_id: str, file_bytes: bytes, filename: str) -> dict:
        """Uploads and indexes document into the current consultation session."""
        session = self.session_manager.get_session(conv_id)
        text = self.doc_analyzer.extract_text_from_bytes(file_bytes, filename)
        doc_id = session.add_document(filename, text)
        analysis = self.doc_analyzer.analyze_document_content(text, filename)
        return {
            "session_id": conv_id,
            "doc_id": doc_id,
            "filename": filename,
            "char_count": len(text),
            "preview": self.doc_analyzer.summarize_document(text),
            "analysis": analysis
        }

    def search_legal_library(self, query: str, corpus: str = None, limit: int = 15) -> list[dict]:
        """Direct search across the authoritative Indian legal corpora for Legal Library."""
        query_str = (query or "").strip()
        if not query_str or query_str == "*":
            target_corpora = [corpus] if corpus and corpus in self.available_collections else self.available_collections
            top_ranked = []
            for c in target_corpora:
                try:
                    if self.qdrant.collection_exists(collection_name=c):
                        pts, _ = self.qdrant.scroll(collection_name=c, limit=limit, with_payload=True)
                        top_ranked.extend(pts)
                except Exception:
                    pass
        else:
            query_plan = understand_query(query_str)
            target_corpora = [corpus] if corpus and corpus in self.available_collections else query_plan["selected_corpora"]
            
            q_dense = self.embed_model.encode("query: " + query_str, convert_to_numpy=True).tolist()
            q_sparse = self.get_sparse_vector(query_str)
            filters = query_plan.get("filters", {})
            
            all_dense = []
            all_sparse = []
            for c in target_corpora:
                d_res, s_res = self.retrieve_from_corpus(c, q_dense, q_sparse, filters, limit=limit)
                all_dense.extend(d_res)
                all_sparse.extend(s_res)
                
            scores = {}
            docs = {}
            for rk, r in enumerate(all_dense, 1):
                rid = str(r.id)
                scores[rid] = scores.get(rid, 0) + 1.0 / (60 + rk)
                docs[rid] = r
            for rk, r in enumerate(all_sparse, 1):
                rid = str(r.id)
                scores[rid] = scores.get(rid, 0) + 1.0 / (60 + rk)
                docs[rid] = r
            rrf_ranked_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
            rrf_candidates = [docs[i] for i in rrf_ranked_ids[:max(limit * 2, 30)]]
            
            if self.use_larv and self.larv.config.get("enabled", True):
                ranked_results = self.larv.rank(
                    query_plan=query_plan,
                    candidates=rrf_candidates,
                    domain="legal",
                    jurisdiction=query_plan.get("jurisdiction"),
                    rrf_scores=scores,
                    top_k=limit
                )
                top_ranked = [r[0] for r in ranked_results]
            else:
                top_ranked = rrf_candidates[:limit]

        results = []
        for doc in top_ranked:

            p = doc.payload
            doc_type = p.get("document_type", "Statute")
            doc_title = p.get("document_title", p.get("act_name", "Statute"))
            authority = p.get("source_authority", "Official Indian Legal Source")
            url = p.get("canonical_source_url") or p.get("source_url", "")
            
            if doc_type == "judgment" or "case_name" in p or "supreme_court_judgments" in str(p.get("record_id", "")):
                c_name = p.get("case_name", "Landmark Judgment")
                cit = p.get("citation", "")
                court = p.get("court", "Supreme Court of India")
                text = p.get("text", "")
                results.append({
                    "id": str(doc.id),
                    "corpus": "supreme_court_judgments",
                    "title": f"{c_name} {cit}",
                    "act_name": court,
                    "article_or_section": cit if cit else "Judicial Precedent",
                    "heading": c_name,
                    "jurisdiction": p.get("jurisdiction", "Central / India"),
                    "authority": authority,
                    "url": url,
                    "legal_status": p.get("legal_status", "Active Precedent"),
                    "text": text
                })
            elif "Constitution" in doc_type or "constitution" in str(p.get("record_id", "")):
                art_num = p.get("article_number", "")
                heading = p.get("heading") or p.get("article_title") or f"Article {art_num}"
                text = p.get("text", "")
                results.append({
                    "id": str(doc.id),
                    "corpus": "constitution",
                    "title": f"Article {art_num} — {heading}",
                    "act_name": "Constitution of India",
                    "article_or_section": f"Article {art_num}" if art_num else "Provision",
                    "heading": heading,
                    "jurisdiction": "Central / India",
                    "authority": authority,
                    "url": url,
                    "legal_status": p.get("legal_status", "Active"),
                    "text": text
                })
            else:
                sec_num = p.get("section_number", "")
                sec_heading = p.get("section_heading") or f"Section {sec_num}"
                text = p.get("text", "")
                c_name = "bns" if "Nyaya" in doc_title else ("bnss" if "Nagarik" in doc_title else ("bsa" if "Sakshya" in doc_title else "tamilnadu"))
                results.append({
                    "id": str(doc.id),
                    "corpus": c_name,
                    "title": f"{doc_title} — Section {sec_num}",
                    "act_name": doc_title,
                    "article_or_section": f"Section {sec_num}" if sec_num else "Provision",
                    "heading": sec_heading,
                    "jurisdiction": "Tamil Nadu" if c_name == "tamilnadu" else "Central / India",
                    "authority": authority,
                    "url": url,
                    "legal_status": p.get("legal_status", "Active"),
                    "text": text
                })
        return results
