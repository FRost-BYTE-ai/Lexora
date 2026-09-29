"""
Lexora Legal AI Application Server
==================================
FastAPI application exposing:
- Chat consultation endpoints with multi-turn memory & natural greetings
- Voice mode endpoint (same legal intelligence pipeline + voice summary)
- Legal Library search & statutory inspection
- Government Schemes discovery (Central & Tamil Nadu)
- Case Explorer (Verified landmark Indian precedents)
- Document upload, OCR, and grounded legal analysis
- Translation service (preserving statutory sections, acts, and URLs)
- TTS synthesis (Nemotron Speech / gTTS)
- Saved items persistent manager
- Draft generator
- RAG runtime diagnostics
"""

import os
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, Response as RawResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chatbot.chatbot import LexoraChatbot
from chatbot.larv import larv_engine
from chatbot.translation_provider import translator
from chatbot.tts_provider import tts_manager
from chatbot.schemes_provider import schemes_provider
from chatbot.case_provider import case_provider
from chatbot.saved_manager import saved_manager
from chatbot.draft_generator import draft_generator
from chatbot.ocr_engine import ocr_engine


app = FastAPI(title="Lexora - Modern Legal Research Desk", version="2.5")

# Security Headers & CSP Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "media-src 'self' blob:; "
        "connect-src 'self';"
    )
    return response

# Restricted CORS - Only local origins permitted for credentials
ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global Chatbot Instance
print("Initializing Lexora Chatbot Engine...")
use_lora_env = os.environ.get("USE_LORA", "true").lower() == "true"
bot = LexoraChatbot(config={"use_lora": use_lora_env})
print("Lexora Chatbot Engine ready.")

class ChatRequest(BaseModel):
    session_id: str = Field(default="", max_length=128)
    message: str = Field(..., min_length=1, max_length=4000)
    language: str = Field(default=None, max_length=16)
    jurisdiction: str = Field(default=None, max_length=32)

class VoiceRequest(BaseModel):
    session_id: str = Field(default="", max_length=128)
    transcript: str = Field(..., min_length=1, max_length=4000)
    language: str = Field(default=None, max_length=16)
    jurisdiction: str = Field(default=None, max_length=32)

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    target_language: str = Field(default="ta", max_length=16)
    source_language: str = Field(default="auto", max_length=16)

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en", max_length=16)

class SaveItemRequest(BaseModel):
    type: str = Field(..., min_length=1, max_length=32)
    title: str = Field(..., min_length=1, max_length=256)
    content: str = Field(..., min_length=1, max_length=50000)
    metadata: dict = Field(default={})

class DraftRequest(BaseModel):
    draft_type: str = Field(..., min_length=1, max_length=32)
    details: dict = Field(default={})

# Simple IP-based Rate Limiter for LLM inference (prevent DoS)
request_history: dict[str, list[float]] = {}
RATE_LIMIT_PER_MINUTE = 60

def check_rate_limit(client_ip: str):
    now = time.time()
    times = request_history.get(client_ip, [])
    times = [t for t in times if now - t < 60.0]
    if len(times) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Too many consultation requests. Please wait a moment.")
    times.append(now)
    request_history[client_ip] = times

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model": "qwen3-0.6b-base",
        "adapter": "lexora_lora" if getattr(bot, 'lora_active', False) else "none",
        "rag": "enabled",
        "eos_token_id": [151643, 151645],
        "corpora": bot.available_collections,
        "features": {
            "legal_library": "active",
            "government_schemes": "active",
            "case_explorer": "active",
            "translation": "active",
            "tts": "active",
            "ocr": "active",
            "saved": "active",
            "drafts": "active",
            "diagnostics": "active"
        },
        "timestamp": time.time()
    }

# ─────────────────────────────────────────────────────────────────────────────
# Session Management
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/sessions/new")
def create_session(title: str = "Legal Consultation"):
    safe_title = title[:100] if title else "Legal Consultation"
    session_id = bot.start_consultation(title=safe_title)
    return {"session_id": session_id, "title": safe_title}

@app.get("/api/sessions")
def list_sessions():
    return {"sessions": bot.session_manager.list_sessions()}

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    session = bot.session_manager.get_session(session_id, create_if_missing=False)
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found")
    return {
        "session_id": session.session_id,
        "title": session.title,
        "turns": session.turns,
        "documents": session.uploaded_documents
    }

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    success = bot.session_manager.delete_session(session_id)
    return {"success": success}

# ─────────────────────────────────────────────────────────────────────────────
# Core Consultation: Text & Voice
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
def chat_endpoint(req: ChatRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)
    
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    
    session_id = req.session_id
    if not session_id or not bot.session_manager.has_session(session_id):
        session_id = bot.start_consultation()
        
    result = bot.process_message(
        session_id, 
        req.message.strip(),
        language=req.language,
        jurisdiction=req.jurisdiction
    )
    result["session_id"] = session_id
    return result

@app.post("/api/voice")
def voice_endpoint(req: VoiceRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)
    
    if not req.transcript or not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Empty transcript")
        
    session_id = req.session_id
    if not session_id or not bot.session_manager.has_session(session_id):
        session_id = bot.start_consultation()
        
    result = bot.process_voice_message(
        session_id, 
        req.transcript.strip(),
        language=req.language,
        jurisdiction=req.jurisdiction
    )
    result["session_id"] = session_id
    return result

# ─────────────────────────────────────────────────────────────────────────────
# Legal Library Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/legal/search")
def search_legal_library(q: str = "", corpus: str = None, limit: int = 25):
    query_str = q.strip() if q else ""
    results = bot.search_legal_library(query_str, corpus=corpus, limit=limit)
    return {"results": results, "query": query_str, "corpus": corpus}

