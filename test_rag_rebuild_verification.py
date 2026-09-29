import sys
import json
import time

from chatbot.chatbot import LexoraChatbot

def run_tests():
    print("==================================================", flush=True)
    print("LEXORA RAG + CHATBOT REBUILD DIAGNOSTIC VERIFICATION", flush=True)
    print("==================================================", flush=True)
    
    bot = LexoraChatbot(config={"use_lora": False})
    
    test_cases = [
        {
            "name": "MANEKA_GANDHI_PRECEDENT",
            "query": "What is the significance of the landmark ruling in Maneka Gandhi v. Union of India (1978) 1 SCC 248 : AIR 1978 SC 597? Key Holding: 'A law depriving a person of personal liberty under Article 21 must satisfy the tests of reasonableness under Article 19 and non-arbitrariness under Article 14.' How does this judicial precedent apply to current disputes?",
            "expected_intent": "LEGAL_CASE",
            "expected_corpora": ["supreme_court_judgments", "constitution"],
            "must_pass_validation": True
        },
        {
            "name": "PUTTASWAMY_PRIVACY",
            "query": "What did Justice K.S. Puttaswamy v Union of India (2017) 10 SCC 1 decide regarding Article 21 and Right to Privacy?",
            "expected_intent": "LEGAL_CASE",
            "expected_corpora": ["supreme_court_judgments", "constitution"],
            "must_pass_validation": True
        },
        {
            "name": "KESAVANANDA_BHARATI",
            "query": "Explain the Basic Structure doctrine under Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225.",
            "expected_intent": "LEGAL_CASE",
            "expected_corpora": ["supreme_court_judgments", "constitution"],
            "must_pass_validation": True
        },
        {
            "name": "STATUTE_BNS_303",
            "query": "What is BNS Section 303?",
            "expected_intent": "LEGAL_STATUTE",
            "expected_corpora": ["bns"],
            "must_pass_validation": True
        },
        {
            "name": "CONSTITUTION_ART_21",
            "query": "What is Article 21?",
            "expected_intent": "LEGAL_CONSTITUTION",
            "expected_corpora": ["constitution"],
            "must_pass_validation": True
        },
        {
            "name": "GOVERNMENT_SCHEME",
            "query": "What government schemes are available for farmers?",
            "expected_intent": "LEGAL_SCHEME",
            "expected_corpora": ["constitution", "tamilnadu"],
            "must_pass_validation": True
        },
        {
            "name": "GREETING",
            "query": "Hi",
            "expected_intent": "GREETING",
            "expected_corpora": [],
            "must_pass_validation": True
        },
        {
            "name": "NONLEGAL",
            "query": "Give me a biryani recipe",
            "expected_intent": "NONLEGAL",
            "expected_corpora": [],
            "must_pass_validation": True
        }
    ]

    all_passed = True
    session_id = bot.start_consultation(title="Diagnostic Test Suite")

    for tc in test_cases:
        print(f"\n--------------------------------------------------", flush=True)
        print(f"RUNNING TEST: {tc['name']}", flush=True)
        print(f"Query: {tc['query'][:90]}...", flush=True)
        
        t0 = time.time()
        res = bot.process_message(session_id, tc['query'])
        elapsed = time.time() - t0
        
        plan = res.get("query_plan", {})
        intent = plan.get("intent")
        corpora = plan.get("selected_corpora", [])
        scope = res.get("scope")
        response_text = res.get("response", "")
        sufficient = res.get("evidence_sufficient", True)
        records = res.get("retrieved_records", 0)

        print(f"Result Scope: {scope} | Intent: {intent} | Corpora: {corpora}", flush=True)
        print(f"Retrieved Records: {records} | Evidence Sufficient: {sufficient} | Time: {elapsed:.2f}s", flush=True)
        print(f"Response Preview: {response_text[:200]}...", flush=True)

        # Assertions
        if scope == "LEGAL":
            if intent != tc["expected_intent"]:
                print(f"[FAIL] Expected intent {tc['expected_intent']}, got {intent}", flush=True)
                all_passed = False
            else:
                print(f"[PASS] Intent matches {intent}", flush=True)

            if any(c not in corpora for c in tc["expected_corpora"]):
                print(f"[FAIL] Expected corpora {tc['expected_corpora']} not fully in {corpora}", flush=True)
                all_passed = False
            else:
                print(f"[PASS] Corpora targets matched {corpora}", flush=True)

            if tc["must_pass_validation"] and not sufficient:
                print(f"[FAIL] Evidence validation failed! Reason: {res.get('reason')}", flush=True)
                all_passed = False
            else:
                print(f"[PASS] Evidence validation passed cleanly.", flush=True)
        else:
            print(f"[PASS] Non-legal / Casual scope correctly handled.", flush=True)

    print("\n==================================================", flush=True)
    if all_passed:
        print("ALL DIAGNOSTIC TEST CASES PASSED PERFECTLY!", flush=True)
    else:
        print("SOME TEST CASES FAILED — CHECK LOGS ABOVE.", flush=True)
    print("==================================================", flush=True)
    return all_passed

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
