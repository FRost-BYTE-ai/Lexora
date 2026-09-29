import time
import json
import gc
import psutil
import os
from chatbot.chatbot import LexoraChatbot

def get_ram_mb():
    return psutil.Process().memory_info().rss / (1024 * 1024)

def run_real_world_validation():
    print("Initializing Lexora Real-World Validation Suite...")
    ram_start = get_ram_mb()
    
    t0 = time.time()
    bot = LexoraChatbot(config={"use_lora": True})
    cold_start_time = time.time() - t0
    
    print(f"Cold Start Time: {cold_start_time:.2f}s | RAM: {get_ram_mb():.2f} MB")
    
    conversations = [
        # A. Criminal
        [
            ("Someone stole my phone from my bag. What can I do?", "Criminal_1"),
            ("What offence is that?", "Criminal_2"),
            ("Can I complain to the police?", "Criminal_3")
        ],
        # B. Threat
        [
            ("My neighbour keeps threatening me.", "Threat_1"),
            ("He said he'll hurt me if I complain.", "Threat_2"),
            ("What should I do?", "Threat_3")
        ],
        # C. Evidence
        [
            ("I have WhatsApp messages where he threatened me.", "Evidence_1"),
            ("Can those messages be used as evidence?", "Evidence_2")
        ],
        # D. Tanglish
        [
            ("En neighbour daily ah threaten panraru.", "Tanglish_1"),
            ("Police complaint kudukka mudiyuma?", "Tanglish_2"),
            ("Online scam la 10000 rupees pochu.", "Tanglish_3"),
            ("Vandi document ilama police pidichitanga.", "Tanglish_4"),
            ("Will ezhuthi vekama yaarachu iranthuta, property epdi pirikkanum?", "Tanglish_5")
        ],
        # E. Cooperative
        [
            ("Our cooperative society is refusing to give me information about my membership.", "Coop_1"),
            ("What legal rules apply?", "Coop_2")
        ],
        # F. Panchayat
        [
            ("Panchayat is refusing to act on a local issue.", "Panchayat_1"),
            ("Who can I approach?", "Panchayat_2")
        ],
        # G. Procedure
        [
            ("Someone filed a criminal complaint against me.", "Proc_1"),
            ("What happens next?", "Proc_2")
        ],
        # H. Ambiguous
        [
            ("My neighbour has a problem with me.", "Ambiguous")
        ],
        # I. Non-Legal
        [
            ("Give me a chicken recipe.", "NonLegal_1"),
            ("Write a poem.", "NonLegal_2"),
            ("What's the weather?", "NonLegal_3"),
            ("Help me with my Python code.", "NonLegal_4"),
            ("Who won the cricket match?", "NonLegal_5")
        ],
        # J. Insufficient Evidence
        [
            ("Is there a law about space piracy in Tamil Nadu?", "Insuff_1"),
            ("Tell me Section 999 of the BNS.", "Insuff_2"),
            ("What does the Tamil Nadu Mars Exploration Act say?", "Insuff_3")
        ]
    ]
    
    results = {
        "metrics": {
            "cold_start_s": cold_start_time,
            "queries": []
        }
    }
    
    for conv_idx, turns in enumerate(conversations):
        sess_id = bot.start_consultation(title=f"Test_Conv_{conv_idx}")
        
        for q, label in turns:
            print(f"[{label}] User: {q}")
            t_q_start = time.time()
            res = bot.process_message(sess_id, q)
            lat = time.time() - t_q_start
            
            results["metrics"]["queries"].append({
                "label": label,
                "query": q,
                "scope": res.get("scope"),
                "latency_s": lat,
                "ram_mb": get_ram_mb(),
                "retrieved_count": res.get("retrieved_records", 0),
                "answer_preview": res.get("response", "")[:100]
            })
            
        # Clean up conversation memory explicitly to simulate real user lifecycle
        gc.collect()
        
    print(f"Final RAM usage: {get_ram_mb():.2f} MB")
    
    with open(r"C:\Lexora\data\evaluation\real_world_validation_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_real_world_validation()
