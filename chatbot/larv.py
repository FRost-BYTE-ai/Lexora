"""
Lexora Adaptive Retrieval & Verification (LARV) Layer
=====================================================
Adaptive evidence ranking and verification layer operating AFTER
hybrid retrieval/RRF and BEFORE final evidence selection/generation.

Conceptual Scoring Formula:
    LARV(q,d) =
        α * SemanticSimilarity
      + β * KeywordRelevance
      + γ * Authority
      + δ * JurisdictionMatch
      + ε * StructuralMatch
      + ζ * Recency
      + η * IntentMatch
      - λ * ConflictPenalty

All components are strictly normalized to [0.0, 1.0].
Weights are domain-configurable and loaded from config/larv_config.json.
Execution is completely deterministic (no randomized hash).
"""

import os
import json
import re
import datetime
from typing import Dict, List, Any, Optional, Tuple


DEFAULT_CONFIG = {
    "enabled": True,
    "top_k_candidates": 30,
    "top_k_ranked": 10,
    "final_evidence_k": 5,
    "min_confidence_threshold": 0.25,
    "domains": {
        "legal": {
            "semantic": 0.25,
            "keyword": 0.15,
            "authority": 0.20,
            "jurisdiction": 0.10,
            "structural": 0.15,
            "recency": 0.05,
            "intent": 0.10,
            "conflict": 0.15
        },
        "scheme": {
            "semantic": 0.20,
            "keyword": 0.20,
            "authority": 0.15,
            "jurisdiction": 0.10,
            "structural": 0.10,
            "recency": 0.10,
            "intent": 0.15,
            "conflict": 0.10
        },

        "case": {
            "semantic": 0.20,
            "keyword": 0.15,
            "authority": 0.25,
            "jurisdiction": 0.10,
            "structural": 0.15,
            "recency": 0.05,
            "intent": 0.10,
            "conflict": 0.15
        }
    },
    "authority_weights": {
        "constitution": 1.0,
        "statute_primary": 0.95,
        "gazette": 0.95,
        "supreme_court": 0.90,
        "high_court": 0.85,
        "official_government": 0.85,
        "official_scheme_portal": 0.85,
        "secondary_legal": 0.50,
        "unverified": 0.30
    }
}


