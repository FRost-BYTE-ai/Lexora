import sys
import json
import time

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from chatbot.chatbot import LexoraChatbot

print("=== STARTING TARGETED VERIFICATION SCRIPT ===", flush=True)
bot = LexoraChatbot(config={"use_lora": False})

test_cases = [
    {"id": "CONST_01", "query": "What is Article 21?", "expected_corpus": "constitution", "expected_keywords": ["life", "personal liberty"]},
    {"id": "CONST_02", "query": "Explain Article 14.", "expected_corpus": "constitution", "expected_keywords": ["equality", "law"]},
    {"id": "BNS_01", "query": "what is the punishment for pickpocketing?", "expected_corpus": "bns", "expected_keywords": ["theft", "303"]},
    {"id": "BNS_02", "query": "someone stole my phone from my pocket", "expected_corpus": "bns", "expected_keywords": ["theft", "303"]},
    {"id": "BNSS_01", "query": "How do I file a criminal complaint or FIR under BNSS?", "expected_corpus": "bnss", "expected_keywords": ["173"]},
    {"id": "BSA_01", "query": "Can electronic records like WhatsApp messages be used as evidence in court?", "expected_corpus": "bsa", "expected_keywords": ["electronic", "61"]},
    {"id": "TN_01", "query": "How are disputes in a co-operative society resolved under Tamil Nadu law?", "expected_corpus": "tamilnadu", "expected_keywords": ["Registrar", "90"]},
    {"id": "SCOPE_01", "query": "Tell me a chicken biryani recipe.", "expected_exact": "I only help with legal queries."},
    {"id": "LANG_01", "query": "thiruttu ku enna punishment?", "expected_corpus": "bns", "expected_keywords": ["theft", "303"]},
    {"id": "HALLUC_01", "query": "Explain Section 999 of the Constitution of India.", "expected_sufficient": False}
]

passed = 0
results = []
for tc in test_cases:
    sid = bot.start_consultation()
    res = bot.process_message(sid, tc["query"])
    resp = res.get("response", "").strip()
    plan = res.get("query_plan", {})
    corp = plan.get("selected_corpora", [])
    suff = res.get("evidence_sufficient", True)
    
    ok = True
    reasons = []
    if "expected_exact" in tc and resp != tc["expected_exact"]:
        ok = False
        reasons.append(f"Expected exact mismatch: '{resp}'")
    if "expected_corpus" in tc and tc["expected_corpus"] not in corp:
        ok = False
        reasons.append(f"Expected corpus '{tc['expected_corpus']}' not in {corp}")
    if "expected_sufficient" in tc and suff != tc["expected_sufficient"]:
        ok = False
        reasons.append(f"Expected sufficiency {tc['expected_sufficient']} != {suff}")
    if "expected_keywords" in tc:
        check_str = f"{resp.lower()} {res.get('evidence_passed', '').lower()}"
        for kw in tc["expected_keywords"]:
            if kw.lower() not in check_str:
                ok = False
                reasons.append(f"Missing keyword '{kw}'")
                
    if ok:
        passed += 1
        print(f"[{tc['id']}] PASS -> Scope: {res.get('scope')} | Corp: {corp} | Sources: {len(res.get('source_metadata', []))}", flush=True)
    else:
        print(f"[{tc['id']}] FAIL -> {reasons}", flush=True)
        print(f"   Response: {resp[:120]}...", flush=True)
        
    results.append({
        "id": tc["id"],
        "query": tc["query"],
        "passed": ok,
        "reasons": reasons,
        "response": resp,
        "metrics": res.get("metrics")
    })

print(f"\n=== RESULT: {passed}/{len(test_cases)} PASSED ({passed/len(test_cases)*100:.1f}%) ===", flush=True)

with open(r"C:\Lexora\comprehensive_test_report.json", "w", encoding="utf-8") as f:
    json.dump({
        "total_tests": len(test_cases),
        "passed_tests": passed,
        "pass_rate": f"{passed/len(test_cases)*100:.1f}%",
        "results": results
    }, f, indent=4)
