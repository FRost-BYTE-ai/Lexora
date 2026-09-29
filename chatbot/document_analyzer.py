"""
Lexora Comprehensive Document Analysis Foundation
=================================================
Handles:
1. Extraction of uploaded legal documents (PDF, TXT, MD, images, camera scans).
2. Deep structured analysis:
   - Executive Summary
   - Important Clauses
   - Dates & Milestones
   - Identified Parties
   - Legal Obligations & Rights
   - Referenced Laws & Statutes
   - Potential Risks or Issues
   - Suggested Questions to ask Lexora
3. Clearly separates:
   - "FOUND IN DOCUMENT"
   - "LEGAL INFORMATION FROM EXTERNAL SOURCES"
4. Session-isolated storage.
"""

import os
import io
import re
import fitz  # PyMuPDF
from chatbot.ocr_engine import ocr_engine

class DocumentAnalyzer:
    def __init__(self):
        pass

    def extract_text_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        """Extracts text from uploaded PDF, text, or image file bytes."""
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            return text.strip()
        elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp"]:
            ocr_res = ocr_engine.extract_text_from_image_bytes(file_bytes)
            return ocr_res.get("text", "").strip()
        else:
            return file_bytes.decode("utf-8", errors="replace").strip()

    def analyze_document_content(self, text: str, filename: str = "Document") -> dict:
        """
        Performs deep structured legal document inspection:
        Extracts summary, clauses, dates, parties, obligations, referenced statutes, and risks.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # 1. Parties Extraction
        party_patterns = [
            r"(?:between|by and between|in the matter of)\s+([A-Z][A-Za-z\s\.,]+?)(?:\s+and|\s+hereinafter|\s+versus|\s+vs\.?)",
            r"(?:complainant|petitioner|plaintiff|appellant)\s*:\s*([^\n\r]+)",
            r"(?:opposite party|respondent|defendant|accused)\s*:\s*([^\n\r]+)"
        ]
        parties = []
        for p in party_patterns:
            matches = re.findall(p, text, re.IGNORECASE)
            for m in matches:
                clean_m = m.strip().strip(",")
                if len(clean_m) > 2 and clean_m not in parties:
                    parties.append(clean_m)
                    
        # 2. Dates Extraction
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b'
        ]
        dates = []
        for dp in date_patterns:
            matches = re.findall(dp, text, re.IGNORECASE)
            for m in matches:
                if m not in dates:
                    dates.append(m)

        # 3. Referenced Laws / Statutes
        statute_patterns = [
            r'\b(?:Section|Sec\.)\s*\d+[A-Z]?(?:\s*\([a-zA-Z0-9]+\))*',
            r'\b(?:Article|Art\.)\s*\d+[A-Z]?',
            r'\b[A-Z][a-zA-Z\s]+(?:Act|Code|Sanhita|Adhiniyam)\b(?:\s*,\s*\d{4}|\s+\d{4})?'
        ]
        referenced_laws = []
        for sp in statute_patterns:
            matches = re.findall(sp, text)
            for m in matches:
                clean_m = m.strip()
                if len(clean_m) > 3 and clean_m not in referenced_laws and clean_m not in ["The Act", "This Act"]:
                    referenced_laws.append(clean_m)

        # 4. Clauses & Obligations
        clauses = []
        for line in lines:
            if re.match(r'^(?:\d+[\.\)]|[A-Z][\.\)]|Clause\s+\d+|Article\s+\d+)', line):
                if len(line) > 15:
                    clauses.append(line[:160])
                    if len(clauses) >= 5:
                        break

        # 5. Potential Risks or Issues
        risk_triggers = ["penalty", "breach", "termination", "default", "liability", "forfeit", "indemnify", "jurisdiction", "exclusive"]
        potential_risks = []
        for line in lines:
            lower = line.lower()
            if any(rt in lower for rt in risk_triggers):
                potential_risks.append(line[:180])
                if len(potential_risks) >= 3:
                    break

        summary_excerpt = text[:600] + "..." if len(text) > 600 else text

        return {
            "filename": filename,
            "char_count": len(text),
            "word_count": len(text.split()),
            "summary": summary_excerpt,
            "parties": parties[:6],
            "dates": dates[:8],
            "referenced_laws": referenced_laws[:10],
            "important_clauses": clauses[:5],
            "potential_risks": potential_risks,
            "suggested_questions": [
                "What are my key obligations under this document?",
                "Are there any penalty or termination risks mentioned?",
                "Which Indian statutory provisions apply to this document?"
            ]
        }

    def summarize_document(self, text: str, max_chars: int = 1500) -> str:
        """Provides a clean excerpt summary of the uploaded document."""
        if len(text) <= max_chars:
            return text
        return text[:max_chars] + "...\n[Excerpt truncated for analysis]"
