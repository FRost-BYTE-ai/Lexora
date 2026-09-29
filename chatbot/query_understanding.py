"""
Lexora Legal Query Understanding & Intent Classification Layer
==============================================================
Pipeline:
User Query
-> Language detection (English / Tamil / Tanglish)
-> Scope classification (LEGAL / NON_LEGAL / CASUAL / AMBIGUOUS / MIXED)
-> Intent classification (LEGAL_STATUTE, LEGAL_CONSTITUTION, LEGAL_CASE,
                         LEGAL_PROCEDURE, LEGAL_SCHEME, LEGAL_DOCUMENT,
                         LEGAL_GENERAL, NONLEGAL, GREETING)
-> Legal Domain & Query Type classification
-> Deep Entity Extraction (Case name, citations, articles, sections, court, concepts)
-> User-Provided Context Isolation (separating user quotes/claims from authoritative RAG query)
-> Task/Requested Action extraction
-> Multi-Corpus Routing (supreme_court_judgments, constitution, bns, bnss, bsa, tamilnadu)
-> Structured Legal Query Plan Assembly
"""

import re
import unicodedata

# ─────────────────────────────────────────────────────────────────────────────
# Legal Concept Expansion Table
# ─────────────────────────────────────────────────────────────────────────────
LEGAL_CONCEPT_MAP = {
    # Property Offenses (BNS Chapter XVII)
    "pickpocket": ["theft", "dishonestly takes movable property", "stealing from person", "theft section 303"],
    "pickpocketing": ["theft", "dishonestly takes movable property", "stealing from person", "theft section 303"],
    "stole": ["theft", "dishonestly takes movable property", "theft section 303"],
    "stolen": ["theft", "stolen property", "dishonestly receives stolen property", "section 303"],
    "stealing": ["theft", "dishonestly takes movable property", "theft section 303"],
    "thief": ["theft", "offence of theft", "punishment for theft", "section 303"],
    "theft": ["theft", "dishonestly takes movable property out of possession", "punishment for theft section 303", "snatching"],
    "phone": ["movable property", "theft", "dishonestly takes movable property", "snatching"],
    "wallet": ["movable property", "theft", "dishonestly takes movable property"],
    "pocket": ["theft", "dishonestly takes movable property", "from the person"],
    "shoplifting": ["theft", "dishonestly takes movable property", "section 303"],
    "snatching": ["snatching", "theft", "uses criminal force to commit theft", "section 304"],
    "chain snatching": ["snatching", "theft", "criminal force", "section 304"],
    "robbery": ["robbery", "theft with hurt or wrongful restraint", "extortion", "section 309"],
    "mugging": ["robbery", "hurt", "theft", "criminal force", "section 309"],
    "dacoity": ["dacoity", "conjointly commit robbery", "five or more persons"],
    "extortion": ["extortion", "intentionally puts in fear of injury", "dishonestly induces delivery of property", "section 308"],
    "blackmail": ["extortion", "criminal intimidation", "fear of injury", "section 308"],
    "burglary": ["house-trespass", "house-breaking", "lurking house-trespass", "theft"],
    "house breaking": ["house-breaking", "house-trespass", "criminal trespass"],
    "trespass": ["criminal trespass", "house-trespass", "unlawfully enters property"],
    "vandalism": ["mischief", "causes destruction of property", "diminishes value or utility"],
    "mischief": ["mischief", "damaging property", "loss or damage to public or private property"],
    
    # Financial, Cyber & Fraud Offenses
    "cheating": ["cheating", "fraudulently or dishonestly induces delivery of property", "section 318"],
    "fraud": ["cheating", "dishonest misappropriation", "forgery", "section 318"],
    "scam": ["cheating", "dishonest inducement", "fraud", "section 318"],
    "forgery": ["forgery", "making a false document", "electronic record forgery", "section 336"],
    "fake document": ["forgery", "making false document", "using forged document as genuine"],
    "counterfeit": ["counterfeit", "causes one thing to resemble another", "counterfeiting currency notes"],
    "bribery": ["gratification other than legal remuneration", "public servant", "corruption"],
    "corruption": ["public servant", "criminal misconduct", "gratification"],
    "breach of trust": ["criminal breach of trust", "entrusted with property", "dishonest misappropriation", "section 316"],
    
    # Bodily Offenses (BNS Chapter VI)
    "murder": ["murder", "culpable homicide", "intentionally causing death", "section 103", "section 101"],
    "killing": ["murder", "culpable homicide", "causing death"],
    "death": ["culpable homicide", "murder", "causing death by negligence"],
    "accident": ["rash or negligent act", "causing death by negligence", "section 106"],
    "hit and run": ["rash and negligent driving", "escape without reporting", "section 106"],
    "hurt": ["voluntarily causing hurt", "bodily pain disease or infirmity", "section 115"],
    "grievous hurt": ["grievous hurt", "permanent privation of sight or hearing", "fracture", "section 116", "section 117"],
    "beating": ["voluntarily causing hurt", "criminal force", "assault", "section 115"],
    "hitting": ["hurt", "criminal force", "assault"],
    "stabbing": ["grievous hurt", "voluntarily causing hurt by dangerous weapons", "attempt to murder", "section 118", "section 109"],
    "acid": ["voluntarily causing grievous hurt by use of acid", "section 124"],
    "assault": ["assault", "criminal force", "gesture or preparation causing apprehension of force", "section 131", "section 132"],
    "intimidation": ["criminal intimidation", "threatens another with injury to person reputation or property", "section 351"],
    "threatening": ["criminal intimidation", "threatens with injury", "section 351"],
    "threatened": ["criminal intimidation", "threatens with injury", "section 351"],
    "threat": ["criminal intimidation", "threat to cause death or grievous hurt", "section 351"],
    "stalking": ["stalking", "monitors use of internet or electronic communication", "follows woman", "section 78"],
    "harassment": ["criminal intimidation", "outraging modesty", "stalking", "insulting modesty of woman"],
    "outraging modesty": ["assault or criminal force to woman with intent to outrage her modesty", "section 74"],
    "rape": ["rape", "sexual assault", "punishment for rape", "section 64"],
    "kidnapping": ["kidnapping", "abduction", "conveying beyond lawful guardianship", "section 137"],
    "abduction": ["abduction", "by force compels or induces any person to go from any place", "section 138"],
    "defamation": ["defamation", "imputation intending to harm reputation", "section 356"],

    # Procedural Criminal Law (BNSS)
    "fir": ["information in cognizable cases", "first information report", "registration of FIR", "section 173"],
    "complaint": ["complaint to magistrate", "information to police officer", "cognizable offence", "section 173", "section 223"],
    "police": ["police officer", "powers of arrest", "investigation by police", "section 35", "section 173"],
    "arrest": ["arrest of persons", "arrest without warrant", "procedure of arrest", "rights of arrested person", "section 35", "section 36"],
    "bail": ["bail and bonds", "bail in bailable offences", "bail in non-bailable offences", "anticipatory bail", "section 478", "section 482"],
    "anticipatory bail": ["direction for grant of bail to person apprehending arrest", "anticipatory bail", "section 482"],
    "search": ["search by police officer", "search warrant", "power to inspect and seize", "section 94", "section 105"],
    "seizure": ["seizure of property", "police officer power to seize", "search and seizure audio-video recording", "section 105"],
    "charge sheet": ["police report on completion of investigation", "final report", "section 193"],
    "investigation": ["procedure for investigation", "examination of witnesses by police", "section 175", "section 180"],
    "zero fir": ["information of cognizable offence irrespective of jurisdiction", "zero FIR", "section 173"],

    # Law of Evidence (BSA)
    "evidence": ["admissibility of evidence", "relevancy of facts", "proof of facts", "electronic evidence", "section 61"],
    "electronic evidence": ["admissibility of electronic records", "certificate for electronic record", "digital record", "section 61", "section 63"],
    "whatsapp": ["electronic record", "admissibility of digital communication", "certificate under section 63"],
    "cctv": ["electronic record", "video recording", "secondary evidence", "section 63"],
    "confession": ["confession to police officer not to be proved", "confession while in custody", "section 23", "section 24"],
    "dying declaration": ["statement by person who is dead or cannot be found", "cause of death", "section 26"],
    "burden of proof": ["burden of proving fact", "burden of proof as to particular fact", "section 104", "section 105"],

    # Constitutional Law & Precedent Concepts
    "article 14": ["equality before law", "equal protection of the laws", "non-discrimination", "Article 14", "non-arbitrariness"],
    "equality": ["equality before law", "prohibition of discrimination", "equality of opportunity", "Article 14", "Article 15", "Article 16"],
    "article 19": ["protection of certain rights regarding freedom of speech", "freedom of speech and expression", "Article 19(1)(a)", "reasonableness"],
    "freedom of speech": ["freedom of speech and expression", "reasonable restrictions", "Article 19(1)(a)", "Article 19(2)"],
    "article 21": ["protection of life and personal liberty", "procedure established by law", "right to privacy", "Article 21", "personal liberty"],
    "personal liberty": ["protection of life and personal liberty", "procedure established by law", "Article 21", "due process"],
    "reasonableness": ["tests of reasonableness", "reasonable restriction", "Article 19", "non-arbitrariness"],
    "non-arbitrariness": ["equal protection of laws", "Article 14", "non-arbitrariness", "natural justice"],
    "golden triangle": ["golden triangle of fundamental rights", "Article 14 Article 19 Article 21", "Maneka Gandhi"],
    "fundamental rights": ["Fundamental Rights Part III", "Article 12", "Article 14", "Article 19", "Article 21", "Article 32"],

    # Tamil Nadu Specific & Cooperative Law
    "cooperative": ["co-operative society", "Tamil Nadu Co-operative Societies Act 1983", "Registrar dispute section 90", "board management section 33"],
    "cooperative society": ["Tamil Nadu Co-operative Societies Act 1983", "dispute under section 90", "appeal under section 152"],
    "tamil nadu": ["Tamil Nadu state legislation", "Tamil Nadu Acts and Rules", "jurisdiction Tamil Nadu"],

    # Government Schemes & Rights
    "scheme": ["government welfare scheme", "statutory entitlements", "eligibility criteria", "grievance redressal mechanism"],
    "ration": ["Public Distribution System", "food security entitlement", "ration card eligibility", "grievance officer"],
    "pension": ["welfare pension scheme", "old age pension eligibility", "statutory rules"]
}

