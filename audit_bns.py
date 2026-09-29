"""Comprehensive BNS audit with provenance validation."""
import json
import collections

def audit():
    records = []
    with open(r'C:\Lexora\data\raw\bns\bns_rag.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            records.append(json.loads(line))
            
    ids = [r['record_id'] for r in records]
    id_counts = collections.Counter(ids)
    duplicates = {id: count for id, count in id_counts.items() if count > 1}
    
    empty_text = [r['record_id'] for r in records if not r.get('text', '').strip()]
    missing_sections = [r['record_id'] for r in records if not r.get('section_number')]
    
    # Check section coverage
    section_numbers = sorted([int(r['section_number']) for r in records if r.get('section_number')])
    expected_sections = list(range(1, 359))  # BNS has 358 sections
    missing_from_expected = [s for s in expected_sections if s not in section_numbers]
    extra_sections = [s for s in section_numbers if s not in expected_sections]
    
    # Check provenance consistency
    source_urls = set(r.get('source_url', '') for r in records)
    source_authorities = set(r.get('source_authority', '') for r in records)
    canonical_urls = set(r.get('canonical_source_url', '') for r in records)
    
    # Check chapters
    chapters = sorted(set(r.get('chapter', '') for r in records))
    
    # Check for duplicate text
    texts = [r['text'][:200] for r in records]
    text_counts = collections.Counter(texts)
    duplicate_texts = {t[:80]: count for t, count in text_counts.items() if count > 1}
    
    report = {
        "total_records": len(records),
        "unique_section_numbers": len(set(section_numbers)),
        "duplicate_record_ids": duplicates,
        "duplicate_record_id_count": len(duplicates),
        "empty_text_records": len(empty_text),
        "missing_section_numbers": len(missing_sections),
        "section_range": f"{min(section_numbers)}-{max(section_numbers)}" if section_numbers else "N/A",
        "missing_from_expected_range": missing_from_expected[:20],
        "extra_sections_beyond_358": [s for s in section_numbers if s > 358],
        "chapters_found": chapters,
        "chapter_count": len(chapters),
        "source_urls": list(source_urls),
        "source_authorities": list(source_authorities),
        "canonical_urls": list(canonical_urls),
        "duplicate_text_snippets": duplicate_texts,
        "provenance": {
            "actual_download_source": "PRS Legislative Research",
            "actual_download_url": list(source_urls)[0] if source_urls else "N/A",
            "canonical_india_code_url": list(canonical_urls)[0] if canonical_urls else "N/A",
            "reason_for_alternative": "India Code returned HTTP 504 Gateway Timeout",
            "document_identity": "Act No. 45 of 2023, Gazette of India, 25 December 2023"
        }
    }
    
    import os
    os.makedirs(r'C:\Lexora\data\rag\audit', exist_ok=True)
    with open(r'C:\Lexora\data\rag\audit\bns_rag_audit.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4, ensure_ascii=False)
        
    print(f"Audit complete. {len(records)} records.")
    print(f"Sections: {report['section_range']}")
    print(f"Missing from expected 1-358: {len(missing_from_expected)}")
    print(f"Duplicate IDs: {len(duplicates)}")
    print(f"Empty text: {len(empty_text)}")
    print(f"Chapters: {len(chapters)}")

if __name__ == '__main__':
    audit()
