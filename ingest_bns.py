"""Re-ingest BNS with corrected provenance metadata into Qdrant."""
import json
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, SparseVectorParams
from sentence_transformers import SentenceTransformer

from chatbot.sparse_utils import compute_sparse_vector

def get_sparse_vector(text):
    return compute_sparse_vector(text)

def ingest():
    client = QdrantClient(path=r'C:\Lexora\data\rag\qdrant')
    
    collection_name = 'bns'
    # Delete and recreate to ensure clean state with updated metadata
    if client.collection_exists(collection_name=collection_name):
        client.delete_collection(collection_name=collection_name)
    
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        sparse_vectors_config={"text_sparse": SparseVectorParams()}
    )
        
    model = SentenceTransformer("intfloat/multilingual-e5-small", device='cpu')
    
    records = []
    with open(r'C:\Lexora\data\raw\bns\bns_rag.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            records.append(json.loads(line))
            
    points = []
    for i, rec in enumerate(records):
        text = rec['text']
        q_dense = model.encode("passage: " + text, convert_to_numpy=True).tolist()
        indices, values = get_sparse_vector(text)
        
        points.append(PointStruct(
            id=i,
            vector={
                "": q_dense,
                "text_sparse": {"indices": indices, "values": values}
            },
            payload=rec
        ))
        
    client.upsert(collection_name=collection_name, points=points)
    
    count = client.get_collection(collection_name).points_count
    print(f"BNS re-ingested with corrected provenance. {count} records.")

if __name__ == '__main__':
    ingest()