TANGLISH_VOCAB = {
    "thiruttu": "theft stolen property",
    "thiruditaanga": "theft stolen phone movable property",
    "thiruditaan": "theft stolen property",
    "thirudittanga": "theft stolen property",
    "kole": "murder killing",
    "kolai": "murder killing",
    "adichitaan": "voluntarily causing hurt assault beating",
    "adichitaanga": "voluntarily causing hurt assault beating",
    "threaten": "criminal intimidation threat",
    "payamuruthuranga": "criminal intimidation threatening",
    "payamuruthan": "criminal intimidation threatening",
    "police complaint": "filing FIR criminal complaint police station",
    "epdi kudukradhu": "how to file procedure",
    "kudukradhu": "how to file register",
    "panradhu": "procedure to do",
    "enna punishment": "what is the punishment",
    "enna section": "which legal section",
    "na enna": "what is the meaning and explanation",
    "sothu": "property immovable property",
    "thagararu": "dispute trespass",
    "veedu": "house property house-trespass",
    "panam": "money debt cheating",
    "kaasu": "money cheating fraud"
}

KNOWN_LANDMARK_CASES = [
    "maneka gandhi", "puttaswamy", "kesavananda bharati", "lalita kumari",
    "arnesh kumar", "arjun panditrao", "chinnasamy", "vishaka", "shreya singhal",
    "navtej singh johar", "indra sawhney", "s.r. bommai", "sr bommai", "ak gopalan",
    "minerva mills", "bachan singh"
]

