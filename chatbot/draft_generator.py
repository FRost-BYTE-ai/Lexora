"""
Lexora Legal Draft Generator Engine
===================================
Produces structured, professional legal drafts:
- Criminal Complaint (under Section 173 BNSS)
- Representation to Public Authority
- Grievance Redressal Petition
- Legal Notice (Demanding remedy/compliance)
- Cooperative Dispute Petition (under Section 90 TN Co-operative Societies Act)
- Right to Information (RTI) Application

Grounding Rule:
Uses verified statutory context without fabricating Acts, sections, or authorities.
Clearly marks generated drafts as draft documents for user and advocate review.
"""

import time

class DraftGenerator:
    def __init__(self):
        pass

    def generate_draft(self, draft_type: str, details: dict) -> dict:
        """
        Generates a legally structured draft based on user factual inputs.
        draft_type: 'complaint', 'representation', 'grievance', 'legal_notice', 'cooperative', 'rti'
        """
        complainant = details.get("complainant_name") or "[Name of Applicant/Complainant]"
        address = details.get("complainant_address") or "[Full Address & Contact Number]"
        opposite_party = details.get("opposite_party") or "[Name / Designation of Opposite Party]"
        facts = details.get("facts") or "[Detailed statement of relevant facts and incidents]"
        incident_date = details.get("incident_date") or "[Date / Time of Incident]"
        place = details.get("place") or "[Place of Occurrence / Jurisdiction]"
        remedy = details.get("remedy_sought") or "[Specific relief / action requested]"
        act_cited = details.get("statute_cited") or ""

        date_str = time.strftime("%d-%m-%Y")

        if draft_type == "complaint":
            title = "FORMAL COMPLAINT UNDER SECTION 173 OF BHARATIYA NAGARIK SURAKSHA SANHITA, 2023"
            content = f"""BEFORE THE STATION HOUSE OFFICER
Police Station: {place}

DATE: {date_str}

COMPLAINANT:
{complainant}
Address: {address}

AGAINST / OPPOSITE PARTY:
{opposite_party}

SUBJECT: Formal complaint regarding cognizable offence committed at {place} on {incident_date}.

RESPECTED OFFICER,

1. I am a law-abiding citizen residing at the address mentioned above.

2. On {incident_date} at approximately {place}, the following incident occurred:
{facts}

3. The acts committed by the accused party constitute cognizable offences under the Bharatiya Nyaya Sanhita, 2023 {f'including {act_cited}' if act_cited else '(including offences against property / person / criminal intimidation)'}.

4. PRAYER:
In light of the facts stated above, it is respectfully prayed that:
(a) An FIR be registered forthwith under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023;
(b) The matter be investigated promptly and necessary statutory action be taken against the accused;
(c) Immediate protection of life and property be extended to the complainant.

Yours faithfully,

_______________________
({complainant})
Complainant

[DISCLAIMER: This is a structured legal draft generated for review. Please verify all factual details and consult a practicing advocate prior to formal filing.]
"""

        elif draft_type == "legal_notice":
            title = "LEGAL NOTICE DEMANDING REMEDY AND STATUTORY COMPLIANCE"
            content = f"""LEGAL NOTICE
(Sent via Registered Post with Acknowledgment Due / Speed Post)

Date: {date_str}
Place: {place}

TO:
{opposite_party}

FROM:
{complainant}
Address: {address}

SUBJECT: Legal Notice demanding immediate redressal of grievance and cessation of unlawful conduct.

SIR / MADAM,

Under instructions and on behalf of my client, {complainant}, residing at {address}, I hereby serve upon you this formal Legal Notice:

1. That my client is a law-abiding citizen who has been subjected to wrongful acts and harassment on account of the following facts:
{facts}

2. That the aforesaid conduct on your part is entirely arbitrary, illegal, and in violation of the applicable statutory framework {f'({act_cited})' if act_cited else ''}.

3. That despite repeated oral and written reminders, you have failed and neglected to rectify the situation, thereby causing immense financial loss and mental distress to my client.

4. PRAYER & DEMAND:
You are hereby called upon to comply with the following demands within FIFTEEN (15) DAYS from the receipt of this Notice:
{remedy}

Failing compliance within the stipulated period, my client will be constrained to initiate appropriate civil and/or criminal proceedings before the competent court of law entirely at your risk, cost, and consequences.

Yours sincerely,

_______________________
({complainant} / Advocate)

[DISCLAIMER: This is a structured legal draft generated for review. Verify all details with legal counsel prior to dispatch.]
"""

        elif draft_type == "cooperative":
            title = "DISPUTE PETITION UNDER SECTION 90 OF THE TAMIL NADU CO-OPERATIVE SOCIETIES ACT, 1983"
            content = f"""BEFORE THE REGISTRAR / DEPUTY REGISTRAR OF CO-OPERATIVE SOCIETIES
District / Jurisdiction: {place}

DATE: {date_str}

IN THE MATTER OF:
{complainant}
Member No.: [Member Identification]
Address: {address}
... PETITIONER / APPLICANT

VERSUS

{opposite_party}
(Management / Officer of Co-operative Society)
... RESPONDENT

PETITION UNDER SECTION 90 OF THE TAMIL NADU CO-OPERATIVE SOCIETIES ACT, 1983 (READ WITH APPLICABLE RULES)

1. The Petitioner is a bona fide member of the Respondent Co-operative Society.

2. A dispute touching the business / management / elections / rights of the society has arisen between the Petitioner and the Respondent under the following circumstances:
{facts}

3. That the grievance was brought to the notice of the management, but no redressal has been provided.

4. PRAYER:
It is therefore respectfully prayed that this learned Authority may be pleased to:
(a) Enter upon the dispute and adjudicate the rights of the parties under Section 90 of the 1983 Act;
(b) Direct the Respondent to grant the relief: {remedy};
(c) Pass such further orders as this Authority may deem fit and proper in the interests of cooperative justice.

Petitioner:
_______________________
({complainant})

[DISCLAIMER: Draft for reference. Verify society membership numbers and statutory grounds before submission.]
"""

        else: # representation / grievance
            title = "FORMAL CITIZEN REPRESENTATION & GRIEVANCE REDRESSAL APPLICATION"
            content = f"""TO:
The Competent Public Authority / Grievance Redressal Officer
Office: {opposite_party}
Location: {place}

DATE: {date_str}

FROM:
{complainant}
Address: {address}

SUBJECT: Formal Representation regarding {facts[:80]}...

RESPECTED SIR / MADAM,

I submit this formal citizen representation before your office to draw your kind and urgent attention to the following factual situation:

1. Factual Background:
{facts}

2. Statutory / Welfare Entitlement:
The matter pertains to citizens' statutory rights and entitlements {f'governed by {act_cited}' if act_cited else 'under the welfare framework of the State'}.

3. Action Requested:
In the interest of justice and fair administrative action, I earnestly request your office to:
{remedy}

I shall produce any additional supporting records or documents upon receiving notice from your office.

Thanking you,

Yours respectfully,

_______________________
({complainant})

[DISCLAIMER: Draft prepared for citizen assistance. Verify dates and particulars prior to submission.]
"""

        return {
            "title": title,
            "draft_type": draft_type,
            "content": content.strip(),
            "created_at": time.time(),
            "metadata": details
        }

draft_generator = DraftGenerator()
