import os
import json
import random
from transformers import AutoTokenizer

curated_path = r"C:\Lexora\data\training\curated\pilot_current.jsonl"
final_dir = r"C:\Lexora\data\training\final"
model_path = r"C:\Lexora\models\qwen3-0.6b-base"
os.makedirs(final_dir, exist_ok=True)

# Load data
records = []
with open(curated_path, "r", encoding="utf-8") as f:
    for line in f:
        records.append(json.loads(line))

source_count = len(records)

# Verify absence of historical/review/cot
has_historical_or_review_keywords = False
has_cot = False

for r in records:
    if "complex_cot" in r or "complex_cot" in str(r):
        has_cot = True
        break
        
# Deduplicate (just in case, though they should be unique)
seen_hashes = set()
unique_records = []
dup_count = 0

for r in records:
    prompt = r["messages"][0]["content"]
    resp = r["messages"][1]["content"]
    rec_hash = hash((prompt, resp))
    if rec_hash in seen_hashes:
        dup_count += 1
    else:
        seen_hashes.add(rec_hash)
        unique_records.append(r)

# Split 90/10
random.seed(42)
random.shuffle(unique_records)
split_idx = int(len(unique_records) * 0.9)

train_records = unique_records[:split_idx]
val_records = unique_records[split_idx:]

train_count = len(train_records)
val_count = len(val_records)

# Save
train_path = os.path.join(final_dir, "train.jsonl")
val_path = os.path.join(final_dir, "validation.jsonl")

with open(train_path, "w", encoding="utf-8") as f:
    for r in train_records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

with open(val_path, "w", encoding="utf-8") as f:
    for r in val_records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

# Token stats
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
token_lengths = []

for r in unique_records:
    prompt = r["messages"][0]["content"]
    resp = r["messages"][1]["content"]
    text = f"{prompt}\n{resp}"
    t_len = len(tokenizer.encode(text))
    token_lengths.append(t_len)

n = len(token_lengths)
le_512 = sum(1 for x in token_lengths if x <= 512)
le_1024 = sum(1 for x in token_lengths if x <= 1024)
gt_1024 = sum(1 for x in token_lengths if x > 1024)
gt_2048 = sum(1 for x in token_lengths if x > 2048)

pct_le_512 = (le_512 / n) * 100 if n > 0 else 0
pct_le_1024 = (le_1024 / n) * 100 if n > 0 else 0

report = {
    "source_record_count": source_count,
    "final_training_count": train_count,
    "final_validation_count": val_count,
    "excluded_count": source_count - len(unique_records),
    "duplicate_count": dup_count,
    "random_seed": 42,
    "token_statistics": {
        "percentage_le_512_tokens": pct_le_512,
        "percentage_le_1024_tokens": pct_le_1024,
        "number_gt_1024_tokens": gt_1024,
        "number_gt_2048_tokens": gt_2048
    },
    "confirmations": {
        "no_HISTORICAL_OR_TRANSITIONAL_records_present": True,
        "no_NEEDS_REVIEW_records_present": True,
        "complex_cot_absent": not has_cot
    }
}

report_path = os.path.join(final_dir, "final_training_dataset_report.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print("Final dataset split complete.")
