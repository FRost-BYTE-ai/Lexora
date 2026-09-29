import json
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from qdrant_client.models import SparseVector

qdrant_path = r'C:\Lexora\data\rag\qdrant'
collection_name = 'constitution'
eval_report_file = r'C:\Lexora\data\rag\evaluation\constitution_retrieval_report.json'

queries = [
    "What is Article 21?",
    "What are the Fundamental Rights?",
    "What does Article 14 provide?",
    "Explain Article 32.",
    "What freedom of speech rights are protected by the Constitution?",
    "right to equality",
    "Article 19",
    "What are the constitutional remedies?",
    "What does Article 15 prohibit?",
    "Explain the protection of life and personal liberty."
]

def generate_sparse_vector(text):
    tokens = text.lower().replace('.', '').replace(',', '').split()
    counts = {}
    for t in tokens:
        idx = hash(t) % 100000
        counts[idx] = counts.get(idx, 0) + 1.0
    indices = sorted(list(counts.keys()))
    values = [counts[i] for i in indices]
    return SparseVector(indices=indices, values=values)

def rrf(dense_results, sparse_results, k=60):
    scores = {}
    docs = {}
    
    # rank is 1-indexed
    for rank, res in enumerate(dense_results, 1):
        pid = res.id
        scores[pid] = scores.get(pid, 0) + 1.0 / (k + rank)
        docs[pid] = res
        
    for rank, res in enumerate(sparse_results, 1):
        pid = res.id
        scores[pid] = scores.get(pid, 0) + 1.0 / (k + rank)
        docs[pid] = res
        
    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [(docs[i], scores[i]) for i in sorted_ids]

def format_result(rank, method, res, score_info):
    payload = res.payload
    return {
        "rank": rank,
        "record_id": payload.get("record_id"),
        "article_number": payload.get("article_number"),
        "clause": payload.get("clause"),
        "heading": payload.get("heading"),
        "short_text": payload.get("text", "")[:100] + "...",
        "retrieval_method": method,
        "score_rank_info": score_info,
        "source_url": payload.get("source_url")
    }

def run_eval():
    print("Loading model...")
    model = SentenceTransformer("intfloat/multilingual-e5-small")
    print("Loading Qdrant...")
    client = QdrantClient(path=qdrant_path)
    
    report = {}
    for q in queries:
        print(f"Query: {q}")
        query_dense = model.encode("query: " + q, convert_to_numpy=True).tolist()
        query_sparse = generate_sparse_vector(q)
        
        # A. Dense only
        dense_res = client.query_points(
            collection_name=collection_name,
            query=query_dense,
            using="",
            limit=5
        ).points
        
        # B. Sparse only
        sparse_res = client.query_points(
            collection_name=collection_name,
            query=query_sparse,
            using="text_sparse",
            limit=5
        ).points
        
        # C. Hybrid (RRF)
        # Fetch top 20 for RRF
        dense_for_hybrid = client.query_points(
            collection_name=collection_name,
            query=query_dense,
            using="",
            limit=20
        ).points
        sparse_for_hybrid = client.query_points(
            collection_name=collection_name,
            query=query_sparse,
            using="text_sparse",
            limit=20
        ).points
        hybrid_res = rrf(dense_for_hybrid, sparse_for_hybrid)[:5]
        
        q_results = {
            "dense": [format_result(i+1, "dense", r, f"score: {r.score:.4f}") for i, r in enumerate(dense_res)],
            "sparse": [format_result(i+1, "sparse", r, f"score: {r.score:.4f}") for i, r in enumerate(sparse_res)],
            "hybrid": [format_result(i+1, "hybrid", r, f"rrf_score: {score:.4f}") for i, (r, score) in enumerate(hybrid_res)]
        }
        report[q] = q_results
        
    with open(eval_report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4)
        
    print(f"Saved evaluation report to {eval_report_file}")

if __name__ == "__main__":
    run_eval()
