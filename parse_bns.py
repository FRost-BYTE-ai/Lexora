import fitz
import re
import json

def parse_pdf():
    doc = fitz.open(r'C:\Lexora\data\raw\bns\a202345.pdf')
    text = ""
    for page in doc:
        text += page.get_text()
        
    lines = text.split('\n')
    
    records = []
    
    current_chapter = None
    current_chapter_title = None
    current_section = None
    
    chapter_regex = re.compile(r"^CHAPTER ([A-ZIVX]+)$")
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
            # Save previous section if exists
            if current_section and buffer_text:
                records.append({
                    "record_id": f"bns__section_{current_section}",
                    "document_title": "Bharatiya Nyaya Sanhita, 2023",
                    "document_type": "Act",
                    "act_name": "Bharatiya Nyaya Sanhita",
                    "act_number": "45 of 2023",
                    "chapter": current_chapter,
                    "chapter_title": current_chapter_title,
                    "section_number": current_section,
                    "section_heading": f"Section {current_section}",
                    "subsection": None,
                    "clause": None,
                    "subclause": None,
                    "text": buffer_text.strip(),
                    "legal_status": "active",
                    "source_authority": "India Code",
                    "source_url": "https://www.indiacode.nic.in/bitstream/123456789/20062/1/a202345.pdf",
                    "parent_record_id": None
                })
                buffer_text = ""
            current_chapter = f"CHAPTER {chap_match.group(1)}"
            if i + 1 < len(lines):
                current_chapter_title = lines[i+1].strip()
                i += 1
            i += 1
            continue
            
        sec_match = section_regex.match(line)
        if sec_match:
            # Save previous section
            if current_section and buffer_text:
                records.append({
                    "record_id": f"bns__section_{current_section}",
                    "document_title": "Bharatiya Nyaya Sanhita, 2023",
                    "document_type": "Act",
                    "act_name": "Bharatiya Nyaya Sanhita",
                    "act_number": "45 of 2023",
                    "chapter": current_chapter,
                    "chapter_title": current_chapter_title,
                    "section_number": current_section,
                    "section_heading": f"Section {current_section}",
                    "subsection": None,
                    "clause": None,
                    "subclause": None,
                    "text": buffer_text.strip(),
                    "legal_status": "active",
                    "source_authority": "India Code",
                    "source_url": "https://www.indiacode.nic.in/bitstream/123456789/20062/1/a202345.pdf",
                    "parent_record_id": None
                })
            current_section = sec_match.group(1)
            buffer_text = sec_match.group(2) + " "
        else:
            if current_section:
                buffer_text += line + " "
                
        i += 1

    # Save last section
    if current_section and buffer_text:
        records.append({
            "record_id": f"bns__section_{current_section}",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "document_type": "Act",
            "act_name": "Bharatiya Nyaya Sanhita",
            "act_number": "45 of 2023",
            "chapter": current_chapter,
            "chapter_title": current_chapter_title,
            "section_number": current_section,
            "section_heading": f"Section {current_section}",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "text": buffer_text.strip(),
            "legal_status": "active",
            "source_authority": "India Code",
            "source_url": "https://www.indiacode.nic.in/bitstream/123456789/20062/1/a202345.pdf",
            "parent_record_id": None
        })

    with open(r'C:\Lexora\data\raw\bns\bns_rag.jsonl', 'w', encoding='utf-8') as f:
        for rec in records:
            f.write(json.dumps(rec) + '\n')
            
    print(f"Parsed {len(records)} sections.")

if __name__ == '__main__':
    parse_pdf()
