"""
Lexora Session & Consultation Memory Manager
============================================
Handles:
1. Multi-turn conversation state and turn history per consultation session.
2. Complete isolation between consultation sessions (Conversation A never leaks into B).
3. Session-scoped document analysis storage.
4. Export and inspection of consultation transcripts and telemetry.
"""

import uuid
import time

class ConsultationSession:
    def __init__(self, session_id: str = None, title: str = "New Consultation"):
        self.session_id = session_id or str(uuid.uuid4())
        self.title = title
        self.created_at = time.time()
        self.turns = []  # list of {"role": "user"|"assistant", "content": str, "timestamp": float, "metadata": dict}
        self.uploaded_documents = []  # list of {"doc_id": str, "filename": str, "text": str, "extracted_at": float}

    def add_turn(self, role: str, content: str, metadata: dict = None):
        self.turns.append({
            "role": role,
            "content": content,
            "timestamp": time.time(),
            "metadata": metadata or {}
        })

    def get_conversation_context(self) -> list:
        return [{"role": t["role"], "content": t["content"]} for t in self.turns]

    def add_document(self, filename: str, text: str) -> str:
        doc_id = str(uuid.uuid4())
        self.uploaded_documents.append({
            "doc_id": doc_id,
            "filename": filename,
            "text": text,
            "extracted_at": time.time()
        })
        return doc_id

    def get_documents_text(self) -> str:
        return "\n\n".join([f"Document [{d['filename']}]:\n{d['text']}" for d in self.uploaded_documents])


class SessionManager:
    def __init__(self):
        self.sessions: dict[str, ConsultationSession] = {}

    def create_session(self, title: str = "New Legal Consultation") -> str:
        session = ConsultationSession(title=title)
        self.sessions[session.session_id] = session
        return session.session_id

    def has_session(self, session_id: str) -> bool:
        return session_id in self.sessions

    def get_session(self, session_id: str, create_if_missing: bool = True) -> ConsultationSession:
        if session_id not in self.sessions:
            if not create_if_missing:
                return None
            session = ConsultationSession(session_id=session_id)
            self.sessions[session_id] = session
        return self.sessions[session_id]

    def list_sessions(self) -> list:
        return [
            {
                "session_id": s.session_id,
                "title": s.title,
                "created_at": s.created_at,
                "turn_count": len(s.turns)
            }
            for s in sorted(self.sessions.values(), key=lambda x: x.created_at, reverse=True)
        ]

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
