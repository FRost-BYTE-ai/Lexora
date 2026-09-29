import sys
import json
import time

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from chatbot.chatbot import LexoraChatbot
bot = LexoraChatbot(config={"use_lora": False})

remaining_cases = [
    {"id": "TN_01", "query": "How are disputes in a co-operative society resolved under Tamil Nadu law?"},
    {"id": "SCOPE_01", "query": "Tell me a chicken biryani recipe."},
    {"id": "LANG_01", "query": "thiruttu ku enna punishment?"},
    {"id": "HALLUC_01", "query": "Explain Section 999 of the Constitution of India."}
]

for tc in remaining_cases:
    t0 = time.time()
    sid = bot.start_consultation()
    res = bot.process_message(sid, tc["query"])
    dt = time.time() - t0
    resp = res.get("response", "").strip()
    corp = res.get("query_plan", {}).get("selected_corpora", [])
    suff = res.get("evidence_sufficient", True)
    sources = len(res.get("source_metadata", []))
    print(f"[{tc['id']}] {dt:.2f}s | Scope: {res.get('scope')} | Suff: {suff} | Corp: {corp} | Sources: {sources}", flush=True)
    print(f"   Ans: {resp}", flush=True)