def detect_language(query: str) -> str:
    """Detect if query is Tamil script, Tanglish (Romanized Tamil), or English."""
    tamil_chars = sum(1 for c in query if '\u0b80' <= c <= '\u0bff')
    if tamil_chars > 2:
        return "ta"
        
    lower = query.lower()
    tanglish_markers = [
        "thiruttu", "thirudi", "enna", "irundhu", "panradhu", "kudukradhu", 
        "solranga", "pannraru", "pannanga", "epdi", "iruku", "illai", "kole", 
        "kolai", "kaasu", "panam", "veedu", "sothu", "adichan", "adichitaanga",
        "payamuruthuranga", "en neighbour", "enna threaten"
    ]
    if any(marker in lower for marker in tanglish_markers):
        return "tanglish"
        
    return "en"

def normalize_query(query: str, lang: str) -> str:
    """Normalize query text, preserving legal terms and expanding Tanglish."""
    text = unicodedata.normalize('NFKD', query)
    lower = text.lower()
    
    if lang == "tanglish":
        tokens = lower.split()
        normalized_tokens = []
        for token in tokens:
            cleaned = re.sub(r'[^\w]', '', token)
            if cleaned in TANGLISH_VOCAB:
                normalized_tokens.append(TANGLISH_VOCAB[cleaned])
            else:
                normalized_tokens.append(token)
        return " ".join(normalized_tokens)
        
    return query

