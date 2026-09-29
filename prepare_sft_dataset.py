import json
import os
import time

dataset_path = r"C:\Lexora\data\raw\indian-law-kaggle\Alpie-core_core_indian_law.json"
training_dir = r"C:\Lexora\data\training"
os.makedirs(training_dir, exist_ok=True)

sft_out_path = os.path.join(training_dir, "indian_law_sft_candidate.jsonl")
report_out_path = os.path.join(training_dir, "sft_preparation_report.json")

print(f"Loading original dataset from {dataset_path}...")
with open(dataset_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

original_count = len(data)

malformed_count = 0
duplicate_count = 0
seen = set()

valid_records = []
samples_for_report = []

print("Processing records...")
for item in data:
    prompt = item.get("prompt")
    response = item.get("response")
    
    # Check for malformed (empty prompt or response)
    if not prompt or not response or not str(prompt).strip() or not str(response).strip():
        malformed_count += 1
        continue
    
    # Check for duplicates
    # Use hash of tuple for memory efficiency
    record_hash = hash((prompt, response))
    if record_hash in seen:
        duplicate_count += 1
        continue
    
    seen.add(record_hash)
    
    # Create valid record
    formatted_record = {
        "messages": [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": response}
        ]
    }
    
    valid_records.append(formatted_record)
    
    if len(samples_for_report) < 3:
        samples_for_report.append(formatted_record)

final_count = len(valid_records)
removed_count = malformed_count + duplicate_count
percentage_retained = (final_count / original_count) * 100 if original_count > 0 else 0

print("Writing JSONL...")
with open(sft_out_path, 'w', encoding='utf-8') as f:
    for record in valid_records:
        f.write(json.dumps(record, ensure_ascii=False) + '\n')

print("Generating report...")
report = {
    "metrics": {
        "original_record_count": original_count,
        "valid_record_count": final_count,
        "removed_record_count": removed_count,
        "duplicate_count": duplicate_count,
        "malformed_count": malformed_count,
        "final_sft_record_count": final_count,
        "percentage_retained": round(percentage_retained, 2)
    },
    "samples": samples_for_report,
    "limitations_and_warnings": [
        "EXPLICIT WARNING: This dataset contains synthetic/generated legal reasoning and has no source URLs.",
        "NOT AUTHORITATIVE: This dataset is NOT an authoritative legal source and should not be used as primary legal evidence.",
        "HALLUCINATION RISK: Since responses are generated synthetically, they may contain legal inaccuracies or outdated information (such as old IPC/CrPC references).",
        "NO CHAIN-OF-THOUGHT: The complex reasoning track (complex_cot) has been excluded for this training subset, leaving only prompt and response."
    ]
}

with open(report_out_path, 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print("Data preparation complete.")
