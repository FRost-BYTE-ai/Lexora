import json
import os
import time
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, SparseVectorParams
from sentence_transformers import SentenceTransformer

from chatbot.sparse_utils import compute_sparse_vector

def get_sparse_vector(text):
    return compute_sparse_vector(text)

def ingest_corpus(client, model, collection_name, jsonl_path):
    print(f"\n--- Ingesting {collection_name} from {jsonl_path} ---")
    if client.collection_exists(collection_name=collection_name):
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
        passages = ["passage: " + r['text'] for r in batch]
        embeddings = model.encode(passages, convert_to_numpy=True)
        
        for j, rec in enumerate(batch):
            pid = i + j
            indices, values = get_sparse_vector(rec['text'])
            points.append(PointStruct(
                id=pid,
                vector={
                    "": embeddings[j].tolist(),
                    "text_sparse": {"indices": indices, "values": values}
                },
                payload=rec
            ))
            
    # Upsert in batches of 100
    for i in range(0, len(points), 100):
        client.upsert(collection_name=collection_name, points=points[i:i+100])
        
    count = client.get_collection(collection_name).points_count
    print(f"Successfully ingested {collection_name}: {count} records.")

def main():
    qdrant_path = r'C:\Lexora\data\rag\qdrant'
    client = QdrantClient(path=qdrant_path)
    print("Loading embedding model (intfloat/multilingual-e5-small)...")
    model = SentenceTransformer("intfloat/multilingual-e5-small", device='cpu')
    
    # Ingest BNS
    ingest_corpus(client, model, "bns", r'C:\Lexora\data\raw\bns\bns_rag.jsonl')
    
    # Ingest BNSS
    ingest_corpus(client, model, "bnss", r'C:\Lexora\data\raw\bnss\bnss_rag.jsonl')
    
    # Ingest BSA
    ingest_corpus(client, model, "bsa", r'C:\Lexora\data\raw\bsa\bsa_rag.jsonl')
    
    # Ingest Tamil Nadu
    ingest_corpus(client, model, "tamilnadu", r'C:\Lexora\data\raw\tamilnadu\tamilnadu_rag.jsonl')
    
    print("\nAll target collections ingested successfully.")
    existing_collections = [c.name for c in client.get_collections().collections]
    print(f"Current Qdrant collections: {existing_collections}")

if __name__ == '__main__':
    main()