def classify_scope(query: str, normalized: str) -> str:
    """Classify user query into scope: CASUAL, LEGAL, NON_LEGAL, AMBIGUOUS, MIXED."""
    lower = query.lower().strip()
    cleaned_chars = re.sub(r'[^\w\s]', '', lower).strip()
    
    # Casual greetings
    casual_greetings = [
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening", "vanakkam", "namaste",
        "who are you", "who r u", "what is your name", "who made you", "what can you do", "help me understand what you can do",
        "tell me about yourself", "how can you help me", "what are your features"
    ]
    if cleaned_chars in casual_greetings or any(cleaned_chars.startswith(c) and len(cleaned_chars.split()) <= 4 for c in ["hi ", "hello ", "hey ", "good morning", "good afternoon", "good evening", "vanakkam"]):
        return "CASUAL"
        
    if "who are you" in cleaned_chars or "what can you do" in cleaned_chars or "who r u" in cleaned_chars:
        return "CASUAL"

    non_legal_triggers = [
        "recipe", "biryani", "chicken recipe", "how to cook", "cake recipe", "weather today",
        "tell me a joke", "write a python", "write python", "python program", "python code", 
        "write a poem", "football match", "cricket match", "cricket score", "capital of france", 
        "who won the cricket", "who won the match", "make me coffee", "movie review", "sing a song"
    ]
    
    has_non_legal = any(nl in lower for nl in non_legal_triggers)
    
    legal_triggers = [
        "punishment", "jail", "imprisonment", "fine", "section", "article", "holding", "precedent", "ruling", "ruling in",
        "bns", "bnss", "bsa", "ipc", "crpc", "theft", "stole", "stolen", "pickpocket", "case", "judgment",
        "robbery", "murder", "threat", "intimidation", "offence", "crime", "illegal", "maneka gandhi", "puttaswamy",
        "police", "fir", "complaint", "arrest", "bail", "court", "evidence", "witness", "kesavananda",
        "constitution", "fundamental right", "equality", "liberty", "freedom of speech", "ratio",
        "writ", "cheating", "fraud", "trespass", "assault", "hurt", "cooperative", "landmark",
        "tamil nadu", "scheme", "eligibility", "grievance", "entitlement", "ration card",
        "pension", "dispute", "tenant", "landlord", "modesty", "rape", "kidnapping",
        "cyber", "scam", "contract", "defamation", "property", "neighbour", "neighbor", "phone",
        "scc", "air", "ctc", "mlj", "scale", "scr"
    ]
    has_legal = any(lt in lower or lt in normalized.lower() for lt in legal_triggers)
    
    if has_non_legal and not has_legal:
        return "NON_LEGAL"
        
    if has_non_legal and has_legal:
        return "MIXED"
        
    if not has_legal:
        if lower.startswith("can you help") or lower.startswith("what should i do"):
            return "AMBIGUOUS"
        return "NON_LEGAL"
            
    return "LEGAL"

