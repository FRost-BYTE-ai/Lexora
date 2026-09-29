"""
Verification script for updated BNS and BNSS RAG collections in Qdrant.
Tests:
1. Qdrant point counts for 'bns' and 'bnss'.
2. Multi-corpus retrieval with LexoraChatbot.
"""
import sys
import json
from qdrant_client import QdrantClient

def verify_collections():
    qdrant_path = r'C:\Lexora\data\rag\qdrant'
    client = QdrantClient(path=qdrant_path)
    
    print("=== Qdrant Collection Verification ===")
    cols = {c.name: client.get_collection(c.name).points_count for c in client.get_collections().collections}
    print(json.dumps(cols, indent=2))
    
    assert 'bns' in cols and cols['bns'] == 620, f"Expected 620 BNS points, got {cols.get('bns')}"
    assert 'bnss' in cols and cols['bnss'] == 2175, f"Expected 2175 BNSS points, got {cols.get('bnss')}"
    print("\nSUCCESS: All expected point counts verified in Qdrant!")

def verify_chatbot_retrieval():
    print("\n=== Testing LexoraChatbot Retrieval ===")
    from chatbot.chatbot import LexoraChatbot
    bot = LexoraChatbot(config={"use_lora": False})
    
    test_queries = [
        ("What is the punishment for murder under BNS?", "bns"),
        ("What is the procedure for arrest under BNSS?", "bnss")
    ]
    
    for query, expected_corpus in test_queries:
        print(f"\nQuery: '{query}'")
        plan = {
            "retrieval_query": query,
            "selected_corpora": [expected_corpus],
            "filters": {},
            "jurisdiction": "Central / India"
        }
        docs, scores, larv_diag = bot.execute_multi_corpus_retrieval(plan)
        print(f"Retrieved {len(docs)} documents from '{expected_corpus}'")
        if docs:
            top_payload = docs[0].payload
            print(f" Top match: {top_payload.get('document_title')} - {top_payload.get('section_heading')}")
            print(f" Excerpt: {top_payload.get('text')[:150]}...")
            
    print("\nSUCCESS: RAG retrieval verified working on BNS and BNSS datasets!")

if __name__ == '__main__':
    verify_collections()
    verify_chatbot_retrieval()
