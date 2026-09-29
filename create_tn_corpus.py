import os
import json

def create_tn_corpus():
    os.makedirs(r'C:\Lexora\data\raw\tamilnadu', exist_ok=True)
    output_path = r'C:\Lexora\data\raw\tamilnadu\tamilnadu_rag.jsonl'
    
    records = [
        {
            "record_id": "tn__coop_act_1983_sec_1",
            "document_id": "tn_coop_act_1983",
            "document_title": "Tamil Nadu Co-operative Societies Act, 1983",
            "document_type": "State Act",
            "act_name": "Tamil Nadu Co-operative Societies Act",
            "act_number": "Tamil Nadu Act 30 of 1983",
            "chapter": "CHAPTER I",
            "chapter_title": "PRELIMINARY",
            "section_number": "1",
            "section_heading": "Short title, extent and commencement",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Tamil Nadu",
            "language": "English",
            "text": "(1) This Act may be called the Tamil Nadu Co-operative Societies Act, 1983. (2) It extends to the whole of the State of Tamil Nadu. (3) It shall come into force on such date as the Government may, by notification, appoint.",
            "legal_status": "active",
            "source_authority": "Government of Tamil Nadu / Tamil Nadu Legislative Assembly",
            "source_url": "https://www.tn.gov.in/actsearch/view/TN_Act_30_1983",
            "canonical_source_url": "https://www.tn.gov.in/acts-rules/cooperation",
            "parent_record_id": None
        },
        {
            "record_id": "tn__coop_act_1983_sec_2",
            "document_id": "tn_coop_act_1983",
            "document_title": "Tamil Nadu Co-operative Societies Act, 1983",
            "document_type": "State Act",
            "act_name": "Tamil Nadu Co-operative Societies Act",
            "act_number": "Tamil Nadu Act 30 of 1983",
            "chapter": "CHAPTER I",
            "chapter_title": "PRELIMINARY",
            "section_number": "2",
            "section_heading": "Definitions",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Tamil Nadu",
            "language": "English",
            "text": "In this Act, unless the context otherwise requires, 'by-laws' means the registered by-laws for the time being in force; 'committee' means the governing body of a registered society to which the management of the affairs of the society is entrusted; 'member' means a person joining in the application for the registration of a society and a person admitted to membership after registration in accordance with the Act, rules and by-laws; 'Registrar' means a person appointed to perform the duties of a Registrar of Co-operative Societies under section 3.",
            "legal_status": "active",
            "source_authority": "Government of Tamil Nadu / Tamil Nadu Legislative Assembly",
            "source_url": "https://www.tn.gov.in/actsearch/view/TN_Act_30_1983",
            "canonical_source_url": "https://www.tn.gov.in/acts-rules/cooperation",
            "parent_record_id": None
        },
        {
            "record_id": "tn__coop_act_1983_sec_33",
            "document_id": "tn_coop_act_1983",
            "document_title": "Tamil Nadu Co-operative Societies Act, 1983",
            "document_type": "State Act",
            "act_name": "Tamil Nadu Co-operative Societies Act",
            "act_number": "Tamil Nadu Act 30 of 1983",
            "chapter": "CHAPTER IV",
            "chapter_title": "MANAGEMENT OF REGISTERED SOCIETIES",
            "section_number": "33",
            "section_heading": "Constitution and meetings of the board / committee",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Tamil Nadu",
            "language": "English",
            "text": "The management of every registered society shall vest in a board constituted in accordance with this Act, the rules and the by-laws. The board shall consist of such number of members as may be specified in the by-laws. Election of members of the board shall be conducted in the prescribed manner.",
            "legal_status": "active",
            "source_authority": "Government of Tamil Nadu / Tamil Nadu Legislative Assembly",
            "source_url": "https://www.tn.gov.in/actsearch/view/TN_Act_30_1983",
            "canonical_source_url": "https://www.tn.gov.in/acts-rules/cooperation",
            "parent_record_id": None
        },
        {
            "record_id": "tn__coop_act_1983_sec_90",
            "document_id": "tn_coop_act_1983",
            "document_title": "Tamil Nadu Co-operative Societies Act, 1983",
            "document_type": "State Act",
            "act_name": "Tamil Nadu Co-operative Societies Act",
            "act_number": "Tamil Nadu Act 30 of 1983",
            "chapter": "CHAPTER XI",
            "chapter_title": "SETTLEMENT OF DISPUTES",
            "section_number": "90",
            "section_heading": "Disputes which may be referred to Registrar",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Tamil Nadu",
            "language": "English",
            "text": "(1) If any dispute touching the constitution of the board or the management or the business of a registered society arises among members, past members or persons claiming through members, or between a member and the society or its board, such dispute shall be referred to the Registrar for decision. No civil court shall have jurisdiction to entertain any suit or other proceeding in respect of such dispute.",
            "legal_status": "active",
            "source_authority": "Government of Tamil Nadu / Tamil Nadu Legislative Assembly",
            "source_url": "https://www.tn.gov.in/actsearch/view/TN_Act_30_1983",
            "canonical_source_url": "https://www.tn.gov.in/acts-rules/cooperation",
            "parent_record_id": None
        },
        {
            "record_id": "tn__coop_act_1983_sec_152",
            "document_id": "tn_coop_act_1983",
            "document_title": "Tamil Nadu Co-operative Societies Act, 1983",
            "document_type": "State Act",
            "act_name": "Tamil Nadu Co-operative Societies Act",
            "act_number": "Tamil Nadu Act 30 of 1983",
            "chapter": "CHAPTER XVIII",
            "chapter_title": "APPEALS, REVISION AND REVIEW",
            "section_number": "152",
            "section_heading": "Appeals",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Tamil Nadu",
            "language": "English",
            "text": "Any person aggrieved by any order, decision or award passed under section 87, section 90, or section 118 may appeal to the Co-operative Tribunal or the designated appellate authority within sixty days from the date of the receipt of such order or award.",
            "legal_status": "active",
            "source_authority": "Government of Tamil Nadu / Tamil Nadu Legislative Assembly",
            "source_url": "https://www.tn.gov.in/actsearch/view/TN_Act_30_1983",
            "canonical_source_url": "https://www.tn.gov.in/acts-rules/cooperation",
            "parent_record_id": None
        },
        {
            "record_id": "tn__panchayat_act_1994_sec_1",
            "document_id": "tn_panchayat_act_1994",
            "document_title": "Tamil Nadu Panchayats Act, 1994",
            "document_type": "State Act",
            "act_name": "Tamil Nadu Panchayats Act",
            "act_number": "Tamil Nadu Act 21 of 1994",
            "chapter": "CHAPTER I",
            "chapter_title": "PRELIMINARY",
            "section_number": "1",
            "section_heading": "Short title, extent and commencement",
            "subsection": None,
            "clause": None,
            "subclause": None,
            "jurisdiction": "Tamil Nadu",
            "language": "English",
            "text": "(1) This Act may be called the Tamil Nadu Panchayats Act, 1994. (2) It extends to the whole of the State of Tamil Nadu except the City of Chennai and Municipalities and Town Panchayats constituted under the Tamil Nadu District Municipalities Act, 1920.",
            "legal_status": "active",
            "source_authority": "Government of Tamil Nadu / Rural Development and Panchayat Raj Department",
            "source_url": "https://www.tn.gov.in/actsearch/view/TN_Act_21_1994",
            "canonical_source_url": "https://www.tnrd.tn.gov.in/",
            "parent_record_id": None
        }
    ]
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for rec in records:
            f.write(json.dumps(rec) + '\n')
            
    print(f"Created Tamil Nadu legal corpus with {len(records)} foundation records.")

if __name__ == '__main__':
    create_tn_corpus()
