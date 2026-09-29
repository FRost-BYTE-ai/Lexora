import fitz
import re
import json
import os

def parse_bnss():
    pdf_path = r'C:\Lexora\data\raw\bnss\a202346.pdf'
    output_path = r'C:\Lexora\data\raw\bnss\bnss_rag.jsonl'
    
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
        
    lines = text.split('\n')
    records = []
    
    current_chapter = None
    current_chapter_title = None
    current_section = None
    
    chapter_regex = re.compile(r"^CHAPTER\s+([A-ZIVX]+)$", re.IGNORECASE)
    section_regex = re.compile(r"^(\d+)\.\s+(.*)$")
    
    buffer_text = ""
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
            
        chap_match = chapter_regex.match(line)
        if chap_match:
            if current_section and buffer_text.strip():
                records.append({
                    "record_id": f"bnss__section_{current_section}",
                    "document_id": "bnss_2023",
                    "document_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
                    "document_type": "Act",
                    "act_name": "Bharatiya Nagarik Suraksha Sanhita",
                    "act_number": "46 of 2023",
                    "chapter": current_chapter,
                    "chapter_title": current_chapter_title,
                    "section_number": str(current_section),
                    "section_heading": f"Section {current_section}",
                    "subsection": None,
                    "clause": None,
                    "subclause": None,
                    "jurisdiction": "Central / India",
                    "language": "English",
                    "text": buffer_text.strip(),
                    "legal_status": "active",
                    "source_authority": "Ministry of Law and Justice / Government of India",
                    "source_url": "https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Nagarik%20Suraksha%20Sanhita,%202023.pdf",
                    "canonical_source_url": "https://www.indiacode.nic.in/bitstream/123456789/20063/1/a202346.pdf",
                    "parent_record_id": None
                })
                buffer_text = ""
            current_chapter = f"CHAPTER {chap_match.group(1).upper()}"
            if i + 1 < len(lines):
                current_chapter_title = lines[i+1].strip()
                i += 1
            i += 1
            continue
            
        sec_match = section_regex.match(line)
        if sec_match:
            if current_section and buffer_text.strip():
                records.append({
                    "record_id": f"bnss__section_{current_section}",
                    "document_id": "bnss_2023",
                    "document_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
                    "document_type": "Act",
                    "act_name": "Bharatiya Nagarik Suraksha Sanhita",
                    "act_number": "46 of 2023",
                    "chapter": current_chapter,
                    "chapter_title": current_chapter_title,
                    "section_number": str(current_section),
                    "section_heading": f"Section {current_section}",
                    "subsection": None,
                    "clause": None,
                    "subclause": None,
                    "jurisdiction": "Central / India",
                    "language": "English",
                    "text": buffer_text.strip(),
                    "legal_status": "active",
                    "source_authority": "Ministry of Law and Justice / Government of India",
                    "source_url": "https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Nagarik%20Suraksha%20Sanhita,%202023.pdf",
                    "canonical_source_url": "https://www.indiacode.nic.in/bitstream/123456789/20063/1/a202346.pdf",
                    "parent_record_id": None
                })
            current_section = sec_match.group(1)
            buffer_text = sec_match.group(2) + " "
        else:
            if current_section:
                buffer_text += line + " "
        i += 1
        
    if current_section and buffer_text.strip():
        records.append({
            "record_id": f"bnss__section_{current_section}",
            "document_id": "bnss_2023",
            "document_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
            "document_type": "Act",
            "act_name": "Bharatiya Nagarik Suraksha Sanhita",
            "act_number": "46 of 2023",
            "chapter": current_chapter,
            "chapter_title": current_chapter_title,
            "section_number": str(current_section),
            "section_heading": f"Section {current_section}",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Central / India",
            "language": "English",
            "text": buffer_text.strip(),
            "legal_status": "active",
            "source_authority": "Ministry of Law and Justice / Government of India",
            "source_url": "https://prsindia.org/files/bills_acts/acts_parliament/2023/The%20Bharatiya%20Nagarik%20Suraksha%20Sanhita,%202023.pdf",
            "canonical_source_url": "https://www.indiacode.nic.in/bitstream/123456789/20063/1/a202346.pdf",
            "parent_record_id": None
        })
        
    with open(output_path, 'w', encoding='utf-8') as f:
        for rec in records:
            f.write(json.dumps(rec) + '\n')
            
    print(f"Parsed BNSS: {len(records)} sections.")
    return len(records)

