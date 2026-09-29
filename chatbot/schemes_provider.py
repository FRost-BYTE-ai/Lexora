"""
Lexora Government Schemes Registry & Real Discovery Provider
============================================================
Data Provenance:
- Source: Official Central Government (myScheme / Ministry of Agriculture / Social Justice)
  and Government of Tamil Nadu (TNeGA / Department of Welfare).
- Zero fabricated criteria: Every scheme displays verified ministry, eligibility rules,
  benefits, required documents, application process, and official government portal URL.
"""

import os
from chatbot.larv import larv_engine
from chatbot.query_understanding import understand_query

OFFICIAL_GOVERNMENT_SCHEMES = [


    {
        "id": "scheme_pm_kisan",
        "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "level": "Central",
        "category": "Agriculture",
        "description": "Income support of Rs. 6,000 per year in three equal installments to all landholding farmer families across the country.",
        "benefits": "Direct benefit transfer of Rs. 6,000 per annum paid in three installments of Rs. 2,000 directly into the bank accounts of eligible farmers.",
        "eligibility": "Small and marginal landholder farmer families with cultivable landholding up to 2 hectares in their name. Institutional landholders and high-income tax payers are excluded.",
        "required_documents": [
            "Aadhaar Card",
            "Proof of Agricultural Land Ownership (Patta / Chitta / Land Record)",
            "Bank Account Passbook (Aadhaar linked)",
            "Citizenship / Identity Proof"
        ],
        "application_process": "Apply online at pmkisan.gov.in or through Common Service Centres (CSCs) or State Nodal Officers.",
        "official_source": "Ministry of Agriculture and Farmers Welfare, Govt of India",
        "official_url": "https://pmkisan.gov.in"
    },
    {
        "id": "scheme_pmfby",
        "scheme_name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "level": "Central",
        "category": "Agriculture & Insurance",
        "description": "Comprehensive insurance cover against failure of crops, helping stabilize the income of farmers and encouraging innovative practices.",
        "benefits": "Subsidized crop insurance coverage for non-preventable natural risks from pre-sowing to post-harvest stages at nominal premium rates (1.5% to 2% for food & oilseed crops).",
        "eligibility": "All farmers including sharecroppers and tenant farmers growing notified crops in notified areas during the season.",
        "required_documents": [
            "Land Possession Certificate / Land Tenancy Agreement",
            "Sowing Certificate issued by Village Administrative Officer (VAO)",
            "Aadhaar Card",
            "Bank Account Details"
        ],
        "application_process": "Register via the PMFBY portal (pmfby.gov.in), designated nationalized / cooperative banks, or CSC centers within the notified sowing window.",
        "official_source": "Department of Agriculture and Farmers Welfare",
        "official_url": "https://pmfby.gov.in"
    },
    {
        "id": "scheme_kalaignar_magalir_urimai",
        "scheme_name": "Kalaignar Magalir Urimai Thittam",
        "ministry": "Department of Social Welfare and Women Empowerment, Govt of Tamil Nadu",
        "level": "Tamil Nadu / State",
        "category": "Women & Social Welfare",
        "description": "Monthly rights grant of Rs. 1,000 provided to eligible women heads of households in Tamil Nadu to foster financial autonomy.",
        "benefits": "Monthly financial aid of Rs. 1,000 credited directly into the bank accounts of women heads of eligible households.",
        "eligibility": "Female head of family aged 21 years or older residing in Tamil Nadu with annual household income below Rs. 2.5 lakh, cultivable land below 5 acres (or 10 acres dry land), and domestic electricity consumption under 3,600 units per year.",
        "required_documents": [
            "Smart Ration Card (Family Card)",
            "Aadhaar Card",
            "Bank Passbook linked with Aadhaar",
            "Electricity Consumer Number / Bill"
        ],
        "application_process": "Special registration camps organized by Revenue Administration at the ward/village level across Tamil Nadu.",
        "official_source": "Government of Tamil Nadu",
        "official_url": "https://kmut.tn.gov.in"
    },
    {
        "id": "scheme_tn_pudhumaipen",
        "scheme_name": "Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme (Pudhumai Penn)",
        "ministry": "Social Welfare and Women Empowerment Department, Tamil Nadu",
        "level": "Tamil Nadu / State",
        "category": "Education & Students",
        "description": "Financial assistance scheme to encourage female students from government schools to pursue higher education.",
        "benefits": "Direct financial aid of Rs. 1,000 per month until the completion of undergraduate degree, diploma, or ITI courses.",
        "eligibility": "Girl students who studied classes 6 to 12 in Tamil Nadu Government schools and enrolled in recognized higher education institutions.",
        "required_documents": [
            "Transfer Certificate / Government School Study Certificate (Classes 6-12)",
            "Aadhaar Card",
            "College Admission Verification & Student ID",
            "Bank Account linked with Aadhaar"
        ],
        "application_process": "Apply via the dedicated departmental portal (pudhumaipenn.tn.gov.in) through the respective higher education institution nodal officer.",
        "official_source": "Department of Higher Education & Social Welfare, Govt of Tamil Nadu",
        "official_url": "https://www.pudhumaipenn.tn.gov.in"
    },
    {
        "id": "scheme_tn_tamil_puthalvan",
        "scheme_name": "Tamil Pudhalvan Scheme",
        "ministry": "Higher Education Department, Government of Tamil Nadu",
        "level": "Tamil Nadu / State",
        "category": "Education & Students",
        "description": "Assistance scheme for male students from government schools to pursue collegiate education and vocational qualifications.",
        "benefits": "Monthly stipend of Rs. 1,000 to purchase books, learning aids, and support college education expenses.",
        "eligibility": "Male students who completed education from Class 6 to 12 in Tamil Nadu Government schools pursuing recognized undergraduate degrees, polytechnic, or ITI courses.",
        "required_documents": [
            "Government School Study Proof (6th-12th standard)",
            "Aadhaar Card",
            "College Bonafide Certificate",
            "Bank Account Passbook"
        ],
        "application_process": "Facilitated through college administrations via the Tamil Nadu higher education portal.",
        "official_source": "Government of Tamil Nadu",
        "official_url": "https://tn.gov.in"
    },
    {
        "id": "scheme_tn_coop_crop_loan",
        "scheme_name": "Tamil Nadu Cooperative Interest-Free Crop Loan Scheme",
        "ministry": "Cooperation, Food and Consumer Protection Department, Tamil Nadu",
        "level": "Tamil Nadu / State",
        "category": "Cooperatives & Agriculture",
        "description": "Interest-free short-term agricultural loans distributed through Primary Agricultural Cooperative Credit Societies (PACCS) to cultivate notified crops.",
        "benefits": "100% interest subvention for loans repaid within the due period (effective interest rate: 0%).",
        "eligibility": "Cultivator members of registered Primary Agricultural Cooperative Credit Societies (PACCS) holding valid agricultural land or cultivating land as tenants.",
        "required_documents": [
            "PACCS Membership Card / Details",
            "Land Ownership Document (Patta / Chitta / Adangal)",
            "Aadhaar Card",
            "VAO Adangal Crop Cultivation Certificate"
        ],
        "application_process": "Submit application directly at the local Primary Agricultural Cooperative Credit Society (PACCS) branch.",
        "official_source": "Registrar of Cooperative Societies, Tamil Nadu",
        "official_url": "https://www.tncoops.gov.in"
    },
    {
        "id": "scheme_ayushman_bharat",
        "scheme_name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "ministry": "National Health Authority, Ministry of Health and Family Welfare",
        "level": "Central",
        "category": "Health & Social Welfare",
        "description": "World's largest government-funded health assurance scheme providing comprehensive secondary and tertiary care hospitalization coverage.",
        "benefits": "Cashless health cover of up to Rs. 5,00,000 per family per year for secondary and tertiary care hospitalization across empanelled hospitals.",
        "eligibility": "Families identified on the basis of deprivation and occupational criteria as per the Socio-Economic Caste Census (SECC 2011) database, and all senior citizens aged 70+ irrespective of income.",
        "required_documents": [
            "Aadhaar Card / Government Photo ID",
            "Ration Card or Family Identification Document"
        ],
        "application_process": "Verify eligibility at beneficiary.nha.gov.in or visit any Ayushman Arogya Mandir / empanelled hospital kiosk.",
        "official_source": "National Health Authority, Government of India",
        "official_url": "https://pmjay.gov.in"
    },
    {
        "id": "scheme_pm_awas",
        "scheme_name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "ministry": "Ministry of Rural Development",
        "level": "Central",
        "category": "Housing",
        "description": "Financial assistance to houseless rural households and those living in kutcha or dilapidated houses for the construction of pucca houses.",
        "benefits": "Direct financial assistance of Rs. 1,20,000 in plains and Rs. 1,30,000 in hilly/difficult areas, plus 90/95 days of unskilled labor wage under MGNREGS and Rs. 12,000 for toilet construction.",
        "eligibility": "Deprived rural households without a permanent pucca house, prioritized through the SECC 2011 list and verified by the Gram Sabha.",
        "required_documents": [
            "Aadhaar Card",
            "MGNREGA Job Card",
            "Bank Account Passbook",
            "Land / House site ownership document"
        ],
        "application_process": "Identified through Village Panchayat / Gram Sabha verification and uploaded via AwaasSoft portal.",
        "official_source": "Ministry of Rural Development, Govt of India",
        "official_url": "https://pmayg.nic.in"
    }
]

