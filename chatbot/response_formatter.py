"""
Lexora Response Formatter & Natural Legal Generation Utility
============================================================
Adaptive formatting for legal responses:
- Direct, natural answers for straightforward legal queries (no rigid template headers).
- Clean structured formatting for multi-step procedures or complex statutory frameworks.
- Preserves statutory precision (Act, Section/Article, Punishment, Exceptions).
"""

import re

def clean_llm_response(text: str) -> str:
    """Removes any extraneous tokens or artificial prompt artifacts from LLM generation."""
    cleaned = text.strip()
    # Remove think tags if any
    cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL).strip()
    
    # Remove rigid boilerplate headers if present
    rigid_headers = [
        r"^###\s*Legal Research Assessment\s*",
        r"^###\s*Direct Answer\s*",
        r"^###\s*Applicable Legal Framework\s*",
        r"^###\s*Statutory Grounding\s*",
        r"^###\s*Jurisdiction Applied\s*",
        r"^Legal Research Assessment:\s*",
        r"^Direct Answer:\s*"
    ]
    for pattern in rigid_headers:
        cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.IGNORECASE).strip()
        
    # Deduplicate consecutive identical or near-identical sentences to prevent looping
    sentences = re.split(r'(?<=[.!?])\s+', cleaned)
    deduped = []
    for s in sentences:
        s_norm = s.strip().lower()
        if not deduped or s_norm != deduped[-1].strip().lower():
            deduped.append(s)
    cleaned = " ".join(deduped).strip()
        
    return cleaned

def build_system_prompt(query_plan: dict) -> str:
    """Builds a contextual, natural legal assistant system prompt."""
    lang = query_plan.get("language", "en")
    
    base_prompt = (
        "You are Lexora, an authoritative and helpful AI legal assistant. "
        "Answer the user's question directly, clearly, and concisely based strictly on the provided legal evidence. "
        "State the exact Act and Section or Article number when answering. "
        "Do not invent laws, case names, punishments, section numbers, or citations. "
        "Do not use generic disclaimers or rigid repetitive headings. "
        "Answer in a natural, professional legal advisory style."
    )
    
    if lang in ["tanglish", "ta"]:
        base_prompt += (
            " The user asked in Tanglish/Tamil. Explain the answer naturally and clearly so the user understands, "
            "while citing the authoritative Indian legal sections and acts accurately."
        )
        
    return base_prompt
