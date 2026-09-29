import os
import sys
import json

# Force C:\Lexora to top of sys.path BEFORE any imports
LEXORA_ROOT = r"C:\Lexora"
if LEXORA_ROOT not in sys.path:
    sys.path.insert(0, LEXORA_ROOT)

os.chdir(LEXORA_ROOT)

from chatbot.chatbot import LexoraChatbot

def run_audit():
    print("=" * 80)
    print("STARTING LEXORA PRODUCTION-READINESS AUDIT")
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

    # 1. Existing 19 Baseline Tests
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

    print("\n--- 1. Running Existing 19 Baseline Tests ---")
    conv_id = None
    for tc in existing_queries:
        if tc["new_session"] or conv_id is None:
            conv_id = bot.start_consultation()
        print(f"Executing: {tc['q']}")
        res = bot.process_message(conv_id, tc["q"])
        audit_results["existing_19_tests"].append({
            "query": tc["q"],
            "scope": res.get("scope"),
            "response": res.get("response", "").strip()[:400],
            "records": res.get("retrieved_records", 0),
            "sufficient": res.get("evidence_sufficient", True)
        })

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

    print("\n--- 2. Running 15 Unseen Criminal Law Queries ---")
    for q in unseen_criminal:
        conv_id = bot.start_consultation()
        print(f"Executing: {q}")
        res = bot.process_message(conv_id, q)
        audit_results["unseen_15_criminal"].append({
            "query": q,
            "scope": res.get("scope"),
            "query_plan": res.get("query_plan"),
            "response": res.get("response", "").strip()[:400],
            "records": res.get("retrieved_records", 0),
            "source_metadata": res.get("source_metadata", []),
            "evidence": res.get("evidence_passed", "")[:300],
            "sufficient": res.get("evidence_sufficient", True)
        })

    # 3. 5 Tamil / Tanglish Legal Queries
    tanglish_queries = [
        "En phone thiruttupoachu, enna section panradhu?",
        "Oruathan enna kole panrennu threaten panran.",
        "En veettu kulla oruthan thirudittan, enna punishment?",
        "Enna adichitaanga, police complaint epdi kudukradhu?",
        "Kaasu vaangittu emathitaan, cheating section iruka?"
    ]

    print("\n--- 3. Running 5 Tamil / Tanglish Legal Queries ---")
    for q in tanglish_queries:
        conv_id = bot.start_consultation()
        print(f"Executing: {q}")
        res = bot.process_message(conv_id, q)
        audit_results["tanglish_5_queries"].append({
            "query": q,
            "language": res.get("query_plan", {}).get("language"),
            "normalized": res.get("query_plan", {}).get("normalized_query"),
            "concepts": res.get("query_plan", {}).get("expanded_legal_concepts"),
            "response": res.get("response", "").strip()[:400],
            "records": res.get("retrieved_records", 0)
        })

    # 4. 5 Multi-Turn Conversations
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

    print("\n--- 4. Running 5 Multi-Turn Conversation Scenarios ---")
    for session_idx, turn_list in enumerate(multiturn_scenarios, 1):
        conv_id = bot.start_consultation(title=f"Audit Multi-Turn {session_idx}")
        session_log = []
        for turn_idx, q in enumerate(turn_list, 1):
            print(f"Session {session_idx} Turn {turn_idx}: {q}")
            res = bot.process_message(conv_id, q)
            session_log.append({
                "turn": turn_idx,
                "query": q,
                "rewritten": res.get("query_plan", {}).get("rewritten_query"),
                "response": res.get("response", "").strip()[:300]
            })
        audit_results["multiturn_5_sessions"].append({
            "session_id": conv_id,
            "turns": session_log
        })

    # 5. 5 Non-Legal Queries
    non_legal_queries = [
        "How to bake a chocolate cake?",
        "What is the capital city of Australia?",
        "Write a Python function to sort a list of numbers.",
        "Who won the FIFA World Cup in 2022?",
        "Can you write a poem about the sea?"
    ]

    print("\n--- 5. Running 5 Non-Legal Queries ---")
    for q in non_legal_queries:
        conv_id = bot.start_consultation()
        print(f"Executing: {q}")
        res = bot.process_message(conv_id, q)
        audit_results["non_legal_5_queries"].append({
            "query": q,
            "scope": res.get("scope"),
            "response": res.get("response", "").strip(),
            "pass": res.get("response", "").strip() == "I only help with legal queries."
        })

    # 6. Spacing & Format Variations
    variation_queries = [
        "What is BNS section 303?",
        "Explain bns sec 303.",
        "What is Section   303?",
        "What is Sec.303 of BNS?",
        "Explain Article 19 ( 1 ) ( a )",
        "Article19(1)(a)"
    ]

    print("\n--- 6. Running Section/Article Format Variation Tests ---")
    for q in variation_queries:
        conv_id = bot.start_consultation()
        print(f"Executing: {q}")
        res = bot.process_message(conv_id, q)
        audit_results["section_variations"].append({
            "query": q,
            "filters": res.get("query_plan", {}).get("filters"),
            "records": res.get("retrieved_records", 0),
            "response": res.get("response", "").strip()[:300]
        })

    # 7. Insufficient-Evidence Cases
    insufficient_queries = [
        "What is the penalty for space piracy under BNS?",
        "What does Section 999 of BNS state?",
        "What is the tax rate for cryptocurrency in the Indian Constitution?",
        "What is the sentence for quantum hacking in Article 500?"
    ]

    print("\n--- 7. Running Insufficient-Evidence Cases ---")
    for q in insufficient_queries:
        conv_id = bot.start_consultation()
        print(f"Executing: {q}")
        res = bot.process_message(conv_id, q)
        audit_results["insufficient_evidence_cases"].append({
            "query": q,
            "sufficient": res.get("evidence_sufficient"),
            "response": res.get("response", "").strip()[:300]
        })

    with open(r"C:\Lexora\chatbot\production_readiness_audit_report.json", "w", encoding="utf-8") as f:
        json.dump(audit_results, f, indent=4, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("PRODUCTION-READINESS AUDIT COMPLETE")
    print("Report saved to production_readiness_audit_report.json")
    print("=" * 80)

if __name__ == "__main__":
    run_audit()
