"""
Comprehensive multi-corpus test suite.
Tests: Constitution regression (7), BNS exact-section (2), 
       natural-language theft/pickpocketing (6), edge cases (4).
"""
import json
from chatbot import LexoraChatbot

def run_tests():
    bot = LexoraChatbot(config={"use_lora": False})
    
    test_cases = [
        # ── Constitution Regression (7) ──
        {"q": "What is Article 21?", "new_session": True, "group": "constitution"},
        {"q": "Explain Article 14.", "new_session": True, "group": "constitution"},
        {"q": "What does Article 19(1)(a) protect?", "new_session": True, "group": "constitution"},
        {"q": "Article 19 (1) (a)", "new_session": True, "group": "constitution"},
        {"q": "What are the Fundamental Rights?", "new_session": True, "group": "constitution"},
        {"q": "What is the right to equality?", "new_session": True, "group": "constitution"},
        {"q": "Explain Article 32.", "new_session": True, "group": "constitution"},
        
        # ── BNS Exact-Section (2) ──
        {"q": "What is BNS Section 303?", "new_session": True, "group": "bns_exact"},
        {"q": "Explain Section 303.", "new_session": True, "group": "bns_exact"},
        
        # ── Natural Language Theft/Pickpocketing (6) ──
        {"q": "What is the punishment for pickpocketing?", "new_session": True, "group": "theft_nl"},
        {"q": "Someone stole my phone from my pocket.", "new_session": True, "group": "theft_nl"},
        {"q": "What offence is taking someone's wallet from their pocket?", "new_session": True, "group": "theft_nl"},
        {"q": "What is the punishment for theft?", "new_session": True, "group": "theft_nl"},
        {"q": "What is the punishment for robbery?", "new_session": True, "group": "theft_nl"},
        {"q": "What is the punishment for criminal intimidation?", "new_session": True, "group": "theft_nl"},
        
        # ── Edge Cases (4) ──
        {"q": "Tell me a chicken recipe.", "new_session": True, "group": "edge"},
        {"q": "I have a problem with my neighbour.", "new_session": True, "group": "edge"},
        {"q": "They keep threatening me.", "new_session": False, "group": "edge"},
        {"q": "Why is the neighbour bothering me?", "new_session": True, "group": "edge"},
    ]
    
    report = []
    conv_id = None
    
    for tc in test_cases:
        if tc["new_session"] or conv_id is None:
            conv_id = bot.start_consultation()
            
        print(f"Testing [{tc['group']}]: {tc['q']}")
        res = bot.process_message(conv_id, tc["q"])
        
        report.append({
            "query": tc["q"],
            "group": tc["group"],
            "scope": res.get("scope"),
            "rewritten_query": res.get("rewritten_query"),
            "expanded_concepts": res.get("expanded_concepts", []),
            "matched_colloquial_keys": res.get("matched_colloquial_keys", []),
            "retrieval_confidence": res.get("retrieval_confidence"),
            "response": res.get("response", "").strip()[:500],
            "retrieved_records": res.get("retrieved_records", 0),
            "source_metadata": res.get("source_metadata", []),
            "evidence_passed": res.get("evidence_passed", "")[:800],
            "metrics": res.get("metrics"),
            "new_session": tc["new_session"]
        })
        
    with open("concept_expansion_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=4, ensure_ascii=False)
        
    print(f"\nTests completed. {len(report)} scenarios. Report saved to concept_expansion_report.json.")

if __name__ == "__main__":
    run_tests()
