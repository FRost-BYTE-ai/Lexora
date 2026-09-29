"""
Re-index sparse vectors across all 5 Qdrant collections using deterministic CRC32 hash.
This preserves existing dense embeddings and payloads while replacing random hash()
sparse vectors with 100% deterministic, cross-process reproducible sparse representations.
"""

import time
from qdrant_client import QdrantClient
from qdrant_client.models import PointVectors
from chatbot.sparse_utils import compute_sparse_vector

qdrant_path = r'C:\Lexora\data\rag\qdrant'

def update_collection_sparse(client, collection_name, batch_size=200):
    print(f"\nUpdating sparse vectors for collection: {collection_name}...", flush=True)
    t0 = time.time()
    
    total = client.count(collection_name).count
    print(f"Total points: {total}", flush=True)
    
    offset = None
    processed = 0
    while True:
        points, next_offset = client.scroll(
            collection_name=collection_name,
            limit=batch_size,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )
        if not points:
            break
            
        update_points = []
        for p in points:
            text = p.payload.get('text', '') or p.payload.get('search_text', '')
            indices, values = compute_sparse_vector(text)
            update_points.append(PointVectors(
                id=p.id,
                vector={'text_sparse': {'indices': indices, 'values': values}}
            ))
            
        client.update_vectors(
            collection_name=collection_name,
            points=update_points
        )
        processed += len(points)
        print(f"  Processed {processed}/{total} points...", flush=True)
        
        offset = next_offset
        if offset is None:
            break
            
    print(f"Done {collection_name} in {round(time.time() - t0, 2)}s.", flush=True)

def main():
    client = QdrantClient(path=qdrant_path)
    collections = ['constitution', 'bns', 'bnss', 'bsa', 'tamilnadu']
    for c in collections:
        update_collection_sparse(client, c)
    print("\nAll 5 collections updated with deterministic sparse vectors successfully!")

if __name__ == '__main__':
    main()
