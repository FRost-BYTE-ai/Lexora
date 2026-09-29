import sys
import json
import time

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from chatbot.chatbot import LexoraChatbot
bot = LexoraChatbot(config={"use_lora": False})

queries = [
    "Tamil Nadu Cooperative Societies Act",
    "cooperative society dispute",
    "relevant cooperative registrar provision",
    "Tamil Nadu Panchayats Act",
    "Panchayat is refusing to act. What can I do?"
]

print("=== RETRIEVAL AUDIT FOR TAMIL NADU CORPUS ===")
for q in queries:
    sid = bot.start_consultation()
    res = bot.process_message(sid, q)
    print(f"\n[QUERY]: {q}")
    print("Scope:", res.get("scope"))
    print("Selected Corpora:", res.get("query_plan", {}).get("selected_corpora"))
    print("Evidence Sufficient:", res.get("evidence_sufficient"))
    print("Retrieved Sources Count:", len(res.get("source_metadata", [])))
    for s in res.get("source_metadata", []):
        act = s.get("act_name")
        sec = s.get("article_or_section")
        hd = s.get("heading")
        auth = s.get("authority")
        url = s.get("url")
        print(f"  - Act: {act} | Section: {sec} | Heading: {hd} | Auth: {auth} | URL: {url}")
    print("Response Text:", res.get("response", "").strip())
