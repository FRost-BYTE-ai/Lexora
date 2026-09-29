"""
Lexora Evidence Validation & Hallucination Guard
================================================
Ensures strict fidelity to authoritative legal material:
1. Validates retrieval confidence and relevance before generation.
2. Rejects generation if authoritative evidence is absent or insufficient.
3. Enforces post-generation verification to prevent fabricated sections or punishments.
"""

import re

class EvidenceValidator:
    def __init__(self, rrf_threshold: float = 0.008):
        self.rrf_threshold = rrf_threshold

    def validate_retrieval(self, query_plan: dict, top_docs: list, rrf_scores: dict) -> tuple[bool, str]:
        """
        Validate whether the retrieved documents provide sufficient basis to answer.
        Returns: (is_sufficient: bool, reason: str)
        """
        if not top_docs:
            return False, "No authoritative legal provisions retrieved from the corpus."
            
        # Check scores
        if rrf_scores:
            best_score = max(rrf_scores.values())
            if best_score < self.rrf_threshold:
                return False, f"Retrieval confidence score ({best_score:.4f}) is below reliable threshold."
                
        # If explicit section / article was requested, verify top documents contain it
        filters = query_plan.get("filters", {})
        intent = query_plan.get("intent", "")
        
        if filters.get("article_number"):
            art = str(filters["article_number"])
            has_art = False
            for doc in top_docs:
                p = doc.payload
                art_num_payload = str(p.get("article_number", ""))
                provisions_payload = [str(x) for x in p.get("legal_provisions", [])]
                text_payload = str(p.get("text", "")) + " " + str(p.get("holdings", ""))
                
                if art_num_payload == art or any(f"Article {art}" in prov for prov in provisions_payload) or f"Article {art}" in text_payload:
                    has_art = True
                    break
            if not has_art and intent != "LEGAL_CASE":
                return False, f"Article {art} was requested, but was not found in retrieved authoritative records."
                
        if filters.get("section_number"):
            sec = str(filters["section_number"])
            has_sec = False
            for doc in top_docs:
                p = doc.payload
                sec_num_payload = str(p.get("section_number", ""))
                provisions_payload = [str(x) for x in p.get("legal_provisions", [])]
                text_payload = str(p.get("text", "")) + " " + str(p.get("holdings", ""))
                
                if sec_num_payload == sec or any(f"Section {sec}" in prov for prov in provisions_payload) or f"Section {sec}" in text_payload:
                    has_sec = True
                    break
            if not has_sec and intent != "LEGAL_CASE":
                return False, f"Section {sec} was requested, but was not found in retrieved authoritative records."
                
        # Check if an explicit Act was mentioned in user query that doesn't exist in top docs
        orig_q = query_plan.get("original_query", "").strip()
        act_matches = re.findall(r'\b(?:[A-Z][a-z]+\s+)+(?:Act|Code|Sanhita|Bill|Adhiniyam)\b(?:\s*,\s*\d{4}|\s+\d{4})?', orig_q)
        for act in act_matches:
            act_clean = act.strip().lower()
            # Ignore generic words
            if len(act_clean) > 4 and act_clean not in ["the act", "this act", "an act"]:
                doc_acts = " ".join([
                    str(d.payload.get("act_name", "")).lower() + " " +
                    str(d.payload.get("document_title", "")).lower() + " " +
                    str(d.payload.get("case_name", "")).lower() + " " +
                    " ".join([str(p).lower() for p in d.payload.get("legal_provisions", [])]) + " " +
                    str(d.payload.get("text", "")).lower()
                    for d in top_docs
                ])
                has_match = any(word in doc_acts for word in act_clean.split() if len(word) > 4 and word not in ["indian", "bharatiya", "national", "act", "code"])
                if not has_match and intent != "LEGAL_CASE":
                    return False, f"The requested statute '{act.strip()}' is not present in the indexed legal corpus."

        # Check if an explicit Case Name was requested that doesn't exist in top docs
        req_case = query_plan.get("case_name")
        if req_case and intent == "LEGAL_CASE":
            stop_words = {
                "v", "v.", "vs", "versus", "union", "india", "state", "the", "and", "of", "in", "or", "to", "for", "with",
                "government", "govt", "retd", "supreme", "court", "decide", "decided", "decision", "ruling", "judgment", "case", "what", "did"
            }
            case_keywords = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9]+\b', str(req_case)) if len(w) > 1 and w.lower() not in stop_words]
            if case_keywords:
                has_case_match = False
                for doc in top_docs:
                    doc_text = " ".join([
                        str(doc.payload.get("case_name", "")),
                        str(doc.payload.get("heading", "")),
                        str(doc.payload.get("case_title", "")),
                        str(doc.payload.get("citation", "")),
                        str(doc.payload.get("text", "")),
                        str(doc.payload.get("holdings", ""))
                    ]).lower()
                    if all(kw in doc_text for kw in case_keywords) or any(kw in doc_text for kw in case_keywords if kw in ["maneka", "puttaswamy", "kesavananda", "arnesh", "vishaka", "lalita", "shreya", "arnesh", "chinnasamy"]):
                        has_case_match = True
                        break
                if not has_case_match:
                    return False, f"The requested judicial precedent '{req_case}' is not present in the indexed Supreme Court judgments corpus."

        return True, "Sufficient authoritative evidence found."

    def build_insufficient_response(self, query_plan: dict, reason: str) -> str:
        """Constructs an authoritative, non-hallucinatory disclaimer response."""
        user_q = query_plan.get("original_query", "")
        lang = query_plan.get("language", "en")
        
        if lang == "tanglish" or lang == "ta":
            return (
                "The available authoritative legal corpus does not contain sufficient material to answer this query reliably. "
                f"({reason}) Lexora does not speculate or formulate legal conclusions without direct statutory evidence."
            )
            
        return (
            "The available authoritative legal corpus does not contain sufficient material to answer this question reliably. "
            f"Reason: {reason}\n\n"
            "Lexora does not speculate or formulate legal conclusions when direct statutory evidence is absent."
        )

    def guard_hallucination(self, generated_text: str, evidence_text: str, query_plan: dict = None) -> tuple[str, bool, list]:
        """
        Inspect generated response against retrieved evidence to catch fabricated sections or articles.
        Returns: (safe_text: str, has_fabrication: bool, fabricated_items: list)
        """
        if not generated_text:
            return generated_text, False, []
            
        gen_sections = set(re.findall(r"(?:Section|sec\.?)\s*:?\s*(\d+[A-Z]?)", generated_text, re.IGNORECASE))
        ev_sections = set(re.findall(r"(?:Section|sec\.?)\s*:?\s*(\d+[A-Z]?)", evidence_text, re.IGNORECASE))
        
        gen_articles = set(re.findall(r"(?:Article|art\.?)\s*:?\s*(\d+[A-Z]?)", generated_text, re.IGNORECASE))
        ev_articles = set(re.findall(r"(?:Article|art\.?)\s*:?\s*(\d+[A-Z]?)", evidence_text, re.IGNORECASE))
        
        # Also include any numbers from query_plan filters or provisions
        if query_plan:
            filters = query_plan.get("filters", {})
            if filters.get("section_number"):
                ev_sections.add(str(filters["section_number"]))
            if filters.get("sections"):
                for s in filters["sections"]:
                    ev_sections.add(str(s))
            if filters.get("article_number"):
                ev_articles.add(str(filters["article_number"]))
            if filters.get("articles"):
                for a in filters["articles"]:
                    ev_articles.add(str(a))
        
        fabricated_sections = [f"Section {s}" for s in (gen_sections - ev_sections)]
        fabricated_articles = [f"Article {a}" for a in (gen_articles - ev_articles)]
        fabricated = fabricated_sections + fabricated_articles
        
        if fabricated:
            fab_str = ", ".join(fabricated)
            lang = query_plan.get("language", "en") if query_plan else "en"
            
            if lang in ["tanglish", "ta"]:
                safe_response = (
                    f"The retrieved authoritative legal records do not support the provision ({fab_str}). "
                    "Lexora strictly rejects presenting unverified legal claims or fabricated sections without direct statutory proof."
                )
            else:
                safe_response = (
                    f"The authoritative legal evidence retrieved for this consultation does not contain or support {fab_str}. "
                    "Lexora does not speculate, extrapolate, or formulate legal conclusions on provisions not verified in the authoritative statutory corpus."
                )
            return safe_response, True, fabricated
            
        return generated_text, False, []
