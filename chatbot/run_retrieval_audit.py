"""
Pure Retrieval & Evidence Validator Audit Runner (Bypasses LLM generation loop)
Evaluates Retrieval Accuracy, Evidence Sufficiency, Scope Detection, and Concept Expansion
across all audit categories in ~10 seconds.
"""

import sys
import os
import json

LEXORA_ROOT = r"C:\Lexora"
if LEXORA_ROOT not in sys.path:
    sys.path.insert(0, LEXORA_ROOT)
os.chdir(LEXORA_ROOT)

from chatbot.query_understanding import understand_query
from chatbot.chatbot import LexoraChatbot

def run_retrieval_audit():
    print("=" * 80)
    print("LEXORA PRODUCTION-READINESS RETRIEVAL AUDIT")
    print("=" * 80)
    
    bot = LexoraChatbot(config={"use_lora": False})
    
    audit_results = {
        "existing_19_tests": [],
        "unseen_15_criminal": [],
        "tanglish_5_queries": [],
        "multiturn_5_sessions": [],
        "non_legal_5_queries": [],
        "section_variations": [],
        "insufficient_evidence_cases": []
    }

    # 1. Existing 19 Baseline Queries
    existing_queries = [
        # Constitution (7)
        "What is Article 21?",
        "Explain Article 14.",
        "What does Article 19(1)(a) protect?",
        "Article 19 (1) (a)",
        "What are the Fundamental Rights?",
        "What is the right to equality?",
        "Explain Article 32.",
        # BNS Exact (2)
        "What is BNS Section 303?",
        "Explain Section 303.",
        # Theft/Pickpocketing NL (6)
        "What is the punishment for pickpocketing?",
        "Someone stole my phone from my pocket.",
        "What offence is taking someone's wallet from their pocket?",
        "What is the punishment for theft?",
        "What is the punishment for robbery?",
        "What is the punishment for criminal intimidation?",
        # Guardrails & Context (4)
        "Tell me a chicken recipe.",
        "I have a problem with my neighbour.",
        "They keep threatening me.",
        "Why is the neighbour bothering me?"
    ]

    print("\n--- 1. Auditing Existing 19 Baseline Queries ---")
    conv_context = []
    for q in existing_queries:
        plan = understand_query(q, conv_context)
        if plan["legal_scope"] == "NON_LEGAL":
            audit_results["existing_19_tests"].append({
                "query": q, "scope": "NON_LEGAL", "records": 0, "sufficient": True, "top_doc": None
            })
            continue
            
        top_docs, scores = bot.execute_multi_corpus_retrieval(plan)
        sufficient, reason = bot.evidence_validator.validate_retrieval(plan, top_docs, scores)
        top_payload = top_docs[0].payload if top_docs else None
        
        audit_results["existing_19_tests"].append({
            "query": q,
            "scope": plan["legal_scope"],
            "concepts": plan.get("expanded_legal_concepts", []),
            "records": len(top_docs),
            "sufficient": sufficient,
            "top_doc": f"{top_payload.get('document_title')} - {top_payload.get('article_number') or top_payload.get('section_number')}" if top_payload else None
        })
        if q == "I have a problem with my neighbour.":
            conv_context = [{"role": "user", "content": q}, {"role": "assistant", "content": "I can help."}]

    # 2. 15 Unseen Natural-Language Criminal Law Queries
    unseen_criminal = [
        "Someone broke into my house at night and stole my jewelry.",
        "A guy grabbed my gold chain and ran away on a bike.",
        "My business partner forged my signature on a bank document.",
        "A shop owner cheated me by giving fake gold coins.",
        "What is the punishment for assault on a public servant?",
        "Someone threatened to publish my private photos unless I pay them.",
        "A group of 6 people stopped our car and demanded money at gunpoint.",
        "What section of BNS deals with criminal breach of trust?",
        "Someone intentionally damaged my car parked outside.",
        "A man is following me and monitoring my social media accounts.",
        "What happens if someone gives alcohol to a child?",
        "Someone made a false statement to damage my reputation in public.",
        "What is the penalty for trespassing into private property?",
        "Someone snatched my phone from my hand while I was talking.",
        "A person dishonestly received a stolen laptop knowing it was stolen."
    ]

    print("\n--- 2. Auditing 15 Unseen Criminal Law Queries ---")
    for q in unseen_criminal:
        plan = understand_query(q)
        top_docs, scores = bot.execute_multi_corpus_retrieval(plan)
        sufficient, reason = bot.evidence_validator.validate_retrieval(plan, top_docs, scores)
        top_payload = top_docs[0].payload if top_docs else None
        
        audit_results["unseen_15_criminal"].append({
            "query": q,
            "scope": plan["legal_scope"],
            "concepts": plan.get("expanded_legal_concepts", []),
            "records": len(top_docs),
            "sufficient": sufficient,
            "top_provision": f"Section {top_payload.get('section_number')}: {top_payload.get('section_heading')}" if top_payload else None
        })

    # 3. 5 Tamil / Tanglish Legal Queries
    tanglish_queries = [
        "En phone thiruttupoachu, enna section panradhu?",
        "Oruathan enna kole panrennu threaten panran.",
        "En veettu kulla oruthan thirudittan, enna punishment?",
        "Enna adichitaanga, police complaint epdi kudukradhu?",
        "Kaasu vaangittu emathitaan, cheating section iruka?"
    ]

    print("\n--- 3. Auditing 5 Tamil / Tanglish Legal Queries ---")
    for q in tanglish_queries:
        plan = understand_query(q)
        top_docs, scores = bot.execute_multi_corpus_retrieval(plan)
        sufficient, reason = bot.evidence_validator.validate_retrieval(plan, top_docs, scores)
        top_payload = top_docs[0].payload if top_docs else None
        
        audit_results["tanglish_5_queries"].append({
            "query": q,
            "lang": plan.get("language"),
            "normalized": plan.get("normalized_query"),
            "concepts": plan.get("expanded_legal_concepts", []),
            "records": len(top_docs),
            "top_provision": f"Section {top_payload.get('section_number')}" if top_payload else None
        })

    # 4. 5 Multi-Turn Conversation Scenarios
    multiturn_scenarios = [
        [
            "What is Section 303 of BNS?",
            "What is the punishment under this section?",
            "Does it apply if the stolen property value is less than 5000 rupees?"
        ],
        [
            "Someone stole my purse in a bus.",
            "What section applies to this?",
            "Can I file an FIR at any police station?"
        ],
        [
            "What is Article 14 of the Constitution?",
            "How does it differ from Article 15?",
            "Can non-citizens claim Article 14?"
        ],
        [
            "My neighbour is threatening to hurt me.",
            "He also placed garbage right in front of my gate.",
            "What legal action can I take against him?"
        ],
        [
            "What is cheating under BNS?",
            "What is the punishment for cheating?",
            "Is cheating a bailable offence?"
        ]
    ]

    print("\n--- 4. Auditing 5 Multi-Turn Conversation Scenarios ---")
    for session_idx, turn_list in enumerate(multiturn_scenarios, 1):
        ctx = []
        session_log = []
        for turn_idx, q in enumerate(turn_list, 1):
            plan = understand_query(q, conversation_context=ctx)
            top_docs, scores = bot.execute_multi_corpus_retrieval(plan)
            top_payload = top_docs[0].payload if top_docs else None
            session_log.append({
                "turn": turn_idx,
                "query": q,
                "rewritten": plan.get("rewritten_query"),
                "records": len(top_docs),
                "top_provision": f"Doc {top_payload.get('article_number') or top_payload.get('section_number')}" if top_payload else None
            })
            ctx.append({"role": "user", "content": q})
            ctx.append({"role": "assistant", "content": f"Answer for turn {turn_idx}"})
        audit_results["multiturn_5_sessions"].append(session_log)

    # 5. 5 Non-Legal Queries
    non_legal_queries = [
        "How to bake a chocolate cake?",
        "What is the capital city of Australia?",
        "Write a Python function to sort a list of numbers.",
        "Who won the FIFA World Cup in 2022?",
        "Can you write a poem about the sea?"
    ]

    print("\n--- 5. Auditing 5 Non-Legal Queries ---")
    for q in non_legal_queries:
        plan = understand_query(q)
        audit_results["non_legal_5_queries"].append({
            "query": q,
            "scope": plan["legal_scope"],
            "pass": plan["legal_scope"] == "NON_LEGAL"
        })

    # 6. Spacing & Format Variations
    variations = [
        "What is BNS section 303?",
        "Explain bns sec 303.",
        "What is Section   303?",
        "What is Sec.303 of BNS?",
        "Explain Article 19 ( 1 ) ( a )",
        "Article19(1)(a)"
    ]

    print("\n--- 6. Auditing Format Variations ---")
    for q in variations:
        plan = understand_query(q)
        top_docs, scores = bot.execute_multi_corpus_retrieval(plan)
        top_payload = top_docs[0].payload if top_docs else None
        audit_results["section_variations"].append({
            "query": q,
            "filters": plan.get("filters"),
            "records": len(top_docs),
            "matched_number": top_payload.get("section_number") or top_payload.get("article_number") if top_payload else None
        })

    # 7. Insufficient-Evidence Cases
    insufficient_queries = [
        "What is the penalty for space piracy under BNS?",
        "What does Section 999 of BNS state?",
        "What is the tax rate for cryptocurrency in the Indian Constitution?",
        "What is the sentence for quantum hacking in Article 500?"
    ]

    print("\n--- 7. Auditing Insufficient-Evidence Cases ---")
    for q in insufficient_queries:
        plan = understand_query(q)
        top_docs, scores = bot.execute_multi_corpus_retrieval(plan)
        sufficient, reason = bot.evidence_validator.validate_retrieval(plan, top_docs, scores)
        audit_results["insufficient_evidence_cases"].append({
            "query": q,
            "sufficient": sufficient,
            "reason": reason,
            "records": len(top_docs)
        })

    with open(r"C:\Lexora\chatbot\production_readiness_audit_report.json", "w", encoding="utf-8") as f:
        json.dump(audit_results, f, indent=4, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RETRIEVAL AUDIT COMPLETE! Report saved to production_readiness_audit_report.json")
    print("=" * 80)

if __name__ == "__main__":
    run_retrieval_audit()
