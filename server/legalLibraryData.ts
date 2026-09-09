export interface LegalLibraryRecord {
  id: string;
  title: string;
  titleTamil: string;
  category: 'Constitution' | 'Acts' | 'Rules & Regulations' | 'Citizen Rights' | 'Court Procedures' | 'Government Services' | 'Legal FAQs' | 'Tamil Nadu Laws';
  jurisdiction: 'TN' | 'IN';
  summary: string;
  summaryTamil: string;
  keySections: string[];
  officialSource: string;
  url: string;
}

export const LEGAL_LIBRARY_DATA: LegalLibraryRecord[] = [
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
