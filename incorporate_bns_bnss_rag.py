"""
Incorporate BNS and BNSS datasets from data/data/legal into Lexora RAG.
Normalizes record fields and ingests into Qdrant vector store.
"""
import os
import json
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, SparseVectorParams
from sentence_transformers import SentenceTransformer

from chatbot.sparse_utils import compute_sparse_vector

BNS_SRC = r'C:\Lexora\data\data\legal\bns\bns_rag.jsonl'
BNSS_SRC = r'C:\Lexora\data\data\legal\bnss\bnss_rag.jsonl'

BNS_DST = r'C:\Lexora\data\raw\bns\bns_rag.jsonl'
BNSS_DST = r'C:\Lexora\data\raw\bnss\bnss_rag.jsonl'

QDRANT_PATH = r'C:\Lexora\data\rag\qdrant'

def normalize_bns(rec):
    sec_num = str(rec.get('section_number', '') or '').strip()
    sec_heading = (rec.get('section_heading', '') or rec.get('chunk_header', '') or '').strip()
    if not sec_heading:
        sec_heading = f"Bharatiya Nyaya Sanhita Section {sec_num}" if sec_num else "Bharatiya Nyaya Sanhita Provision"
        
    text = rec.get('chunk_text') or rec.get('embedding_text') or rec.get('text', '')
    rag_id = rec.get('rag_id') or f"bns__section_{sec_num}"
    
    chap_num = str(rec.get('chapter_number', '') or '').strip()
    if chap_num and not chap_num.upper().startswith("CHAPTER"):
        chapter_formatted = f"CHAPTER {chap_num}"
    else:
        chapter_formatted = chap_num

    return {
        "record_id": rag_id,
        "document_title": "Bharatiya Nyaya Sanhita, 2023",
        "document_type": "Act",
        "act_name": "Bharatiya Nyaya Sanhita",
        "act_number": "45 of 2023",
        "chapter": chapter_formatted,
        "chapter_title": rec.get('chapter_title', '') or '',
        "section_number": sec_num,
        "section_heading": sec_heading,
        "subsection": str(rec.get('subsection', '') or ''),
        "clause": str(rec.get('clause', '') or ''),
        "subclause": str(rec.get('subclause', '') or ''),
        "schedule_number": str(rec.get('schedule_number', '') or ''),
        "form_number": str(rec.get('form_number', '') or ''),
        "node_type": rec.get('node_type', 'section'),
        "text": text,
        "legal_status": "Active",
        "source_authority": rec.get('source_authority', 'India Code') or 'India Code',
        "source_url": rec.get('source_url', '') or "https://www.indiacode.nic.in/bitstream/123456789/20062/1/a2023-45.pdf",
        "canonical_source_url": rec.get('source_url', '') or "https://www.indiacode.nic.in/bitstream/123456789/20062/1/a2023-45.pdf",
        "parent_record_id": rec.get('parent_record_id', '') or '',
        "rag_id": rag_id,
        "act_short": "BNS",
        "search_text": rec.get('search_text', '') or ''
    }

