"""
Lexora Text-to-Speech (TTS) Provider Subsystem
=============================================
Architecture:
Frontend -> Lexora Backend (/api/tts/synthesize) -> TTSProvider -> Audio Output

Provider Implementations:
1. NemotronTTSProvider (NVIDIA NIM / Magpie TTS Multilingual Cloud/Self-Hosted)
   - Authenticated strictly server-side using NVIDIA_API_KEY.
   - Key is never sent to browser, frontend HTML, or localStorage.
2. GTTSProvider (High-quality bilingual fallback for Tamil & English)
   - Provides clear spoken Tamil and Indian English audio.
"""

import os
import io
import json
import logging
import urllib.request
from abc import ABC, abstractmethod
from gtts import gTTS

logger = logging.getLogger("lexora.tts")

class TTSProvider(ABC):
    @abstractmethod
    def synthesize(self, text: str, lang: str = "en") -> tuple[bytes, str]:
        """Synthesizes text into audio bytes and mime_type."""
        pass

class NemotronTTSProvider(TTSProvider):
    """
    NVIDIA Nemotron / Magpie Multilingual TTS NIM provider.
    Uses NVIDIA_API_KEY from server environment.
    """
    def __init__(self, api_key: str = None, endpoint_url: str = None):
        self.api_key = api_key or os.environ.get("NVIDIA_API_KEY", "")
        # Official NVIDIA hosted invocation or custom local NIM endpoint
        self.endpoint_url = endpoint_url or os.environ.get(
            "NVIDIA_TTS_URL", 
            "https://integrate.api.nvidia.com/v1/audio/synthesize"
        )

    def synthesize(self, text: str, lang: str = "en") -> tuple[bytes, str]:
        if not self.api_key:
            raise ValueError("NVIDIA_API_KEY is not configured on the server.")
        
        payload = {
            "text": text,
            "language": "hi-IN" if lang == "hi" else ("en-US" if lang == "en" else "ta-IN"),
            "encoding": "MP3"
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.endpoint_url,
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            }
        )
        
        with urllib.request.urlopen(req, timeout=15) as res:
            audio_bytes = res.read()
            return audio_bytes, "audio/mpeg"

class GTTSProvider(TTSProvider):
    """
    High-fidelity gTTS fallback supporting natural spoken Tamil and Indian English.
    """
    def synthesize(self, text: str, lang: str = "en") -> tuple[bytes, str]:
        # Filter language
        gtts_lang = "ta" if lang in ["ta", "tanglish"] else ("hi" if lang == "hi" else "en")
        tld = "co.in" if gtts_lang == "en" else "com"

        # Truncate text for voice reading so it remains concise and natural
        clean_text = text.strip()
        if len(clean_text) > 600:
            clean_text = clean_text[:600] + "..."

        tts = gTTS(text=clean_text, lang=gtts_lang, tld=tld, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read(), "audio/mpeg"

class LexoraTTSManager:
    """
    Selects Nemotron TTS when NVIDIA_API_KEY is provided,
    otherwise uses the robust GTTS provider.
    """
    def __init__(self):
        nvidia_key = os.environ.get("NVIDIA_API_KEY")
        if nvidia_key:
            self.primary_provider = NemotronTTSProvider(nvidia_key)
            self.fallback_provider = GTTSProvider()
        else:
            self.primary_provider = GTTSProvider()
            self.fallback_provider = None

    def synthesize(self, text: str, lang: str = "en") -> tuple[bytes, str, str]:
        """
        Returns: (audio_bytes, mime_type, provider_name)
        """
        if not text or not text.strip():
            raise ValueError("Text to synthesize cannot be empty.")

        try:
            audio, mime = self.primary_provider.synthesize(text, lang)
            return audio, mime, self.primary_provider.__class__.__name__
        except Exception as e:
            logger.warning(f"Primary TTS provider failed: {e}. Falling back.")
            if self.fallback_provider:
                audio, mime = self.fallback_provider.synthesize(text, lang)
                return audio, mime, self.fallback_provider.__class__.__name__
            raise

tts_manager = LexoraTTSManager()
