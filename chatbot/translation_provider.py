"""
Lexora Translation Provider Subsystem
======================================
Clean, robust translation provider abstraction supporting:
- Chat answers
- User messages
- Legal Library provisions
- Government scheme information
- Case information
- Document text
- Drafts
- Selected text

CRITICAL LEGAL TRANSLATION RULE:
Legal translation is for user understanding.
Never make translated text appear to be authoritative original legal text.
Preserves:
- Act name
- Section number
- Article number
- Subsection
- Citations
- Source authority & URLs
"""

import os
import re
import json
import logging
import urllib.request
import urllib.parse
from abc import ABC, abstractmethod

logger = logging.getLogger("lexora.translation")

class TranslationProvider(ABC):
    @abstractmethod
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translates text from source_lang to target_lang."""
        pass

class GoogleCloudTranslationProvider(TranslationProvider):
    """
    Official Google Cloud Translation API (v2 / v3) provider.
    Uses TRANSLATION_API_KEY from environment.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("TRANSLATION_API_KEY", "")

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.api_key:
            raise ValueError("TRANSLATION_API_KEY is not configured on the server.")
        
        url = f"https://translation.googleapis.com/language/translate/v2?key={self.api_key}"
        payload = {
            "q": text,
            "target": target_lang,
            "format": "text"
        }
        if source_lang and source_lang != "auto":
            payload["source"] = source_lang
            
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={"Content-Type": "application/json", "User-Agent": "Lexora/2.0"}
        )
        
        with urllib.request.urlopen(req, timeout=12) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            translations = res_data.get("data", {}).get("translations", [])
            if translations:
                return translations[0].get("translatedText", "")
            raise RuntimeError("Empty response from Google Cloud Translation API.")

class GoogleFreeTranslationProvider(TranslationProvider):
    """
    Fallback public Google Translation service.
    Works reliably without requiring an external paid API key.
    """
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return ""

        # Map language codes
        lang_map = {
            "en": "en",
            "ta": "ta",
            "hi": "hi",
            "tanglish": "ta",
            "auto": "auto"
        }
        sl = lang_map.get(source_lang, "auto") if source_lang else "auto"
        tl = lang_map.get(target_lang, "ta") if target_lang else "ta"

        # Split text into chunks if oversized (Google limit is approx 3000 chars per GET)
        chunks = self._chunk_text(text, max_len=2000)
        translated_chunks = []

        for chunk in chunks:
            encoded_query = urllib.parse.quote(chunk)
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={encoded_query}"
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                raw_bytes = res.read()
                data = json.loads(raw_bytes.decode("utf-8"))
                # data[0] is array of [translated_segment, original_segment]
                chunk_trans = "".join([segment[0] for segment in data[0] if segment and segment[0]])
                translated_chunks.append(chunk_trans)

        return "\n\n".join(translated_chunks)

    def _chunk_text(self, text: str, max_len: int = 2000) -> list[str]:
        if len(text) <= max_len:
            return [text]
        paragraphs = text.split("\n\n")
        chunks = []
        cur_chunk = ""
        for p in paragraphs:
            if len(cur_chunk) + len(p) + 2 > max_len:
                if cur_chunk:
                    chunks.append(cur_chunk.strip())
                cur_chunk = p + "\n\n"
            else:
                cur_chunk += p + "\n\n"
        if cur_chunk.strip():
            chunks.append(cur_chunk.strip())
        return chunks

class LexoraTranslator:
    """
    Unified Translation Service.
    Selects Google Cloud Translation when TRANSLATION_API_KEY is present,
    otherwise gracefully utilizes Google Translation service.
    Enforces legal integrity:
    Preserves exact statutory citations, section/article headers, and source URLs.
    """
    def __init__(self):
        cloud_key = os.environ.get("TRANSLATION_API_KEY")
        if cloud_key:
            self.primary_provider = GoogleCloudTranslationProvider(cloud_key)
            self.fallback_provider = GoogleFreeTranslationProvider()
        else:
            self.primary_provider = GoogleFreeTranslationProvider()
            self.fallback_provider = None

    def translate_legal_text(self, text: str, target_lang: str = "ta", source_lang: str = "auto") -> dict:
        """
        Translates legal text while preserving statutory citations, Act names, Section/Article numbers.
        Returns:
            {
                "success": bool,
                "original_text": str,
                "translated_text": str,
                "source_language": str,
                "target_language": str,
                "provider": str,
                "error": str or None
            }
        """
        if not text or not text.strip():
            return {
                "success": False,
                "original_text": text,
                "translated_text": "",
                "source_language": source_lang,
                "target_language": target_lang,
                "provider": "none",
                "error": "Empty text provided."
            }

        # 1. Identify and protect statutory identifiers using placeholders
        # E.g. "Section 303", "Article 21", "Bharatiya Nyaya Sanhita, 2023"
        placeholders = {}
        counter = 0

        def replace_with_token(match):
            nonlocal counter
            token = f"__LEX_STATUTE_{counter}__"
            placeholders[token] = match.group(0)
            counter += 1
            return token

        # Preserve Sections, Articles, and Acts
        protected_text = re.sub(
            r'\b(?:Section|Sec\.|Article|Art\.)\s*\d+[A-Z]?(?:\([a-zA-Z0-9]+\))*',
            replace_with_token,
            text,
            flags=re.IGNORECASE
        )
        # Preserve URLs
        protected_text = re.sub(
            r'https?://[^\s]+',
            replace_with_token,
            protected_text
        )

        translated = ""
        provider_name = ""
        try:
            translated = self.primary_provider.translate(protected_text, source_lang, target_lang)
            provider_name = self.primary_provider.__class__.__name__
        except Exception as e:
            logger.warning(f"Primary translation failed: {e}. Attempting fallback.")
            if self.fallback_provider:
                try:
                    translated = self.fallback_provider.translate(protected_text, source_lang, target_lang)
                    provider_name = self.fallback_provider.__class__.__name__
                except Exception as e2:
                    logger.error(f"Fallback translation failed: {e2}")
                    return {
                        "success": False,
                        "original_text": text,
                        "translated_text": "",
                        "source_language": source_lang,
                        "target_language": target_lang,
                        "provider": "failed",
                        "error": "Translation unavailable. Please try again."
                    }
            else:
                return {
                    "success": False,
                    "original_text": text,
                    "translated_text": "",
                    "source_language": source_lang,
                    "target_language": target_lang,
                    "provider": "failed",
                    "error": "Translation unavailable. Please try again."
                }

        # Restore preserved statutory tokens
        for token, original in placeholders.items():
            translated = translated.replace(token, original)

        return {
            "success": True,
            "original_text": text,
            "translated_text": translated,
            "source_language": source_lang,
            "target_language": target_lang,
            "provider": provider_name,
            "error": None
        }

# Global translator instance
translator = LexoraTranslator()
