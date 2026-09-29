import json
import os
import random
import re
from transformers import AutoTokenizer

sft_path = r"C:\Lexora\data\training\indian_law_sft_candidate.jsonl"
training_dir = r"C:\Lexora\data\training"
model_path = r"C:\Lexora\models\qwen3-0.6b-base"

# Load tokenizer
print("Loading Tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)

# Read all records
print("Reading records...")
records = []
with open(sft_path, "r", encoding="utf-8") as f:
    for line in f:
        records.append(json.loads(line))

# Tokenize and collect lengths
print("Tokenizing to calculate actual lengths...")
token_lengths = []
long_examples = []
valid_for_pilot = []

for i, rec in enumerate(records):
    # Fallback if chat template isn't setup for base model
    try:
        tokens = tokenizer.apply_chat_template(rec["messages"], tokenize=True, add_generation_prompt=False)
        t_len = len(tokens)
    except Exception:
        text = rec["messages"][0]["content"] + "\n" + rec["messages"][1]["content"]
        t_len = len(tokenizer.encode(text))
        
    token_lengths.append(t_len)
    
    if t_len > 2048:
        long_examples.append({"index": i, "token_length": t_len})
    else:
        valid_for_pilot.append(rec)

# Calculate percentiles and stats
print("Calculating stats...")
sorted_lengths = sorted(token_lengths)
n = len(sorted_lengths)

stats = {
    "pct_le_512": sum(1 for x in sorted_lengths if x <= 512) / n * 100,
    "pct_le_1024": sum(1 for x in sorted_lengths if x <= 1024) / n * 100,
    "pct_le_1536": sum(1 for x in sorted_lengths if x <= 1536) / n * 100,
    "pct_le_2048": sum(1 for x in sorted_lengths if x <= 2048) / n * 100,
    "pct_gt_2048": sum(1 for x in sorted_lengths if x > 2048) / n * 100,
    "max_len": sorted_lengths[-1],
    "mean_len": sum(sorted_lengths) / n,
    "median_len": sorted_lengths[n // 2],
    "p95": sorted_lengths[int(n * 0.95)],
    "p99": sorted_lengths[int(n * 0.99)],
}

# Create Pilot Subset
print("Creating pilot splits...")
random.seed(42)
random.shuffle(valid_for_pilot)
pilot_1000 = valid_for_pilot[:1000]

pilot_train = pilot_1000[:900]
pilot_val = pilot_1000[900:1000]

def save_jsonl(data, filename):
    with open(os.path.join(training_dir, filename), "w", encoding="utf-8") as f:
        for rec in data:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

save_jsonl(pilot_1000, "pilot_1000.jsonl")
save_jsonl(pilot_train, "pilot_train.jsonl")
save_jsonl(pilot_val, "pilot_validation.jsonl")

# Quality Check on Pilot 1000
print("Performing quality check on pilot...")
legal_keywords = re.compile(r'\b(?:law|court|act|section|article|legal|rights|case|judgment|code|constitution|plaintiff|defendant)\b', re.IGNORECASE)
statute_regex = re.compile(r'\b(?:Act|Code|Constitution|Rules)\b', re.IGNORECASE)
section_regex = re.compile(r'\b(?:Section|Article|Clause|Order)\s+\d+[A-Z]*\b', re.IGNORECASE)
old_law_regex = re.compile(r'\b(?:IPC|CrPC|Indian Penal Code|Criminal Procedure Code|Indian Evidence Act|IEA)\b', re.IGNORECASE)
new_law_regex = re.compile(r'\b(?:BNS|BNSS|BSA|Bharatiya Nyaya Sanhita|Bharatiya Nagarik Suraksha Sanhita|Bharatiya Sakshya Adhiniyam)\b', re.IGNORECASE)

pilot_stats = {
    "average_prompt_tokens": 0,
    "average_response_tokens": 0,
    "statute_or_section_references": 0,
    "generic_non_explicit_legal_prompts": 0,
    "mentions_old_laws_ipc_crpc_iea": 0,
    "mentions_new_laws_bns_bnss_bsa": 0,
    "token_distribution": {"<256": 0, "256-512": 0, "512-1024": 0, "1024-2048": 0}
}

sum_prompt = 0
sum_resp = 0

for rec in pilot_1000:
    prompt = rec["messages"][0]["content"]
    resp = rec["messages"][1]["content"]
    combined = prompt + " " + resp
    
    # Tokenize separately just for averages
    try:
        p_len = len(tokenizer.encode(prompt))
        r_len = len(tokenizer.encode(resp))
    except:
        p_len = len(prompt.split())
        r_len = len(resp.split())
        
    sum_prompt += p_len
    sum_resp += r_len
    
    tot_len = p_len + r_len
    if tot_len < 256: pilot_stats["token_distribution"]["<256"] += 1
    elif tot_len < 512: pilot_stats["token_distribution"]["256-512"] += 1
    elif tot_len < 1024: pilot_stats["token_distribution"]["512-1024"] += 1
    else: pilot_stats["token_distribution"]["1024-2048"] += 1
        
    if not legal_keywords.search(prompt):
        pilot_stats["generic_non_explicit_legal_prompts"] += 1
        
    if statute_regex.search(combined) or section_regex.search(combined):
        pilot_stats["statute_or_section_references"] += 1
        
    if old_law_regex.search(combined):
        pilot_stats["mentions_old_laws_ipc_crpc_iea"] += 1
        
    if new_law_regex.search(combined):
        pilot_stats["mentions_new_laws_bns_bnss_bsa"] += 1

pilot_stats["average_prompt_tokens"] = round(sum_prompt / 1000, 2)
pilot_stats["average_response_tokens"] = round(sum_resp / 1000, 2)

report = {
    "tokenizer_stats": stats,
    "long_examples_excluded": len(long_examples),
    "long_examples_sample": long_examples[:10], # Just a sample to avoid huge file
    "pilot_creation": {
        "success": True,
        "total_pilot_size": len(pilot_1000),
        "train_size": len(pilot_train),
        "validation_size": len(pilot_val)
    },
    "pilot_quality_check": pilot_stats,
    "conclusion": {
        "is_2048_appropriate": stats["pct_le_2048"] > 95,
        "data_quality_concerns": [
            "Dataset still synthetically generated.",
            f"Found {pilot_stats['mentions_old_laws_ipc_crpc_iea']} references to outdated laws (IPC/CrPC) out of 1000.",
            f"Found {pilot_stats['mentions_new_laws_bns_bnss_bsa']} references to new laws (BNS/BNSS/BSA)."
        ]
    }
}

with open(os.path.join(training_dir, "pilot_preparation_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print("Pilot preparation complete.")