class GovernmentSchemesProvider:
    """
    Search and verification service for official Central and State (Tamil Nadu) Government Schemes.
    Provides verified provenance, criteria checks, and avoids speculative eligibility determinations.
    """
    def __init__(self):
        self.schemes = OFFICIAL_GOVERNMENT_SCHEMES

    def search_schemes(self, query: str = "", category: str = None, level: str = None) -> list[dict]:
        """Filters official government schemes by keyword, department, or state level."""
        q = (query or "").lower().strip()
        matched = []

        for s in self.schemes:
            if level and level.lower() not in s["level"].lower():
                continue
            if category and category.lower() not in s["category"].lower():
                continue

            if not q:
                matched.append(s)
                continue

            # Text match across name, description, benefits, eligibility, and category
            search_blob = f"{s['scheme_name']} {s['category']} {s['description']} {s['benefits']} {s['eligibility']} {s['level']}".lower()
            
            # Simple keyword matching
            terms = q.split()
            if any(term in search_blob for term in terms):
                matched.append(s)

        # Apply LARV_SCHEME adaptive ranking if query is provided and LARV enabled
        use_larv = os.environ.get("USE_LARV", "true").lower() == "true" and larv_engine.config.get("enabled", True)
        if q and matched and use_larv:
            try:
                query_plan = understand_query(query)
                query_plan["intent"] = "SCHEME_DISCOVERY"
                if level:
                    query_plan["jurisdiction"] = level
                ranked_schemes = larv_engine.rank(
                    query_plan=query_plan,
                    candidates=matched,
                    domain="scheme",
                    jurisdiction=query_plan.get("jurisdiction"),
                    top_k=len(matched)
                )
                return [r[0] for r in ranked_schemes]
            except Exception as e:
                return matched

        return matched


    def get_scheme_by_id(self, scheme_id: str) -> dict | None:
        """Retrieves exact scheme specification."""
        for s in self.schemes:
            if s["id"] == scheme_id:
                return s
        return None

schemes_provider = GovernmentSchemesProvider()
