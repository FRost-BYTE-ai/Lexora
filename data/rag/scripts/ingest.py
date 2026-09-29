import json
import os
import time
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, SparseVectorParams, SparseVector, SparseIndexParams

processed_file = r'C:\Lexora\data\rag\processed\constitution_documents.jsonl'
qdrant_path = r'C:\Lexora\data\rag\qdrant'
collection_name = 'constitution'

from chatbot.sparse_utils import compute_sparse_vector

def generate_sparse_vector(text):
    indices, values = compute_sparse_vector(text)
    return SparseVector(indices=indices, values=values)

def ingest():
    print("Loading embedding model (intfloat/multilingual-e5-small)...")
    model = SentenceTransformer("intfloat/multilingual-e5-small")
    
    print("Initializing Qdrant client...")
    client = QdrantClient(path=qdrant_path)
    
    # Check if collection exists
    collections = [c.name for c in client.get_collections().collections]
    if collection_name not in collections:
        print(f"Creating collection '{collection_name}'...")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            sparse_vectors_config={"text_sparse": SparseVectorParams(
                index=SparseIndexParams(on_disk=False)
            )}
        )
    else:
        print(f"Collection '{collection_name}' already exists. Resuming ingestion...")

    # Load existing IDs to avoid duplicate ingestion
    try:
        # Just approximate check
        count = client.count(collection_name).count
        print(f"Currently {count} records in Qdrant.")
    except Exception as e:
        print(f"Could not count: {e}")

    print("Loading data...")
    records = []
    with open(processed_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
                
    batch_size = 64
    for i in tqdm(range(0, len(records), batch_size), desc="Ingesting batches"):
        batch = records[i:i+batch_size]
        
        # Prepare inputs
        texts = [r.get('text', '') for r in batch]
        # e5 models expect "query: " or "passage: " prefix. We use passage for docs.
        passages = ["passage: " + t for t in texts]
        
        # Dense embeddings
        embeddings = model.encode(passages, convert_to_numpy=True)
        
        points = []
        for j, r in enumerate(batch):
            # Validate record
            if not r.get("record_id"):
                continue
                
            # Create unique UUID based on record_id
            import hashlib
            import uuid
            id_hash = hashlib.md5(r["record_id"].encode('utf-8')).hexdigest()
            point_id = str(uuid.UUID(id_hash))
            
            sparse_vec = generate_sparse_vector(texts[j])
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector={
                        "": embeddings[j].tolist(),
                        "text_sparse": sparse_vec
                    },
                    payload=r
                )
            )
            
        client.upsert(
            collection_name=collection_name,
            points=points
        )
        
    print("Ingestion complete.")

if __name__ == "__main__":
    ingest()