def normalize_bnss(rec):
    sec_num = str(rec.get('section_number', '') or '').strip()
    sec_heading = (rec.get('section_heading', '') or rec.get('chunk_header', '') or '').strip()
    node_type = rec.get('node_type', 'section')
    if not sec_heading:
        if sec_num:
            sec_heading = f"Bharatiya Nagarik Suraksha Sanhita Section {sec_num}"
        else:
            sec_heading = f"BNSS {node_type.replace('_', ' ').title()}"
        
    text = rec.get('chunk_text') or rec.get('embedding_text') or rec.get('text', '')
    rag_id = rec.get('rag_id') or f"bnss__rec_{sec_num or rec.get('schedule_number') or node_type}"
    
    chap_num = str(rec.get('chapter_number', '') or '').strip()
    if chap_num and not chap_num.upper().startswith("CHAPTER"):
        chapter_formatted = f"CHAPTER {chap_num}"
    else:
        chapter_formatted = chap_num

    return {
        "record_id": rag_id,
        "document_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "document_type": "Act",
        "act_name": "Bharatiya Nagarik Suraksha Sanhita",
        "act_number": "46 of 2023",
        "chapter": chapter_formatted,
        "chapter_title": rec.get('chapter_title', '') or '',
        "section_number": sec_num,
        "section_heading": sec_heading,
        "subsection": str(rec.get('subsection', '') or ''),
        "clause": str(rec.get('clause', '') or ''),
        "subclause": str(rec.get('subclause', '') or ''),
        "schedule_number": str(rec.get('schedule_number', '') or ''),
        "form_number": str(rec.get('form_number', '') or ''),
        "node_type": node_type,
        "text": text,
        "legal_status": "Active",
        "source_authority": rec.get('source_authority', 'India Code') or 'India Code',
        "source_url": rec.get('source_url', '') or "https://www.indiacode.nic.in/bitstream/123456789/20335/1/a2023-46.pdf",
        "canonical_source_url": rec.get('source_url', '') or "https://www.indiacode.nic.in/bitstream/123456789/20335/1/a2023-46.pdf",
        "parent_record_id": rec.get('parent_record_id', '') or '',
        "rag_id": rag_id,
        "act_short": "BNSS",
        "search_text": rec.get('search_text', '') or ''
    }

def convert_datasets():
    print("--- Processing and normalizing BNS dataset ---")
    bns_records = []
    with open(BNS_SRC, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                raw = json.loads(line)
                bns_records.append(normalize_bns(raw))
                
    os.makedirs(os.path.dirname(BNS_DST), exist_ok=True)
    with open(BNS_DST, 'w', encoding='utf-8') as f:
        for rec in bns_records:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
    print(f"Wrote {len(bns_records)} normalized BNS records to {BNS_DST}")

    print("\n--- Processing and normalizing BNSS dataset ---")
    bnss_records = []
    with open(BNSS_SRC, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                raw = json.loads(line)
                bnss_records.append(normalize_bnss(raw))
                
    os.makedirs(os.path.dirname(BNSS_DST), exist_ok=True)
    with open(BNSS_DST, 'w', encoding='utf-8') as f:
        for rec in bnss_records:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
    print(f"Wrote {len(bnss_records)} normalized BNSS records to {BNSS_DST}")

def ingest_collection(client, model, collection_name, jsonl_path):
    print(f"\n--- Ingesting collection '{collection_name}' from {jsonl_path} ---")
    if client.collection_exists(collection_name=collection_name):
        print(f"Deleting existing Qdrant collection '{collection_name}'...")
        client.delete_collection(collection_name=collection_name)
        
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        sparse_vectors_config={"text_sparse": SparseVectorParams()}
    )
    
    records = []
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
                
    points = []
    batch_size = 64
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        passages = ["passage: " + (r.get('text') or '') for r in batch]
        embeddings = model.encode(passages, convert_to_numpy=True)
        
        for j, rec in enumerate(batch):
            pid = i + j
            text_for_sparse = rec.get('text', '') or rec.get('search_text', '')
            indices, values = compute_sparse_vector(text_for_sparse)
            points.append(PointStruct(
                id=pid,
                vector={
                    "": embeddings[j].tolist(),
                    "text_sparse": {"indices": indices, "values": values}
                },
                payload=rec
            ))
            
    # Upsert points in batches of 100
    for i in range(0, len(points), 100):
        client.upsert(collection_name=collection_name, points=points[i:i+100])
        
    count = client.get_collection(collection_name).points_count
    print(f"Collection '{collection_name}' successfully ingested: {count} records in Qdrant.")

def main():
    convert_datasets()
    
    print("\nLoading Qdrant client & SentenceTransformer embedding model...")
    client = QdrantClient(path=QDRANT_PATH)
    model = SentenceTransformer("intfloat/multilingual-e5-small", device='cpu')
    
    ingest_collection(client, model, "bns", BNS_DST)
    ingest_collection(client, model, "bnss", BNSS_DST)
    
    print("\n--- Summary of Qdrant Collections ---")
    cols = client.get_collections().collections
    for c in cols:
        cnt = client.get_collection(c.name).points_count
        print(f"  Collection '{c.name}': {cnt} points")

if __name__ == '__main__':
    main()