class LARV:
    """
    Lexora Adaptive Retrieval & Verification engine.
    Ranks, verifies, and filters retrieved candidates without modifying
    provenance or generating hallucinatory text.
    """

    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "config",
            "larv_config.json"
        )
        self.config = self._load_config()

    def _load_config(self) -> dict:
        """Loads configuration file or falls back to default safely."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    # Merge with default to guarantee all keys exist
                    merged = json.loads(json.dumps(DEFAULT_CONFIG))
                    for k, v in cfg.items():
                        if isinstance(v, dict) and k in merged and isinstance(merged[k], dict):
                            merged[k].update(v)
                        else:
                            merged[k] = v
                    return merged
            except Exception as e:
                print(f"[LARV] Warning: Error loading config ({e}), using default.")
        return json.loads(json.dumps(DEFAULT_CONFIG))

    def reload_config(self):
        """Reloads configuration dynamically from disk."""
        self.config = self._load_config()

    def _extract_payload(self, candidate: Any) -> dict:
        """Extracts dictionary payload regardless of candidate object type."""
        if isinstance(candidate, dict):
            # Might be raw dict or Qdrant ScoredPoint dict
            if "payload" in candidate and isinstance(candidate["payload"], dict):
                return candidate["payload"]
            return candidate
        elif hasattr(candidate, "payload") and isinstance(candidate.payload, dict):
            return candidate.payload
        return {}

    def _extract_doc_id(self, candidate: Any) -> str:
        """Extracts deterministic ID string from candidate."""
        if hasattr(candidate, "id"):
            return str(candidate.id)
        if isinstance(candidate, dict):
            return str(candidate.get("id", candidate.get("record_id", "")))
        return ""

    def _compute_semantic_score(self, candidate: Any, rrf_score: Optional[float] = None) -> float:
        """
        Reuses existing dense score or RRF score if dense is absent.
        Normalizes to [0.0, 1.0].
        """
        # 1. Direct dense score if present
        raw_score = None
        if hasattr(candidate, "score") and candidate.score is not None:
            raw_score = candidate.score
        elif isinstance(candidate, dict) and "score" in candidate and candidate["score"] is not None:
            raw_score = candidate["score"]

        if raw_score is not None:
            # Cosine similarity in Qdrant typically [-1, 1] or [0, 1] for e5
            score_val = float(raw_score)
            if score_val < 0.0:
                score_val = max(0.0, (score_val + 1.0) / 2.0)
            elif score_val > 1.0:
                score_val = min(1.0, score_val / 2.0)
            return round(min(1.0, max(0.0, score_val)), 4)

        # 2. If RRF score passed, normalize RRF score (max RRF for k=60 with 2 lists is ~2/61 ≈ 0.0328)
        if rrf_score is not None and rrf_score > 0:
            norm_rrf = min(1.0, rrf_score / 0.033)
            return round(norm_rrf, 4)

        return 0.50

    def _compute_keyword_relevance(self, query_plan: dict, payload: dict) -> Tuple[float, List[str]]:
        """
        Calculates concept & keyword relevance using query_plan's expanded legal
        concepts, entities, and normalized tokens.
        """
        reasons = []
        text_corpus = (
            f"{payload.get('scheme_name', '')} "
            f"{payload.get('category', '')} "
            f"{payload.get('ministry', '')} "
            f"{payload.get('text', '')} "
            f"{payload.get('heading', '')} "
            f"{payload.get('section_heading', '')} "
            f"{payload.get('article_title', '')} "
            f"{payload.get('document_title', '')} "
            f"{payload.get('act_name', '')} "
            f"section {payload.get('section_number', '')} "
            f"article {payload.get('article_number', '')} "
            f"{payload.get('description', '')} "
            f"{payload.get('benefits', '')} "
            f"{payload.get('eligibility', '')} "
            f"{payload.get('summary', '')}"
        ).lower()

        if "nyaya" in text_corpus:
            text_corpus += " bns "
        if "nagarik" in text_corpus:
            text_corpus += " bnss "
        if "sakshya" in text_corpus:
            text_corpus += " bsa "


        matched_concepts = 0
        total_concepts = 0

        # 1. Expanded legal concepts from query plan
        concepts = query_plan.get("expanded_legal_concepts", []) or []
        for c in concepts:
            c_clean = c.lower().strip()
            if not c_clean or len(c_clean) < 3:
                continue
            total_concepts += 1
            if c_clean in text_corpus:
                matched_concepts += 1
            else:
                # Partial match if key words from concept appear in candidate text
                c_words = [w for w in c_clean.split() if len(w) > 3]
                if c_words and any(w in text_corpus for w in c_words):
                    matched_concepts += 0.5

        # 2. Scheme concepts / Beneficiary concepts
        scheme_concepts = query_plan.get("scheme_concepts", []) or []
        for sc in scheme_concepts:
            sc_clean = sc.lower().strip()
            if not sc_clean or len(sc_clean) < 3:
                continue
            total_concepts += 1
            if sc_clean in text_corpus:
                matched_concepts += 1
            else:
                sc_words = [w for w in sc_clean.split() if len(w) > 3]
                if sc_words and any(w in text_corpus for w in sc_words):
                    matched_concepts += 0.5

        # 3. Normalized query keywords (significant tokens >= 3 chars)
        norm_q = query_plan.get("normalized_query", "").lower()
        stopwords = {
            "what", "where", "which", "when", "with", "from", "that", "this", "have", "been", "under", "about",
            "the", "and", "for", "are", "can", "how", "who", "whom", "will", "shall", "does", "explain", "tell",
            "give", "some", "any", "government", "scheme", "schemes"
        }
        tokens = [t for t in re.findall(r'\b\w+\b', norm_q) if len(t) >= 3 and t not in stopwords]
        if not tokens:
            tokens = [t for t in re.findall(r'\b\w+\b', norm_q) if len(t) >= 3 and t not in {"the", "and", "for", "with"}]

        matched_tokens = 0
        for tok in tokens:
            if tok in text_corpus:
                matched_tokens += 1
            elif len(tok) >= 5 and tok[:4] in text_corpus:
                matched_tokens += 0.8

        token_ratio = (matched_tokens / len(tokens)) if tokens else 0.5
        concept_ratio = (matched_concepts / total_concepts) if total_concepts else token_ratio


        final_relevance = 0.6 * concept_ratio + 0.4 * token_ratio
        if concept_ratio >= 0.4:
            reasons.append(f"Matched {matched_concepts}/{total_concepts} legal/domain concepts")
        elif token_ratio >= 0.5:
            reasons.append("High query keyword overlap")

        return round(min(1.0, max(0.0, final_relevance)), 4), reasons


    def _compute_authority_score(self, payload: dict, domain: str) -> Tuple[float, List[str]]:
        """
        Determines authority score based on official source metadata.
        Zero fabrication: respects actual source indicators.
        """
        reasons = []
        auth_weights = self.config.get("authority_weights", DEFAULT_CONFIG["authority_weights"])
        doc_type = str(payload.get("document_type", "")).lower()
        doc_title = str(payload.get("document_title", payload.get("act_name", ""))).lower()
        authority = str(payload.get("source_authority", payload.get("official_source", payload.get("source", "")))).lower()
        url = str(payload.get("canonical_source_url", payload.get("official_url", payload.get("source_url", "")))).lower()

        # 1. Constitution
        if "constitution" in doc_type or "constitution" in doc_title or "constitution" in authority:
            reasons.append("Official Constitution of India")
            return auth_weights.get("constitution", 1.0), reasons

        # 2. Official Primary Statutes (BNS, BNSS, BSA, Tamil Nadu Acts)
        if any(stat in doc_title for stat in ["bharatiya nyaya", "bharatiya nagarik", "bharatiya sakshya", "co-operative societies", "tamil nadu"]):
            reasons.append("Official Primary Statutory Legislation")
            return auth_weights.get("statute_primary", 0.95), reasons

        # 3. Official Government Gazette or India Code
        if "indiacode" in url or "gazette" in authority or "official indian legal source" in authority:
            reasons.append("Official India Code / Gazette Repository")
            return auth_weights.get("gazette", 0.95), reasons

        # 4. Court Records
        court = str(payload.get("court", "")).lower()
        if "supreme court" in court or "supreme court" in authority:
            reasons.append("Supreme Court of India Official Judgment")
            return auth_weights.get("supreme_court", 0.90), reasons
        if "high court" in court or "high court" in authority:
            reasons.append("High Court Official Judgment")
            return auth_weights.get("high_court", 0.85), reasons

        # 5. Official Government Portals & Schemes
        if any(gov_domain in url for gov_domain in [".gov.in", ".nic.in", "myscheme.gov.in", "tn.gov.in"]):
            reasons.append("Official Government Portal (.gov.in / .nic.in)")
            return auth_weights.get("official_government", 0.85), reasons

        if payload.get("is_official", False) or "official" in authority:
            reasons.append("Verified Official Source")
            return auth_weights.get("official_government", 0.85), reasons

        # 6. Secondary / unverified
        if "kanoon" in url or "secondary" in authority:
            return auth_weights.get("secondary_legal", 0.50), reasons

        return auth_weights.get("unverified", 0.30), reasons

    def _compute_jurisdiction_match(self, query_plan: dict, payload: dict) -> Tuple[float, List[str]]:
        """
        Evaluates jurisdiction alignment between query plan and candidate.
        Missing jurisdiction does not cause rejection, but receives neutral score.
        """
        reasons = []
        target_jur = (query_plan.get("jurisdiction") or "").lower().strip()
        doc_jur = str(payload.get("jurisdiction", "")).lower().strip()
        doc_title = str(payload.get("document_title", payload.get("act_name", ""))).lower()
        level = str(payload.get("level", "")).lower()

        # Infer candidate jurisdiction if not explicitly in payload
        if not doc_jur:
            if "tamil nadu" in doc_title or "tamilnadu" in payload.get("record_id", "") or "tamil nadu" in level:
                doc_jur = "tamil nadu"
            elif "central" in level or any(c in doc_title for c in ["constitution", "bharatiya nyaya", "bharatiya nagarik", "bharatiya sakshya", "central"]):
                doc_jur = "central / india"


        if not target_jur:
            return 0.70, reasons  # Neutral confidence when query jurisdiction is unspecified

        if "tamil nadu" in target_jur or "tn" in target_jur:
            if "tamil nadu" in doc_jur or "state" in level:
                reasons.append("Explicit Tamil Nadu State Jurisdiction Match")
                return 1.0, reasons
            elif "central" in doc_jur or "india" in doc_jur:
                # Central laws apply in TN, but state specific query gets lower match for central
                reasons.append("Central Law applicable across India")
                return 0.60, reasons
            else:
                return 0.40, reasons

        if "central" in target_jur or "india" in target_jur:
            if "central" in doc_jur or "india" in doc_jur or "constitution" in doc_title:
                reasons.append("National / Central Jurisdiction Match")
                return 1.0, reasons
            elif "tamil nadu" in doc_jur:
                reasons.append("State Law for Central Query")
                return 0.35, reasons

        if target_jur == doc_jur:
            reasons.append("Exact Jurisdiction Match")
            return 1.0, reasons

        if not doc_jur:
            # Missing metadata reduces confidence appropriately without fake rejection
            return 0.50, reasons

        return 0.40, reasons

    def _compute_structural_match(self, query_plan: dict, payload: dict) -> Tuple[float, List[str]]:
        """
        Rewards exact structural alignment: Article, Section, Clause, Subclause, Chapter.
        Preserves Article 19(1)(a) and BNS Section 303 exact matches.
        """
        reasons = []
        filters = query_plan.get("filters", {}) or {}
        req_art = str(filters.get("article_number", "")).strip().upper()
        req_clause = str(filters.get("clause", "")).strip().lower()
        req_subclause = str(filters.get("subclause", "")).strip().lower()
        req_sec = str(filters.get("section_number", "")).strip().upper()

        doc_art = str(payload.get("article_number", "")).strip().upper()
        doc_sec = str(payload.get("section_number", "")).strip().upper()
        doc_clause = str(payload.get("clause", "")).strip().lower()
        doc_subclause = str(payload.get("subclause", "")).strip().lower()

        # Also search in heading/text if not in structured payload field
        heading = (payload.get("heading") or payload.get("section_heading") or "").lower()

        # 1. Explicit Article Check
        if req_art:
            if doc_art == req_art:
                score = 0.85
                match_desc = f"Exact Article {req_art} match"
                # Strip parentheses from clause/subclause for flexible matching
                clean_req_clause = req_clause.replace("(", "").replace(")", "").strip()
                clean_doc_clause = doc_clause.replace("(", "").replace(")", "").strip()
                clean_req_sub = req_subclause.replace("(", "").replace(")", "").strip()
                clean_doc_sub = doc_subclause.replace("(", "").replace(")", "").strip()

                if clean_req_clause and (clean_req_clause == clean_doc_clause or f"({clean_req_clause})" in heading):
                    score += 0.10
                    match_desc += f" Clause ({clean_req_clause})"
                if clean_req_sub and (clean_req_sub == clean_doc_sub or f"({clean_req_sub})" in heading):
                    score += 0.05
                    match_desc += f" Subclause ({clean_req_sub})"
                reasons.append(match_desc)
                return min(1.0, score), reasons
            else:
                return 0.05, reasons

        # 2. Explicit Section Check
        if req_sec:
            if doc_sec == req_sec:
                reasons.append(f"Exact Section {req_sec} match")
                return 1.0, reasons
            else:
                return 0.05, reasons

        # 3. Infer from query text if filters didn't catch it
        norm_q = query_plan.get("normalized_query", "").lower()
        if doc_art and (f"article {doc_art.lower()}" in norm_q or f"art {doc_art.lower()}" in norm_q):
            reasons.append(f"Article {doc_art} found in query")
            return 0.90, reasons

        if doc_sec and (f"section {doc_sec.lower()}" in norm_q or f"sec {doc_sec.lower()}" in norm_q):
            reasons.append(f"Section {doc_sec} found in query")
            return 0.90, reasons

        # Generic structural presence (candidate has clean section/article metadata)
        if doc_art or doc_sec:
            return 0.60, reasons

        return 0.40, reasons

    def _compute_intent_match(self, query_plan: dict, payload: dict, domain: str) -> Tuple[float, List[str]]:
        """
        Rewards candidate alignment with user task intent (punishment, eligibility,
        application process, definition, procedure).
        """
        reasons = []
        intent = str(query_plan.get("intent", "")).upper()
        text_blob = (
            f"{payload.get('text', '')} "
            f"{payload.get('heading', '')} "
            f"{payload.get('section_heading', '')} "
            f"{payload.get('benefits', '')} "
            f"{payload.get('eligibility', '')} "
            f"{payload.get('application_process', '')}"
        ).lower()

        if any(term in intent for term in ["PUNISHMENT", "PENALTY", "OFFENCE", "OFFENSE"]):
            if any(term in text_blob for term in ["punished with", "imprisonment", "fine", "shall be punished", "cognizable", "bailable"]):
                reasons.append("Direct statutory penalty/punishment terms verified")
                return 0.95, reasons
            return 0.60, reasons


        if intent in ["SCHEME_DISCOVERY", "BENEFITS", "ELIGIBILITY"]:
            if any(term in text_blob for term in ["eligible", "criteria", "benefits", "assistance", "subsidy", "installment", "income limit"]):
                reasons.append("Scheme eligibility and direct benefits specification verified")
                return 0.95, reasons
            return 0.50, reasons

        if intent in ["APPLICATION", "PROCEDURE", "PROCESS"]:
            if any(term in text_blob for term in ["application", "apply", "portal", "procedure", "registration", "officer", "paccs", "csc"]):
                reasons.append("Application and operational procedure instructions present")
                return 0.95, reasons
            return 0.50, reasons

        if intent in ["DEFINITION", "MEANING", "INTERPRETATION"]:
            if any(term in text_blob for term in ["means", "includes", "defined as", "explanation", "for the purposes of"]):
                reasons.append("Statutory definitions and explanations matched")
                return 0.90, reasons
            return 0.60, reasons

        if intent in ["EVIDENCE", "ADMISSIBILITY"]:
            if any(term in text_blob for term in ["admissible", "certificate", "electronic record", "evidence", "proved"]):
                reasons.append("Evidentiary admissibility terms verified")
                return 0.95, reasons
            return 0.50, reasons

        return 0.70, reasons

    def _compute_recency_score(self, payload: dict, domain: str) -> Tuple[float, List[str]]:
        """
        Scores temporal status and recency based on actual metadata.
        For statutes: Active legal status > age.
        For schemes: Recent update/active scheme > deprecated.
        """
        reasons = []
        status = str(payload.get("legal_status", payload.get("status", "Active"))).lower()
        if "repealed" in status or "omitted" in status or "struck down" in status:
            return 0.10, ["Repealed or Omitted Provision"]

        # Bharatiya laws (2023 enacted, 2024 in force) are the most recent criminal codes
        doc_title = str(payload.get("document_title", payload.get("act_name", ""))).lower()
        if any(b in doc_title for b in ["bharatiya nyaya", "bharatiya nagarik", "bharatiya sakshya"]):
            reasons.append("Current Bharatiya Criminal Jurisprudence (2023/2024)")
            return 1.0, reasons

        # Parse date if available
        raw_date = payload.get("effective_date") or payload.get("decision_date") or payload.get("last_updated") or payload.get("amendment_date")
        if raw_date:
            try:
                date_str = str(raw_date)[:10]
                dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                year = dt.year
                if year >= 2020:
                    reasons.append(f"Recent authority ({year})")
                    return 0.95, reasons
                elif year >= 2010:
                    return 0.85, reasons
                elif year >= 2000:
                    return 0.75, reasons
                else:
                    return 0.65, reasons
            except Exception:
                pass

        if "active" in status:
            return 0.80, ["In Force / Currently Active"]

        return 0.50, reasons

    def _compute_conflict_penalty(self, candidate: Any, payload: dict, all_candidates: List[Any]) -> Tuple[float, bool, List[str]]:
        """
        Detects potential conflicting evidence conservatively.
        Returns: (penalty: float [0.0 - 1.0], potential_conflict: bool, reasons: list)
        """
        reasons = []
        penalty = 0.0
        potential_conflict = False

        status = str(payload.get("legal_status", "")).lower()
        doc_title = str(payload.get("document_title", payload.get("act_name", ""))).lower()

        # 1. Repealed vs Current Law conflict (e.g. IPC vs BNS)
        if "repealed" in status:
            penalty = 0.80
            potential_conflict = True
            reasons.append("Statutory provision marked as repealed")

        if "indian penal code" in doc_title or "code of criminal procedure, 1973" in doc_title:
            # Check if any candidate contains BNS or BNSS
            for other in all_candidates:
                other_p = self._extract_payload(other)
                other_title = str(other_p.get("document_title", other_p.get("act_name", ""))).lower()
                if "bharatiya" in other_title:
                    penalty = max(penalty, 0.70)
                    potential_conflict = True
                    reasons.append("Older provision potentially superseded by Bharatiya code")
                    break

        # 2. Check for contradictory jurisdictional claims
        doc_jur = str(payload.get("jurisdiction", "")).lower()
        if "state" in doc_jur and "central" in doc_jur:
            potential_conflict = True
            penalty = max(penalty, 0.30)
            reasons.append("Ambiguous jurisdictional applicability")

        return round(penalty, 4), potential_conflict, reasons

    def score_candidate(
        self,
        query_plan: dict,
        candidate: Any,
        domain: str = "legal",
        all_candidates: Optional[List[Any]] = None,
        rrf_score: Optional[float] = None
    ) -> dict:
        """
        Calculates individual component scores, composite LARV score,
        and diagnostic explanations for a candidate.
        """
        payload = self._extract_payload(candidate)
        domain_weights = self.config.get("domains", {}).get(
            domain,
            self.config.get("domains", {}).get("legal", DEFAULT_CONFIG["domains"]["legal"])
        )

        all_cands = all_candidates or [candidate]

        # Calculate individual normalized components [0.0 -> 1.0]
        s_semantic = self._compute_semantic_score(candidate, rrf_score=rrf_score)
        s_keyword, r_keyword = self._compute_keyword_relevance(query_plan, payload)
        s_authority, r_authority = self._compute_authority_score(payload, domain)
        s_jurisdiction, r_jurisdiction = self._compute_jurisdiction_match(query_plan, payload)
        s_structural, r_structural = self._compute_structural_match(query_plan, payload)
        s_recency, r_recency = self._compute_recency_score(payload, domain)
        s_intent, r_intent = self._compute_intent_match(query_plan, payload, domain)
        s_conflict, has_conflict, r_conflict = self._compute_conflict_penalty(candidate, payload, all_cands)

        # Composite LARV score computation:
        # LARV(q,d) = α*Sem + β*Key + γ*Auth + δ*Jur + ε*Struct + ζ*Rec + η*Int - λ*Conf
        composite = (
            domain_weights.get("semantic", 0.25) * s_semantic
            + domain_weights.get("keyword", 0.15) * s_keyword
            + domain_weights.get("authority", 0.20) * s_authority
            + domain_weights.get("jurisdiction", 0.10) * s_jurisdiction
            + domain_weights.get("structural", 0.15) * s_structural
            + domain_weights.get("recency", 0.05) * s_recency
            + domain_weights.get("intent", 0.10) * s_intent
            - domain_weights.get("conflict", 0.15) * s_conflict
        )

        # Clamp strictly between 0.0 and 1.0
        final_larv = round(max(0.0, min(1.0, composite)), 4)

        # Synthesize rank reasons for diagnostics
        rank_reasons = []
        if r_structural:
            rank_reasons.extend(r_structural)
        if r_authority:
            rank_reasons.extend(r_authority)
        if s_semantic >= 0.75:
            rank_reasons.append("Strong semantic alignment")
        if r_jurisdiction:
            rank_reasons.extend(r_jurisdiction)
        if r_keyword:
            rank_reasons.extend(r_keyword)
        if r_intent:
            rank_reasons.extend(r_intent)
        if r_recency:
            rank_reasons.extend(r_recency)
        if r_conflict:
            rank_reasons.extend(r_conflict)

        components = {
            "semantic": s_semantic,
            "keyword": s_keyword,
            "authority": s_authority,
            "jurisdiction": s_jurisdiction,
            "structural": s_structural,
            "recency": s_recency,
            "intent": s_intent,
            "conflict": s_conflict
        }

        return {
            "larv_score": final_larv,
            "components": components,
            "potential_conflict": has_conflict,
            "rank_reason": rank_reasons,
            "weights_used": domain_weights
        }

    def rank(
        self,
        query_plan: dict,
        candidates: List[Any],
        domain: str = "legal",
        jurisdiction: Optional[str] = None,
        rrf_scores: Optional[Dict[Any, float]] = None,
        top_k: Optional[int] = None
    ) -> List[Tuple[Any, dict]]:
        """
        Ranks candidates deterministically using LARV score.
        Returns: list of (candidate, score_explanation_dict)
        """
        if not candidates:
            return []

        limit = top_k or self.config.get("top_k_ranked", 10)
        rrf_map = rrf_scores or {}

        scored_candidates = []
        for cand in candidates:
            doc_id = self._extract_doc_id(cand)
            rrf_s = rrf_map.get(doc_id, None)

            explanation = self.score_candidate(
                query_plan=query_plan,
                candidate=cand,
                domain=domain,
                all_candidates=candidates,
                rrf_score=rrf_s
            )
            scored_candidates.append((cand, explanation))

        # Deterministic sorting: sort by larv_score descending, tie-break on doc_id
        scored_candidates.sort(
            key=lambda x: (x[1]["larv_score"], self._extract_doc_id(x[0])),
            reverse=True
        )

        return scored_candidates[:limit]

    def explain_score(self, candidate_explanation: dict) -> dict:
        """Returns structured diagnostic explanation of a candidate's scoring."""
        return {
            "larv_score": candidate_explanation.get("larv_score", 0.0),
            "components": candidate_explanation.get("components", {}),
            "potential_conflict": candidate_explanation.get("potential_conflict", False),
            "rank_reason": candidate_explanation.get("rank_reason", []),
            "weights_used": candidate_explanation.get("weights_used", {})
        }


# Global singleton instance
larv_engine = LARV()
