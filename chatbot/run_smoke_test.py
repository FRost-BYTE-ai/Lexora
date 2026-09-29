"""
Fast Smoke Test Audit (Inference max_new_tokens=150)
Runs all 10 target smoke test queries and streams results to smoke_test_report.json
"""

import sys
import os
import json
import time

sys.path.insert(0, r"C:\Lexora")

from chatbot.chatbot import LexoraChatbot

def run_fast_smoke_test():
    print("=" * 80)
    print("LEXORA SMOKE TEST RUNNER (max_new_tokens=150)")
    print("=" * 80)

    report_file = r"C:\Lexora\chatbot\smoke_test_report.json"
    
    # 1. Initialize with USE_LORA=true
    print("\n[STEP 1] Testing Chatbot Initialization with USE_LORA=True...")
    t0 = time.time()
    bot_lora = LexoraChatbot(config={"use_lora": True})
    load_time_lora = time.time() - t0
    print(f"-> LoRA Chatbot loaded successfully in {load_time_lora:.2f}s!")
    print(f"-> Model class: {type(bot_lora.model).__name__}")
    
    bot_lora.qdrant.close()
    
    # 2. Initialize with USE_LORA=false
    print("\n[STEP 2] Testing Chatbot Initialization with USE_LORA=False...")
    t0 = time.time()
    bot_base = LexoraChatbot(config={"use_lora": False})
    load_time_base = time.time() - t0
    print(f"-> Base Chatbot loaded successfully in {load_time_base:.2f}s!")
    print(f"-> Model class: {type(bot_base.model).__name__}")
    bot_base.qdrant.close()

    # Re-initialize LoRA bot for full 10-query suite
    bot = LexoraChatbot(config={"use_lora": True})

    smoke_test_queries = [
        {"id": 1, "q": "What is Article 21?", "new_session": True},
        {"id": 2, "q": "What is BNS Section 303?", "new_session": True},
        {"id": 3, "q": "What is the punishment for pickpocketing?", "new_session": True},
        {"id": 4, "q": "Someone stole my phone from my pocket.", "new_session": True},
        {"id": 5, "q": "Article 19 (1) (a)", "new_session": True},
        {"id": 6, "q": "சட்டம் பிரிவு 303 என்றால் என்ன?", "new_session": True},
        {"id": 7, "q": "En phone thiruttupoachu, enna section panradhu?", "new_session": True},
        {"id": 8, "q": "My neighbour is threatening to hurt me.", "new_session": True},
        {"id": 8.1, "q": "He also dumped garbage in front of my door.", "new_session": False},
        {"id": 9, "q": "How to bake a chocolate cake?", "new_session": True},
        {"id": 10, "q": "What is the sentence for quantum hacking under Section 999 of BNS?", "new_session": True}
    ]

    report_data = {
        "use_lora_load_success": True,
        "lora_model_class": type(bot_lora.model).__name__,
        "base_model_class": type(bot_base.model).__name__,
        "total_tests": len(smoke_test_queries),
        "results": []
    }

    conv_id = None

    for item in smoke_test_queries:
        if item["new_session"] or conv_id is None:
            conv_id = bot.start_consultation()
            
        print(f"\n[Test #{item['id']}] Query: {item['q']}")
        t_start = time.time()
        res = bot.process_message(conv_id, item['q'])
        elapsed = time.time() - t_start
        
        response_text = res.get("response", "").strip()
        evidence_text = res.get("evidence_passed", "")
        metadata = res.get("source_metadata", [])
        scope = res.get("scope")
        records = res.get("retrieved_records", 0)
        
        print(f"  Scope: {scope} | Records: {records} | Time: {elapsed:.2f}s")
        print(f"  Response ({len(response_text)} chars): {response_text[:150]}...")
            
        item_res = {
            "test_id": item['id'],
            "query": item['q'],
            "scope": scope,
            "records": records,
            "response": response_text,
            "sources": metadata,
            "evidence_passed": evidence_text[:300],
            "metrics": res.get("metrics"),
            "elapsed_s": elapsed
        }
        report_data["results"].append(item_res)

        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=4, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("SMOKE TEST COMPLETE! Report saved to smoke_test_report.json")
    print("=" * 80)

if __name__ == "__main__":
    run_fast_smoke_test()
