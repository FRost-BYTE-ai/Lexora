"""
Lexora Quick Response / Shortcut Registry
=========================================
Deterministic pre-stored response layer for instant multilingual shortcuts.

Architecture:
User Input
-> normalization
-> quick-response matcher
-> language-specific stored response
-> return immediately

If there is no match:
User Input
-> existing Lexora pipeline
-> Legal Scope
-> Query Understanding
-> RAG
-> Qwen/LoRA
-> Response

For matched triggers:
- Do NOT invoke Qwen
- Do NOT invoke LoRA
- Do NOT invoke RAG
- Do NOT query Qdrant
- Do NOT generate embeddings
- Do NOT perform legal retrieval
- Do NOT generate a new answer
- Return the exact pre-stored response for the matched language.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
import unicodedata
import logging

logger = logging.getLogger("lexora.quick_responses")


def normalize_trigger(text: str) -> str:
    """
    Normalizes input text for deterministic shortcut matching:
    - Unicode NFKC normalization (handles Tamil & Hindi combining sequences, fullwidth chars)
    - Lowercase differences (case folding)
    - Punctuation normalization (strips Unicode category 'P' characters such as . , ! ? " ' । ॥)
    - Surrounding & internal whitespace collapsing
    """
    if not text:
        return ""
    # 1. Unicode NFKC normalization
    normalized = unicodedata.normalize("NFKC", str(text))
    # 2. Case folding & strip
    normalized = normalized.lower().strip()
    # 3. Replace all Unicode punctuation characters with a space
    normalized = "".join(" " if unicodedata.category(c).startswith("P") else c for c in normalized)
    # 4. Collapse consecutive whitespace into single spaces
    return " ".join(normalized.split())


@dataclass
class QuickResponseEntry:
    entry_id: str
    description: str
    triggers: Dict[str, List[str]]    # lang_code -> list of trigger phrases
    responses: Dict[str, str]          # lang_code -> exact pre-stored response
    normalized_index: Dict[str, str] = field(init=False, default_factory=dict) # norm_text -> lang_code

    def __post_init__(self):
        self.normalized_index = {}
        for lang, trigger_list in self.triggers.items():
            for trg in trigger_list:
                norm = normalize_trigger(trg)
                if norm:
                    self.normalized_index[norm] = lang

    def match(self, normalized_query: str) -> Optional[Tuple[str, str]]:
        """
        If the normalized query matches one of the triggers for this entry,
        returns (matched_language_code, stored_response_text).
        Otherwise returns None.
        """
        matched_lang = self.normalized_index.get(normalized_query)
        if matched_lang and matched_lang in self.responses:
            return matched_lang, self.responses[matched_lang]
        return None


class QuickResponseRegistry:
    """
    Dedicated registry for multilingual quick responses.
    Allows easy extension with new trigger/response entries.
    """
    def __init__(self):
        self.entries: List[QuickResponseEntry] = []
        self._lookup: Dict[str, Tuple[QuickResponseEntry, str]] = {}
        self._register_default_entries()

    def register_entry(self, entry: QuickResponseEntry):
        """Registers a new QuickResponseEntry into the registry."""
        self.entries.append(entry)
        for norm_trg, lang in entry.normalized_index.items():
            self._lookup[norm_trg] = (entry, lang)
        logger.info(f"[QuickResponse] Registered entry '{entry.entry_id}' with {len(entry.normalized_index)} triggers across {list(entry.responses.keys())}")

    def add_response(self, entry_id: str, triggers: Dict[str, List[str]], responses: Dict[str, str], description: str = ""):
        """Convenience method to register a new trigger/response set."""
        entry = QuickResponseEntry(
            entry_id=entry_id,
            description=description,
            triggers=triggers,
            responses=responses
        )
        self.register_entry(entry)

    def match(self, user_query: str) -> Optional[Dict[str, Any]]:
        """
        Matches a user query against all registered quick responses.
        Returns a dictionary if matched, or None if no match.
        """
        norm_query = normalize_trigger(user_query)
        if not norm_query:
            return None

        match_result = self._lookup.get(norm_query)
        if match_result:
            entry, lang = match_result
            response_text = entry.responses.get(lang)
            if response_text:
                return {
                    "entry_id": entry.entry_id,
                    "language": lang,
                    "response": response_text,
                    "matched_trigger": norm_query
                }
        return None

    def _register_default_entries(self):
        """
        Registers authoritative default quick response sets.
        """
        # 1. Neighbour threat during argument (EN, TA, HI)
        self.register_entry(
            QuickResponseEntry(
                entry_id="neighbour_threat_argument",
                description="Deterministic guidance for neighbour threat during argument",
                triggers={
                    "en": [
                        "My neighbour threatened me during an argument.",
                        "My neighbor threatened me during an argument.",
                    ],
                    "ta": [
                        "ஒரு வாக்குவாதத்தின் போது என் அண்டை வீட்டுக்காரர் என்னை மிரட்டினார்.",
                    ],
                    "hi": [
                        "एक बहस के दौरान मेरे पड़ोसी ने मुझे धमकी दी।",
                        "एक बहस के दौरान मेरे पडोसी ने मुझे धमकी दी।",
                    ],
                },
                responses={
                    "en": (
                        "If your neighbour threatened you during an argument, the legal options available "
                        "to you depend on what exactly was said or done, whether the threat was serious, "
                        "and the surrounding circumstances. You can document the incident and, where appropriate, "
                        "make a complaint to the police or seek other legal remedies. If you tell me what the "
                        "neighbour said or did, I can help explain the relevant legal provisions and possible next steps."
                    ),
                    "ta": (
                        "ஒரு வாக்குவாதத்தின் போது உங்கள் அண்டை வீட்டுக்காரர் உங்களை மிரட்டியிருந்தால், "
                        "அவர் என்ன கூறினார் அல்லது செய்தார், அந்த மிரட்டலின் தன்மை மற்றும் சம்பவத்தின் "
                        "சூழ்நிலையைப் பொறுத்து உங்களுக்கு கிடைக்கும் சட்டப்பூர்வமான வழிகள் மாறுபடும். "
                        "சம்பவத்தைப் பதிவு செய்து வைத்துக்கொள்வது முக்கியம்; தேவையான சூழ்நிலையில் காவல்துறையில் "
                        "புகார் அளிப்பது அல்லது பிற சட்டப்பூர்வமான நடவடிக்கைகளை மேற்கொள்வது குறித்து பரிசீலிக்கலாம். "
                        "அவர் என்ன கூறினார் அல்லது செய்தார் என்பதைத் தெரிவித்தால், தொடர்புடைய சட்ட விதிகள் "
                        "மற்றும் அடுத்தடுத்த நடவடிக்கைகள் குறித்து நான் விளக்க முடியும்."
                    ),
                    "hi": (
                        "यदि आपके पड़ोसी ने किसी बहस के दौरान आपको धमकी दी है, तो आपके पास उपलब्ध कानूनी विकल्प "
                        "इस बात पर निर्भर करते हैं कि उन्होंने वास्तव में क्या कहा या किया, धमकी की प्रकृति क्या थी "
                        "और घटना की परिस्थितियाँ कैसी थीं। घटना का रिकॉर्ड रखना महत्वपूर्ण है और परिस्थितियों के "
                        "अनुसार पुलिस में शिकायत दर्ज करना या अन्य कानूनी उपायों पर विचार किया जा सकता है। "
                        "यदि आप बताएँ कि आपके पड़ोसी ने क्या कहा या किया, तो मैं संबंधित कानूनी प्रावधानों "
                        "और संभावित अगले कदमों को समझाने में मदद कर सकता हूँ।"
                    ),
                }
            )
        )


# Singleton instance
quick_response_registry = QuickResponseRegistry()


def match_quick_response(user_query: str) -> Optional[Dict[str, Any]]:
    """Convenience functional interface to match user input."""
    return quick_response_registry.match(user_query)
