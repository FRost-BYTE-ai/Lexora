export interface LegalLibraryRecord {
  id: string;
  title: string;
  titleTamil: string;
  category: 
    | 'Constitution' 
    | 'Acts' 
    | 'Rules & Regulations' 
    | 'Citizen Rights' 
    | 'Court Procedures' 
    | 'Government Services' 
    | 'Legal FAQs' 
    | 'Tamil Nadu Laws'
    | 'Cooperative Laws'
    | 'Cooperative By-laws'
    | 'Government Schemes'
    | 'Crop Insurance & PMFBY';
  jurisdiction: 'TN' | 'IN';
  summary: string;
  summaryTamil: string;
  keySections: string[];
  officialSource: string;
  url: string;
}

export interface SchemeRecord {
  id: string;
  name: string;
  nameTamil: string;
  category: 'Cooperative' | 'Agriculture' | 'Insurance' | 'Credit' | 'Storage & Infra';
  eligibility: string;
  eligibilityTamil: string;
  requiredDocuments: string[];
  requiredDocumentsTamil: string[];
  applicationProcess: string;
  applicationProcessTamil: string;
  relevantAuthority: string;
  relevantAuthorityTamil: string;
  officialSource: string;
  portalUrl: string;
  keyBenefits: string;
  keyBenefitsTamil: string;
  schemeStatus: 'Active' | 'Updated Guidelines 2024-25';
}

