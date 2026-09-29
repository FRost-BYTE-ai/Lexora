"""
Lexora Comprehensive Regression & Evaluation Suite
==================================================
Covers all evaluation tracks:
A. Constitution Regression (Art 14, Art 19(1)(a), Art 21, Art 32, Fundamental Rights)
B. BNS Natural Language (Pickpocketing, Stolen phone, Stolen wallet, Theft, Sec 303, Criminal intimidation)
C. BNSS Procedural Law (FIR filing, criminal complaints, arrest, bail)
D. BSA Evidence Law (Admissibility of electronic records, WhatsApp/CCTV proof)
E. Tamil Nadu State Law (Co-operative societies disputes under TN Act 1983)
F. Legal Scope Guard (Non-legal strict response, Ambiguous queries, Government schemes)
G. Multi-Turn Session Memory (Pronoun & antecedent continuation, New session isolation)
H. Tamil & Tanglish Language Support
I. Hallucination Resistance & Evidence Validation
"""

import sys
import json
import time

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try: sys.stderr.reconfigure(encoding='utf-8')
    except Exception: pass

from chatbot.chatbot import LexoraChatbot

def run_evaluation_suite():
    print("==================================================")
    print("STARTING LEXORA COMPREHENSIVE REGRESSION SUITE")
    print("==================================================")
    
    t_suite_start = time.time()
    bot = LexoraChatbot(config={"use_lora": False})
    
    test_cases = [
        # --- A. CONSTITUTION REGRESSION ---
        {
            "id": "CONST_01",
            "category": "Constitution",
            "query": "What is Article 21?",
            "expected_corpus": "constitution",
            "expected_keywords": ["life", "personal liberty"],
            "new_session": True
        },
        {
            "id": "CONST_02",
            "category": "Constitution",
            "query": "Explain Article 14.",
            "expected_corpus": "constitution",
            "expected_keywords": ["equality", "law"],
            "new_session": True
        },
        {
            "id": "CONST_03",
            "category": "Constitution",
            "query": "What does Article 19(1)(a) protect?",
            "expected_corpus": "constitution",
            "expected_keywords": ["freedom of speech", "expression"],
            "new_session": True
        },
        {
            "id": "CONST_04",
            "category": "Constitution",
            "query": "Article 19 (1) (a)",
            "expected_corpus": "constitution",
            "expected_keywords": ["freedom of speech", "expression"],
            "new_session": True
        },
        {
            "id": "CONST_05",
            "category": "Constitution",
            "query": "What are the Fundamental Rights?",
            "expected_corpus": "constitution",
            "expected_keywords": ["Part III", "right"],
            "new_session": True
        },

        # --- B. BNS NATURAL LANGUAGE & SUBSTANTIVE CRIMINAL LAW ---
        {
            "id": "BNS_01",
            "category": "BNS Natural Language",
            "query": "what is the punishment for pickpocketing?",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "BNS_02",
            "category": "BNS Natural Language",
            "query": "someone stole my phone from my pocket",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "BNS_03",
            "category": "BNS Natural Language",
            "query": "someone took my wallet from my pocket",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "BNS_04",
            "category": "BNS Natural Language",
            "query": "what offence is taking someone's phone?",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "BNS_05",
            "category": "BNS Natural Language",
            "query": "what is the punishment for theft?",
            "expected_corpus": "bns",
            "expected_keywords": ["303"],
            "new_session": True
        },
        {
            "id": "BNS_06",
            "category": "BNS Explicit Section",
            "query": "BNS section 303",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "BNS_07",
            "category": "BNS Explicit Section",
            "query": "explain section 303",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },

        # --- C. BNSS PROCEDURAL LAW ---
        {
            "id": "BNSS_01",
            "category": "BNSS Procedure",
            "query": "How do I file a criminal complaint or FIR under BNSS?",
            "expected_corpus": "bnss",
            "expected_keywords": ["173"],
            "new_session": True
        },
        {
            "id": "BNSS_02",
            "category": "BNSS Procedure",
            "query": "What are the rules for anticipatory bail under BNSS?",
            "expected_corpus": "bnss",
            "expected_keywords": ["bail", "482"],
            "new_session": True
        },

        # --- D. BSA EVIDENCE LAW ---
        {
            "id": "BSA_01",
            "category": "BSA Evidence",
            "query": "Can electronic records like WhatsApp messages be used as evidence in court?",
            "expected_corpus": "bsa",
            "expected_keywords": ["electronic", "61"],
            "new_session": True
        },

        # --- E. TAMIL NADU STATE LAW ---
        {
            "id": "TN_01",
            "category": "Tamil Nadu State Law",
            "query": "How are disputes in a co-operative society resolved under Tamil Nadu law?",
            "expected_corpus": "tamilnadu",
            "expected_keywords": ["Registrar", "90"],
            "new_session": True
        },

        # --- F. LEGAL SCOPE GUARD ---
        {
            "id": "SCOPE_01",
            "category": "Scope Guard Non-Legal",
            "query": "Tell me a chicken biryani recipe.",
            "expected_exact": "I only help with legal queries.",
            "new_session": True
        },
        {
            "id": "SCOPE_02",
            "category": "Scope Guard Non-Legal",
            "query": "Write a python script to sort a list of numbers.",
            "expected_exact": "I only help with legal queries.",
            "new_session": True
        },
        {
            "id": "SCOPE_03",
            "category": "Scope Guard Ambiguous",
            "query": "Can you help me?",
            "expected_scope": "AMBIGUOUS",
            "new_session": True
        },
        {
            "id": "SCOPE_04",
            "category": "Scope Guard Scheme",
            "query": "What are the legal eligibility criteria and grievance redressal under the food security ration scheme?",
            "expected_scope": "LEGAL",
            "new_session": True
        },

        # --- G. MULTI-TURN CONVERSATION MEMORY ---
        {
            "id": "MEM_01",
            "category": "Conversation Memory Turn 1",
            "query": "My neighbour is harassing and threatening me.",
            "expected_corpus": "bns",
            "new_session": True
        },
        {
            "id": "MEM_02",
            "category": "Conversation Memory Turn 2",
            "query": "He said he would kill me.",
            "expected_corpus": "bns",
            "expected_keywords": ["351"],
            "new_session": False  # Same session as MEM_01
        },
        {
            "id": "MEM_03",
            "category": "New Session Isolation",
            "query": "What were we discussing?",
            "expected_scope": "AMBIGUOUS",
            "new_session": True  # Isolated new consultation
        },

        # --- H. TAMIL & TANGLISH SUPPORT ---
        {
            "id": "LANG_01",
            "category": "Tanglish Legal",
            "query": "thiruttu ku enna punishment?",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "LANG_02",
            "category": "Tanglish Legal",
            "query": "phone ah pocket la irundhu thiruditaanga",
            "expected_corpus": "bns",
            "expected_keywords": ["theft", "303"],
            "new_session": True
        },
        {
            "id": "LANG_03",
            "category": "Tanglish Legal",
            "query": "Article 21 na enna?",
            "expected_corpus": "constitution",
            "expected_keywords": ["life"],
            "new_session": True
        },

        # --- I. HALLUCINATION RESISTANCE ---
        {
            "id": "HALLUC_01",
            "category": "Hallucination Guard",
            "query": "Explain Section 999 of the Constitution of India.",
            "expected_sufficient": False,
            "new_session": True
        }
    ]
    
    results = []
    passed_count = 0
    total_count = len(test_cases)
    
    session_id = None
    for tc in test_cases:
        if tc.get("new_session") or session_id is None:
            session_id = bot.start_consultation()
            
        print(f"\n[{tc['id']}] Testing: {tc['query']}", flush=True)
        res = bot.process_message(session_id, tc["query"])
        
        response_text = res.get("response", "").strip()
        scope = res.get("scope")
        selected_corpora = res.get("query_plan", {}).get("selected_corpora", []) if res.get("query_plan") else []
        evidence_sufficient = res.get("evidence_sufficient", True)
        source_count = len(res.get("source_metadata", []))
        
        test_passed = True
        failure_reasons = []
        
        # Check exact string if specified
        if "expected_exact" in tc:
            if response_text != tc["expected_exact"]:
                test_passed = False
                failure_reasons.append(f"Expected exact '{tc['expected_exact']}', got '{response_text}'")
                
        # Check scope if specified
        if "expected_scope" in tc:
            if scope != tc["expected_scope"]:
                test_passed = False
                failure_reasons.append(f"Expected scope '{tc['expected_scope']}', got '{scope}'")
                
        # Check corpus routing if specified
        if "expected_corpus" in tc:
            if tc["expected_corpus"] not in selected_corpora:
                test_passed = False
                failure_reasons.append(f"Expected corpus '{tc['expected_corpus']}' in {selected_corpora}")
                
        # Check keywords in response
        if "expected_keywords" in tc:
            combined_check = f"{response_text.lower()} {res.get('evidence_passed', '').lower()}"
            for kw in tc["expected_keywords"]:
                if kw.lower() not in combined_check:
                    test_passed = False
                    failure_reasons.append(f"Expected keyword '{kw}' missing from response/evidence")
                    
        # Check sufficiency if specified
        if "expected_sufficient" in tc:
            if evidence_sufficient != tc["expected_sufficient"]:
                test_passed = False
                failure_reasons.append(f"Expected sufficiency {tc['expected_sufficient']}, got {evidence_sufficient}")
                
        if test_passed:
            passed_count += 1
            print(f"-> PASS | Scope: {scope} | Corpora: {selected_corpora} | Sources: {source_count}", flush=True)
        else:
            print(f"-> FAIL | Reasons: {', '.join(failure_reasons)}", flush=True)
            print(f"   Response Preview: {response_text[:120]}...", flush=True)
            
        results.append({
            "test_id": tc["id"],
            "category": tc["category"],
            "query": tc["query"],
            "passed": test_passed,
            "failure_reasons": failure_reasons,
            "scope": scope,
            "selected_corpora": selected_corpora,
            "response": response_text,
            "source_count": source_count,
            "metrics": res.get("metrics")
        })
        
    duration = time.time() - t_suite_start
    print("\n==================================================", flush=True)
    print(f"EVALUATION SUITE FINISHED: {passed_count}/{total_count} PASSED ({passed_count/total_count*100:.1f}%) in {duration:.2f}s", flush=True)
    print("==================================================", flush=True)
    
    with open(r"C:\Lexora\comprehensive_test_report.json", "w", encoding="utf-8") as f:
        json.dump({
            "total_tests": total_count,
            "passed_tests": passed_count,
            "pass_rate": f"{passed_count/total_count*100:.1f}%",
            "duration_seconds": duration,
            "test_details": results
        }, f, indent=4)
        
    return passed_count, total_count

if __name__ == '__main__':
    run_evaluation_suite()

