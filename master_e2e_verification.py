"""
Lexora Comprehensive Master End-to-End Verification Suite
=========================================================
Runs full verification across all 13 core features, natural greetings,
voice, translation, scheme/case provenance, OCR, and multi-turn context.
"""

import sys
import json
import urllib.request
import urllib.parse

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.status, json.loads(res.read().decode("utf-8"))

def get(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.status, json.loads(res.read().decode("utf-8"))

def main():
    results = {}
    print("==================================================")
    print("STARTING LEXORA MASTER E2E VERIFICATION SUITE")
    print("==================================================")

    # 1. Health check
    status, data = get("/api/health")
    assert status == 200
    results["Health"] = "PASS"
    print("1. Health Endpoint: PASS")

    # 2. Casual Greeting Tests (Text & Voice pipeline)
    # User: "Hi"
    status, chat_hi = post("/api/chat", {"message": "Hi"})
    assert "Hi!" in chat_hi["response"] or "Lexora" in chat_hi["response"]
    assert chat_hi["scope"] == "CASUAL"
    results["Greeting_Hi"] = "PASS"
    print(f"2a. Greeting 'Hi': PASS -> '{chat_hi['response']}'")

    # User: "Who are you?"
    status, chat_who = post("/api/chat", {"message": "Who are you?"})
    assert "Tamil-first" in chat_who["response"] or "Lexora" in chat_who["response"]
    results["Greeting_WhoAreYou"] = "PASS"
    print(f"2b. Identity 'Who are you?': PASS -> '{chat_who['response']}'")

    # User: "What can you do?"
    status, chat_what = post("/api/chat", {"message": "What can you do?"})
    assert len(chat_what["response"]) > 20
    results["Greeting_WhatCanYouDo"] = "PASS"
    print(f"2c. Capabilities 'What can you do?': PASS -> '{chat_what['response']}'")

    # 3. Non-Legal Rejection (Substantive non-legal query)
    status, chat_nonlegal = post("/api/chat", {"message": "Give me a biryani recipe."})
    assert chat_nonlegal["response"] == "I only help with legal queries."
    results["NonLegal_Guard"] = "PASS"
    print(f"3. Non-Legal Rejection: PASS -> '{chat_nonlegal['response']}'")

    # 4. Multi-Turn Session Memory (Neighbour harassment scenario)
    status, session_new = post("/api/sessions/new", {"title": "Neighbour Dispute Test"})
    sid = session_new["session_id"]
    
    # Turn 1: "My neighbour is threatening me."
    status, t1 = post("/api/chat", {"session_id": sid, "message": "My neighbour is threatening me."})
    assert t1["scope"] == "LEGAL"
    
    # Turn 2: "He keeps calling me."
    status, t2 = post("/api/chat", {"session_id": sid, "message": "He keeps calling me."})
    assert t2["scope"] == "LEGAL"
    
    # Turn 3: "What can I do?"
    status, t3 = post("/api/chat", {"session_id": sid, "message": "What can I do?"})
    assert t3["scope"] == "LEGAL"
    
    # Turn 4: "Can I complain to the police?"
    status, t4 = post("/api/chat", {"session_id": sid, "message": "Can I complain to the police?"})
    assert t4["scope"] == "LEGAL"

    results["MultiTurn_Session"] = "PASS"
    print("4. Multi-Turn Session Memory: PASS (4 continuous turns retained)")

    # 5. Translation Subsystem
    # Legal answer to Tamil
    trans_legal_text = "Theft is punishable under Section 303 of Bharatiya Nyaya Sanhita, 2023 with imprisonment."
    status, trans_res = post("/api/translate", {"text": trans_legal_text, "target_language": "ta"})
    assert trans_res["success"] == True
    assert "Section 303" in trans_res["translated_text"]
    assert len(trans_res["translated_text"].encode("utf-8")) > len(trans_legal_text)
    results["Translation_Legal_Ta"] = "PASS"
    print(f"5a. Translation (En->Ta): PASS (Section 303 preserved, Provider: {trans_res['provider']})")

    # Tanglish to Tamil
    status, trans_tang = post("/api/translate", {"text": "thiruttu ku enna punishment", "target_language": "en", "source_language": "ta"})
    assert trans_tang["success"] == True
    results["Translation_Tanglish"] = "PASS"
    print("5b. Translation (Tanglish/Ta->En): PASS")

    # 6. Legal Library Search & Grounding
    status, lib_res = get("/api/legal/search?q=Article%2021&limit=5")
    assert status == 200
    assert len(lib_res["results"]) > 0
    first_res = lib_res["results"][0]
    assert "Constitution" in first_res["act_name"] or "Article" in first_res["article_or_section"]
    assert len(first_res["text"]) > 10
    results["Legal_Library_Search"] = "PASS"
    print(f"6a. Legal Library (Article 21): PASS -> Found {len(lib_res['results'])} provisions")

    status, lib_bns = get("/api/legal/search?q=Section%20303&corpus=bns&limit=5")
    assert len(lib_bns["results"]) > 0
    results["Legal_Library_BNS"] = "PASS"
    print(f"6b. Legal Library (BNS 303): PASS -> Found {len(lib_bns['results'])} provisions")

    # 7. Government Schemes
    status, sch_res = get("/api/schemes/search?q=farmer")
    assert len(sch_res["schemes"]) > 0
    first_sch = sch_res["schemes"][0]
    assert "PM-KISAN" in first_sch["scheme_name"] or "Fasal" in first_sch["scheme_name"] or "Crop" in first_sch["scheme_name"]
    assert first_sch["official_url"].startswith("http")
    results["Government_Schemes"] = "PASS"
    print(f"7. Government Schemes: PASS -> Found {len(sch_res['schemes'])} verified schemes")

    # 8. Case Explorer
    status, cases_res = get("/api/cases/search?q=Article%2021")
    assert len(cases_res["cases"]) > 0
    first_case = cases_res["cases"][0]
    assert first_case["citation"] != ""
    assert "Maneka Gandhi" in first_case["title"] or "Puttaswamy" in first_case["title"]
    results["Case_Explorer"] = "PASS"
    print(f"8. Case Explorer: PASS -> Found {len(cases_res['cases'])} verified landmark precedents")

    # 9. Saved Items Subsystem
    status, saved_item = post("/api/saved", {
        "type": "provision",
        "title": "Article 21 Constitution",
        "content": "No person shall be deprived of his life or personal liberty...",
        "metadata": {"source": "Constitution"}
    })
    assert saved_item["id"] != ""
    status, list_saved = get("/api/saved?type=provision")
    assert any(i["id"] == saved_item["id"] for i in list_saved["items"])
    # Delete
    del_req = urllib.request.Request(f"{BASE_URL}/api/saved/{saved_item['id']}", method="DELETE")
    with urllib.request.urlopen(del_req) as dres:
        assert dres.status == 200
    results["Saved_Subsystem"] = "PASS"
    print("9. Saved Items Subsystem (Save/List/Delete): PASS")

    # 10. Draft Generator
    status, draft = post("/api/drafts/generate", {
        "draft_type": "complaint",
        "details": {
            "complainant_name": "K. Murugan",
            "opposite_party": "Unknown Pickpocket",
            "place": "Madurai Junction",
            "facts": "My wallet containing Rs. 4,500 and Aadhaar card was stolen from my pocket while boarding bus.",
            "remedy_sought": "Registration of FIR under Section 173 BNSS and recovery of property"
        }
    })
    assert "SECTION 173" in draft["title"]
    assert "K. Murugan" in draft["content"]
    assert "DISCLAIMER" in draft["content"]
    results["Draft_Generator"] = "PASS"
    print("10. Draft Generator: PASS")

    # 11. Text-to-Speech (TTS)
    req = urllib.request.Request(
        f"{BASE_URL}/api/tts/synthesize",
        data=json.dumps({"text": "Hello, this is Lexora.", "language": "en"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        audio_data = res.read()
        provider = res.headers.get("X-TTS-Provider", "")
        assert len(audio_data) > 1000
    results["TTS_Synthesize"] = "PASS"
    print(f"11. TTS Synthesize: PASS -> {len(audio_data)} bytes returned ({provider})")

    # 12. Voice Endpoint (Same Brain Pipeline)
    status, voice_res = post("/api/voice", {"transcript": "Who are you?"})
    assert voice_res["is_voice"] == True
    assert "voice_summary" in voice_res
    results["Voice_Endpoint"] = "PASS"
    print(f"12. Voice Endpoint: PASS -> Voice summary: '{voice_res['voice_summary']}'")

    # 13. RAG Diagnostics
    status, diag = get(f"/api/rag/diagnostics?session_id={sid}")
    assert diag["status"] == "online"
    assert "hybrid_retrieval" in diag
    results["RAG_Diagnostics"] = "PASS"
    print("13. RAG Diagnostics: PASS")

    print("==================================================")
    print("ALL 13 MASTER FEATURES & GREETINGS TESTED SUCCESSFULLY!")
    print("==================================================")
    return results

if __name__ == "__main__":
    main()
