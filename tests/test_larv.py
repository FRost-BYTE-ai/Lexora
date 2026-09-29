"""
Lexora LARV Comprehensive Unit and Regression Test Suite
========================================================
Covers the 22 required test cases across:
1. Article 21
2. Article 14
3. Article 19(1)(a)
4. BNS Section 303
5. Pickpocketing
6. Stolen phone from pocket
7. Punishment for theft
8. BNSS FIR
9. BSA electronic evidence
10. Tamil Nadu cooperative dispute
11. Tamil Nadu scheme
12. Farmer scheme
13. Women scheme
14. Student scheme
15. Irrelevant scheme candidate
16. Nonexistent Article 999
17. Nonexistent BNS Section 999
18. Conflicting/outdated source
19. Tanglish legal query
20. Tanglish scheme query
21. Follow-up legal query
22. Follow-up scheme query

Runs both unit verification on LARV directly and end-to-end through the running Lexora server.
"""

import os
import sys
import json
import time
import requests
import unittest

# Fix UTF-8 encoding
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass

from chatbot.larv import LARV, larv_engine
from chatbot.query_understanding import understand_query
from chatbot.schemes_provider import schemes_provider
from chatbot.case_provider import case_provider

BASE_URL = "http://127.0.0.1:8000"


class TestLARVEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.larv = LARV()
        cls.session_id = None
        # Verify server is up
        try:
            r = requests.get(f"{BASE_URL}/api/health", timeout=5)
            cls.server_online = (r.status_code == 200)
            if cls.server_online:
                s_res = requests.post(f"{BASE_URL}/api/sessions/new?title=LARV_Regression_Suite")
                cls.session_id = s_res.json()["session_id"]
        except Exception:
            cls.server_online = False

    def test_01_article_21(self):
        plan = understand_query("What is Article 21 of the Constitution?")
        candidate = {
            "id": "const_art_21",
            "article_number": "21",
            "document_title": "Constitution of India",
            "heading": "Protection of life and personal liberty",
            "text": "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
            "source_authority": "Constitution of India Official"
        }
        res = self.larv.score_candidate(plan, candidate, domain="legal")
        self.assertGreater(res["larv_score"], 0.70)
        self.assertGreater(res["components"]["structural"], 0.80)
        self.assertIn("Exact Article 21 match", res["rank_reason"])

    def test_02_article_14(self):
        plan = understand_query("Explain Article 14 equality before law")
        candidate = {
            "id": "const_art_14",
            "article_number": "14",
            "document_title": "Constitution of India",
            "heading": "Equality before law",
            "text": "The State shall not deny to any person equality before the law or the equal protection of the laws.",
            "source_authority": "Constitution of India Official"
        }
        res = self.larv.score_candidate(plan, candidate, domain="legal")
        self.assertGreater(res["larv_score"], 0.70)
        self.assertGreater(res["components"]["structural"], 0.80)

    def test_03_article_19_1_a(self):
        plan = understand_query("Article 19(1)(a) freedom of speech")
        candidate = {
            "id": "const_art_19_1_a",
            "article_number": "19",
            "clause": "1",
            "subclause": "a",
            "document_title": "Constitution of India",
            "heading": "Protection of certain rights regarding freedom of speech, etc.",
            "text": "All citizens shall have the right to freedom of speech and expression.",
            "source_authority": "Constitution of India Official"
        }
        res = self.larv.score_candidate(plan, candidate, domain="legal")
        self.assertGreater(res["larv_score"], 0.75)
        self.assertGreater(res["components"]["structural"], 0.90)

    def test_04_bns_section_303(self):
        plan = understand_query("BNS Section 303")
        candidate = {
            "id": "bns_303",
            "section_number": "303",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "section_heading": "Theft",
            "text": "Whoever, intending to take dishonestly any movable property out of the possession of any person...",
            "source_authority": "Official Indian Legal Source"
        }
        res = self.larv.score_candidate(plan, candidate, domain="legal")
        self.assertGreater(res["larv_score"], 0.75)
        self.assertGreater(res["components"]["structural"], 0.90)

    def test_05_pickpocketing(self):
        plan = understand_query("what is the punishment for pickpocketing?")
        theft_cand = {
            "id": "bns_theft",
            "section_number": "303",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "section_heading": "Theft",
            "text": "Whoever commits theft shall be punished with imprisonment for a term which may extend to three years, or with fine...",
            "source_authority": "Official Indian Legal Source"
        }
        unrelated_cand = {
            "id": "bns_adultery",
            "section_number": "84",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "section_heading": "Act of a person of unsound mind",
            "text": "Nothing is an offence which is done by a person who is of unsound mind...",
            "source_authority": "Official Indian Legal Source"
        }
        ranked = self.larv.rank(plan, [unrelated_cand, theft_cand], domain="legal")
        self.assertEqual(ranked[0][0]["id"], "bns_theft")
        self.assertGreater(ranked[0][1]["larv_score"], ranked[1][1]["larv_score"])

    def test_06_stolen_phone_from_pocket(self):
        plan = understand_query("someone stole my phone from my pocket")
        theft_cand = {
            "id": "theft_phone",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "text": "theft dishonestly takes movable property out of possession",
            "section_number": "303"
        }
        res = self.larv.score_candidate(plan, theft_cand, domain="legal")
        self.assertGreater(res["components"]["keyword"], 0.30)


    def test_07_punishment_for_theft(self):
        plan = understand_query("what is the punishment for theft?")
        punishment_cand = {
            "id": "theft_p",
            "section_number": "303",
            "text": "Whoever commits theft shall be punished with imprisonment for a term which may extend to three years...",
            "document_title": "Bharatiya Nyaya Sanhita, 2023"
        }
        res = self.larv.score_candidate(plan, punishment_cand, domain="legal")
        self.assertGreater(res["components"]["intent"], 0.80)

    def test_08_bnss_fir(self):
        plan = understand_query("How to file FIR under BNSS?")
        cand = {
            "id": "bnss_173",
            "section_number": "173",
            "document_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
            "text": "Information in cognizable cases first information report registration of FIR",
            "source_authority": "Official Indian Legal Source"
        }
        res = self.larv.score_candidate(plan, cand, domain="legal")
        self.assertGreater(res["larv_score"], 0.60)

    def test_09_bsa_electronic_evidence(self):
        plan = understand_query("admissibility of electronic evidence whatsapp under BSA")
        cand = {
            "id": "bsa_63",
            "section_number": "63",
            "document_title": "Bharatiya Sakshya Adhiniyam, 2023",
            "text": "Admissibility of electronic records certificate condition precedent",
            "source_authority": "Official Indian Legal Source"
        }
        res = self.larv.score_candidate(plan, cand, domain="legal")
        self.assertGreater(res["larv_score"], 0.60)

    def test_10_tamil_nadu_cooperative_dispute(self):
        plan = understand_query("Tamil Nadu cooperative society dispute resolution")
        tn_cand = {
            "id": "tn_coop_90",
            "section_number": "90",
            "document_title": "Tamil Nadu Co-operative Societies Act, 1983",
            "jurisdiction": "Tamil Nadu",
            "text": "Disputes Registrar of Cooperative Societies arbitration",
            "source_authority": "Official Government Source"
        }
        central_cand = {
            "id": "central_coop",
            "document_title": "Multi-State Co-operative Societies Act",
            "jurisdiction": "Central / India",
            "text": "Disputes in multi state societies"
        }
        ranked = self.larv.rank(plan, [central_cand, tn_cand], domain="legal", jurisdiction="Tamil Nadu")
        self.assertEqual(ranked[0][0]["id"], "tn_coop_90")
        self.assertGreater(ranked[0][1]["components"]["jurisdiction"], ranked[1][1]["components"]["jurisdiction"])

    def test_11_tamil_nadu_scheme(self):
        plan = understand_query("Tamil Nadu women monthly grant scheme")
        kmut = schemes_provider.get_scheme_by_id("scheme_kalaignar_magalir_urimai")
        pmkisan = schemes_provider.get_scheme_by_id("scheme_pm_kisan")
        ranked = self.larv.rank(plan, [pmkisan, kmut], domain="scheme", jurisdiction="Tamil Nadu")
        self.assertEqual(ranked[0][0]["id"], "scheme_kalaignar_magalir_urimai")

    def test_12_farmer_scheme(self):
        plan = understand_query("government scheme for small farmers")
        pmkisan = schemes_provider.get_scheme_by_id("scheme_pm_kisan")
        pudhumai = schemes_provider.get_scheme_by_id("scheme_tn_pudhumaipen")
        ranked = self.larv.rank(plan, [pudhumai, pmkisan], domain="scheme")
        self.assertEqual(ranked[0][0]["id"], "scheme_pm_kisan")

    def test_13_women_scheme(self):
        plan = understand_query("scheme for girl student college education in Tamil Nadu")
        pudhumai = schemes_provider.get_scheme_by_id("scheme_tn_pudhumaipen")
        pmay = schemes_provider.get_scheme_by_id("scheme_pm_awas")
        ranked = self.larv.rank(plan, [pmay, pudhumai], domain="scheme")
        self.assertEqual(ranked[0][0]["id"], "scheme_tn_pudhumaipen")

    def test_14_student_scheme(self):
        plan = understand_query("Tamil Pudhalvan boys higher education scheme")
        puthalvan = schemes_provider.get_scheme_by_id("scheme_tn_tamil_puthalvan")
        pmfby = schemes_provider.get_scheme_by_id("scheme_pmfby")
        ranked = self.larv.rank(plan, [pmfby, puthalvan], domain="scheme")
        self.assertEqual(ranked[0][0]["id"], "scheme_tn_tamil_puthalvan")

    def test_15_irrelevant_scheme_candidate(self):
        plan = understand_query("farmers crop loan interest free Tamil Nadu")
        coop_loan = schemes_provider.get_scheme_by_id("scheme_tn_coop_crop_loan")
        ayushman = schemes_provider.get_scheme_by_id("scheme_ayushman_bharat")
        ranked = self.larv.rank(plan, [ayushman, coop_loan], domain="scheme")
        self.assertEqual(ranked[0][0]["id"], "scheme_tn_coop_crop_loan")
        self.assertGreater(ranked[0][1]["larv_score"], ranked[1][1]["larv_score"] + 0.05)


    def test_16_nonexistent_article_999(self):
        if not self.server_online:
            self.skipTest("Server offline")
        res = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "Explain Constitution Article 999",
            "session_id": self.session_id
        }).json()
        self.assertFalse(res.get("evidence_sufficient", True))
        self.assertIn("does not contain sufficient material", res.get("response", ""))

    def test_17_nonexistent_bns_section_999(self):
        if not self.server_online:
            self.skipTest("Server offline")
        res = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "What is BNS Section 999?",
            "session_id": self.session_id
        }).json()
        self.assertFalse(res.get("evidence_sufficient", True))

    def test_18_conflicting_outdated_source(self):
        plan = understand_query("punishment for murder")
        current_bns = {
            "id": "bns_103",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "section_number": "103",
            "legal_status": "Active",
            "text": "Whoever commits murder shall be punished with death or imprisonment for life..."
        }
        repealed_ipc = {
            "id": "ipc_302",
            "document_title": "Indian Penal Code, 1860",
            "section_number": "302",
            "legal_status": "Repealed",
            "text": "Whoever commits murder shall be punished with death..."
        }
        res_ipc = self.larv.score_candidate(plan, repealed_ipc, domain="legal", all_candidates=[current_bns, repealed_ipc])
        self.assertTrue(res_ipc["potential_conflict"])
        self.assertGreater(res_ipc["components"]["conflict"], 0.50)

    def test_19_tanglish_legal_query(self):
        plan = understand_query("thiruttu ku enna punishment?")
        self.assertEqual(plan["language"], "tanglish")
        self.assertIn("theft", plan["expanded_legal_concepts"])
        theft_cand = {
            "id": "bns_theft",
            "document_title": "Bharatiya Nyaya Sanhita, 2023",
            "section_number": "303",
            "text": "Whoever commits theft shall be punished with imprisonment..."
        }
        res = self.larv.score_candidate(plan, theft_cand, domain="legal")
        self.assertGreater(res["larv_score"], 0.50)

    def test_20_tanglish_scheme_query(self):
        plan = understand_query("magalir 1000 scheme ku enna eligibility?")
        kmut = schemes_provider.get_scheme_by_id("scheme_kalaignar_magalir_urimai")
        res = self.larv.score_candidate(plan, kmut, domain="scheme")
        self.assertGreater(res["larv_score"], 0.50)

    def test_21_follow_up_legal_query(self):
        if not self.server_online:
            self.skipTest("Server offline")
        s_res = requests.post(f"{BASE_URL}/api/sessions/new?title=FollowUpTest")
        sess_id = s_res.json()["session_id"]
        # Turn 1
        r1 = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "Someone stole my phone from my pocket.",
            "session_id": sess_id
        }).json()
        self.assertTrue(r1.get("evidence_sufficient", True))
        
        # Turn 2: Follow-up
        r2 = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "What is the punishment for this?",
            "session_id": sess_id
        }).json()
        self.assertTrue(r2.get("evidence_sufficient", True))
        self.assertIn("303", r2.get("evidence_passed", ""))

    def test_22_follow_up_scheme_query(self):
        plan1 = understand_query("Kalaignar Magalir Urimai Thittam")
        plan2 = understand_query("adhuku enna documents?", session_turns=[
            {"role": "user", "content": "Kalaignar Magalir Urimai Thittam", "metadata": {"query_plan": plan1}}
        ])
        kmut = schemes_provider.get_scheme_by_id("scheme_kalaignar_magalir_urimai")
        res = self.larv.score_candidate(plan2, kmut, domain="scheme")
        self.assertGreater(res["larv_score"], 0.40)


if __name__ == "__main__":
    unittest.main()
