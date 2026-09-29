import json
import os
from collections import defaultdict

raw_file = r'C:\Lexora\data\raw\constitution\constitution_rag.jsonl'
audit_file = r'C:\Lexora\data\rag\audit\constitution_rag_audit.json'
processed_file = r'C:\Lexora\data\rag\processed\constitution_documents.jsonl'

def run():
    records = []
    with open(raw_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
                
    # Phase 1: Audit
    audit_results = {
        "total_records": len(records),
        "document_types": defaultdict(int),
        "missing_metadata": defaultdict(int),
        "empty_text_records": 0,
        "duplicate_record_ids": [],
        "duplicate_text": [],
        "legal_status_values": defaultdict(int),
        "source_consistency": {"authorities": defaultdict(int), "urls": defaultdict(int)},
        "text_length_distribution": {"min": float('inf'), "max": 0, "avg": 0, "total": 0}
    }
    
    seen_ids = set()
    seen_texts = set()
    dup_ids = set()
    dup_texts = set()
    
    for r in records:
        # types
        audit_results["document_types"][r.get("document_type", "UNKNOWN")] += 1
        
        # empty text
        text = r.get("text", "")
        if not text.strip():
            audit_results["empty_text_records"] += 1
            
        # lengths
        l = len(text)
        audit_results["text_length_distribution"]["min"] = min(audit_results["text_length_distribution"]["min"], l)
        audit_results["text_length_distribution"]["max"] = max(audit_results["text_length_distribution"]["max"], l)
        audit_results["text_length_distribution"]["total"] += l
        
        # duplicates
        rid = r.get("record_id")
        if rid in seen_ids:
            dup_ids.add(rid)
        else:
            seen_ids.add(rid)
            
        if text and text in seen_texts:
            dup_texts.add(text)
        elif text:
            seen_texts.add(text)
            
        # metadata
        for k in ["record_id", "parent_record_id", "document_type", "article_number", "text"]:
            if k not in r or r[k] is None:
                audit_results["missing_metadata"][k] += 1
                
        # status & source
        audit_results["legal_status_values"][r.get("legal_status", "UNKNOWN")] += 1
        audit_results["source_consistency"]["authorities"][r.get("source_authority", "UNKNOWN")] += 1
        audit_results["source_consistency"]["urls"][r.get("source_url", "UNKNOWN")] += 1

    audit_results["text_length_distribution"]["avg"] = audit_results["text_length_distribution"]["total"] / len(records) if records else 0
    audit_results["duplicate_record_ids"] = list(dup_ids)
    
    # Phase 2: Processed documents
    processed_records = []
    for r in records:
        # just copy as is to preserve metadata
        processed_records.append(r)
        
    os.makedirs(os.path.dirname(audit_file), exist_ok=True)
    with open(audit_file, 'w', encoding='utf-8') as f:
        json.dump(audit_results, f, indent=4)
        
    os.makedirs(os.path.dirname(processed_file), exist_ok=True)
    with open(processed_file, 'w', encoding='utf-8') as f:
        for pr in processed_records:
            f.write(json.dumps(pr) + '\n')
            
    print("Audit and process complete.")

if __name__ == "__main__":
    run()
