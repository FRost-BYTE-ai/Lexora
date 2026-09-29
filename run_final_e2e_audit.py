import os
import sys
import json
import time
import psutil
import requests
import fitz # PyMuPDF

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from chatbot.chatbot import LexoraChatbot

print("=== STARTING FULL END-TO-END AUDIT & PERFORMANCE PROFILING ===", flush=True)

proc = psutil.Process()
ram_startup_mb = proc.memory_info().rss / (1024 * 1024)
print(f"[METRIC] Startup RAM: {ram_startup_mb:.2f} MB", flush=True)

t_init_start = time.time()
bot = LexoraChatbot(config={"use_lora": False})
t_init = time.time() - t_init_start

ram_model_loaded_mb = proc.memory_info().rss / (1024 * 1024)
print(f"[METRIC] RAM after loading embeddings & model: {ram_model_loaded_mb:.2f} MB (Init Time: {t_init:.2f}s)", flush=True)

# 3. ACTUAL END-TO-END DEMO TEST SUITE (10 Queries A to J)
queries = [
    {"label": "A", "q": "What is Article 21?", "desc": "Constitution"},
    {"label": "B", "q": "What is the punishment for pickpocketing?", "desc": "BNS Substantive"},
    {"label": "C", "q": "How do I file a criminal complaint under BNSS?", "desc": "BNSS Procedure"},
    {"label": "D", "q": "Can WhatsApp messages be used as evidence?", "desc": "BSA Evidence"},
    {"label": "E", "q": "How are disputes in a Tamil Nadu cooperative society resolved?", "desc": "TN State Law"},
    {"label": "F", "q": "Panchayat is refusing to act. What can I do?", "desc": "TN Panchayats Law"},
    {"label": "G", "q": "thiruttu ku enna punishment?", "desc": "Tanglish Theft"},
    {"label": "H", "q": "En neighbour enna threaten panraru.", "desc": "Tanglish Criminal Intimidation Turn 1"},
    {"label": "I", "q": "Tell me a chicken recipe.", "desc": "Scope Guard Non-Legal"},
    {"label": "J", "q": "Explain Section 999 of the Constitution.", "desc": "Hallucination Guard Non-Existent"}
]

query_latencies = []
conversation_1_id = bot.start_consultation()
conv_id = conversation_1_id

audit_results = []

for idx, item in enumerate(queries):
    # For Turn 2 test of Tanglish neighbour threatening
    if item["label"] == "I":
        # Start a new conversation for non-legal check
        conv_id = bot.start_consultation()
    
    t_start = time.time()
    res = bot.process_message(conv_id, item["q"])
    lat = time.time() - t_start
    query_latencies.append(lat)
    
    resp = res.get("response", "").strip()
    plan = res.get("query_plan", {})
    scope = res.get("scope")
    lang = plan.get("language", "en") if plan else "en"
    corp = plan.get("selected_corpora", []) if plan else []
    suff = res.get("evidence_sufficient", True)
    sources = res.get("source_metadata", [])
    
    print(f"\n[{item['label']}] ({item['desc']}) Query: '{item['q']}'", flush=True)
    print(f"    Latency: {lat:.2f}s | Scope: {scope} | Lang: {lang} | Corpora: {corp} | Sources: {len(sources)} | Suff: {suff}", flush=True)
    print(f"    Response: {resp[:180]}...", flush=True)
    if sources:
        top_s = sources[0]
        print(f"    [Top Source] Act: {top_s.get('act_name')} | Sec/Art: {top_s.get('article_or_section')} | Auth: {top_s.get('authority')} | URL: {top_s.get('url')}", flush=True)
        print(f"    [Top Excerpt]: {repr(top_s.get('text_excerpt', '')[:100])}", flush=True)
        
    audit_results.append({
        "label": item["label"],
        "description": item["desc"],
        "query": item["q"],
        "latency_sec": round(lat, 2),
        "scope": scope,
        "language": lang,
        "corpora": corp,
        "evidence_sufficient": suff,
        "source_count": len(sources),
        "top_source": sources[0] if sources else None,
        "response": resp
    })

