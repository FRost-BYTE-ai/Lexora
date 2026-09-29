import json
import os
import random
import re

jsonl_path = r"C:\Lexora\data\training\indian_law_sft_candidate.jsonl"
report_out_path = r"C:\Lexora\data\training\sft_validation_report.json"

total_records = 0
invalid_records = 0
duplicate_records = 0
empty_records = 0
unusually_long_records = 0
complex_cot_found = 0

seen_hashes = set()
lengths = []

# To collect 50 random records, reservoir sampling
samples = []
k = 50

with open(jsonl_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        total_records += 1
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            invalid_records += 1
            continue
        
        # Check structure
        if "messages" not in record or len(record["messages"]) != 2:
            invalid_records += 1
            continue
        
        m1 = record["messages"][0]
        m2 = record["messages"][1]
        
        if m1.get("role") != "user" or m2.get("role") != "assistant":
            invalid_records += 1
            continue
            
        prompt = m1.get("content", "")
        response = m2.get("content", "")
        
        # Check empty
        if not prompt or not response or not prompt.strip() or not response.strip():
            empty_records += 1
            continue
            
        # Check complex_cot
        if "complex_cot" in record or "complex_cot" in str(record):
            complex_cot_found += 1
            
        # Check duplicates
        rec_hash = hash((prompt, response))
        if rec_hash in seen_hashes:
            duplicate_records += 1
            continue
        seen_hashes.add(rec_hash)
        
        # Calculate length
        total_len = len(prompt) + len(response)
        lengths.append(total_len)
        
        # Unusually long (e.g. > 6000 chars, ~1500 tokens)
        if total_len > 6000:
            unusually_long_records += 1
            
        # Reservoir sampling
        if len(samples) < k:
            samples.append((prompt, response))
        else:
            j = random.randint(0, i)
            if j < k:
                samples[j] = (prompt, response)

valid_records = total_records - invalid_records - duplicate_records - empty_records

# Length stats
min_len = min(lengths) if lengths else 0
max_len = max(lengths) if lengths else 0
avg_len = sum(lengths) / len(lengths) if lengths else 0

# Distribution
buckets = {"<500": 0, "500-1000": 0, "1000-2000": 0, "2000-4000": 0, "4000-6000": 0, ">6000": 0}
for l in lengths:
    if l < 500: buckets["<500"] += 1
    elif l < 1000: buckets["500-1000"] += 1
    elif l < 2000: buckets["1000-2000"] += 1
    elif l < 4000: buckets["2000-4000"] += 1
    elif l < 6000: buckets["4000-6000"] += 1
    else: buckets[">6000"] += 1

# Random 50 Inspection
legal_keywords = re.compile(r'\b(?:law|court|act|section|article|legal|rights|case|judgment|code|constitution|plaintiff|defendant)\b', re.IGNORECASE)

inspection_results = {
    "prompt_is_legal_question": 0,
    "response_is_present": 0,
    "response_is_coherent": 0, # basic heuristic: length > 50, contains punctuation
    "formatting_corruption": 0,
    "obvious_non_legal": 0
}

for p, r in samples:
    # prompt is legal
    if legal_keywords.search(p) or legal_keywords.search(r):
        inspection_results["prompt_is_legal_question"] += 1
    else:
        inspection_results["obvious_non_legal"] += 1
        
    if r.strip():
        inspection_results["response_is_present"] += 1
        
    if len(r) > 50 and ('.' in r or '!' in r or '?' in r):
        inspection_results["response_is_coherent"] += 1
        
    if '' in r or '\\u' in r: # typical corruption chars
        inspection_results["formatting_corruption"] += 1

recommended_max_seq_length = 2048 # typically ~8000 chars

report = {
    "validation_summary": {
        "total_records": total_records,
        "valid_records": valid_records,
        "invalid_records": invalid_records,
        "duplicate_records": duplicate_records,
        "empty_records": empty_records,
        "complex_cot_found": complex_cot_found,
        "unusually_long_records": unusually_long_records
    },
    "length_statistics_characters": {
        "min_length": min_len,
        "max_length": max_len,
        "average_length": round(avg_len, 2),
        "distribution": buckets
    },
    "random_50_inspection": {
        "samples_checked": len(samples),
        "prompt_is_legal_question_scenario": inspection_results["prompt_is_legal_question"],
        "response_is_present": inspection_results["response_is_present"],
        "response_is_coherent": inspection_results["response_is_coherent"],
        "formatting_corruption_detected": inspection_results["formatting_corruption"],
        "obvious_non_legal_or_malformed": inspection_results["obvious_non_legal"]
    },
    "technical_readiness": {
        "recommended_max_sequence_length": recommended_max_seq_length,
        "is_ready_for_qwen3_0_6b_sft": (invalid_records == 0 and empty_records == 0 and complex_cot_found == 0),
        "disclaimer": "Technical readiness does NOT mean legal correctness. The dataset remains non-authoritative and must not be used as the legal evidence layer for Lexora RAG."
    }
}

with open(report_out_path, 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print("Validation complete.")
