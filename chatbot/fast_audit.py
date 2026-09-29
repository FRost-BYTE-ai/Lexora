"""
Fast Standalone Verification Runner
Evaluates:
- 19 Baseline Tests
- 15 Unseen Criminal Queries
- 5 Tanglish Queries
- 5 Non-Legal Guardrails
- Section Variations & Insufficient-Evidence Cases
Logs incremental JSON to file after EVERY query.
"""

import sys
import os
import json
import time

LEXORA_ROOT = r"C:\Lexora"
if LEXORA_ROOT not in sys.path:
    sys.path.insert(0, LEXORA_ROOT)
os.chdir(LEXORA_ROOT)

from chatbot.chatbot import LexoraChatbot

def run_fast_audit():
    print("Initializing Lexora Chatbot Engine...")
    bot = LexoraChatbot(config={"use_lora": False})
    
    results_file = r"C:\Lexora\chatbot\production_readiness_audit_report.json"
    audit_data = {
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
        {"q": "What is Article 21?", "new_session": True},
        {"q": "Explain Article 14.", "new_session": True},
        {"q": "What does Article 19(1)(a) protect?", "new_session": True},
        {"q": "Article 19 (1) (a)", "new_session": True},
        {"q": "What are the Fundamental Rights?", "new_session": True},
        {"q": "What is the right to equality?", "new_session": True},
        {"q": "Explain Article 32.", "new_session": True},
        {"q": "What is BNS Section 303?", "new_session": True},
        {"q": "Explain Section 303.", "new_session": True},
        {"q": "What is the punishment for pickpocketing?", "new_session": True},
        {"q": "Someone stole my phone from my pocket.", "new_session": True},
        {"q": "What offence is taking someone's wallet from their pocket?", "new_session": True},
        {"q": "What is the punishment for theft?", "new_session": True},
        {"q": "What is the punishment for robbery?", "new_session": True},
        {"q": "What is the punishment for criminal intimidation?", "new_session": True},
        {"q": "Tell me a chicken recipe.", "new_session": True},
        {"q": "I have a problem with my neighbour.", "new_session": True},
        {"q": "They keep threatening me.", "new_session": False},
        {"q": "Why is the neighbour bothering me?", "new_session": True}
    ]

    print("\n--- 1. Baseline 19 Tests ---")
    conv_id = None
    for idx, tc in enumerate(existing_queries, 1):
        if tc["new_session"] or conv_id is None:
            conv_id = bot.start_consultation()
        print(f"[{idx}/19] Query: {tc['q']}")
        res = bot.process_message(conv_id, tc["q"])
        audit_data["existing_19_tests"].append({
            "query": tc["q"],
            "scope": res.get("scope"),
            "records": res.get("retrieved_records", 0),
            "response": res.get("response", "").strip()[:300]
        })
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=4, ensure_ascii=False)

    # 2. 15 Unseen Criminal Queries
    unseen_queries = [
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

    print("\n--- 2. Unseen 15 Criminal Law Queries ---")
    for idx, q in enumerate(unseen_queries, 1):
        conv_id = bot.start_consultation()
        print(f"[{idx}/15] Unseen Query: {q}")
        res = bot.process_message(conv_id, q)
        audit_data["unseen_15_criminal"].append({
            "query": q,
            "scope": res.get("scope"),
            "records": res.get("retrieved_records", 0),
            "response": res.get("response", "").strip()[:300]
        })
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=4, ensure_ascii=False)

    # 3. 5 Tanglish Queries
    tanglish_queries = [
        "En phone thiruttupoachu, enna section panradhu?",
        "Oruathan enna kole panrennu threaten panran.",
        "En veettu kulla oruthan thirudittan, enna punishment?",
        "Enna adichitaanga, police complaint epdi kudukradhu?",
        "Kaasu vaangittu emathitaan, cheating section iruka?"
    ]

    print("\n--- 3. 5 Tanglish Queries ---")
    for idx, q in enumerate(tanglish_queries, 1):
        conv_id = bot.start_consultation()
        print(f"[{idx}/5] Tanglish Query: {q}")
        res = bot.process_message(conv_id, q)
        audit_data["tanglish_5_queries"].append({
            "query": q,
            "lang": res.get("query_plan", {}).get("language"),
            "records": res.get("retrieved_records", 0),
            "response": res.get("response", "").strip()[:300]
        })
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=4, ensure_ascii=False)

    # 4. 5 Non-Legal Queries
    non_legal_queries = [
        "How to bake a chocolate cake?",
        "What is the capital city of Australia?",
        "Write a Python function to sort a list of numbers.",
        "Who won the FIFA World Cup in 2022?",
        "Can you write a poem about the sea?"
    ]

    print("\n--- 4. 5 Non-Legal Queries ---")
    for idx, q in enumerate(non_legal_queries, 1):
        conv_id = bot.start_consultation()
        print(f"[{idx}/5] Non-Legal Query: {q}")
        res = bot.process_message(conv_id, q)
        audit_data["non_legal_5_queries"].append({
            "query": q,
            "scope": res.get("scope"),
            "response": res.get("response", "").strip()
        })
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=4, ensure_ascii=False)

    # 5. Section/Article Variations & Insufficient Evidence
    variations = [
        "What is BNS section 303?",
        "Explain Article 19 ( 1 ) ( a )",
        "What is the penalty for space piracy under BNS?",
        "What does Section 999 of BNS state?"
    ]

    print("\n--- 5. Variations & Insufficient-Evidence Cases ---")
    for idx, q in enumerate(variations, 1):
        conv_id = bot.start_consultation()
        print(f"[{idx}/4] Edge Case: {q}")
        res = bot.process_message(conv_id, q)
        audit_data["insufficient_evidence_cases"].append({
            "query": q,
            "sufficient": res.get("evidence_sufficient"),
            "records": res.get("retrieved_records", 0),
            "response": res.get("response", "").strip()[:300]
        })
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=4, ensure_ascii=False)

    print("\nFAST AUDIT COMPLETE! Results written to production_readiness_audit_report.json")

if __name__ == "__main__":
    run_fast_audit()