ram_after_10_queries_mb = proc.memory_info().rss / (1024 * 1024)
print(f"\n[METRIC] RAM after 10 queries: {ram_after_10_queries_mb:.2f} MB", flush=True)

# 4. MULTI-CONVERSATION MEMORY & ISOLATION PROFILING (3 Conversations)
c1 = bot.start_consultation()
bot.process_message(c1, "My neighbour threatened to kill me yesterday.")
bot.process_message(c1, "What sections apply to him?")
sess1_len = len(bot.session_manager.get_session(c1).turns)

c2 = bot.start_consultation()
bot.process_message(c2, "What is Article 14?")
sess2_len = len(bot.session_manager.get_session(c2).turns)

c3 = bot.start_consultation()
res_c3 = bot.process_message(c3, "What were we discussing earlier?")
sess3_len = len(bot.session_manager.get_session(c3).turns)

ram_after_3_convs_mb = proc.memory_info().rss / (1024 * 1024)
print(f"[METRIC] RAM after 3 separate conversations: {ram_after_3_convs_mb:.2f} MB", flush=True)
print(f"[ISOLATION] C1 Turns: {sess1_len}, C2 Turns: {sess2_len}, C3 Turns: {sess3_len} | C3 Scope: {res_c3.get('scope')}", flush=True)

# 5. DOCUMENT ISOLATION AUDIT
doc_session_id = bot.start_consultation()
bot.session_manager.attach_document_to_session(
    doc_session_id,
    doc_id="lease_notice_01",
    filename="Eviction_Notice.txt",
    doc_type="text",
    raw_text="CONFIDENTIAL NOTICE: Tenant Mr. Kumar is hereby given 15 days to vacate Premises No. 42 Gandhi Nagar due to non-payment of rent for 3 consecutive months totaling Rs. 45,000.",
    summary="Eviction notice to Mr. Kumar for non-payment of rent of Rs 45,000."
)

res_doc = bot.process_message(doc_session_id, "Who is the tenant mentioned in the notice and what is the amount due?")
print(f"\n[DOCUMENT ANALYSIS in Session {doc_session_id[:8]}] Responded: {res_doc['response'][:200]}...", flush=True)

# Check isolation in a clean session
clean_session_id = bot.start_consultation()
res_clean = bot.process_message(clean_session_id, "Who is the tenant mentioned in the notice?")
print(f"[DOCUMENT ISOLATION in Clean Session {clean_session_id[:8]}] Response: {res_clean['response'][:200]}...", flush=True)

# 6. VOICE PIPELINE AUDIT
voice_res_en = bot.process_voice_message(bot.start_consultation(), "What is Article 21 of the Constitution?")
voice_res_ta = bot.process_voice_message(bot.start_consultation(), "thiruttu ku enna punishment?")
print(f"\n[VOICE EN] Is Voice: {voice_res_en.get('is_voice')} | Scope: {voice_res_en.get('scope')} | Res: {voice_res_en.get('response')[:120]}...", flush=True)
print(f"[VOICE TANGLISH] Is Voice: {voice_res_ta.get('is_voice')} | Scope: {voice_res_ta.get('scope')} | Res: {voice_res_ta.get('response')[:120]}...", flush=True)

final_summary = {
    "metrics": {
        "startup_ram_mb": round(ram_startup_mb, 2),
        "ram_model_loaded_mb": round(ram_model_loaded_mb, 2),
        "first_query_latency_sec": round(query_latencies[0], 2),
        "subsequent_query_latency_avg_sec": round(sum(query_latencies[1:]) / len(query_latencies[1:]), 2),
        "ram_after_10_queries_mb": round(ram_after_10_queries_mb, 2),
        "ram_after_3_convs_mb": round(ram_after_3_convs_mb, 2),
    },
    "audit_results": audit_results,
    "document_isolation_verified": "Kumar" not in res_clean["response"],
    "voice_verified": voice_res_en.get("is_voice") and voice_res_ta.get("is_voice")
}

with open(r"C:\Lexora\e2e_audit_report.json", "w", encoding="utf-8") as f:
    json.dump(final_summary, f, indent=4)

print("\n=== COMPLETE AUDIT FINISHED SUCCESSFULLY ===", flush=True)
