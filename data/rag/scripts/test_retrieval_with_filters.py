import json
import re
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from qdrant_client.models import SparseVector

qdrant_path = r'C:\Lexora\data\rag\qdrant'
collection_name = 'constitution'
eval_report_file = r'C:\Lexora\data\rag\evaluation\constitution_retrieval_filtered_report.json'

queries = {
    "What is Article 21?": ["21"],
    "Explain Article 14": ["14"],
    "Article 19(1)(a)": ["19"],
    "What are the Fundamental Rights?": ["12", "13", "14", "19", "21", "32"],
    "right to equality": ["14", "15", "16", "17", "18"],
    "protection of life and personal liberty": ["21"]
}

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

def extract_article_filter(query):
    pattern = r"(?:article|art\.?)\s*(\d+[A-Z]?)(?:\s*\(\s*([a-zA-Z0-9]+)\s*\))?(?:\s*\(\s*([a-zA-Z0-9]+)\s*\))?"
    match = re.search(pattern, query, re.IGNORECASE)
    if match:
        article = match.group(1)
        clause = f"({match.group(2)})" if match.group(2) else None
        subclause = f"({match.group(3)})" if match.group(3) else None
        return article, clause, subclause
    return None, None, None

def build_filter(article, clause, subclause):
    if not article:
        return None
    conditions = [FieldCondition(key="article_number", match=MatchValue(value=article))]
    if clause:
        conditions.append(FieldCondition(key="clause", match=MatchValue(value=clause)))
    if subclause:
        conditions.append(FieldCondition(key="subclause", match=MatchValue(value=subclause)))
    return Filter(must=conditions)

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
        "score_rank_info": score_info
    }

def run_tests():
    print("Loading model...")
    model = SentenceTransformer("intfloat/multilingual-e5-small")
    print("Loading Qdrant...")
    client = QdrantClient(path=qdrant_path)
    
    report = {}
    metrics = {
        "baseline": {"top_1": 0, "top_3": 0, "top_5": 0, "wrong": 0, "missing": 0},
        "filtered": {"top_1": 0, "top_3": 0, "top_5": 0, "wrong": 0, "missing": 0},
        "explicit_queries": 0,
        "non_explicit_queries": 0
    }
    
    for q, expected in queries.items():
        print(f"Query: {q}")
        query_dense = model.encode("query: " + q, convert_to_numpy=True).tolist()
        query_sparse = generate_sparse_vector(q)
        
        art, cls, sub = extract_article_filter(q)
        q_filter = build_filter(art, cls, sub)
        
        if art:
            metrics["explicit_queries"] += 1
        else:
            metrics["non_explicit_queries"] += 1
        
        # 1. Baseline Hybrid
        dense_base = client.query_points(collection_name=collection_name, query=query_dense, using="", limit=20).points
        sparse_base = client.query_points(collection_name=collection_name, query=query_sparse, using="text_sparse", limit=20).points
        hybrid_base = rrf(dense_base, sparse_base)[:5]
        
        # 2. Filtered Hybrid (if filter exists)
        if q_filter:
            dense_filt = client.query_points(collection_name=collection_name, query=query_dense, using="", limit=20, query_filter=q_filter).points
            sparse_filt = client.query_points(collection_name=collection_name, query=query_sparse, using="text_sparse", limit=20, query_filter=q_filter).points
            hybrid_filt = rrf(dense_filt, sparse_filt)[:5]
        else:
            hybrid_filt = hybrid_base
            
        def evaluate(results):
            found = False
            top_1, top_3, top_5 = 0, 0, 0
            for rank, (r, s) in enumerate(results, 1):
                article = str(r.payload.get("article_number", ""))
                main_article = article.split('(')[0].strip()
                is_relevant = main_article in expected or "Part III" in str(r.payload.get("short_text", ""))
                if is_relevant:
                    found = True
                    if rank == 1: top_1 = 1
                    if rank <= 3: top_3 = 1
                    if rank <= 5: top_5 = 1
                    break
            return found, top_1, top_3, top_5, len(results) if not found else 0
            
        b_found, b1, b3, b5, bw = evaluate(hybrid_base)
        f_found, f1, f3, f5, fw = evaluate(hybrid_filt)
        
        metrics["baseline"]["top_1"] += b1
        metrics["baseline"]["top_3"] += b3
        metrics["baseline"]["top_5"] += b5
        if not b_found:
            metrics["baseline"]["missing"] += 1
            metrics["baseline"]["wrong"] += bw
            
        metrics["filtered"]["top_1"] += f1
        metrics["filtered"]["top_3"] += f3
        metrics["filtered"]["top_5"] += f5
        if not f_found:
            metrics["filtered"]["missing"] += 1
            metrics["filtered"]["wrong"] += fw
            
        report[q] = {
            "has_filter": bool(q_filter),
            "extracted": {"article": art, "clause": cls, "subclause": sub},
            "baseline_results": [format_result(i+1, "hybrid_baseline", r, f"score: {s:.4f}") for i, (r, s) in enumerate(hybrid_base)],
            "filtered_results": [format_result(i+1, "hybrid_filtered", r, f"score: {s:.4f}") for i, (r, s) in enumerate(hybrid_filt)]
        }
        
    full_report = {
        "metrics": metrics,
        "query_details": report
    }
    
    with open(eval_report_file, 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=4)
        
    print(f"Saved evaluation report to {eval_report_file}")

if __name__ == "__main__":
    run_tests()
