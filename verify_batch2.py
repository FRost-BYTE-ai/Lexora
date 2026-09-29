import sys
import json
import time

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from chatbot.chatbot import LexoraChatbot
bot = LexoraChatbot(config={"use_lora": False})

test_cases = [
    {"id": "BNS_01", "query": "what is the punishment for pickpocketing?", "expected_corpus": "bns", "expected_keywords": ["theft", "303"]},
    {"id": "BNS_02", "query": "someone stole my phone from my pocket", "expected_corpus": "bns", "expected_keywords": ["theft", "303"]},
    {"id": "BNSS_01", "query": "How do I file a criminal complaint or FIR under BNSS?", "expected_corpus": "bnss", "expected_keywords": ["173"]},
    {"id": "BSA_01", "query": "Can electronic records like WhatsApp messages be used as evidence in court?", "expected_corpus": "bsa", "expected_keywords": ["electronic", "61"]},
    {"id": "TN_01", "query": "How are disputes in a co-operative society resolved under Tamil Nadu law?", "expected_corpus": "tamilnadu", "expected_keywords": ["Registrar", "90"]},
    {"id": "SCOPE_01", "query": "Tell me a chicken biryani recipe.", "expected_exact": "I only help with legal queries."},
    {"id": "LANG_01", "query": "thiruttu ku enna punishment?", "expected_corpus": "bns", "expected_keywords": ["theft", "303"]},
    {"id": "HALLUC_01", "query": "Explain Section 999 of the Constitution of India.", "expected_sufficient": False}
]

for tc in test_cases:
    t0 = time.time()
    sid = bot.start_consultation()
    res = bot.process_message(sid, tc["query"])
    dt = time.time() - t0
    resp = res.get("response", "").strip()
    corp = res.get("query_plan", {}).get("selected_corpora", [])
    suff = res.get("evidence_sufficient", True)
    sources = len(res.get("source_metadata", []))
    print(f"[{tc['id']}] {dt:.2f}s | Scope: {res.get('scope')} | Suff: {suff} | Corp: {corp} | Sources: {sources}", flush=True)
    print(f"   Ans: {resp[:160]}...", flush=True)
