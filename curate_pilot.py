import json
import os
import re

input_path = r"C:\Lexora\data\training\pilot_1000.jsonl"
out_dir = r"C:\Lexora\data\training\curated"
os.makedirs(out_dir, exist_ok=True)

# Regexes for laws
ipc_pattern = re.compile(r'\b(?:IPC|Indian Penal Code)\b', re.IGNORECASE)
crpc_pattern = re.compile(r'\b(?:CrPC|Criminal Procedure Code)\b', re.IGNORECASE)
iea_pattern = re.compile(r'\b(?:Indian Evidence Act|IEA)\b', re.IGNORECASE)
bns_pattern = re.compile(r'\b(?:BNS|Bharatiya Nyaya Sanhita)\b', re.IGNORECASE)
bnss_pattern = re.compile(r'\b(?:BNSS|Bharatiya Nagarik Suraksha Sanhita)\b', re.IGNORECASE)
bsa_pattern = re.compile(r'\b(?:BSA|Bharatiya Sakshya Adhiniyam)\b', re.IGNORECASE)

hist_context_pattern = re.compile(r'\b(?:history|historical|historically|prior to|before|repealed|replaced|transitional|formerly|erstwhile|legacy|previous|old)\b', re.IGNORECASE)

current_list = []
historical_list = []
review_list = []

stats = {
    "original_pilot_count": 0,
    "CURRENT_OR_GENERAL_count": 0,
    "HISTORICAL_OR_TRANSITIONAL_count": 0,
    "NEEDS_REVIEW_count": 0,
    "ipc_count": 0,
    "crpc_count": 0,
    "iea_count": 0,
    "bns_count": 0,
    "bnss_count": 0,
    "bsa_count": 0
}

examples = {
    "CURRENT_OR_GENERAL": None,
    "HISTORICAL_OR_TRANSITIONAL": None,
    "NEEDS_REVIEW": None
}

with open(input_path, 'r', encoding='utf-8') as f:
    for line in f:
        stats["original_pilot_count"] += 1
        rec = json.loads(line)
        prompt = rec["messages"][0]["content"]
        resp = rec["messages"][1]["content"]
        text = prompt + " " + resp
        
        # Check mentions
        has_ipc = bool(ipc_pattern.search(text))
        has_crpc = bool(crpc_pattern.search(text))
        has_iea = bool(iea_pattern.search(text))
        has_bns = bool(bns_pattern.search(text))
        has_bnss = bool(bnss_pattern.search(text))
        has_bsa = bool(bsa_pattern.search(text))
        
        if has_ipc: stats["ipc_count"] += 1
        if has_crpc: stats["crpc_count"] += 1
        if has_iea: stats["iea_count"] += 1
        if has_bns: stats["bns_count"] += 1
        if has_bnss: stats["bnss_count"] += 1
        if has_bsa: stats["bsa_count"] += 1
        
        if not (has_ipc or has_crpc or has_iea):
            current_list.append(rec)
            if not examples["CURRENT_OR_GENERAL"]:
                examples["CURRENT_OR_GENERAL"] = {
                    "record": {"prompt": prompt[:150] + "...", "response": resp[:150] + "..."}, 
                    "reason": "No dependence on repealed criminal laws detected in context."
                }
            continue
            
        # We have an old law. Split into sentences to inspect context.
        sentences = re.split(r'(?<=[.!?]) +', text)
        is_historical = False
        for s in sentences:
            if ipc_pattern.search(s) or crpc_pattern.search(s) or iea_pattern.search(s):
                if hist_context_pattern.search(s):
                    is_historical = True
                    break
                    
        if is_historical:
            historical_list.append(rec)
            if not examples["HISTORICAL_OR_TRANSITIONAL"]:
                examples["HISTORICAL_OR_TRANSITIONAL"] = {
                    "record": {"prompt": prompt[:150] + "...", "response": resp[:150] + "..."}, 
                    "reason": "Mentions repealed criminal law but context includes historical/transitional keywords (e.g. repealed, replaced, before)."
                }
        else:
            review_list.append(rec)
            if not examples["NEEDS_REVIEW"]:
                examples["NEEDS_REVIEW"] = {
                    "record": {"prompt": prompt[:150] + "...", "response": resp[:150] + "..."}, 
                    "reason": "Legal answer depends on old statutes (IPC/CrPC/IEA) presented as current law without historical context."
                }

stats["CURRENT_OR_GENERAL_count"] = len(current_list)
stats["HISTORICAL_OR_TRANSITIONAL_count"] = len(historical_list)
stats["NEEDS_REVIEW_count"] = len(review_list)

# Write output files
def save_jsonl(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        for r in data:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
            
save_jsonl(os.path.join(out_dir, "pilot_current.jsonl"), current_list)
save_jsonl(os.path.join(out_dir, "pilot_historical.jsonl"), historical_list)
save_jsonl(os.path.join(out_dir, "pilot_review.jsonl"), review_list)

report = {
    "metrics": stats,
    "examples": examples
}

with open(os.path.join(out_dir, "curation_report.json"), 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)
    
print("Curation complete.")
