import json
from chatbot import LexoraChatbot

def run_tests():
    bot = LexoraChatbot(config={"use_lora": False})
    
    queries = [
        "What is Article 19?",
        "What does Article 19(1)(a) protect?",
        "Explain Article 19(1)(a)",
        "Article 19 (1) (a)",
        "What is the freedom of speech provision?",
        "What is Article 21?",
        "What is the right to equality?"
    ]
    
    report = []
    
    for q in queries:
        art, cls, sub = bot.extract_metadata_filter(q)
        
        # Test just the retrieval part
        q_dense = bot.embed_model.encode("query: " + q, convert_to_numpy=True).tolist()
        q_sparse = bot.get_sparse_vector(q)
        
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        q_filter = None
        filter_dict = None
        if art:
            conds = [FieldCondition(key="article_number", match=MatchValue(value=art))]
            if cls: conds.append(FieldCondition(key="clause", match=MatchValue(value=cls)))
            if sub: conds.append(FieldCondition(key="subclause", match=MatchValue(value=sub)))
            q_filter = Filter(must=conds)
            filter_dict = {"article": art, "clause": cls, "subclause": sub}
            
        dense_res = bot.qdrant.query_points(collection_name=bot.collection_name, query=q_dense, using="", limit=10, query_filter=q_filter).points
        sparse_res = bot.qdrant.query_points(collection_name=bot.collection_name, query=q_sparse, using="text_sparse", limit=10, query_filter=q_filter).points
        
        scores = {}
        docs = {}
        for rk, r in enumerate(dense_res, 1):
            scores[r.id] = scores.get(r.id, 0) + 1.0/(60+rk)
            docs[r.id] = r
        for rk, r in enumerate(sparse_res, 1):
            scores[r.id] = scores.get(r.id, 0) + 1.0/(60+rk)
            docs[r.id] = r
            
        ranked = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        top_docs = [docs[i] for i in ranked[:3]]
        num_candidates = len(scores)
        
        top_record = top_docs[0] if top_docs else None
        
        # Relevance check
        is_relevant = False
        if top_record:
            rec_id = top_record.payload.get("record_id", "")
            rec_art = str(top_record.payload.get("article_number", ""))
            
            if q == "What is Article 19?" and "article_19" in rec_id:
                is_relevant = True
            elif "19(1)(a)" in q and rec_art == "19" and top_record.payload.get("clause") == "(1)" and top_record.payload.get("subclause") == "(a)":
                is_relevant = True
            elif q == "What is the freedom of speech provision?" and rec_art == "19":
                is_relevant = True
            elif q == "What is Article 21?" and rec_art == "21":
                is_relevant = True
            elif q == "What is the right to equality?" and rec_art in ["14", "15", "16", "17", "18", "13"]:
                is_relevant = True

        report.append({
            "query": q,
            "parsed_article": art,
            "parsed_clause": cls,
            "parsed_subclause": sub,
            "actual_payload_representation": {
                "article_number": top_record.payload.get("article_number") if top_record else None,
                "clause": top_record.payload.get("clause") if top_record else None,
                "subclause": top_record.payload.get("subclause") if top_record else None
            } if top_record else None,
            "filter_applied": filter_dict,
            "number_of_candidates": num_candidates,
            "top_retrieved_record": top_record.payload.get("record_id") if top_record else None,
            "is_relevant": is_relevant
        })
        
    with open("art19_test_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=4)
        
    print("Tests complete. Report saved to art19_test_report.json.")

if __name__ == "__main__":
    run_tests()