def parse_bsa():
    pdf_path = r'C:\Lexora\data\raw\bsa\a202347.pdf'
    output_path = r'C:\Lexora\data\raw\bsa\bsa_rag.jsonl'
    
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
        
    lines = text.split('\n')
    records = []
    
    current_chapter = None
    current_chapter_title = None
    current_section = None
    
    chapter_regex = re.compile(r"^CHAPTER\s+([A-ZIVX]+)$", re.IGNORECASE)
    section_regex = re.compile(r"^(\d+)\.\s+(.*)$")
    
    buffer_text = ""
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
            
        chap_match = chapter_regex.match(line)
        if chap_match:
            if current_section and buffer_text.strip():
                records.append({
                    "record_id": f"bsa__section_{current_section}",
                    "document_id": "bsa_2023",
                    "document_title": "Bharatiya Sakshya Adhiniyam, 2023",
                    "document_type": "Act",
                    "act_name": "Bharatiya Sakshya Adhiniyam",
                    "act_number": "47 of 2023",
                    "chapter": current_chapter,
                    "chapter_title": current_chapter_title,
                    "section_number": str(current_section),
                    "section_heading": f"Section {current_section}",
                    "subsection": None,
                    "clause": None,
                    "subclause": None,
                    "jurisdiction": "Central / India",
                    "language": "English",
                    "text": buffer_text.strip(),
                    "legal_status": "active",
                    "source_authority": "Ministry of Law and Justice / Ministry of Home Affairs / Government of India",
                    "source_url": "https://www.mha.gov.in/sites/default/files/250882_english_01042024.pdf",
                    "canonical_source_url": "https://www.indiacode.nic.in/bitstream/123456789/20064/1/a202347.pdf",
                    "parent_record_id": None
                })
                buffer_text = ""
            current_chapter = f"CHAPTER {chap_match.group(1).upper()}"
            if i + 1 < len(lines):
                current_chapter_title = lines[i+1].strip()
                i += 1
            i += 1
            continue
            
        sec_match = section_regex.match(line)
        if sec_match:
            if current_section and buffer_text.strip():
                records.append({
                    "record_id": f"bsa__section_{current_section}",
                    "document_id": "bsa_2023",
                    "document_title": "Bharatiya Sakshya Adhiniyam, 2023",
                    "document_type": "Act",
                    "act_name": "Bharatiya Sakshya Adhiniyam",
                    "act_number": "47 of 2023",
                    "chapter": current_chapter,
                    "chapter_title": current_chapter_title,
                    "section_number": str(current_section),
                    "section_heading": f"Section {current_section}",
                    "subsection": None,
                    "clause": None,
                    "subclause": None,
                    "jurisdiction": "Central / India",
                    "language": "English",
                    "text": buffer_text.strip(),
                    "legal_status": "active",
                    "source_authority": "Ministry of Law and Justice / Ministry of Home Affairs / Government of India",
                    "source_url": "https://www.mha.gov.in/sites/default/files/250882_english_01042024.pdf",
                    "canonical_source_url": "https://www.indiacode.nic.in/bitstream/123456789/20064/1/a202347.pdf",
                    "parent_record_id": None
                })
            current_section = sec_match.group(1)
            buffer_text = sec_match.group(2) + " "
        else:
            if current_section:
                buffer_text += line + " "
        i += 1
        
    if current_section and buffer_text.strip():
        records.append({
            "record_id": f"bsa__section_{current_section}",
            "document_id": "bsa_2023",
            "document_title": "Bharatiya Sakshya Adhiniyam, 2023",
            "document_type": "Act",
            "act_name": "Bharatiya Sakshya Adhiniyam",
            "act_number": "47 of 2023",
            "chapter": current_chapter,
            "chapter_title": current_chapter_title,
            "section_number": str(current_section),
            "section_heading": f"Section {current_section}",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Central / India",
            "language": "English",
            "text": buffer_text.strip(),
            "legal_status": "active",
            "source_authority": "Ministry of Law and Justice / Ministry of Home Affairs / Government of India",
            "source_url": "https://www.mha.gov.in/sites/default/files/250882_english_01042024.pdf",
            "canonical_source_url": "https://www.indiacode.nic.in/bitstream/123456789/20064/1/a202347.pdf",
            "parent_record_id": None
        })
        
    with open(output_path, 'w', encoding='utf-8') as f:
        for rec in records:
            f.write(json.dumps(rec) + '\n')
            
    print(f"Parsed BSA: {len(records)} sections.")
    return len(records)

if __name__ == '__main__':
    parse_bnss()
    parse_bsa()
