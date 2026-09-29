import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def post_json(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(endpoint):
    url = f"{BASE_URL}{endpoint}"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_all_tests():
    print("==================================================", flush=True)
    print("STARTING REAL END-TO-END VERIFICATION (11 TESTS)", flush=True)
    print("==================================================", flush=True)
    
    test_results = []
    
    # --------------------------------------------------
    # TEST 1 — EXACT CASE QUERY
    # --------------------------------------------------
    print("\n--- RUNNING TEST 1: EXACT CASE QUERY ---", flush=True)
    sess1 = post_json("/api/sessions/new", {"title": "Test 1 Session"})["session_id"]
    t1_q = "What did Maneka Gandhi v. Union of India (1978) 1 SCC 248 decide?"
    r1 = post_json("/api/chat", {"session_id": sess1, "message": t1_q})
    
    plan1 = r1.get("query_plan", {})
    sources1 = r1.get("source_metadata", [])
    larv_diag1 = r1.get("larv_diagnostics", [])
    
    top_case = sources1[0] if sources1 else {}
    top_larv = larv_diag1[0] if larv_diag1 else {}
    
    t1_pass = (
        plan1.get("intent") == "LEGAL_CASE" and
        "Maneka Gandhi" in str(plan1.get("case_name")) and
        "supreme_court_judgments" in plan1.get("selected_corpora", []) and
        r1.get("evidence_sufficient") == True
    )
    
    print(f"Plan Intent: {plan1.get('intent')} | Case: {plan1.get('case_name')} | Citation: {plan1.get('citation')}", flush=True)
    print(f"Retrieved Case Name: {top_case.get('heading')}", flush=True)
    print(f"Citation: {top_case.get('article_or_section')}", flush=True)
    print(f"Authority: {top_case.get('authority')}", flush=True)
    print(f"Source URL: {top_case.get('url')}", flush=True)
    print(f"RRF Score: {top_larv.get('rrf_score')} | LARV Score: {top_larv.get('larv_score')}", flush=True)
    print(f"Evidence Status: {r1.get('evidence_sufficient')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t1_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 1 — EXACT CASE QUERY",
        "expected": "LEGAL_CASE, Maneka Gandhi, supreme_court_judgments",
        "actual": f"Intent: {plan1.get('intent')}, Case: {plan1.get('case_name')}, Corpora: {plan1.get('selected_corpora')}",
        "evidence": f"Retrieved {top_case.get('heading')} ({top_case.get('article_or_section')})",
        "status": "PASS" if t1_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 2 — CASE + CONSTITUTION
    # --------------------------------------------------
    print("\n--- RUNNING TEST 2: CASE + CONSTITUTION ---", flush=True)
    sess2 = post_json("/api/sessions/new", {"title": "Test 2 Session"})["session_id"]
    t2_q = "What is the significance of the landmark ruling in Maneka Gandhi v. Union of India (1978) 1 SCC 248 : AIR 1978 SC 597? Key Holding: 'A law depriving a person of personal liberty under Article 21 must satisfy the tests of reasonableness under Article 19 and non-arbitrariness under Article 14.' How does this judicial precedent apply to current disputes?"
    r2 = post_json("/api/chat", {"session_id": sess2, "message": t2_q})
    
    plan2 = r2.get("query_plan", {})
    ev2_text = r2.get("evidence_passed", "")
    sources2 = [s.get("heading", "") + " / " + s.get("article_or_section", "") for s in r2.get("source_metadata", [])]
    
    has_maneka = any("Maneka Gandhi" in s for s in sources2) or "Maneka Gandhi" in ev2_text
    has_art14 = "Article 14" in ev2_text
    has_art19 = "Article 19" in ev2_text
    has_art21 = "Article 21" in ev2_text
    has_user_ctx = plan2.get("user_provided_context") is not None
    
    t2_pass = (
        plan2.get("intent") == "LEGAL_CASE" and
        "supreme_court_judgments" in plan2.get("selected_corpora", []) and
        "constitution" in plan2.get("selected_corpora", []) and
        has_maneka and has_art14 and has_art19 and has_art21 and has_user_ctx and
        r2.get("evidence_sufficient") == True
    )
    
    print(f"Corpora Targets: {plan2.get('selected_corpora')}", flush=True)
    print(f"Extracted User Context: {plan2.get('user_provided_context')[:80]}...", flush=True)
    print(f"Retrieved Sources: {sources2[:4]}", flush=True)
    print(f"Evidence Sufficient: {r2.get('evidence_sufficient')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t2_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 2 — CASE + CONSTITUTION",
        "expected": "Maneka Gandhi judgment + Articles 14, 19, 21 + User context isolated",
        "actual": f"Corpora: {plan2.get('selected_corpora')}, UserContext: {has_user_ctx}",
        "evidence": f"Sources: {sources2[:3]}",
        "status": "PASS" if t2_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 3 — NATURAL LANGUAGE CASE SEARCH
    # --------------------------------------------------
    print("\n--- RUNNING TEST 3: NATURAL LANGUAGE CASE SEARCH ---", flush=True)
    sess3 = post_json("/api/sessions/new", {"title": "Test 3 Session"})["session_id"]
    t3_q = "Why is Maneka Gandhi case important?"
    r3 = post_json("/api/chat", {"session_id": sess3, "message": t3_q})
    
    plan3 = r3.get("query_plan", {})
    t3_pass = (
        plan3.get("intent") == "LEGAL_CASE" and
        "supreme_court_judgments" in plan3.get("selected_corpora", []) and
        r3.get("evidence_sufficient") == True
    )
    print(f"Intent: {plan3.get('intent')} | Case: {plan3.get('case_name')} | Corpora: {plan3.get('selected_corpora')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t3_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 3 — NATURAL LANGUAGE CASE SEARCH",
        "expected": "LEGAL_CASE, Maneka Gandhi retrieved",
        "actual": f"Intent: {plan3.get('intent')}, Case: {plan3.get('case_name')}",
        "evidence": f"Retrieved {len(r3.get('source_metadata', []))} sources",
        "status": "PASS" if t3_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 4 — CITATION SEARCH
    # --------------------------------------------------
    print("\n--- RUNNING TEST 4: CITATION SEARCH ---", flush=True)
    sess4 = post_json("/api/sessions/new", {"title": "Test 4 Session"})["session_id"]
    t4_q = "1978 1 SCC 248"
    r4 = post_json("/api/chat", {"session_id": sess4, "message": t4_q})
    
    plan4 = r4.get("query_plan", {})
    t4_pass = (
        plan4.get("intent") == "LEGAL_CASE" and
        "supreme_court_judgments" in plan4.get("selected_corpora", []) and
        r4.get("evidence_sufficient") == True
    )
    print(f"Intent: {plan4.get('intent')} | Citations Extracted: {plan4.get('citation')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t4_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 4 — CITATION SEARCH",
        "expected": "LEGAL_CASE, citation extracted",
        "actual": f"Intent: {plan4.get('intent')}, Citations: {plan4.get('citation')}",
        "evidence": f"Sufficient: {r4.get('evidence_sufficient')}",
        "status": "PASS" if t4_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 5 — ARTICLE + CASE
    # --------------------------------------------------
    print("\n--- RUNNING TEST 5: ARTICLE + CASE ---", flush=True)
    sess5 = post_json("/api/sessions/new", {"title": "Test 5 Session"})["session_id"]
    t5_q = "Maneka Gandhi Article 21 personal liberty"
    r5 = post_json("/api/chat", {"session_id": sess5, "message": t5_q})
    
    plan5 = r5.get("query_plan", {})
    t5_pass = (
        plan5.get("intent") == "LEGAL_CASE" and
        "supreme_court_judgments" in plan5.get("selected_corpora", []) and
        "constitution" in plan5.get("selected_corpora", []) and
        r5.get("evidence_sufficient") == True
    )
    print(f"Intent: {plan5.get('intent')} | Corpora: {plan5.get('selected_corpora')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t5_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 5 — ARTICLE + CASE",
        "expected": "CASE + CONSTITUTION combined corpora",
        "actual": f"Corpora: {plan5.get('selected_corpora')}",
        "evidence": f"Articles: {plan5.get('articles')}",
        "status": "PASS" if t5_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 6 — FOLLOW-UP MEMORY
    # --------------------------------------------------
    print("\n--- RUNNING TEST 6: FOLLOW-UP MEMORY ---", flush=True)
    sess6 = post_json("/api/sessions/new", {"title": "Test 6 Session"})["session_id"]
    
    r6_1 = post_json("/api/chat", {"session_id": sess6, "message": "What did Maneka Gandhi v Union of India decide?"})
    r6_2 = post_json("/api/chat", {"session_id": sess6, "message": "What Articles were involved?"})
    r6_3 = post_json("/api/chat", {"session_id": sess6, "message": "Why is it important?"})
    r6_4 = post_json("/api/chat", {"session_id": sess6, "message": "How does that apply today?"})
    
    plan6_4 = r6_4.get("query_plan", {})
    t6_pass = (
        "Maneka Gandhi" in plan6_4.get("retrieval_query", "") or
        "supreme_court_judgments" in plan6_4.get("selected_corpora", [])
    )
    print(f"Turn 4 Plan Intent: {plan6_4.get('intent')} | Rewritten Query: {plan6_4.get('rewritten_query')[:70]}...", flush=True)
    print(f"PASS/FAIL: {'PASS' if t6_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 6 — FOLLOW-UP MEMORY",
        "expected": "Case context carried across pronouns/elliptical follow-ups",
        "actual": f"Rewritten query carries context: {'Maneka Gandhi' in plan6_4.get('rewritten_query', '')}",
        "evidence": f"Turn 4 Corpora: {plan6_4.get('selected_corpora')}",
        "status": "PASS" if t6_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 7 — TANGLISH
    # --------------------------------------------------
    print("\n--- RUNNING TEST 7: TANGLISH FOLLOW-UPS ---", flush=True)
    sess7 = post_json("/api/sessions/new", {"title": "Test 7 Session"})["session_id"]
    
    r7_1 = post_json("/api/chat", {"session_id": sess7, "message": "Maneka Gandhi case enna decide pannuchu?"})
    r7_2 = post_json("/api/chat", {"session_id": sess7, "message": "adhoda importance enna?"})
    r7_3 = post_json("/api/chat", {"session_id": sess7, "message": "indha principle ippo apply aaguma?"})
    
    plan7_3 = r7_3.get("query_plan", {})
    t7_pass = (
        "Maneka Gandhi" in plan7_3.get("retrieval_query", "") or
        "supreme_court_judgments" in plan7_3.get("selected_corpora", [])
    )
    print(f"Tanglish Turn 3 Language: {plan7_3.get('language')} | Rewritten Query: {plan7_3.get('rewritten_query')[:70]}...", flush=True)
    print(f"PASS/FAIL: {'PASS' if t7_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 7 — TANGLISH FOLLOW-UPS",
        "expected": "Tanglish antecedent resolution maintains case context",
        "actual": f"Language: {plan7_3.get('language')}, Rewritten: {'Maneka Gandhi' in plan7_3.get('rewritten_query', '')}",
        "evidence": f"Turn 3 Corpora: {plan7_3.get('selected_corpora')}",
        "status": "PASS" if t7_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 8 — WRONG CORPUS DETECTION
    # --------------------------------------------------
    print("\n--- RUNNING TEST 8: WRONG CORPUS DETECTION ---", flush=True)
    sess8 = post_json("/api/sessions/new", {"title": "Test 8 Session"})["session_id"]
    
    r8_1 = post_json("/api/chat", {"session_id": sess8, "message": "What is BNS Section 303?"})
    r8_2 = post_json("/api/chat", {"session_id": sess8, "message": "What is Article 21?"})
    r8_3 = post_json("/api/chat", {"session_id": sess8, "message": "How do I file an FIR?"})
    
    plan8_1 = r8_1.get("query_plan", {})
    plan8_2 = r8_2.get("query_plan", {})
    plan8_3 = r8_3.get("query_plan", {})
    
    t8_pass = (
        plan8_1.get("intent") == "LEGAL_STATUTE" and plan8_1.get("selected_corpora") == ["bns"] and
        plan8_2.get("intent") == "LEGAL_CONSTITUTION" and plan8_2.get("selected_corpora") == ["constitution"] and
        plan8_3.get("intent") == "LEGAL_PROCEDURE" and plan8_3.get("selected_corpora") == ["bnss"]
    )
    
    print(f"Q1 BNS 303 -> Intent: {plan8_1.get('intent')}, Corpora: {plan8_1.get('selected_corpora')}", flush=True)
    print(f"Q2 Art 21 -> Intent: {plan8_2.get('intent')}, Corpora: {plan8_2.get('selected_corpora')}", flush=True)
    print(f"Q3 FIR -> Intent: {plan8_3.get('intent')}, Corpora: {plan8_3.get('selected_corpora')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t8_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 8 — WRONG CORPUS DETECTION",
        "expected": "BNS Section 303 -> bns, Article 21 -> constitution, FIR -> bnss",
        "actual": f"Q1: {plan8_1.get('selected_corpora')}, Q2: {plan8_2.get('selected_corpora')}, Q3: {plan8_3.get('selected_corpora')}",
        "evidence": "No routing leaks to supreme_court_judgments",
        "status": "PASS" if t8_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 9 — NONEXISTENT CASE
    # --------------------------------------------------
    print("\n--- RUNNING TEST 9: NONEXISTENT CASE ---", flush=True)
    sess9 = post_json("/api/sessions/new", {"title": "Test 9 Session"})["session_id"]
    t9_q = "What did the Supreme Court decide in XYZ v ABC 2099?"
    r9 = post_json("/api/chat", {"session_id": sess9, "message": t9_q})
    
    plan9 = r9.get("query_plan", {})
    t9_pass = (
        r9.get("evidence_sufficient") == False or
        "does not contain" in r9.get("response", "").lower() or
        "not found" in r9.get("response", "").lower() or
        "not present" in r9.get("response", "").lower()
    )
    print(f"Response: {r9.get('response')[:150]}...", flush=True)
    print(f"Evidence Sufficient: {r9.get('evidence_sufficient')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t9_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 9 — NONEXISTENT CASE",
        "expected": "No fabricated judgment/citation, evidence validation rejects",
        "actual": f"Sufficient: {r9.get('evidence_sufficient')}, Response: {r9.get('response')[:80]}...",
        "evidence": "Zero fabrication enforcement verified",
        "status": "PASS" if t9_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 10 — BROWSER / API ENDPOINTS VERIFICATION
    # --------------------------------------------------
    print("\n--- RUNNING TEST 10: BROWSER / UI API VERIFICATION ---", flush=True)
    health = get_json("/api/health")
    cases_search = get_json("/api/cases/search?q=Maneka+Gandhi")
    
    t10_pass = (
        health.get("status") == "healthy" and
        "supreme_court_judgments" in health.get("corpora", []) and
        cases_search.get("total", 0) > 0
    )
    print(f"Health Status: {health.get('status')} | Corpora: {health.get('corpora')}", flush=True)
    print(f"Cases Search Total: {cases_search.get('total')} | First Case: {cases_search['cases'][0]['case_name'] if cases_search.get('cases') else None}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t10_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 10 — BROWSER / UI API VERIFICATION",
        "expected": "API healthy, supreme_court_judgments available, Case Explorer search works",
        "actual": f"Status: {health.get('status')}, Cases Total: {cases_search.get('total')}",
        "evidence": f"Found case: {cases_search['cases'][0]['case_name'] if cases_search.get('cases') else 'None'}",
        "status": "PASS" if t10_pass else "FAIL"
    })

    # --------------------------------------------------
    # TEST 11 — RAG DIAGNOSTICS
    # --------------------------------------------------
    print("\n--- RUNNING TEST 11: RAG DIAGNOSTICS ---", flush=True)
    diag = get_json(f"/api/rag/diagnostics?session_id={sess1}")
    
    last_plan = diag.get("last_query_plan", {})
    t11_pass = (
        diag.get("status") == "online" and
        last_plan.get("intent") == "LEGAL_CASE" and
        "supreme_court_judgments" in last_plan.get("selected_corpora", [])
    )
    print(f"Diagnostics Status: {diag.get('status')} | Last Plan Intent: {last_plan.get('intent')}", flush=True)
    print(f"Last Plan Case Name: {last_plan.get('case_name')} | Citations: {last_plan.get('citation')}", flush=True)
    print(f"PASS/FAIL: {'PASS' if t11_pass else 'FAIL'}", flush=True)
    
    test_results.append({
        "test": "TEST 11 — RAG DIAGNOSTICS",
        "expected": "RAG diagnostics report full query plan & LARV candidates",
        "actual": f"Status: {diag.get('status')}, Last Intent: {last_plan.get('intent')}",
        "evidence": f"Last Case: {last_plan.get('case_name')}",
        "status": "PASS" if t11_pass else "FAIL"
    })

    print("\n==================================================", flush=True)
    print("FINAL SUMMARY REPORT FOR ALL 11 TESTS", flush=True)
    print("==================================================", flush=True)
    for tr in test_results:
        print(f"{tr['test']} | Expected: {tr['expected']} | Actual: {tr['actual']} | Status: {tr['status']}", flush=True)
        
    return test_results

if __name__ == "__main__":
    results = run_all_tests()