export const GOVERNMENT_SCHEMES_DATA: SchemeRecord[] = [
  {
    id: 'pmfby-crop-insurance',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    nameTamil: 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY)',
    category: 'Insurance',
    eligibility: 'All farmers growing notified crops in notified areas (both loanee and non-loanee farmers, sharecroppers and tenant farmers eligible).',
    eligibilityTamil: 'அறிவிக்கப்பட்ட பகுதிகளில் அறிவிக்கப்பட்ட பயிர்களை சாகுபடி செய்யும் அனைத்து விவசாயிகள் (கடன் பெற்றோர் மற்றும் பெறாதோர், குத்தகை விவசாயிகள் உட்பட).',
    requiredDocuments: [
      'Aadhaar Card',
      'Land Ownership Record (Patta / Chitta / Revenue Adangal)',
      'Village Administrative Officer (VAO) Sowing Certificate / பயிர் சாகுபடி சான்றிதழ்',
      'Bank Passbook photocopy showing IFSC & Account No',
      'Tenant Agreement / Self-declaration (for tenant farmers)'
    ],
    requiredDocumentsTamil: [
      'ஆதார் அட்டை',
      'பட்டா / சிட்டா மற்றும் நடப்பு பசலி அடங்கல் நகல்',
      'கிராம நிர்வாக அலுவலர் (VAO) வழங்கிய பயிர் சாகுபடி சான்று',
      'வங்கி கணக்கு புத்தக நகல் (IFSC & கணக்கு எண் தெளிவாக)',
      'குத்தகை ஒப்பந்தம் / சுய பிரகடனம் (குத்தகை விவசாயிகளுக்கு)'
    ],
    applicationProcess: 'Enroll via nearest Primary Agricultural Credit Society (PACS), National Crop Insurance Portal (pmfby.gov.in), Common Service Centre (CSC), or commercial bank before statutory cut-off dates. For localized calamities (flood/hailstorm), intimation must be registered within 72 hours via Crop Insurance App or Toll-Free 14447.',
    applicationProcessTamil: 'அருகிலுள்ள தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS), e-Sevai / CSC மையம் அல்லது pmfby.gov.in மூலம் காலக்கெடுவிற்குள் பதிவு செய்யவும். வெள்ளம்/மழை சேதம் ஏற்பட்டால் 72 மணி நேரத்திற்குள் 14447 கட்டணமில்லா எண் அல்லது செயலியில் தகவல் தெரிவிக்க வேண்டும்.',
    relevantAuthority: 'District Grievance Redressal Committee (DGRC) headed by District Collector • Joint Director of Agriculture • Insurance Company Nodal Office',
    relevantAuthorityTamil: 'மாவட்ட ஆட்சித்தலைவர் தலைமையிலான குறைதீர் குழு • வேளாண்மை இணை இயக்குநர் • பயிர் காப்பீட்டு நிறுவன தொடர்பு அலுவலர்',
    officialSource: 'Ministry of Agriculture & Farmers Welfare, Govt of India & Department of Agriculture, Govt of Tamil Nadu',
    portalUrl: 'https://pmfby.gov.in/',
    keyBenefits: 'Premium capped at 2% for Kharif crops, 1.5% for Rabi food & oilseed crops, and 5% for commercial/horticultural crops; remaining premium shared equally by Central and State Governments. Full insured sum settled for yield loss.',
    keyBenefitsTamil: 'காரிப் பயிர்களுக்கு 2%, ரபி உணவுப் பயிர்களுக்கு 1.5%, வணிகப் பயிர்களுக்கு 5% மட்டுமே குறைந்த பிரீமியம். மீதி பிரீமியத்தை அரசே செலுத்துகிறது. மகசூல் இழப்பிற்கு முழு இழப்பீடு.',
    schemeStatus: 'Active'
  },
  {
    id: 'kcc-interest-subvention',
    name: 'Kisan Credit Card (KCC) & Modified Interest Subvention Scheme (MISS)',
    nameTamil: 'கிசான் கடன் அட்டை (KCC) & வட்டி மானியத் திட்டம்',
    category: 'Credit',
    eligibility: 'Individual/joint farmers, owner cultivators, tenant farmers, oral lessees, sharecroppers, and SHGs/JLGs engaged in agriculture, animal husbandry, or fisheries.',
    eligibilityTamil: 'சொந்த நிலம் வைத்துள்ள விவசாயிகள், குத்தகை விவசாயிகள், பங்கு சாகுபடியாளர்கள், கால்நடை மற்றும் மீன்வள விவசாயிகள்.',
    requiredDocuments: [
      'Duly completed KCC application form',
      'Identity & Address Proof (Aadhaar / Voter ID)',
      'Land Records (Patta, Chitta, Adangal copy)',
      'Crop cultivation plan / cropping pattern certificate',
      'No-Dues Certificate from other financial institutions in the operational area'
    ],
    requiredDocumentsTamil: [
      'பூர்த்தி செய்யப்பட்ட KCC விண்ணப்பப் படிவம்',
      'அடையாள அட்டை (ஆதார் / வாக்காளர் அட்டை)',
      'நில ஆவணங்கள் (பட்டா, சிட்டா, நடப்பு அடங்கல் நகல்)',
      'பயிர் சாகுபடி திட்டம் / கிராம நிர்வாக அலுவலர் சான்று',
      'பிற வங்கிகளில் நிலுவை இல்லை என்பதற்கான சான்று'
    ],
    applicationProcess: 'Apply at the village Primary Agricultural Credit Society (PACS), District Central Cooperative Bank (DCCB) branch, or online through the JanSamarth portal. PACS verifies land holding and issues credit limit within 14 working days.',
    applicationProcessTamil: 'கிராம தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS) அல்லது மாவட்ட மத்திய கூட்டுறவு வங்கி (DCCB) கிளையில் விண்ணப்பிக்கலாம். 14 நாட்களுக்குள் கடன் அட்டை மற்றும் கடன் வரம்பு அனுமதிக்கப்படும்.',
    relevantAuthority: 'Primary Agricultural Credit Society (PACS) Management • District Central Cooperative Bank (DCCB) • NABARD',
    relevantAuthorityTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS) • மாவட்ட மத்திய கூட்டுறவு வங்கி (DCCB) • நபார்டு (NABARD)',
    officialSource: 'Reserve Bank of India (RBI) & NABARD Rural Credit Division',
    portalUrl: 'https://www.jansamarth.in/',
    keyBenefits: 'Short-term crop credit up to ₹3,00,000 at a benchmark 7% interest per annum. Prompt Repaying Farmers receive an additional 3% prompt repayment subvention (PRIS), reducing the effective interest rate to just 4% per annum (zero interest in select Tamil Nadu cooperative schemes).',
    keyBenefitsTamil: 'ரூ. 3 லட்சம் வரை குறுகிய கால பயிர்க்கடன் 7% வட்டியில். உரிய தவணையில் திருப்பிச் செலுத்துவோருக்கு 3% ஊக்கத்தொகை கழிவு செய்யப்பட்டு வெறும் 4% வட்டியில் (தமிழ்நாடு கூட்டுறவில் சரியான நேரத்தில் செலுத்தினால் வட்டி இல்லாக் கடன்).',
    schemeStatus: 'Active'
  },
  {
    id: 'computerization-of-pacs',
    name: 'Centrally Sponsored Project for Computerization of PACS',
    nameTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS) கணினிமயமாக்கல் திட்டம்',
    category: 'Cooperative',
    eligibility: 'All functional Primary Agricultural Credit Societies across India onboarded into the national ERP system.',
    eligibilityTamil: 'அனைத்து செயல்பாட்டில் உள்ள தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS).',
    requiredDocuments: [
      'Society Registration Certificate under State Cooperative Act',
      'Approved Society By-laws & Member Register',
      'Audited Financial Statements (Last 3 years)',
      'NABARD / State Cooperative Bank authorization'
    ],
    requiredDocumentsTamil: [
      'கூட்டுறவு சங்க பதிவுச் சான்றிதழ்',
      'உறுப்பினர் பதிவேடு மற்றும் சங்க துணை விதிகள் நகல்',
      'கடந்த 3 ஆண்டுகளுக்கான தணிக்கை அறிக்கை',
      'மாநில கூட்டுறவு வங்கி / நபார்டு அங்கீகார கடிதம்'
    ],
    applicationProcess: 'Implemented directly through the State Registrar of Cooperative Societies, NABARD, and Ministry of Cooperation via state-level implementation committees (SLIC). Members access real-time digital passbooks, direct loan disbursements, and transparent stock ledgers.',
    applicationProcessTamil: 'மத்திய கூட்டுறவு அமைச்சகம், நபார்டு மற்றும் தமிழ்நாடு கூட்டுறவு சங்கங்களின் பதிவாளர் மூலம் நேரடியாக செயல்படுத்தப்படுகிறது. உறுப்பினர்கள் டிஜிட்டல் பாஸ்புக் மற்றும் வெளிப்படையான வரவு-செலவு பதிவுகளை பெறலாம்.',
    relevantAuthority: 'Ministry of Cooperation, GoI • Registrar of Co-operative Societies, Tamil Nadu • NABARD',
    relevantAuthorityTamil: 'மத்திய கூட்டுறவு அமைச்சகம் • தமிழ்நாடு கூட்டுறவு சங்கங்களின் பதிவாளர் • நபார்டு',
    officialSource: 'Ministry of Cooperation, Government of India',
    portalUrl: 'https://cooperation.gov.in/',
    keyBenefits: 'Standardizes PACS operations on cloud ERP, integrates PACS with DCCBs, enables transparent accounting, eliminates fake ledger entries, and allows PACS to deliver CSC services, fertilizer sales, and PDS transactions seamlessly.',
    keyBenefitsTamil: 'ஒற்றை கிளவுட் மென்பொருள் மூலம் நேரடி கணினிமயமாக்கல், முறைகேடுகள் தவிர்ப்பு, CSC இணையவழி சேவைகள் மற்றும் வெளிப்படையான கடன் பரிவர்த்தனை.',
    schemeStatus: 'Updated Guidelines 2024-25'
  },
  {
    id: 'model-bylaws-multipurpose-pacs',
    name: 'Model By-laws for Multipurpose PACS & Diversified Services',
    nameTamil: 'பல்நோக்கு தொடக்க வேளாண் கூட்டுறவு சங்கங்களுக்கான மாதிரி துணை விதிகள்',
    category: 'Cooperative',
    eligibility: 'PACS adopting the Ministry of Cooperation Model By-laws by resolution of their General Body.',
    eligibilityTamil: 'பொதுக்குழு தீர்மானம் மூலம் மாதிரி துணை விதிகளை ஏற்றுக்கொள்ளும் அனைத்து தொடக்க வேளாண் கூட்டுறவு சங்கங்கள்.',
    requiredDocuments: [
      'General Body Meeting Resolution adopting Model By-laws',
      'Submission to Circle Deputy Registrar of Cooperative Societies (DRCS)',
      'Amendment form under Section 11 of TN Cooperative Societies Act 1983'
    ],
    requiredDocumentsTamil: [
      'மாதிரி துணை விதிகளை ஏற்பதற்கான பொதுக்குழுக் கூட்டத் தீர்மானம்',
      'வட்ட துணைப் பதிவாளரிடம் சமர்ப்பிப்பு படிவம்',
      '1983 சட்டத்தின் பிரிவு 11-ன் கீழ் துணை விதி திருத்த விண்ணப்பம்'
    ],
    applicationProcess: 'PACS convenes a Special or Annual General Body meeting with statutory quorum, approves the adoption of 25+ diversified business domains (LPG dealership, CSC services, fertilizer retail, custom hiring, drone spraying, farm produce aggregation), and registers amendments with the Circle Deputy Registrar.',
    applicationProcessTamil: 'சங்கத்தின் பொதுக்குழுவில் தீர்மானம் நிறைவேற்றி, வட்ட துணைப் பதிவாளரிடம் (DRCS) பதிவு செய்ய வேண்டும். இதன் மூலம் உரம் விற்பனை, வாடகை இயந்திர மையம், CSC சேவை உள்ளிட்ட 25-க்கும் மேற்பட்ட வணிகங்களை தொடங்கலாம்.',
    relevantAuthority: 'Circle Deputy Registrar of Co-operative Societies (DRCS) • Joint Registrar (District)',
    relevantAuthorityTamil: 'வட்ட கூட்டுறவு துணைப் பதிவாளர் (DRCS) • மாவட்ட கூட்டுறவு இணைப் பதிவாளர்',
    officialSource: 'Ministry of Cooperation & Tamil Nadu Co-operative Department',
    portalUrl: 'https://cooperation.gov.in/model-by-laws',
    keyBenefits: 'Enables PACS to diversify beyond crop loans into community service centers (CSC), custom hiring centers for farm machinery, cold storage, retail fuel outlets, dairy, and national seed/organic marketing.',
    keyBenefitsTamil: 'பயிர்க்கடன் மட்டுமின்றி உழவு இயந்திர வாடகை மையம், பெட்ரோல்/டீசல் பங்க், பால் பண்ணை, விதை உற்பத்தி மற்றும் சி.எஸ்.சி இணைய சேவைகள் வழங்கும் அதிகாரமளித்தல்.',
    schemeStatus: 'Active'
  },
  {
    id: 'agriculture-infrastructure-fund',
    name: 'Agriculture Infrastructure Fund (AIF) for Cooperatives & Farmers',
    nameTamil: 'வேளாண் உட்கட்டமைப்பு நிதி (AIF) - கூட்டுறவு சங்கங்களுக்கான திட்டம்',
    category: 'Storage & Infra',
    eligibility: 'Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producer Organizations (FPOs), Self Help Groups, and individual agri-entrepreneurs.',
    eligibilityTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS), உழவர் உற்பத்தியாளர் நிறுவனங்கள் (FPO), சுயஉதவிக் குழுக்கள் மற்றும் விவசாய தொழில்முனைவோர்.',
    requiredDocuments: [
      'Detailed Project Report (DPR) for post-harvest infrastructure or godown',
      'Land ownership or long-term lease deed (minimum 10-15 years)',
      'Registration Certificate & Audited Financials of PACS / Applicant',
      'Bank consent / In-principle loan sanction letter'
    ],
    requiredDocumentsTamil: [
      'கிடங்கு அல்லது அறுவடை பின்செய் உட்கட்டமைப்பு விரிவான திட்ட அறிக்கை (DPR)',
      'நில உரிமைப் பத்திரம் அல்லது நீண்ட கால குத்தகை ஒப்பந்தம் (10-15 ஆண்டுகள்)',
      'கூட்டுறவு சங்க பதிவுச் சான்றிதழ் மற்றும் தணிக்கை கணக்கு விவரம்',
      'வங்கி கொள்கை அளவிலான கடன் அனுமதி கடிதம்'
    ],
    applicationProcess: 'Apply online on the AIF Portal (agriinfra.dac.gov.in). Applications are evaluated by the State Project Management Unit (SPMU) and sanctioned by participating commercial banks, cooperative banks, or NABARD within 30-45 days.',
    applicationProcessTamil: 'agriinfra.dac.gov.in இணையதளம் வழியாக விண்ணப்பிக்க வேண்டும். மாவட்ட மற்றும் மாநில அளவிலான குழு பரிசீலனை செய்து கூட்டுறவு வங்கிகள் அல்லது நபார்டு மூலம் கடன் வழங்கும்.',
    relevantAuthority: 'Department of Agriculture & Farmers Welfare, GoI • State Nodal Officer (Agriculture) • NABARD',
    relevantAuthorityTamil: 'மத்திய வேளாண் துறை • மாநில வேளாண்மை இயக்குனர் • நபார்டு',
    officialSource: 'Department of Agriculture & Farmers Welfare, Ministry of Agriculture',
    portalUrl: 'https://agriinfra.dac.gov.in/',
    keyBenefits: 'Medium-to-long term debt financing for post-harvest management infrastructure (cold storages, warehouses, silos, sorting/grading units). Features 3% per annum interest subvention up to ₹2 Crore loan for a maximum of 7 years, along with CGTMSE credit guarantee coverage.',
    keyBenefitsTamil: 'ரூ. 2 கோடி வரை 3% வட்டி மானியத்துடன் 7 ஆண்டுகளுக்கு முதலீட்டுக் கடன். சேமிப்புக் கிடங்கு, குளிர்பதனக் கிடங்கு, தானிய உலர் களம் அமைக்க மிக குறைந்த வட்டி.',
    schemeStatus: 'Active'
  },
  {
    id: 'national-cooperatives-export-seed-organic',
    name: 'National Level Multi-State Cooperatives: Exports (NCEL), Seeds (BBSSL) & Organics (NCOL)',
    nameTamil: 'தேசிய அளவிலான பல்மாநில கூட்டுறவு சங்கங்கள்: ஏற்றுமதி, விதை & இயற்கை வேளாண்மை',
    category: 'Cooperative',
    eligibility: 'PACS, District/State cooperative unions, FPOs, and farmers desiring to become primary members or institutional shareholders to market farm produce globally.',
    eligibilityTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS), உழவர் உற்பத்தியாளர் நிறுவனங்கள் (FPO), மற்றும் விவசாயிகள்.',
    requiredDocuments: [
      'PACS Board Resolution for subscribing to share capital',
      'KYC of Authorized Representative (Chairman / Secretary)',
      'Crop quality/organic certification documents (where applicable)'
    ],
    requiredDocumentsTamil: [
      'பங்கு மூலதனம் செலுத்துவதற்கான சங்க நிர்வாகக் குழுவின் தீர்மானம்',
      'தலைவர் / செயலாளரின் KYC ஆவணங்கள்',
      'இயற்கை வேளாண்மை சான்றிதழ் (பொருந்தினால்)'
    ],
    applicationProcess: 'Institutional membership application submitted to National Cooperative Export Ltd (NCEL), Bharatiya Beej Sahakari Samiti Ltd (BBSSL), or National Cooperative Organics Ltd (NCOL) via the Ministry of Cooperation portal.',
    applicationProcessTamil: 'மத்திய கூட்டுறவு அமைச்சகத்தின் போர்டல் மூலமாக அல்லது மாவட்ட மத்திய கூட்டுறவு வங்கி வாயிலாக உறுப்பினர் விண்ணப்பம் சமர்ப்பிக்கலாம்.',
    relevantAuthority: 'Ministry of Cooperation, Government of India • NCEL / BBSSL / NCOL Boards',
    relevantAuthorityTamil: 'மத்திய கூட்டுறவு அமைச்சகம் • NCEL / BBSSL / NCOL நிர்வாகக் குழு',
    officialSource: 'Ministry of Cooperation, GoI',
    portalUrl: 'https://cooperation.gov.in/',
    keyBenefits: 'Enables grassroots farmers to aggregate agricultural produce at the village PACS level and sell directly into domestic and international export supply chains, bypassing intermediary commissions and retaining fair export premiums.',
    keyBenefitsTamil: 'கிராமப்புற விவசாயிகளின் உற்பத்திப் பொருட்களை சர்வதேச அளவில் ஏற்றுமதி செய்யவும், தரமான பாரதிய விதைகள் பெறவும், இயற்கை விவசாய விளைபொருட்களுக்கு நல்ல விலை கிடைக்கவும் நேரடி வாய்ப்பு.',
    schemeStatus: 'Active'
  }
];