def extract_case_details(query: str):
    """
    Extracts case title, citations, court, and user-provided quote/holding.
    """
    case_name = None
    citations = []
    court = None
    user_provided_context = None

    # 1. Regex case title extraction e.g. "Maneka Gandhi v. Union of India" or "XYZ v ABC 2099"
    v_pattern = r"\b((?:[A-Z0-9][A-Za-z0-9\.\']*\s+){1,3}v\.?\s+(?:[A-Z0-9][A-Za-z0-9\.\']*\s*){1,3}(?:\s+\d{4})?)\b"
    v_match = re.search(v_pattern, query)
    if v_match:
        case_name = v_match.group(1).strip()
    else:
        # Check known landmark case names
        q_lower = query.lower()
        for k in KNOWN_LANDMARK_CASES:
            if k in q_lower:
                if "maneka" in k:
                    case_name = "Maneka Gandhi v. Union of India"
                elif "puttaswamy" in k:
                    case_name = "Justice K.S. Puttaswamy (Retd.) v. Union of India"
                elif "kesavananda" in k:
                    case_name = "Kesavananda Bharati v. State of Kerala"
                elif "lalita" in k:
                    case_name = "Lalita Kumari v. Government of Uttar Pradesh"
                elif "arnesh" in k:
                    case_name = "Arnesh Kumar v. State of Bihar"
                elif "arjun" in k:
                    case_name = "Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal"
                elif "chinnasamy" in k:
                    case_name = "P. Chinnasamy v. Deputy Registrar of Co-operative Societies"
                elif "vishaka" in k:
                    case_name = "Vishaka v. State of Rajasthan"
                elif "shreya" in k:
                    case_name = "Shreya Singhal v. Union of India"
                elif "navtej" in k:
                    case_name = "Navtej Singh Johar v. Union of India"
                elif "indra" in k:
                    case_name = "Indra Sawhney v. Union of India"
                elif "bommai" in k:
                    case_name = "S.R. Bommai v. Union of India"
                break

    # 2. Citation extraction
    cit_pattern = r"(?:\(?\d{4}\)?\s*\d*\s*(?:SCC|AIR|CTC|MLJ|SCR|SCALE)\s*\d+)|(?:AIR\s*\d{4}\s*SC\s*\d+)"
    cit_matches = re.findall(cit_pattern, query, re.IGNORECASE)
    for c in cit_matches:
        c_clean = c.strip()
        if c_clean not in citations:
            citations.append(c_clean)

    # 3. Court extraction
    if "supreme court" in query.lower():
        court = "Supreme Court of India"
    elif "madras high court" in query.lower():
        court = "Madras High Court"
    elif "high court" in query.lower():
        court = "High Court"

    # 4. Extract User-Provided Context (e.g. Key Holding: '...')
    quote_pattern = r"(?:key holding|holding|ruling text|quote):\s*['\"]([^'\"]+)['\"]"
    quote_match = re.search(quote_pattern, query, re.IGNORECASE)
    if quote_match:
        user_provided_context = quote_match.group(1).strip()
    else:
        # Fallback quotes
        quotes = re.findall(r"['\"]([^'\"]{15,})['\"]", query)
        if quotes:
            user_provided_context = quotes[0].strip()

    return case_name, citations, court, user_provided_context

def extract_articles_and_sections(query: str):
    """Extract all mentioned Articles and Sections from query."""
    articles = []
    sections = []

    # Articles
    art_matches = re.findall(r"(?:Article|Art\.?)\s*(\d+[A-Z]?)", query, re.IGNORECASE)
    for a in art_matches:
        formatted = f"Article {a}"
        if formatted not in articles:
            articles.append(formatted)

    # Sections
    sec_matches = re.findall(r"(?:Section|Sec\.?)\s*(\d+[A-Z]?)", query, re.IGNORECASE)
    for s in sec_matches:
        formatted = f"Section {s}"
        if formatted not in sections:
            sections.append(formatted)

    return articles, sections

