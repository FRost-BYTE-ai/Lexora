import json
import os
import time
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, SparseVectorParams
from sentence_transformers import SentenceTransformer

from chatbot.sparse_utils import compute_sparse_vector

def ingest_judgments():
    qdrant_path = r'C:\Lexora\data\rag\qdrant'
    client = QdrantClient(path=qdrant_path)
    
    print("Loading embedding model (intfloat/multilingual-e5-small)...")
    model = SentenceTransformer("intfloat/multilingual-e5-small", device='cpu')
    
    collection_name = "supreme_court_judgments"
    jsonl_path = r'C:\Lexora\data\raw\judgments\supreme_court_judgments.jsonl'
    
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
    for i, rec in enumerate(records):
        # Build passage text combining case title, citation, provisions, holdings, ratio, text
        passage_text = f"passage: {rec.get('case_name', '')} {rec.get('citation', '')} {' '.join(rec.get('legal_provisions', []))} {' '.join(rec.get('keywords', []))} {rec.get('text', '')}"
        emb = model.encode(passage_text, convert_to_numpy=True)
        
        indices, values = compute_sparse_vector(rec['text'] + " " + rec.get('case_name', '') + " " + rec.get('citation', ''))
        points.append(PointStruct(
            id=i + 1,
            vector={
                "": emb.tolist(),
                "text_sparse": {"indices": indices, "values": values}
            },
            payload=rec
        ))
        
    client.upsert(collection_name=collection_name, points=points)
    count = client.get_collection(collection_name).points_count
    print(f"Successfully ingested {collection_name}: {count} judgment records.")

if __name__ == '__main__':
    ingest_judgments()