export const LEGAL_LIBRARY_DATA: LegalLibraryRecord[] = [
  {
    id: 'tn-coop-societies-act-1983',
    title: 'Tamil Nadu Co-operative Societies Act, 1983 & Rules, 1988',
    titleTamil: 'தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம், 1983 மற்றும் விதிகள், 1988',
    category: 'Cooperative Laws',
    jurisdiction: 'TN',
    summary: 'The primary statutory framework for registration, governance, member rights, elections, audit, inquiry, and dispute settlement in all cooperative societies (PACS, DCCBs, marketing societies) across Tamil Nadu.',
    summaryTamil: 'தமிழ்நாட்டில் உள்ள அனைத்து தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS), மத்திய கூட்டுறவு வங்கிகள் மற்றும் கூட்டுறவு நிறுவனங்களின் நிர்வாகம், உறுப்பினர் உரிமைகள், தேர்தல் மற்றும் தகராறு தீர்வுக்கான முதன்மை சட்டம்.',
    keySections: [
      'Section 21 (Qualifications for Membership & Deemed Admission)',
      'Section 23 (Rights of Members - Voting, Accounts Inspection, Dividend ceiling 14%)',
      'Section 27 (General Body Meetings, Quorum & Notice)',
      'Section 33 (Constitution of Board of Directors & Reservations for Women/SC/ST)',
      'Section 81 (Statutory Inquiry by Registrar on Member Petition)',
      'Section 90 (Settlement of Disputes & Arbitration by Deputy Registrar)',
      'Section 152 (Appeals to Cooperative Tribunal / Principal District Court)'
    ],
    officialSource: 'Registrar of Co-operative Societies, Government of Tamil Nadu',
    url: 'https://www.rcs.tn.gov.in/'
  },
  {
    id: 'model-bylaws-pacs-2023',
    title: 'Model By-laws for Primary Agricultural Credit Societies (PACS)',
    titleTamil: 'தொடக்க வேளாண் கூட்டுறவு கடன் சங்கங்களுக்கான மாதிரி துணை விதிகள் (Model By-laws)',
    category: 'Cooperative By-laws',
    jurisdiction: 'IN',
    summary: 'Model regulatory framework drafted by the Ministry of Cooperation transforming single-purpose credit societies into multipurpose economic entities authorized to undertake 25+ activities including CSC services, fertilizer distribution, custom hiring centers, and dairy.',
    summaryTamil: 'மத்திய கூட்டுறவு அமைச்சகத்தால் உருவாக்கப்பட்ட மாதிரி துணை விதிகள். இதன் மூலம் PACS சங்கங்கள் பயிர்க்கடன் வழங்குவதுடன், உழவு இயந்திர வாடகை மையம், சி.எஸ்.சி இணைய சேவைகள் மற்றும் உர விற்பனை நிலையங்களை நடத்தலாம்.',
    keySections: [
      'By-law 4 (Multipurpose Objectives & Business Lines)',
      'By-law 7 (Individual Membership Criteria & Active Member Definition)',
      'By-law 22 (Annual General Meeting & Requisition of Special Meetings by 1/5th members)',
      'By-law 31 (Board Composition, Secretary Duties, & Transparency Measures)',
      'By-law 52 (Disposal of Net Profit - 25% Reserve Fund, Education Fund, Dividend)'
    ],
    officialSource: 'Ministry of Cooperation, Government of India',
    url: 'https://cooperation.gov.in/model-by-laws'
  },
  {
    id: 'multi-state-coop-act-2002',
    title: 'Multi-State Co-operative Societies Act, 2002 (Amended 2023)',
    titleTamil: 'பல்மாநில கூட்டுறவு சங்கங்கள் சட்டம், 2002 (2023 திருத்தச் சட்டம்)',
    category: 'Cooperative Laws',
    jurisdiction: 'IN',
    summary: 'Regulates cooperative societies with objects not confined to one State. 2023 Amendment introduces Co-operative Election Authority, Co-operative Ombudsman for grievance redressal, and mandatory Concurrent Audit.',
    summaryTamil: 'ஒன்றுக்கும் மேற்பட்ட மாநிலங்களில் செயல்படும் கூட்டுறவு சங்கங்களுக்கான சட்டம். 2023 திருத்தம் மூலம் கூட்டுறவு குறைதீர்ப்பாளர் (Ombudsman) மற்றும் தேர்தல் ஆணையம் அமைக்கப்பட்டுள்ளது.',
    keySections: [
      'Section 25 (Members not to exercise rights till due payment made)',
      'Section 45 (Co-operative Election Authority)',
      'Section 85-A (Establishment of Co-operative Ombudsman for Redressal of Grievances)',
      'Section 108 (Statutory Inquiry by Central Registrar)'
    ],
    officialSource: 'Central Registrar of Cooperative Societies (CRCS), New Delhi',
    url: 'https://mscs.dac.gov.in/'
  },
  {
    id: 'pmfby-guidelines-statutory',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) Revised Operational Guidelines',
    titleTamil: 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY) செயல்பாட்டு வழிகாட்டுதல்கள்',
    category: 'Crop Insurance & PMFBY',
    jurisdiction: 'IN',
    summary: 'Comprehensive yield index insurance operational rules covering prevented sowing, mid-season adversity, localized calamities (flood/hailstorm), and post-harvest losses. Defines 72-hour reporting rule and District Grievance Redressal Committee (DGRC).',
    summaryTamil: 'பயிர் இழப்பீடு மற்றும் இயற்கை இடர்பாடுகளுக்கான விரிவான வழிகாட்டுதல்கள். சேதம் அடைந்த 72 மணி நேரத்திற்குள் தகவல் அளித்தல் மற்றும் மாவட்ட ஆட்சியர் தலைமையிலான குறைதீர் குழுவின் அதிகாரங்கள்.',
    keySections: [
      'Para 11.2 (Coverage of Localized Calamities & 72-hour Intimation Mandate)',
      'Para 14 (Assessment of Loss through Crop Cutting Experiments - CCE)',
      'Para 21 (Dispute Settlement by District Level Grievance Redressal Committee - DGRC)',
      'Para 24 (Timelines for Claim Settlement within 3 weeks of yield data submission)'
    ],
    officialSource: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    url: 'https://pmfby.gov.in/'
  },
  {
    id: 'kcc-nabard-guidelines',
    title: 'Kisan Credit Card (KCC) Scheme & Modified Interest Subvention Guidelines',
    titleTamil: 'கிசான் கடன் அட்டை திட்டம் மற்றும் வட்டி மானிய வழிகாட்டு நெறிமுறைகள்',
    category: 'Government Schemes',
    jurisdiction: 'IN',
    summary: 'RBI and NABARD unified master directions governing credit limits based on scale of finance, 5-year card validity with annual reviews, 7% base interest with 3% prompt repayment subvention (PRIS) up to ₹3 Lakh.',
    summaryTamil: 'ரிசர்வ் வங்கி மற்றும் நபார்டு நெறிமுறைகள். 7% அடிப்படை வட்டி, தவணை தவறாமல் செலுத்தும் விவசாயிகளுக்கு 3% ஊக்கத்தொகை கழிவு செய்யப்பட்டு வெறும் 4% வட்டியில் கடன்.',
    keySections: [
      'Clause 3.1 (Fixation of Scale of Finance per Acre)',
      'Clause 4.2 (Prompt Repayment Incentive of 3% per annum)',
      'Clause 6.1 (Collateral Security Exemption up to ₹1.60 Lakh, extended to ₹3 Lakh for tie-up arrangements)',
      'Clause 8.4 (Issuance of RuPay KCC Debit Card for ATM/PoS access)'
    ],
    officialSource: 'Reserve Bank of India (RBI) & NABARD',
    url: 'https://www.nabard.org/'
  },
  {
    id: 'tn-tenancy-act-2017',
    title: 'Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017',
    titleTamil: 'தமிழ்நாடு நில உரிமையாளர்கள் மற்றும் வாடகையாளர்கள் உரிமை ஒழுங்குமுறைச் சட்டம், 2017',
    category: 'Tamil Nadu Laws',
    jurisdiction: 'TN',
    summary: 'Governs tenancy agreements, security deposits (capped at max 3 months rent), grounds for eviction, and mandatory registration on the Tenancy portal (tenancy.tn.gov.in).',
    summaryTamil: 'வாடகை ஒப்பந்தங்கள், அதிகபட்சம் 3 மாத வாடகை முன்வைப்புத் தொகை (Advance/Deposit), வெளியேற்றுவதற்கான விதிமுறைகள் மற்றும் Tenancy போர்ட்டலில் கட்டாய பதிவு ஆகியவற்றை நிர்வகிக்கிறது.',
    keySections: ['Section 4 (Mandatory Written Agreement)', 'Section 5 (Tenancy Period)', 'Section 21 (Repossession by Landlord)'],
    officialSource: 'Government of Tamil Nadu • Tenancy Authority',
    url: 'https://tenancy.tn.gov.in/'
  },
  {
    id: 'tn-land-patta-chitta',
    title: 'Tamil Nadu Patta Pass Book Act, 1983 & e-Services',
    titleTamil: 'தமிழ்நாடு பட்டா பாஸ் புக் சட்டம் மற்றும் இணைய வழி பட்டா/சிட்டா சேவைகள்',
    category: 'Government Services',
    jurisdiction: 'TN',
    summary: 'Framework for issuance and updating of Patta, Chitta, FMB sketch, and Town Survey Land Records (TSLR) through the AnyTime Anywhere e-Services portal (eservices.tn.gov.in).',
    summaryTamil: 'நிலத்தின் உரிமை ஆவணமான பட்டா, சிட்டா, புல வரைபடம் (FMB) மற்றும் TSLR சான்றுகளை இணைய வழியில் பெறுதல் மற்றும் பெயர் மாற்றம் செய்வதற்கான விதிமுறைகள்.',
    keySections: ['Section 3 (Issue of Patta Pass Book)', 'Section 10 (Modification of Entries)', 'Section 14 (Bar of Suits)'],
    officialSource: 'Department of Revenue & Disaster Management, Tamil Nadu',
    url: 'https://eservices.tn.gov.in/eservicesnew/index.html'
  },
  {
    id: 'tnreginet-registration',
    title: 'Registration (Tamil Nadu Amendment) Act & TNREGINET Protocol',
    titleTamil: 'பத்திரப் பதிவு (தமிழ்நாடு திருத்தச்) சட்டம் மற்றும் இணையவழி வழிகாட்டி மதிப்பு',
    category: 'Tamil Nadu Laws',
    jurisdiction: 'TN',
    summary: 'Mandates transparent online property registration, encumbrance certificates (EC), guideline values, and stringent checks under Section 77-A against fraudulent registrations.',
    summaryTamil: 'வில்லங்கச் சான்றிதழ் (EC), வழிகாட்டி மதிப்பு மற்றும் போலி ஆவணப் பதிவுகளை ரத்து செய்ய பிரிவு 77-A கீழ் மாவட்ட பதிவாளருக்கு வழங்கப்பட்ட அதிகாரங்கள்.',
    keySections: ['Section 17 (Compulsory Registration)', 'Section 77-A (Cancellation of Fraudulent Deeds)', 'Section 82 (Penalty for false statements)'],
    officialSource: 'Inspector General of Registration, Tamil Nadu',
    url: 'https://tnreginet.gov.in/'
  },
  {
    id: 'consumer-protection-act-2019',
    title: 'Consumer Protection Act, 2019',
    titleTamil: 'நுகர்வோர் பாதுகாப்புச் சட்டம், 2019',
    category: 'Acts',
    jurisdiction: 'IN',
    summary: 'Protects consumer rights against unfair trade practices, defective goods, and deficiency in services. Establishes District, State, and National Consumer Dispute Redressal Commissions (e-Daakhil filing).',
    summaryTamil: 'குறைபாடுள்ள பொருட்கள், சேவை குறைபாடுகள் மற்றும் நியாயமற்ற வர்த்தகத்திற்கு எதிராக நுகர்வோர் இழப்பீடு கோர வழிவகை செய்கிறது. e-Daakhil மூலம் இணையவழியில் வழக்கு தொடரலாம்.',
    keySections: ['Section 2(7) (Definition of Consumer)', 'Section 35 (Manner of Complaint to District Commission)', 'Section 82 (Product Liability)'],
    officialSource: 'Ministry of Consumer Affairs, Food & Public Distribution • India Code',
    url: 'https://edaakhil.nic.in/'
  },
  {
    id: 'rti-act-2005',
    title: 'Right to Information Act, 2005 & Tamil Nadu RTI Rules',
    titleTamil: 'தகவல் அறியும் உரிமைச் சட்டம், 2005 மற்றும் தமிழ்நாடு RTI விதிகள்',
    category: 'Citizen Rights',
    jurisdiction: 'IN',
    summary: 'Empowers citizens to request records, files, and updates from public authorities. Public Information Officers (PIOs) must respond within 30 days (48 hours if concerning life and liberty).',
    summaryTamil: 'அரசு துறைகளின் செயல்பாடுகள் மற்றும் ஆவணங்களை கோரிப் பெறும் குடிமக்களின் அடிப்படை உரிமை. 30 நாட்களுக்குள் பதில் அளிக்கப்பட வேண்டும்.',
    keySections: ['Section 6 (Request for Information)', 'Section 7 (Disposal of Request within 30 days)', 'Section 19 (First & Second Appeals)'],
    officialSource: 'Tamil Nadu Information Commission (TNIC)',
    url: 'https://rtionline.tn.gov.in/'
  },
  {
    id: 'bns-criminal-code',
    title: 'Bharatiya Nyaya Sanhita, 2023 (BNS) & Citizen Arrest Guidelines',
    titleTamil: 'பாரதிய நியாய சன்ஹிதா, 2023 மற்றும் குடிமக்கள் கைது வழிகாட்டுதல்கள்',
    category: 'Acts',
    jurisdiction: 'IN',
    summary: 'Codifies substantive criminal law in India replacing IPC. Emphasizes electronic evidence, community service for petty offences, and statutory bail timelines under BNSS.',
    summaryTamil: 'இந்திய குற்றவியல் சட்டத் தொகுப்பு. குற்றங்கள், தண்டனைகள் மற்றும் எலக்ட்ரானிக் சாட்சியங்கள் தொடர்பான புதிய விதிகளின் தொகுப்பு.',
    keySections: ['Section 4 (Punishments)', 'Section 303 (Theft)', 'Section 318 (Cheating & Dishonesty)'],
    officialSource: 'Ministry of Law & Justice, Govt of India',
    url: 'https://www.indiacode.nic.in/'
  },
  {
    id: 'madras-hc-rit-procedure',
    title: 'Madras High Court Writ Jurisdiction (Article 226)',
    titleTamil: 'சென்னை உயர்நீதிமன்ற நீதிப்பேராணை நடைமுறைகள் (சரத்து 226)',
    category: 'Court Procedures',
    jurisdiction: 'TN',
    summary: 'Procedural guidance on approaching the Principal Bench (Chennai) or Madurai Bench for Mandamus, Habeas Corpus, Certiorari, Prohibition, or Quo Warranto for enforcement of rights.',
    summaryTamil: 'அடிப்படை உரிமைகள் மற்றும் சட்டப்பூர்வ உரிமைகளை நிலைநாட்ட சென்னை முதன்மை அமர்வு அல்லது மதுரை கிளையில் ரிட் மனு தாக்கல் செய்யும் வழிகாட்டுதல்கள்.',
    keySections: ['Article 226 (Power of High Courts to issue writs)', 'Writ Rules 2021 (Madras High Court)'],
    officialSource: 'Madras High Court Registry',
    url: 'https://www.hcmadras.tn.gov.in/'
  },
  {
    id: 'tn-maintenance-parents-act',
    title: 'Maintenance and Welfare of Parents and Senior Citizens Act (TN Rules)',
    titleTamil: 'பெற்றோர் மற்றும் மூத்த குடிமக்கள் பராமரிப்பு & நலவாழ்வு சட்டம்',
    category: 'Citizen Rights',
    jurisdiction: 'TN',
    summary: 'Statutory protection for elderly parents to claim monthly maintenance up to Rs. 10,000 from adult children/heirs through the Revenue Divisional Officer (RDO) tribunal.',
    summaryTamil: 'மூத்த பெற்றோரை கவனிக்காத வாரிசுகளிடம் இருந்து RDO நீதிமன்றம் மூலம் மாதாந்திர பராமரிப்பு தொகை மற்றும் சொத்துப் பாதுகாப்பு பெறும் உரிமை.',
    keySections: ['Section 4 (Maintenance of Parents)', 'Section 9 (Order for Maintenance)', 'Section 23 (Transfer of property void in certain circumstances)'],
    officialSource: 'Social Welfare & Women Empowerment Dept, TN',
    url: 'https://cms.tn.gov.in/'
  },
  {
    id: 'industrial-disputes-act-tn',
    title: 'Industrial Disputes Act & Tamil Nadu Shops and Establishments Act, 1947',
    titleTamil: 'தமிழ்நாடு கடைகள் மற்றும் நிறுவனங்கள் சட்டம், 1947',
    category: 'Acts',
    jurisdiction: 'TN',
    summary: 'Protects commercial and IT/ITES sector employees regarding appointment orders, statutory notice before termination, leave entitlement, and gratuity claims.',
    summaryTamil: 'கடைகள், வணிக நிறுவனங்கள் மற்றும் IT ஊழியர்களுக்கான பணிநியமன ஆணை, காரணமின்றி நீக்குதலுக்கு எதிரான பாதுகாப்பு மற்றும் விடுப்பு உரிமைகள்.',
    keySections: ['Section 41 (Notice of dismissal & appellate authority)', 'Section 25 (Annual leave with wages)'],
    officialSource: 'Department of Labour, Tamil Nadu',
    url: 'https://labour.tn.gov.in/'
  },
  {
    id: 'constitution-fundamental-rights',
    title: 'Constitution of India - Part III Fundamental Rights',
    titleTamil: 'இந்திய அரசியலமைப்புச் சட்டம் - பகுதி III அடிப்படை உரிமைகள்',
    category: 'Constitution',
    jurisdiction: 'IN',
    summary: 'Guarantees Equality before Law (Art 14), Freedom of Speech (Art 19), Protection of Life & Personal Liberty (Art 21), and Right to Constitutional Remedies (Art 32).',
    summaryTamil: 'சட்டத்தின் முன் அனைவரும் சமம் (சரத்து 14), கருத்து சுதந்திரம் (சரத்து 19), வாழ்வுரிமை (சரத்து 21) உள்ளிட்ட குடிமக்களின் தலையாய உரிமைகள்.',
    keySections: ['Article 14 (Equality)', 'Article 21 (Life & Liberty)', 'Article 22 (Protection against arrest and detention)'],
    officialSource: 'Legislative Department, Ministry of Law and Justice',
    url: 'https://legislative.gov.in/constitution-of-india/'
  }
];
