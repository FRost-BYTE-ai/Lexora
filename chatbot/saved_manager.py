"""
Lexora Storage & Saved Items Manager
====================================
Persistent storage for:
- Legal provisions
- Chatbot consultation answers
- Government schemes
- Cases
- Documents
- Legal drafts

Supports:
- Save
- Open
- Search
- Filter
- Delete
"""

import os
import json
import time
import uuid

SAVED_STORE_PATH = r"C:\Lexora\data\saved_items.json"

class SavedItemsManager:
    def __init__(self, file_path: str = SAVED_STORE_PATH):
        self.file_path = file_path
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def _load_all(self) -> list[dict]:
        self._ensure_storage()
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_all(self, items: list[dict]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2, ensure_ascii=False)

    def save_item(self, item_type: str, title: str, content: str, metadata: dict = None) -> dict:
        """Saves an item with unique ID and timestamp."""
        items = self._load_all()
        new_item = {
            "id": str(uuid.uuid4()),
            "type": item_type,  # 'provision', 'chat', 'scheme', 'case', 'document', 'draft'
            "title": title,
            "content": content,
            "metadata": metadata or {},
            "saved_at": time.time()
        }
        items.insert(0, new_item)
        self._save_all(items)
        return new_item

    def list_items(self, item_type: str = None, query: str = None) -> list[dict]:
        """Lists saved items with optional filtering by type or search text."""
        items = self._load_all()
        filtered = items
        if item_type and item_type != "all":
            filtered = [i for i in filtered if i.get("type") == item_type]
        if query:
            q = query.lower()
            filtered = [i for i in filtered if q in i.get("title", "").lower() or q in i.get("content", "").lower()]
        return filtered

    def get_item(self, item_id: str) -> dict | None:
        items = self._load_all()
        for i in items:
            if i["id"] == item_id:
                return i
        return None

    def delete_item(self, item_id: str) -> bool:
        items = self._load_all()
        initial_len = len(items)
        items = [i for i in items if i["id"] != item_id]
        if len(items) < initial_len:
            self._save_all(items)
            return True
        return False

saved_manager = SavedItemsManager()