def extract_requested_action(query: str) -> str:
    """Identify requested action e.g. explain significance, apply to dispute."""
    q_lower = query.lower()
    actions = []
    if "significance" in q_lower or "importance" in q_lower:
        actions.append("explain significance")
    if "apply" in q_lower or "application" in q_lower:
        actions.append("explain application to disputes")
    if "punishment" in q_lower:
        actions.append("explain punishment and liability")
    if "how to file" in q_lower or "procedure" in q_lower:
        actions.append("provide procedural steps")
    if "holding" in q_lower or "ratio" in q_lower:
        actions.append("analyze judicial holding")

    return " and ".join(actions) if actions else "provide authoritative legal analysis"

def classify_intent_and_routing(scope: str, query: str, normalized: str, case_name: str, citations: list, articles: list, sections: list):
    """
    Classify fine-grained intent and determine corpus targets.
    Intents:
    - LEGAL_CASE
    - LEGAL_STATUTE
    - LEGAL_CONSTITUTION
    - LEGAL_PROCEDURE
    - LEGAL_SCHEME
    - LEGAL_DOCUMENT
    - LEGAL_GENERAL
    - NONLEGAL
    - GREETING
    """
    if scope == "CASUAL":
        return "GREETING", "casual", "greeting", []
        
    if scope == "NON_LEGAL":
        return "NONLEGAL", "nonlegal", "nonlegal", []

    lower = f"{query.lower()} {normalized.lower()}"
    
    # 1. Case Precedent Inquiries
    if case_name or citations or any(k in lower for k in ["judgment", "precedent", "court ruling", "holding", "ratio", "landmark ruling", "supreme court decision"]):
        intent = "LEGAL_CASE"
        domain = "constitutional_law" if (articles or "article" in lower) else "judicial_precedents"
        query_type = "judicial_precedent"
        
        target_corpora = ["supreme_court_judgments"]
        # Combined retrieval: add constitution if Articles or constitutional terms are referenced
        if articles or any(a in lower for a in ["article", "constitution", "basic structure", "fundamental right", "part iii"]):
            target_corpora.append("constitution")
        if sections or any(s in lower for s in ["bns", "bnss", "bsa", "ipc", "crpc"]):
            if "bnss" in lower or "fir" in lower:
                target_corpora.append("bnss")
            elif "bsa" in lower or "evidence" in lower:
                target_corpora.append("bsa")
            else:
                target_corpora.append("bns")
        return intent, domain, query_type, target_corpora

    # 2. Government Schemes
    if any(k in lower for k in ["scheme", "ration", "pension", "welfare entitlement", "subsidy", "pm kisan", "magalir urimai", "pudhumai penn"]):
        return "LEGAL_SCHEME", "welfare_schemes", "government_scheme", ["constitution", "tamilnadu"]

    # 3. Constitutional Inquiries
    if articles or any(k in lower for k in ["constitution", "fundamental right", "equality before law", "part iii", "writ petition"]):
        return "LEGAL_CONSTITUTION", "constitutional_law", "constitutional_provision", ["constitution"]

    # 4. Criminal Procedural Inquiries (BNSS)
    if any(k in lower for k in ["bnss", "fir", "police complaint", "arrest", "bail", "anticipatory bail", "investigation", "zero fir", "charge sheet", "remand", "search warrant"]):
        return "LEGAL_PROCEDURE", "procedural_law", "procedural_rule", ["bnss"]

    # 5. Law of Evidence (BSA)
    if any(k in lower for k in ["bsa", "electronic evidence", "admissible", "court evidence", "whatsapp", "cctv", "confession", "burden of proof", "dying declaration"]):
        return "LEGAL_STATUTE", "evidence_law", "statutory_provision", ["bsa"]

    # 6. Tamil Nadu State Legislation
    if any(k in lower for k in ["tamil nadu", "cooperative", "co-operative", "tn act", "panchayat"]):
        return "LEGAL_STATUTE", "state_law", "statutory_provision", ["tamilnadu"]

    # 7. Document Analysis & Drafts
    if any(k in lower for k in ["draft", "legal notice", "representation", "grievance petition"]):
        return "LEGAL_DOCUMENT", "legal_documentation", "document_inquiry", ["bnss", "bns", "tamilnadu"]

    # 8. Statutory Penal Offenses (BNS)
    if sections or any(k in lower for k in ["bns", "section 303", "theft", "punishment", "offence", "pickpocket", "stole", "stolen", "robbery", "murder", "assault", "hurt", "intimidation", "threat", "cheating", "fraud"]):
        return "LEGAL_STATUTE", "criminal_law", "statutory_provision", ["bns"]

    # 9. General Legal Fallback
    return "LEGAL_GENERAL", "general_legal", "general_consultation", ["supreme_court_judgments", "constitution", "bns", "bnss", "bsa"]