# ─────────────────────────────────────────────────────────────────────────────
# Government Schemes Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/schemes/search")
def search_schemes(q: str = "", category: str = None, level: str = None):
    results = schemes_provider.search_schemes(query=q, category=category, level=level)
    return {"schemes": results, "total": len(results)}

@app.get("/api/schemes/{scheme_id}")
def get_scheme(scheme_id: str):
    scheme = schemes_provider.get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme

# ─────────────────────────────────────────────────────────────────────────────
# Case Explorer Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/cases/search")
def search_cases(q: str = "", provision: str = None, court: str = None):
    results = case_provider.search_cases(query=q, provision=provision, court=court)
    return {"cases": results, "total": len(results)}

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    case = case_provider.get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case precedent not found")
    return case

# ─────────────────────────────────────────────────────────────────────────────
# Document Analysis & Camera OCR
# ─────────────────────────────────────────────────────────────────────────────
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB limit

@app.post("/api/upload_document")
async def upload_document_endpoint(session_id: str = Form(...), file: UploadFile = File(...)):
    if not bot.session_manager.has_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
        
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_exts = [".pdf", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, TXT, or Image.")
        
    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 15 MB.")
        
    safe_filename = os.path.basename(file.filename or "uploaded_document")
    res = bot.upload_document(session_id, contents, safe_filename)
    return res

@app.post("/api/ocr")
async def ocr_endpoint(file: UploadFile = File(...), lang: str = Form("en")):
    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large.")
    result = ocr_engine.extract_text_from_image_bytes(contents, lang=lang)
    return result

# ─────────────────────────────────────────────────────────────────────────────
# Translation Subsystem
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/translate")
def translate_endpoint(req: TranslateRequest):
    res = translator.translate_legal_text(
        text=req.text,
        target_lang=req.target_language,
        source_lang=req.source_language
    )
    if not res["success"]:
        return JSONResponse(status_code=503, content=res)
    return res

# ─────────────────────────────────────────────────────────────────────────────
# Text-to-Speech Subsystem (Nemotron / gTTS)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/tts/synthesize")
def synthesize_tts_endpoint(req: TTSRequest):
    try:
        audio_bytes, mime_type, provider_name = tts_manager.synthesize(req.text, req.language)
        return RawResponse(
            content=audio_bytes,
            media_type=mime_type,
            headers={
                "X-TTS-Provider": provider_name,
                "Content-Disposition": "inline; filename=speech.mp3"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

# ─────────────────────────────────────────────────────────────────────────────
# Saved Items Subsystem
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/saved")
def list_saved_items(type: str = "all", q: str = ""):
    return {"items": saved_manager.list_items(item_type=type, query=q)}

@app.post("/api/saved")
def save_item(req: SaveItemRequest):
    item = saved_manager.save_item(
        item_type=req.type,
        title=req.title,
        content=req.content,
        metadata=req.metadata
    )
    return item

@app.delete("/api/saved/{item_id}")
def delete_saved_item(item_id: str):
    success = saved_manager.delete_item(item_id)
    return {"success": success}

# ─────────────────────────────────────────────────────────────────────────────
# Draft Generator Subsystem
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/drafts/generate")
def generate_draft_endpoint(req: DraftRequest):
    draft = draft_generator.generate_draft(req.draft_type, req.details)
    return draft

# ─────────────────────────────────────────────────────────────────────────────
# RAG Runtime Diagnostics
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/rag/diagnostics")
def get_rag_diagnostics(session_id: str = ""):
    session = bot.session_manager.get_session(session_id, create_if_missing=False) if session_id else None
    last_turn = None
    if session and session.turns:
        for t in reversed(session.turns):
            if "query_plan" in t.get("metadata", {}):
                last_turn = t
                break
                
    meta = last_turn.get("metadata", {}) if last_turn else {}
    plan = meta.get("query_plan", {})
    larv_diag = meta.get("larv_diagnostics", [])
    
    return {
        "status": "online",
        "model": "Qwen3-0.6B-Base",
        "lora_active": getattr(bot, 'lora_active', False),
        "embedding_model": "intfloat/multilingual-e5-small",
        "hybrid_retrieval": "Dense E5 (384d) + Sparse BM25 Hash + RRF (k=60)",
        "larv_layer": {
            "name": "Lexora Adaptive Retrieval & Verification (LARV)",
            "enabled": getattr(bot, "use_larv", True) and larv_engine.config.get("enabled", True),
            "formula": "LARV(q,d) = α*Semantic + β*Keyword + γ*Authority + δ*Jurisdiction + ε*Structural + ζ*Recency + η*Intent - λ*Conflict",
            "weights": larv_engine.config.get("domains", {}),
            "authority_hierarchy": larv_engine.config.get("authority_weights", {}),
            "candidates_evaluated": larv_diag
        },
        "available_collections": bot.available_collections,
        "last_query_plan": plan,
        "evidence_validator_threshold": bot.evidence_validator.rrf_threshold,
        "session_active": bool(session),
        "timestamp": time.time()
    }


# Static files for Modern Legal Research Desk UI
os.makedirs(r"C:\Lexora\static", exist_ok=True)
app.mount("/static", StaticFiles(directory=r"C:\Lexora\static"), name="static")

@app.get("/", response_class=HTMLResponse)
def index():
    index_path = r"C:\Lexora\static\index.html"
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Lexora Legal AI Desk</h1>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