def understand_query(user_query: str, session_turns=None, explicit_lang: str = None, explicit_jurisdiction: str = None) -> dict:
    """
    Complete Legal Query Understanding & Structured Plan Pipeline.
    """
    # 1. Language Detection
    lang = explicit_lang if explicit_lang and explicit_lang in ["ta", "tanglish", "en", "hi"] else detect_language(user_query)
    
    # 2. Query Normalization
    norm_query = normalize_query(user_query, lang)
    
    # 4. Entity Extraction
    case_name, citations, court, user_provided_context = extract_case_details(user_query)
    articles, sections = extract_articles_and_sections(user_query)
    requested_action = extract_requested_action(user_query)

    # 3. Scope Classification
    scope = classify_scope(user_query, norm_query)
    if (case_name or citations or articles or sections) and scope != "CASUAL":
        scope = "LEGAL"
    
    # 5. Intent, Domain & Corpus Routing
    intent, domain, query_type, target_corpora = classify_intent_and_routing(
        scope, user_query, norm_query, case_name, citations, articles, sections
    )
    
    # 6. Jurisdiction Detection
    if explicit_jurisdiction and explicit_jurisdiction in ["Tamil Nadu", "TN", "tamilnadu"]:
        jurisdiction = "Tamil Nadu"
        if "tamilnadu" not in target_corpora and scope == "LEGAL":
            target_corpora.append("tamilnadu")
    elif "tamilnadu" in target_corpora or "tamil nadu" in user_query.lower():
        jurisdiction = "Tamil Nadu"
    else:
        jurisdiction = "Central / India"

    # 7. Concept Expansion
    expanded_concepts = []
    matched_keys = []
    combined_text = f"{user_query.lower()} {norm_query.lower()}"
    for colloquial, concepts in LEGAL_CONCEPT_MAP.items():
        pattern = r"\b" + re.escape(colloquial) + r"\b"
        if re.search(pattern, combined_text):
            matched_keys.append(colloquial)
            for c in concepts:
                if c not in expanded_concepts:
                    expanded_concepts.append(c)

    # 8. Filter Construction
    filters = {}
    if articles:
        # Primary article for metadata filters
        art_num = re.search(r"\d+[A-Z]?", articles[0])
        if art_num:
            filters["article_number"] = art_num.group(0)
        filters["articles"] = [re.search(r"\d+[A-Z]?", a).group(0) for a in articles if re.search(r"\d+[A-Z]?", a)]
    if sections:
        sec_num = re.search(r"\d+[A-Z]?", sections[0])
        if sec_num:
            filters["section_number"] = sec_num.group(0)
        filters["sections"] = [re.search(r"\d+[A-Z]?", s).group(0) for s in sections if re.search(r"\d+[A-Z]?", s)]

    # 9. Contextual Rewriting (Multi-turn pronouns & elliptical references)
    rewritten_query = norm_query
    if session_turns and len(session_turns) > 0:
        pronouns = ["he", "she", "they", "him", "her", "that", "this", "it", "his", "their",
                    "avan", "ava", "avanga", "adhukku", "athukku", "athula", "indha", "andha", "judgment", "case", "principle", "today", "now", "ippo", "apply", "importance", "important"]
        needs_context = (
            any(re.search(r"\b" + p + r"\b", user_query.lower()) for p in pronouns) or
            len(user_query.split()) < 6 or
            scope in ["NON_LEGAL", "AMBIGUOUS"]
        )
        if needs_context:
            last_user_turn = None
            for t in reversed(session_turns):
                if t["role"] == "user" and "query_plan" in t.get("metadata", {}):
                    last_user_turn = t
                    break
            if last_user_turn:
                prev_plan = last_user_turn["metadata"]["query_plan"]
                if prev_plan.get("legal_scope") == "LEGAL":
                    scope = "LEGAL"
                    prev_raw = prev_plan.get("raw_query", "")
                    prev_case = prev_plan.get("case_name", "")
                    prefix = prev_case if prev_case else prev_raw
                    rewritten_query = f"{prefix} | {user_query}" if prefix else norm_query

                    # Only inherit intent and target corpora if current query has NO explicit new entities
                    if not articles and not sections and not case_name and not citations:
                        intent = prev_plan.get("intent", intent)
                        domain = prev_plan.get("domain", domain)
                        query_type = prev_plan.get("query_type", query_type)
                        target_corpora = prev_plan.get("corpus_targets", target_corpora)
                        if not case_name:
                            case_name = prev_plan.get("case_name")
                        if prev_plan.get("citation"):
                            for c in prev_plan["citation"]:
                                if c not in citations:
                                    citations.append(c)
                    else:
                        # Current query has explicit entities (e.g. Article 21)
                        # Carry forward case_name if query references 'this' / 'that' / 'it' / 'case' / 'judgment' / 'involved'
                        if not case_name and any(p in user_query.lower() for p in ["this", "that", "it", "case", "judgment", "involved"]):
                            case_name = prev_plan.get("case_name")
                            if case_name and "supreme_court_judgments" not in target_corpora:
                                target_corpora.insert(0, "supreme_court_judgments")

    # 10. Retrieval Query Assembly (Construct targeted RAG search string)
    retrieval_parts = []
    if case_name:
        retrieval_parts.append(case_name)
    if citations:
        retrieval_parts.extend(citations)
    if articles:
        retrieval_parts.extend(articles)
    if sections:
        retrieval_parts.extend(sections)
    if expanded_concepts:
        retrieval_parts.extend(expanded_concepts[:6])
    
    # If entity parts extracted, append core non-quoted query terms
    clean_q = user_query
    if user_provided_context:
        clean_q = clean_q.replace(user_provided_context, "")
    clean_terms = [w for w in re.sub(r'[^\w\s]', '', clean_q).split() if len(w) > 3 and w.lower() not in ["what", "which", "how", "does", "this", "that", "holding", "ruling", "landmark"]]
    retrieval_parts.extend(clean_terms[:6])

    retrieval_query = " ".join(retrieval_parts).strip()
    if not retrieval_query:
        retrieval_query = rewritten_query

    return {
        "raw_query": user_query,
        "normalized_query": norm_query,
        "language": lang,
        "intent": intent,
        "domain": domain,
        "query_type": query_type,
        "jurisdiction": jurisdiction,
        "court": court,
        "case_name": case_name,
        "citation": citations,
        "articles": articles,
        "sections": sections,
        "legal_concepts": expanded_concepts,
        "user_provided_context": user_provided_context,
        "requested_action": requested_action,
        "corpus_targets": target_corpora,

        # Backward compatibility
        "original_query": user_query,
        "legal_scope": scope,
        "expanded_legal_concepts": expanded_concepts,
        "matched_colloquial_keys": matched_keys,
        "filters": filters,
        "rewritten_query": rewritten_query,
        "retrieval_query": retrieval_query,
        "selected_corpora": target_corpora
    }
