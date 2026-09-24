export interface LegalSourceItem {
  title: string;
  section?: string;
  act?: string;
  source?: string;
  url?: string;
  last_verified?: string;
}

export interface ActionPlanItem {
  order: number;
  title: string;
  description: string;
  authority?: string;
  timeline?: string;
}

export interface SynthesizedAnswer {
  answer: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_reason: string;
  sources: LegalSourceItem[];
  action_plan: ActionPlanItem[];
  follow_up_questions: string[];
  domain: string;
  intent: string;
  is_non_legal?: boolean;
}

export type TurnIntent = 
  | 'NEW_QUERY'
  | 'FOLLOW_UP'
  | 'CLARIFICATION'
  | 'ADDITIONAL_FACTS'
  | 'CORRECTION'
  | 'CHANGE_OF_TOPIC';

export function isNonLegalQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  
  // Explicit check for non-legal prompts
  const nonLegalPhrases = [
    'recipe', 'how to cook', 'how to make', 'write a poem', 'write a story', 
    'tell me a joke', 'weather in', 'cricket score', 'movie review', 'lyrics of',
    'python code', 'javascript function', 'solve this math', 'what is photosynthesis',
    'who is prime minister of uk', 'capital of france', 'biryani', 'sambar recipe',
    'movie', 'song', 'football', 'basketball', 'chess', 'bake a cake', 'write an essay on'
  ];
  
  for (const phrase of nonLegalPhrases) {
    if (q.includes(phrase)) return true;
  }

  const hasCooking = q.includes('cook') || q.includes('recipe') || q.includes('bake') || q.includes('dish');
  const hasCreative = (q.includes('poem') || q.includes('poetry') || q.includes('song')) && !q.includes('copyright');
  const hasCode = (q.includes('python') || q.includes('react') || q.includes('javascript') || q.includes('algorithm')) && !q.includes('it act') && !q.includes('cyber');
  
  return hasCooking || hasCreative || hasCode;
}

export function determineTurnIntent(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): TurnIntent {
  if (!history || history.length === 0) {
    return 'NEW_QUERY';
  }

  const q = query.toLowerCase().trim();

  // Correction patterns
  if (q.startsWith('no,') || q.startsWith('actually,') || q.startsWith('i meant') || q.startsWith('illai') || q.startsWith('illai,')) {
    return 'CORRECTION';
  }

  // Follow-up question patterns
  const followUpStarters = [
    'what if', 'what about', 'how about', 'what are the documents', 'what document', 
    'how to file', 'how do i', 'what is the next step', 'where do i go', 'who should i contact',
    'is there any limitation', 'how long', 'what time limit', 'what is the punishment',
    'can they', 'can i', 'what can i do', 'enna seivadhu', 'eppadi', 'aanaal', 'eppo'
  ];
  if (followUpStarters.some(s => q.startsWith(s) || q.includes(s))) {
    return 'FOLLOW_UP';
  }

  // Additional facts / narrative description patterns
  const additionalFactIndicators = [
    'family member', 'uncle', 'relative', 'father', 'brother', 'cousin', 'husband', 'wife',
    'minor', 'child', 'under 18', 'age', 'happened', 'yesterday', 'last night', 'years ago',
    'police refused', 'officer', 'landlord', 'tenant', 'cash', 'cheque', 'director',
    'genitals', 'rubbing', 'touching', 'slurs', 'cat calling', 'threatened', 'abusing',
    'தாக்குதல்', 'உறவினர்', 'குழந்தை', 'காவல்துறை', 'வாடகை', 'பணம்'
  ];
  if (additionalFactIndicators.some(f => q.includes(f))) {
    return 'ADDITIONAL_FACTS';
  }

  // Short clarifications
  if (q.length < 40 && !q.includes('what is the') && !q.includes('law on')) {
    return 'CLARIFICATION';
  }

  return 'FOLLOW_UP';
}

export function buildCombinedLegalContext(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): { combinedQuery: string; detectedTopic: string; hasSexualOffense: boolean; hasPhysicalAssault: boolean; hasPropertyTenancy: boolean; hasCheque: boolean; hasPacs: boolean; hasPMFBY: boolean; isFamilyOffense: boolean; isMinorOffense: boolean } {
  const recentTurns = history.slice(-6).map(h => h.content).join(' ');
  const combinedText = `${recentTurns} ${query}`.toLowerCase();

  const isSexualOffense = 
    combinedText.includes('sexual') || combinedText.includes('genitals') || combinedText.includes('rubbing') ||
    combinedText.includes('molest') || combinedText.includes('rape') || combinedText.includes('harass') ||
    combinedText.includes('cat call') || combinedText.includes('catcall') || combinedText.includes('slur') ||
    combinedText.includes('modesty') || combinedText.includes('பாலியல்') || combinedText.includes('சீண்டல்');

  const isPhysicalAssault = 
    !isSexualOffense && (
      combinedText.includes('assault') || combinedText.includes('hurt') || combinedText.includes('beating') ||
      combinedText.includes('weapon') || combinedText.includes('knife') || combinedText.includes('தாக்குதல்') || combinedText.includes('அடிதடி')
    );

  const isFamily = 
    combinedText.includes('family member') || combinedText.includes('uncle') || combinedText.includes('relative') ||
    combinedText.includes('father') || combinedText.includes('brother') || combinedText.includes('cousin') ||
    combinedText.includes('domestic') || combinedText.includes('shared household') || combinedText.includes('உறவினர்') || combinedText.includes('குடும்ப');

  const isMinor = 
    combinedText.includes('minor') || combinedText.includes('child') || combinedText.includes('under 18') ||
    combinedText.includes('school') || combinedText.includes('pocso') || combinedText.includes('சிறுமி') || combinedText.includes('குழந்தை');

  const isProperty = 
    combinedText.includes('tenant') || combinedText.includes('landlord') || combinedText.includes('rent') ||
    combinedText.includes('evict') || combinedText.includes('patta') || combinedText.includes('encroach') || combinedText.includes('வாடகை');

  const isCheque = 
    combinedText.includes('cheque') || combinedText.includes('bounce') || combinedText.includes('138') ||
    combinedText.includes('காசோலை') || combinedText.includes('செக்');

  const isPacs = 
    combinedText.includes('pacs') || combinedText.includes('cooperative') || combinedText.includes('கூட்டுறவு') ||
    combinedText.includes('உறுப்பினர்');

  const isPMFBY = 
    combinedText.includes('pmfby') || combinedText.includes('crop insurance') || combinedText.includes('crop loss') ||
    combinedText.includes('fasal bima') || combinedText.includes('பயிர் காப்பீடு');

  let detectedTopic = 'general';
  if (isSexualOffense) detectedTopic = 'sexual_offenses';
  else if (isPhysicalAssault) detectedTopic = 'criminal_assault';
  else if (isProperty) detectedTopic = 'property_tenancy';
  else if (isCheque) detectedTopic = 'cheque_bounce';
  else if (isPacs) detectedTopic = 'pacs_cooperative';
  else if (isPMFBY) detectedTopic = 'pmfby_crop_insurance';

  return {
    combinedQuery: combinedText,
    detectedTopic,
    hasSexualOffense: isSexualOffense,
    hasPhysicalAssault: isPhysicalAssault,
    hasPropertyTenancy: isProperty,
    hasCheque: isCheque,
    hasPacs: isPacs,
    hasPMFBY: isPMFBY,
    isFamilyOffense: isFamily,
    isMinorOffense: isMinor
  };
}

export function synthesizeLegalAnswer(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  lang: 'ta' | 'en' | 'tanglish' | 'hi' = 'en',
  jurisdiction: 'TN' | 'IN' = 'TN',
  explanationLevel: string = 'citizen'
): SynthesizedAnswer {
  const isTamil = lang === 'ta';
  const isTanglish = lang === 'tanglish';
  const isHindi = lang === 'hi';

  const cleanQuery = query.toLowerCase().trim();

  // 0. Non-legal Query Refusal (Only if current query in isolation is purely non-legal AND not a follow-up)
  if (isNonLegalQuery(cleanQuery)) {
    return {
      domain: 'general',
      intent: 'Non-legal Query Refusal',
      risk_level: 'low',
      risk_reason: 'Legal-only scope',
      sources: [],
      action_plan: [],
      follow_up_questions: [],
      answer: isTamil 
        ? 'நான் சட்டரீதியான கேள்விகளுக்கு மட்டுமே பதிலளிக்கிறேன்.'
        : isTanglish 
        ? 'I only help with legal queries.'
        : isHindi 
        ? 'मैं केवल कानूनी प्रश्नों में सहायता करता हूँ।' 
        : 'I only help with legal queries.',
      is_non_legal: true
    };
  }

  const context = buildCombinedLegalContext(query, history);

  // ==========================================================================
  // Context-Aware Follow-up: Documents Required
  // ==========================================================================
  if (cleanQuery.includes('what document') || cleanQuery.includes('what documents') || cleanQuery.includes('documents do i need') || cleanQuery.includes('documents needed') || cleanQuery.includes('ஆவணங்கள்')) {
    if (context.hasSexualOffense || context.hasPhysicalAssault || cleanQuery.includes('fir') || cleanQuery.includes('police') || cleanQuery.includes('complaint')) {
      return {
        domain: 'criminal',
        intent: 'Documents Required for Criminal Complaint / FIR',
        risk_level: 'medium',
        risk_reason: 'Essential evidential documentation for criminal investigation',
        sources: [
          {
            title: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
            section: 'Section 173 (Information in cognizable cases & Zero FIR)',
            act: 'BNSS 2023'
          }
        ],
        action_plan: [
          { order: 1, title: 'Prepare Written Complaint', description: 'Write down date, time, exact location, accused details, and sequence of events.', authority: 'Victim / Advocate', timeline: 'Immediate' },
          { order: 2, title: 'Attach Medical & Digital Proofs', description: 'Attach MLC report, photos of injuries, and screenshots/recordings of any threats/slurs.', authority: 'Police Station', timeline: 'Along with complaint' }
        ],
        follow_up_questions: [
          'Can I submit audio or video recordings as evidence?',
          'What should I do if the police refuse to register an FIR?'
        ],
        answer: isTamil 
          ? `காவல் நிலையத்தில் குற்றவியல் புகார் அல்லது FIR பதிவு செய்ய கீழ்க்கண்ட ஆவணங்கள் மற்றும் சான்றுகள் தேவைப்படும்:

1. **எழுத்துப்பூர்வ புகார் மனு:** சம்பவம் நடந்த தேதி, நேரம், இடம், சம்பந்தப்பட்ட நபரின் பெயர், உறவுமுறை மற்றும் முழு விவரங்கள் அடங்கிய கையொப்பமிட்ட மனு.
2. **மருத்துவ சான்றிதழ் (MLC Report):** உடல் ரீதியான காயங்கள் அல்லது பாலியல் அத்துமீறல் நடந்திருந்தால் அரசு மருத்துவமனையில் சிகிச்சை பெற்றதற்கான மருத்துவ சட்ட சான்றிதழ்.
3. **டிஜிட்டல் மற்றும் தகவல் தொடர்பு சான்றுகள்:** வாட்ஸ்அப் உரையாடல்கள், ஆபாச மெசேஜ்கள், ஆடியோ/வீடியோ பதிவுகள் அல்லது அழைப்பு பதிவுகள் (Call logs).
4. **அடையாள ஆவணம்:** புகார்தாரரின் ஆதார் அட்டை அல்லது புகைப்பட அடையாள அட்டை நகல்.
5. **சாட்சிகள் விவரம்:** சம்பவம் நடக்கும் போது அருகில் இருந்த நபர்களின் பெயர்கள் மற்றும் தொடர்பு எண்கள்.

புகார் அளித்தவுடன் காவல்துறையினரிடமிருந்து CSR ரசீது அல்லது இலவச FIR நகலைப் பெற்றுக்கொள்வது உங்கள் சட்டப்பூர்வ உரிமையாகும் (Section 173 BNSS).`
          : `To lodge a formal criminal complaint or FIR with the police for this incident, you should prepare and gather the following documents and evidence:

1. **Detailed Written Complaint:** A signed statement specifying the exact date, time, location, identity and relationship of the accused person, and a factual chronological description of what happened.
2. **Medico-Legal Certificate (MLC):** Medical examination records from a government hospital if any physical contact, assault, or injury took place.
3. **Electronic & Communication Records:** Screenshots of any vulgar or abusive text messages, WhatsApp chats, call recordings, emails, or audio/video clips.
4. **Identity Proof:** A self-attested copy of your government ID (such as Aadhaar card).
5. **Witness Information:** Names and phone numbers of anyone who witnessed the actions or whom you confided in immediately after the incident.

Upon submitting your complaint, the police are mandated under Section 173 BNSS to provide you with an acknowledgment (CSR) and a free copy of the registered FIR.`
      };
    }
  }

  // ==========================================================================
  // 1. Sexual Assault / Harassment / Family Relative Molestation / Verbal Slurs
  // ==========================================================================
  if (context.hasSexualOffense) {
    if (context.isFamilyOffense || cleanQuery.includes('family') || cleanQuery.includes('genitals') || cleanQuery.includes('slurs') || cleanQuery.includes('rubbing')) {
      if (isTamil) {
        return {
          domain: 'criminal',
          intent: 'Sexual Assault & Harassment by Family Member',
          risk_level: 'high',
          risk_reason: 'உறவினர் அல்லது குடும்ப உறுப்பினரால் பாலியல் அத்துமீறல் செய்வது கடுமையான குற்றமாகும்',
          sources: [
            {
              title: 'பாரதிய நியாய சன்ஹிதா, 2023 (BNS)',
              section: 'பிரிவு 74 (பெண்ணின் கண்ணியத்திற்கு பங்கம் விளைவித்தல்), பிரிவு 75 (பாலியல் துன்புறுத்தல்), பிரிவு 79 (சொற்கள் மூலம் இழிவுபடுத்துதல்), பிரிவு 64/65 (பாலியல் வன்கொடுமை)',
              act: 'மத்திய குற்றவியல் சட்டம் 2023',
              source: 'மத்திய சட்ட அமைச்சகம்',
              url: 'https://indiacode.nic.in/'
            },
            {
              title: 'பெண்களுக்கு எதிரான குடும்ப வன்முறை தடுப்புச் சட்டம், 2005 (PWDVA)',
              section: 'பிரிவு 18 (பாதுகாப்பு உத்தரவு) & பிரிவு 19 (இருப்பிட உத்தரவு)',
              act: 'மத்திய சட்டம்',
              source: 'மகளிர் மற்றும் குழந்தைகள் மேம்பாட்டு அமைச்சகம்'
            },
            {
              title: 'பாரதிய நகரிக் சுரக்ஷா சன்ஹிதா, 2023 (BNSS)',
              section: 'பிரிவு 173 (Zero FIR & பெண் காவலர் மூலம் வாக்குமூலம் பதிவு)',
              act: 'குற்றவியல் நடைமுறைச் சட்டம்'
            }
          ],
          action_plan: [
            { order: 1, title: 'உடனடி பாதுகாப்பு & உதவி எண்கள்', description: 'உடனடி உதவிக்கு 112 அல்லது மகளிர் உதவி எண் 1091 / 181-க்கு தொடர்பு கொள்ளவும்.', authority: 'மகளிர் உதவி மையம்', timeline: 'உடனடியாக' },
            { order: 2, title: 'அனைத்து மகளிர் காவல் நிலையத்தில் Zero FIR', description: 'எந்த காவல் நிலையத்திலும் பிரிவு 173 BNSS கீழ் Zero FIR பதிவு செய்யலாம்; பெண் காவலர் மூலம் வாக்குமூலம் பதிவு செய்யப்படும்.', authority: 'அனைத்து மகளிர் காவல் நிலையம் (AWPS)', timeline: 'உடனடியாக' },
            { order: 3, title: 'நீதிமன்ற பாதுகாப்பு உத்தரவு (PWDVA)', description: 'குடும்ப உறுப்பினர் என்பதால் குற்றவாளி உங்களை நெருங்காமல் இருக்க மாஜிஸ்திரேட்டிடம் பாதுகாப்பு ஆணை (Protection Order) பெறலாம்.', authority: 'நீதித்துறை நடுவர் நீதிமன்றம்', timeline: 'வழக்கறிஞர் / பாதுகாப்பு அதிகாரி மூலம்' }
          ],
          follow_up_questions: [
            'பாதிக்கப்பட்டவர் 18 வயதுக்குட்பட்டவரா (POCSO சட்டம் பொருந்துமா)?',
            'காவல்துறையில் புகார் அளிக்க என்னென்ன சான்றுகள் அல்லது சாட்சிகள் உதவும்?',
            'குடும்ப வன்முறை சட்டத்தின் கீழ் தங்குமிட பாதுகாப்பு உத்தரவு பெறுவது எப்படி?'
          ],
          answer: `குடும்ப உறுப்பினர் ஒருவர் உங்கள் விருப்பத்திற்கு மாறாக உடலைத் தொடுவது, பாலியல் ரீதியாக அத்துமீறுவது மற்றும் ஆபாசமாக திட்டுவது (catcalling/slurs) இந்திய சட்டப்படி மிகக் கடுமையான குற்றங்களாகும்.

பாரதிய நியாய சன்ஹிதா, 2023 (BNS)-ன் கீழ்:
1. **பாலியல் அத்துமீறல் மற்றும் கண்ணியத்திற்கு பங்கம் விளைவித்தல் (Section 74 BNS):** 1 முதல் 5 ஆண்டுகள் வரை கட்டாய சிறைத்தண்டனை மற்றும் அபராதம் விதிக்கப்படும் (ஜாமீனில் வெளிவர முடியாத குற்றம்).
2. **பாலியல் துன்புறுத்தல் (Section 75 BNS):** உடல் ரீதியான சீண்டல்களுக்கு 3 ஆண்டுகள் வரை சிறைத்தண்டனை உண்டு.
3. **வார்த்தைகள் மூலம் இழிவுபடுத்துதல் (Section 79 BNS):** ஆபாச வார்த்தைகள் மற்றும் திட்டுதல்களுக்கு 3 ஆண்டுகள் வரை சிறைத்தண்டனை விதிக்கப்படும்.
4. **உறவினர் அல்லது நம்பிக்கைக்குரியவர் மீதான கடுமையான தண்டனை (Section 64/65 BNS):** கடுமையான பாலியல் வன்கொடுமைக்கு 10 ஆண்டுகள் முதல் ஆயுள் தண்டனை வரை நீட்டிக்கப்படும்.

பாதிக்கப்பட்டவர் 18 வயதுக்குட்பட்டவராக இருந்தால் போக்சோ சட்டம் (POCSO Act) கீழ் மேலும் கடுமையான பிரிவுகள் பாயும்.

நீங்கள் உடனடியாக அனைத்து மகளிர் காவல் நிலையத்தில் (AWPS) அல்லது அருகிலுள்ள எந்த காவல் நிலையத்திலும் **Zero FIR (பிரிவு 173 BNSS)** பதிவு செய்யலாம். குடும்ப வன்முறை தடுப்புச் சட்டம் (PWDVA 2005) மூலமாகவும் அந்த நபர் உங்களை அணுகாதவாறு நீதிமன்ற பாதுகாப்பு உத்தரவு (Protection Order) பெற முடியும்.`
        };
      } else if (isTanglish) {
        return {
          domain: 'criminal',
          intent: 'Sexual Assault & Harassment by Family Member',
          risk_level: 'high',
          risk_reason: 'Sexual assault and harassment by a family member is a serious non-bailable offense under BNS',
          sources: [
            {
              title: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
              section: 'Section 74 (Outraging modesty), Section 75 (Sexual harassment), Section 79 (Insulting modesty through words/slurs), Section 64/65',
              act: 'BNS 2023',
              source: 'Ministry of Law and Justice',
              url: 'https://indiacode.nic.in/'
            },
            {
              title: 'Protection of Women from Domestic Violence Act, 2005 (PWDVA)',
              section: 'Section 18 (Protection Orders), Section 19 (Residence Orders)',
              act: 'Central Act',
              source: 'Ministry of Women and Child Development'
            }
          ],
          action_plan: [
            { order: 1, title: 'Emergency Contact', description: 'Urgent protection-kku 112 alladhu Women Helpline 1091 / 181 call pannunga.', authority: 'Women Helpline / Police', timeline: 'Immediate' },
            { order: 2, title: 'All Women Police Station FIR', description: 'All Women Police Station-la Zero FIR register pannunga (Section 173 BNSS).', authority: 'AWPS Police', timeline: 'Immediate' },
            { order: 3, title: 'Court Protection Order', description: 'Family member ungalai approach panna koodadhu nu Magistrate kitta Protection Order apply pannalam.', authority: 'Judicial Magistrate Court', timeline: 'Through Protection Officer' }
          ],
          follow_up_questions: [
            'Victim 18 years-kku ulla minor-ah (POCSO Act apply aaguma)?',
            'Police FIR poda refuse pannina enna seivadhu?',
            'Domestic Violence Act padi house protection order epdi vaanguradhu?'
          ],
          answer: `Oru family member unga permission illama unga physical body-ai touch panradhu, forceful sexual contact seiradhu, matrum vulgar slurs / catcalling panradhu Indian Law padi severe non-bailable criminal offense.

Bharatiya Nyaya Sanhita (BNS), 2023 padi:
1. **Outraging Modesty & Forceful Contact (Section 74 BNS):** Forceful touch matrum rubbing panradhukku minimum 1 year mudhal 5 years varaikkum non-bailable jail imprisonment kedaikkum.
2. **Sexual Harassment (Section 75 BNS):** Unwelcome physical contact-kku 3 years varai jail sentence.
3. **Insulting Modesty through Words & Slurs (Section 79 BNS):** Catcalling matrum sexually abusive words use pannina 3 years jail fine varum.
4. **Aggravated Offense by Relative (Section 64/65 BNS):** Family member or relative position of trust-la irundhu severe assault pannina 10 years mudhal Life Imprisonment varai punishment kedaikkum.

Victim 18 years-kku keezha irundha POCSO Act Section 7/8/9 padi strict action edukkum. Neenga ungalukku pakkathula irukka All Women Police Station (AWPS) poi Zero FIR file pannalaam, koodave Magistrate kitta PWDVA Act padi Protection Order vaangalaam.`
        };
      } else {
        return {
          domain: 'criminal',
          intent: 'Sexual Assault, Harassment & Outraging Modesty by a Family Member',
          risk_level: 'high',
          risk_reason: 'Non-consensual sexual contact, outraging modesty, and harassment by a relative carry severe non-bailable imprisonment under BNS 2023 and PWDVA',
          sources: [
            {
              title: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
              section: 'Section 74 (Assault/Criminal force to woman with intent to outrage modesty), Section 75 (Sexual harassment), Section 79 (Words, gestures or acts intended to insult modesty), Section 64/65',
              act: 'Central Act 45 of 2023',
              source: 'Ministry of Law and Justice, Government of India',
              url: 'https://indiacode.nic.in/'
            },
            {
              title: 'Protection of Women from Domestic Violence Act, 2005 (PWDVA)',
              section: 'Section 18 (Protection Orders), Section 19 (Residence Orders)',
              act: 'Central Legislation',
              source: 'Ministry of Women and Child Development'
            },
            {
              title: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
              section: 'Section 173 (Zero FIR & Mandatory Recording by Woman Officer)',
              act: 'BNSS 2023'
            }
          ],
          action_plan: [
            { order: 1, title: 'Emergency Safety & Helplines', description: 'Dial National Emergency 112 or Women Helpline 1091 / 181 for immediate police assistance and protection.', authority: 'Women Helpline / Police', timeline: 'Immediate' },
            { order: 2, title: 'Register Zero FIR at All Women Police Station', description: 'Lodge a formal complaint under Section 173 BNSS; by law, your statement must be recorded by a woman police officer and a free copy of the FIR provided immediately.', authority: 'All Women Police Station (AWPS)', timeline: 'Immediate' },
            { order: 3, title: 'Seek Magistrate Protection & Restraining Order', description: 'Under PWDVA 2005, obtain a court Protection Order restraining the family member from entering your room or contacting you.', authority: 'Judicial Magistrate / Protection Officer', timeline: 'Immediate' }
          ],
          follow_up_questions: [
            'Is the victim under 18 years of age (invoking mandatory POCSO Act provisions)?',
            'What evidence or records should be preserved before filing the police complaint?',
            'How can I get an urgent court restraining order under the Domestic Violence Act?'
          ],
          answer: `What you have described—a family member forcefully rubbing their genitals over you and subjecting you to verbal catcalling and slurs—constitutes serious, non-bailable criminal offenses under Indian law.

Under the **Bharatiya Nyaya Sanhita, 2023 (BNS)**:
1. **Forceful Contact & Outraging Modesty (Section 74 BNS):** Using criminal force or non-consensual contact to outrage a woman's modesty is a cognizable, non-bailable offense punishable with **1 to 5 years of rigorous imprisonment** and a fine.
2. **Sexual Harassment (Section 75 BNS):** Unwelcome physical contact advances carry up to **3 years imprisonment**.
3. **Catcalling & Verbal Slurs (Section 79 BNS):** Using sexually abusive words, gestures, or slurs intended to insult your modesty is punishable with up to **3 years imprisonment** and fine.
4. **Aggravated Sexual Offense by a Relative (Sections 64/65 BNS):** When sexual assault or penetration is committed by a relative or person in a position of trust, the law treats it as aggravated offense with mandatory minimum punishment of **10 years extending to life imprisonment**.

If the survivor is under 18 years old, the **POCSO Act, 2012** applies immediately, carrying even stricter statutory minimum penalties.

**Immediate Legal Steps:**
- You can register a **Zero FIR (under Section 173 BNSS)** at any police station or All Women Police Station (AWPS). By law, your statement must be recorded privately by a female police officer.
- You can also apply for an urgent **Protection Order under the Protection of Women from Domestic Violence Act (PWDVA), 2005**, which legally prohibits this person from entering your space, communicating with you, or staying in the shared household.`
        };
      }
    }
  }

  // ==========================================================================
  // 2. Physical Assault / Hurt
  // ==========================================================================
  if (context.hasPhysicalAssault || cleanQuery.includes('assault') || cleanQuery.includes('hurt') || cleanQuery.includes('தாக்குதல்')) {
    if (context.isMinorOffense || cleanQuery.includes('minor') || cleanQuery.includes('child')) {
      return {
        domain: 'criminal',
        intent: 'Assault against a Minor under BNS and Juvenile Justice Act',
        risk_level: 'high',
        risk_reason: 'குழந்தைகள் அல்லது சிறார்கள் மீதான தாக்குதல் கடுமையான சட்டப்பிரிவுகளின் கீழ் வரும்',
        sources: [
          {
            title: 'பாரதிய நியாய சன்ஹிதா, 2023 (BNS)',
            section: 'பிரிவு 115, பிரிவு 117, பிரிவு 118',
            act: 'BNS 2023',
            source: 'மத்திய சட்ட அமைச்சகம்',
            url: 'https://indiacode.nic.in/'
          },
          {
            title: 'இளஞ்சிறார் நீதி சட்டம், 2015 (Juvenile Justice Act)',
            section: 'பிரிவு 75 (குழந்தைகள் மீதான கொடுமை)',
            act: 'JJ Act 2015',
            source: 'மத்திய அரசு'
          }
        ],
        action_plan: [
          { order: 1, title: 'மருத்துவ சிகிச்சை & சான்றிதழ்', description: 'குழந்தைக்கு அரசு மருத்துவமனையில் சிகிச்சை அளித்து MLC சான்றிதழ் பெறவும்.', authority: 'அரசு மருத்துவமனை', timeline: 'உடனடியாக' },
          { order: 2, title: 'காவல் நிலையம் & Childline 1098', description: '1098 சைல்டுலைன் அல்லது காவல் நிலையத்தில் புகார் அளிக்கவும்.', authority: 'காவல்துறை / CWC', timeline: 'உடனடியாக' }
        ],
        follow_up_questions: [
          'குழந்தை நலக் குழு (CWC) முன் எவ்வாறு ஆஜர்படுத்துவது?',
          'பள்ளியில் அல்லது காப்பகத்தில் நடந்த தாக்குதலுக்கு யார் பொறுப்பு?'
        ],
        answer: isTamil 
          ? `பாதிக்கப்பட்டவர் 18 வயதுக்குட்பட்ட சிறுவர்/சிறுமியாக இருக்கும்போது, தாக்குதல் நடத்தியவர் மீது BNS சட்டப்பிரிவுகளுடன் சேர்த்து **இளஞ்சிறார் நீதி சட்டம், 2015 (Juvenile Justice Act) பிரிவு 75**-ன் கீழும் வழக்கு பதிவு செய்யப்படும்.

JJ Act பிரிவு 75-ன் கீழ் ஒரு குழந்தையை தாக்குவது அல்லது கொடுமைப்படுத்துவது 3 ஆண்டுகள் வரை சிறைத்தண்டனை மற்றும் ₹1 லட்சம் அபராதம் விதிக்கக்கூடிய கடுமையான குற்றமாகும். ஆபத்தான ஆயுதங்கள் பயன்படுத்தப்பட்டிருந்தால் தண்டனை மேலும் அதிகரிக்கும்.

உடனடியாக 1098 (Childline) அல்லது காவல் நிலையத்தில் புகார் அளித்து, அரசு மருத்துவமனையில் குழந்தைக்கு மருத்துவ சட்ட சான்றிதழ் (MLC) பெற வேண்டும்.`
          : `If the victim is a minor (under 18 years old), the offender faces charges under both the Bharatiya Nyaya Sanhita (BNS) and **Section 75 of the Juvenile Justice (Care and Protection of Children) Act, 2015**.

Under Section 75 of the JJ Act, causing physical cruelty or assault to a child is punishable with **imprisonment for up to 3 years and a fine of ₹1 lakh**. If dangerous weapons or grievous injuries are involved, Section 117/118 of BNS adds further severe imprisonment of up to 7 years.

Immediate steps include contacting **Childline at 1098** or the nearest police station, and taking the minor to a government hospital for a Medico-Legal Certificate (MLC).`
      };
    }

    if (isTamil) {
      return {
        domain: 'criminal',
        intent: 'Punishment for Physical Assault under BNS',
        risk_level: 'high',
        risk_reason: 'உடல் மீதான தாக்குதல் பாரதிய நியாய சகிதை (BNS) கீழ் தண்டனைக்குரிய குற்றமாகும்',
        sources: [
          {
            title: 'பாரதிய நியாய சன்ஹிதா, 2023 (BNS)',
            section: 'பிரிவு 115(2), பிரிவு 117, பிரிவு 118, பிரிவு 131',
            act: 'மத்திய குற்றவியல் சட்டம்',
            source: 'மத்திய சட்ட அமைச்சகம்',
            url: 'https://www.indiacode.nic.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'மருத்துவ பரிசோதனை & MLC', description: 'உடனடியாக அரசு மருத்துவமனையில் சிகிச்சை பெற்று MLC சான்றிதழ் பெறவும்.', authority: 'அரசு மருத்துவமனை', timeline: 'உடனடியாக' },
          { order: 2, title: 'காவல் நிலையத்தில் FIR பதிவு', description: 'காவல் நிலையத்தில் பிரிவு 173 BNSS கீழ் புகார் அளித்து இலவச FIR நகல் பெறவும்.', authority: 'காவல் நிலையம்', timeline: 'உடனடியாக' }
        ],
        follow_up_questions: [
          'காவல்துறை FIR பதிவு செய்ய மறுத்தால் என்ன செய்வது?',
          'ஆயுதத்தால் தாக்கப்பட்டால் பொருந்தும் சட்டப்பிரிவு எது?'
        ],
        answer: `இந்தியாவில் ஒருவரை தாக்குவது அல்லது காயம் ஏற்படுத்துவது பாரதிய நியாய சன்ஹிதா, 2023 (BNS)-ன் கீழ் தண்டனைக்குரிய குற்றமாகும். தண்டனை காயத்தின் தீவிரத்தையும் பயன்படுத்தப்பட்ட ஆயுதத்தையும் பொறுத்தது.

எளிய காயம் ஏற்படுத்தினால் (Section 115(2) BNS), 1 ஆண்டு வரை சிறை அல்லது ₹10,000 வரை அபராதம் விதிக்கப்படலாம். கத்தி அல்லது தடி போன்ற ஆபத்தான ஆயுதங்களால் தாக்கினால் (Section 118 BNS), 3 ஆண்டுகள் வரை சிறைத்தண்டனை கிடைக்கும். எலும்பு முறிவு அல்லது கடுமையான காயம் (Grievous hurt - Section 117 BNS) ஏற்பட்டால் 7 ஆண்டுகள் வரை சிறைத்தண்டனை மற்றும் அபராதம் விதிக்கப்படும்.

பாதிக்கப்பட்டவர் உடனடியாக அரசு மருத்துவமனைக்குச் சென்று மருத்துவ சட்ட சான்றிதழ் (MLC) பெற்று, காவல் நிலையத்தில் FIR பதிவு செய்வது முதல் கட்ட சட்ட நடவடிக்கையாகும்.`
      };
    } else {
      return {
        domain: 'criminal',
        intent: 'Punishment for Physical Assault under Indian Criminal Law',
        risk_level: 'high',
        risk_reason: 'Assault and hurt carry custodial imprisonment and fines under BNS 2023',
        sources: [
          {
            title: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
            section: 'Sections 115(2), 117, 118, 131',
            act: 'Central Act 45 of 2023',
            source: 'Ministry of Law and Justice, Government of India',
            url: 'https://www.indiacode.nic.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'Obtain Medico-Legal Certificate (MLC)', description: 'Visit a government hospital immediately to treat injuries and have an official MLC issued.', authority: 'Government Hospital', timeline: 'Immediate' },
          { order: 2, title: 'Register FIR under Section 173 BNSS', description: 'Submit a formal written complaint at the police station and get a free copy of the FIR.', authority: 'Police Station', timeline: 'Immediate' }
        ],
        follow_up_questions: [
          'What is the legal remedy if the police refuse to register an FIR?',
          'How does the law distinguish between simple hurt and grievous hurt under BNS?'
        ],
        answer: `Under Indian criminal law (Bharatiya Nyaya Sanhita, 2023), the punishment for assault depends on the severity of the injury and whether weapons were involved.

For simple hurt (like slapping or minor bruises), Section 115(2) BNS provides for imprisonment of up to 1 year, a fine up to ₹10,000, or both. If dangerous weapons such as knives, rods, or sharp instruments are used, Section 118 BNS increases the punishment to up to 3 years imprisonment. If the assault results in grievous hurt (such as a bone fracture, joint dislocation, or permanent injury), Section 117 BNS imposes imprisonment of up to 7 years along with a mandatory fine.

If someone has been assaulted, the immediate practical step is to get treated at a government hospital to obtain a Medico-Legal Certificate (MLC) and register an FIR at the jurisdictional police station.`
      };
    }
  }

  // ==========================================================================
  // 3. Follow-up: Documents Required (Contextual)
  // ==========================================================================
  if (cleanQuery.includes('what document') || cleanQuery.includes('what documents') || cleanQuery.includes('documents do i need') || cleanQuery.includes('ஆவணங்கள்')) {
    if (context.hasSexualOffense || context.hasPhysicalAssault) {
      return {
        domain: 'criminal',
        intent: 'Documents Required for Criminal Complaint / FIR',
        risk_level: 'medium',
        risk_reason: 'Essential evidential documentation for criminal investigation',
        sources: [
          {
            title: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
            section: 'Section 173 (Information in cognizable cases)',
            act: 'BNSS 2023'
          }
        ],
        action_plan: [
          { order: 1, title: 'Prepare Written Complaint', description: 'Write down date, time, exact location, accused details, and sequence of events.', authority: 'Victim / Advocate', timeline: 'Immediate' },
          { order: 2, title: 'Attach Medical & Digital Proofs', description: 'Attach MLC report, photos of injuries, and screenshots/recordings of any threats/slurs.', authority: 'Police Station', timeline: 'Along with complaint' }
        ],
        follow_up_questions: [
          'Can I submit audio or video recordings as evidence?',
          'What should I do if the accused destroys electronic evidence?'
        ],
        answer: isTamil 
          ? `காவல் நிலையத்தில் குற்றவியல் புகார் அல்லது FIR பதிவு செய்ய கீழ்க்கண்ட ஆவணங்கள் மற்றும் சான்றுகள் தேவைப்படும்:

1. **எழுத்துப்பூர்வ புகார் மனு:** சம்பவம் நடந்த தேதி, நேரம், இடம், சம்பந்தப்பட்ட நபர்களின் பெயர் மற்றும் முழு விவரங்கள் அடங்கிய கையொப்பமிட்ட மனு.
2. **மருத்துவ சான்றிதழ் (MLC Report):** அரசு மருத்துவமனையில் சிகிச்சை பெற்றதற்கான மருத்துவ சட்ட ஆவணம்.
3. **டிஜிட்டல் மற்றும் தகவல் தொடர்பு சான்றுகள்:** ஆபாச மெசேஜ்கள், வாட்ஸ்அப் உரையாடல்கள், ஆடியோ/வீடியோ பதிவுகள் அல்லது அழைப்பு பதிவுகள் (Call logs).
4. **அடையாள ஆவணம்:** புகார்தாரரின் ஆதார் அட்டை அல்லது வாக்காளர் அடையாள அட்டை நகல்.
5. **நேரில் பார்த்த சாட்சிகள்:** சம்பவம் நடக்கும் போது அருகில் இருந்த நபர்களின் பெயர்கள் மற்றும் தொடர்பு எண்கள்.

புகார் அளித்தவுடன் காவல்துறையினரிடமிருந்து CSR ரசீது அல்லது இலவச FIR நகலைப் பெற்றுக்கொள்வது உங்கள் சட்டப்பூர்வ உரிமையாகும்.`
          : `To lodge a formal criminal complaint or FIR with the police, you should gather the following essential documents and evidence:

1. **Written Complaint:** A detailed signed statement mentioning the exact date, time, location, identity/relationship of the accused, and a clear narrative of what occurred.
2. **Medico-Legal Certificate (MLC):** Medical examination records from a government hospital if any physical contact, assault, or injury occurred.
3. **Electronic & Communication Evidence:** Screenshots of abusive messages, WhatsApp chats, call logs, emails, or audio/video recordings.
4. **Identity Proof:** A copy of your Aadhaar card or government ID.
5. **Witness Details:** Names and contact details of anyone who witnessed the incident or to whom you immediately disclosed the incident.

Upon submitting the complaint under Section 173 BNSS, you are entitled to receive a free copy of the registered FIR or CSR acknowledgment.`
      };
    }
  }

  // ==========================================================================
  // 4. PACS Member Rights & Cooperative Law
  // ==========================================================================
  if (context.hasPacs || cleanQuery.includes('pacs') || cleanQuery.includes('கூட்டுறவு')) {
    if (isTamil) {
      return {
        domain: 'cooperative_law',
        intent: 'Statutory Rights of a PACS Member',
        risk_level: 'medium',
        risk_reason: 'தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம் 1983-ன் கீழ் உறுப்பினர் உரிமைகள் பாதுகாக்கப்பட்டுள்ளன',
        sources: [
          {
            title: 'தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம், 1983',
            section: 'பிரிவு 21, பிரிவு 23, பிரிவு 26, பிரிவு 72',
            act: 'TN Act 30 of 1983',
            source: 'கூட்டுறவு சங்கங்களின் பதிவாளர்',
            url: 'https://cooperation.tn.gov.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'உறுப்பினர் பாஸ்புக் சரிபார்ப்பு', description: 'சங்கத்தில் வழங்கப்பட்ட உறுப்பினர் எண் மற்றும் கடன் பதிவேட்டை சரிபார்க்கவும்.', authority: 'PACS செயலாளர்', timeline: 'உடனடியாக' },
          { order: 2, title: 'துணைப் பதிவாளரிடம் முறையீடு', description: 'உரிமைகள் மறுக்கப்பட்டால் வட்ட கூட்டுறவு துணைப் பதிவாளரிடம் (DRCS) முறையிடவும்.', authority: 'வட்ட DRCS', timeline: '30 நாட்களுக்குள்' }
        ],
        follow_up_questions: [
          'PACS உறுப்பினர் சேர்க்கை மறுக்கப்பட்டால் மேல்முறையீடு செய்வது எப்படி?',
          'கூட்டுறவு சங்கத்தில் பயிர்க்கடன் வட்டி மானிய விகிதம் எவ்வளவு?'
        ],
        answer: `தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம், 1983-ன் கீழ், ஒரு தொடக்க வேளாண் கூட்டுறவு சங்க (PACS) உறுப்பினருக்கு பல சட்டப்பூர்வ உரிமைகள் உள்ளன.

முதலாவதாக, தகுதியுள்ள எந்தவொரு விவசாயியும் சங்கத்தில் உறுப்பினராக சேர உரிமை உண்டு (Section 21). விண்ணப்பித்து 60 நாட்களுக்குள் சங்கம் பதிலளிக்கவில்லை என்றால், அவர் தானாகவே உறுப்பினராக சேர்க்கப்பட்டதாக கருதப்படுவார். 

மேலும், உறுப்பினர்களுக்கு சங்கத்தின் கணக்கு புத்தகங்களை பார்வையிடும் உரிமை (Section 23), பொதுக்குழுவில் வாக்களிக்கும் உரிமை (Section 26), 4% குறைந்த வட்டியில் பயிர்க்கடன் பெறும் உரிமை, மற்றும் சங்கத்தின் லாபத்தில் 14% வரை ஈவுத்தொகை (Dividend) பெறும் உரிமை உண்டு. சங்கம் இந்த உரிமைகளை மறுத்தால், வட்ட கூட்டுறவு துணைப் பதிவாளரிடம் (DRCS) புகார் அளிக்கலாம்.`
      };
    } else {
      return {
        domain: 'cooperative_law',
        intent: 'Rights of a PACS Member in Tamil Nadu',
        risk_level: 'medium',
        risk_reason: 'Guaranteed by Tamil Nadu Co-operative Societies Act 1983',
        sources: [
          {
            title: 'Tamil Nadu Co-operative Societies Act, 1983',
            section: 'Section 21, Section 23, Section 26, Section 72',
            act: 'TN Act 30 of 1983',
            source: 'Department of Co-operation, TN',
            url: 'https://cooperation.tn.gov.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'Verify Member Passbook', description: 'Ensure issuance of an official share capital receipt and computerized passbook.', authority: 'PACS Secretary', timeline: 'Immediate' }
        ],
        follow_up_questions: [
          'What is the procedure to appeal against refusal of PACS membership?',
          'How does the 60-day deemed admission rule work in practice?'
        ],
        answer: `As a member of a Primary Agricultural Credit Society (PACS) in Tamil Nadu, you have several statutory rights protected under the Tamil Nadu Co-operative Societies Act, 1983.

You have the right to membership if you cultivate land in the society's area (Section 21). If the society does not respond to your membership application within 60 days, you are automatically deemed admitted. 

Additionally, you are entitled to inspect the society's audited accounts and your loan ledger (Section 23), vote in general body meetings and elections (Section 26), access subsidized crop loans (KCC loans at an effective 4% interest rate with prompt repayment), and receive dividends up to 14% on your share capital. If any of these rights are denied, you can file a formal grievance with the Circle Deputy Registrar of Co-operative Societies.`
      };
    }
  }

  // ==========================================================================
  // 5. PMFBY Crop Insurance Appeal
  // ==========================================================================
  if (context.hasPMFBY || cleanQuery.includes('pmfby') || cleanQuery.includes('crop insurance') || cleanQuery.includes('பயிர் காப்பீடு')) {
    if (isTamil) {
      return {
        domain: 'crop_insurance',
        intent: 'Appeal Rejected PMFBY Crop Loss Claim',
        risk_level: 'high',
        risk_reason: 'DGRC குறைதீர்ப்பு நடைமுறை',
        sources: [
          {
            title: 'PMFBY செயல்பாட்டு வழிகாட்டு நெறிமுறைகள்',
            section: 'பத்தி 21 (குறைதீர் வழிமுறை - DGRC)',
            act: 'PMFBY Operational Guidelines',
            source: 'மத்திய வேளாண்மை அமைச்சகம்',
            url: 'https://pmfby.gov.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'ஆவணங்கள் சேகரிப்பு', description: 'காப்பீட்டு பிரீமியம் ரசீது, அடங்கல் மற்றும் டோக்கன் எண்ணை சேகரிக்கவும்.', authority: 'PACS / வங்கி', timeline: 'உடனடியாக' },
          { order: 2, title: 'DGRC மாவட்ட குழுவிடம் மனு', description: 'மாவட்ட ஆட்சியர் தலைமையிலான குறைதீர் குழுவிடம் மனு சமர்ப்பிக்கவும்.', authority: 'மாவட்ட ஆட்சியர்', timeline: '30 நாட்களுக்குள்' }
        ],
        follow_up_questions: [
          'DGRC குறைதீர் குழுவிற்கு மனு எழுதுவது எப்படி?',
          '72 மணி நேரத்திற்குள் தகவல் தெரிவிக்க தவறினால் என்ன செய்வது?'
        ],
        answer: `பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டத்தில் (PMFBY) உங்கள் பயிர் இழப்பீட்டுக் கோரிக்கை நிராகரிக்கப்பட்டாலோ அல்லது தாமதமானாலோ, மாவட்ட ஆட்சியர் தலைமையிலான மாவட்ட குறைதீர்க்கும் குழுவிடம் (DGRC) நீங்கள் மேல்முறையீடு செய்யலாம்.

இதற்கு உங்கள் காப்பீட்டு பிரீமியம் ரசீது, கிராம நிர்வாக அலுவலர் (VAO) வழங்கிய அடங்கல் சான்றிதழ், கள ஆய்வு அறிக்கை மற்றும் நீங்கள் 14447 உதவி எண் மூலம் பதிவு செய்த டோக்கன் எண் ஆகியவற்றை இணைத்து மனு அளிக்க வேண்டும். 

DGRC குழு உங்கள் மனுவை 30 நாட்களுக்குள் விசாரித்து உத்தரவு பிறப்பிக்க வேண்டும். அங்கும் தீர்வு கிடைக்காவிடில், மாநில அளவிலான குறைதீர் குழுவிற்கு (SGRC) மேல்முறையீடு செய்ய முடியும்.`
      };
    } else {
      return {
        domain: 'crop_insurance',
        intent: 'Appeal a Rejected PMFBY Crop Loss Claim',
        risk_level: 'high',
        risk_reason: 'Statutory appeal lies before DGRC chaired by District Collector',
        sources: [
          {
            title: 'PMFBY Operational Guidelines',
            section: 'Para 21 (Grievance Redressal Mechanism)',
            act: 'PMFBY Operational Guidelines',
            source: 'Ministry of Agriculture & Farmers Welfare',
            url: 'https://pmfby.gov.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'Assemble Documents', description: 'Gather bank premium debit receipt, Adangal, and 14447 intimation docket number.', authority: 'PACS / Bank', timeline: 'Immediate' },
          { order: 2, title: 'File Appeal with DGRC', description: 'Submit a petition to the District Grievance Redressal Committee chaired by the District Collector.', authority: 'District Collectorate', timeline: 'Within 30 days' }
        ],
        follow_up_questions: [
          'What documents are needed for a DGRC appeal?',
          'How does the 72-hour localized calamity rule work?'
        ],
        answer: `If your PMFBY crop insurance claim was rejected or underpaid, you can file an appeal before the District Level Grievance Redressal Committee (DGRC), which is chaired by the District Collector.

To file the appeal, attach your bank premium deduction receipt, revenue Adangal (cultivation proof), field damage photos, and the 72-hour intimation docket number received from the 14447 helpline or app.

The DGRC is mandated to review the survey reports and premium records and pass an order within 30 days. If the district committee does not resolve the issue satisfactorily, you can escalate the matter to the State Level Grievance Redressal Committee (SGRC).`
      };
    }
  }

  // ==========================================================================
  // 6. Property & Tenancy Notice Period
  // ==========================================================================
  if (context.hasPropertyTenancy || cleanQuery.includes('tenant') || cleanQuery.includes('landlord') || cleanQuery.includes('வாடகை')) {
    if (isTamil) {
      return {
        domain: 'property',
        intent: 'Tenant Eviction Notice Period in Tamil Nadu',
        risk_level: 'medium',
        risk_reason: 'TNRRRLT Act 2017 விதிகள் பொருந்தும்',
        sources: [
          {
            title: 'தமிழ்நாடு நில உரிமையாளர்கள் மற்றும் வாடகையாளர்கள் உரிமை ஒழுங்குமுறைச் சட்டம், 2017',
            section: 'பிரிவு 8 & பிரிவு 21',
            act: 'TNRRRLT Act 2017',
            source: 'வீட்டுவசதித் துறை, தமிழ்நாடு அரசு',
            url: 'https://tenancy.tn.gov.in/'
          }
        ],
        action_plan: [
          { order: 1, title: '30 நாட்கள் நோட்டீஸ்', description: 'பதிவு அஞ்சலில் (RPAD) 30 நாட்கள் அவகாசத்துடன் நோட்டீஸ் அனுப்பவும்.', authority: 'நில உரிமையாளர் / வழக்கறிஞர்', timeline: '30 நாட்கள்' }
        ],
        follow_up_questions: [
          'வாடகை ஒப்பந்தம் பதிவு செய்யப்படாவிட்டால் என்ன செய்வது?',
          'குடியிருப்பு வீட்டிற்கு அதிகபட்ச முன்பணம் (Advance) எவ்வளவு?'
        ],
        answer: `தமிழ்நாடு வாடகை சட்டம் 2017 (TNRRRLT Act)-ன் படி, ஒரு நில உரிமையாளர் வாடகைதாரரை காலி செய்யக் கோர குறைந்தபட்சம் 30 நாட்கள் எழுத்துப்பூர்வ நோட்டீஸ் வழங்க வேண்டும் (அல்லது ஒப்பந்தத்தில் ஒப்புக்கொண்ட காலம்).

மேலும், குடியிருப்பு வீடுகளுக்கு அதிகபட்சமாக 3 மாத வாடகைத் தொகையை மட்டுமே முன்பணமாக (Security Deposit) பெற சட்டம் அனுமதிக்கிறது. 

வாடகைதாரர் நோட்டீஸ் காலத்திற்குள் காலி செய்யாவிட்டால், உரிமையாளர் நேரடியாக பூட்டு போடவோ அல்லது மின்சாரம்/தண்ணீர் இணைப்பை துண்டிக்கவோ கூடாது; நியமிக்கப்பட்ட வாடகை நீதிமன்றத்தில் (Rent Court) மட்டுமே வெளியேற்ற மனு தாக்கல் செய்ய வேண்டும்.`
      };
    } else {
      return {
        domain: 'property',
        intent: 'Tenant Notice Period in Tamil Nadu',
        risk_level: 'medium',
        risk_reason: 'Governed by TNRRRLT Act 2017',
        sources: [
          {
            title: 'Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017',
            section: 'Section 8, Section 21',
            act: 'TNRRRLT Act 2017',
            source: 'Housing and Urban Development Department, TN',
            url: 'https://tenancy.tn.gov.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'Serve 30-Day Legal Notice', description: 'Send a formal written notice via Registered Post with Acknowledgment Due.', authority: 'Landlord / Advocate', timeline: '30 Days Notice' }
        ],
        follow_up_questions: [
          'What happens if the tenancy agreement is not registered?',
          'Can a landlord cut off water or electricity supply to evict a tenant?'
        ],
        answer: `In Tamil Nadu, under the TNRRRLT Act 2017, a landlord must provide at least 30 days of written notice (or the notice duration specified in the registered tenancy agreement) before asking a tenant to vacate.

The law also caps the security deposit for residential premises at a maximum of 3 months' rent. 

Landlords are strictly prohibited from using self-help measures such as cutting off electricity, water, or locking the property. If the tenant does not vacate after the notice period expires, the landlord must file an eviction petition before the designated Rent Court.`
      };
    }
  }

  // ==========================================================================
  // 7. Cheque Bounce (Section 138 NI Act)
  // ==========================================================================
  if (context.hasCheque || cleanQuery.includes('cheque') || cleanQuery.includes('bounce') || cleanQuery.includes('138') || cleanQuery.includes('காசோலை')) {
    if (isTamil) {
      return {
        domain: 'finance',
        intent: 'Cheque Bounce Law under Section 138 NI Act',
        risk_level: 'high',
        risk_reason: '30 நாட்கள் நோட்டீஸ் மற்றும் 1 மாத நீதிமன்ற காலக்கெடு கட்டாயம்',
        sources: [
          {
            title: 'மாற்றுமுறை ஆவணச் சட்டம், 1881',
            section: 'பிரிவு 138, பிரிவு 142',
            act: 'NI Act 1881',
            source: 'மத்திய சட்ட அமைச்சகம்',
            url: 'https://indiacode.nic.in/'
          }
        ],
        action_plan: [
          { order: 1, title: '30 நாட்களுக்குள் நோட்டீஸ்', description: 'வங்கி மெமோ கிடைத்த 30 நாட்களுக்குள் வழக்கறிஞர் மூலம் நோட்டீஸ் அனுப்பவும்.', authority: 'வழக்கறிஞர்', timeline: '30 நாட்களுக்குள்' }
        ],
        follow_up_questions: [
          'காசோலை வழக்கில் 20% இடைக்கால இழப்பீடு பெறுவது எப்படி?',
          'நிறுவனத்தின் காசோலை பவுன்ஸ் ஆனால் யார் மீது வழக்கு தொடரலாம்?'
        ],
        answer: `வங்கி கணக்கில் பணமில்லாமல் காசோலை நிராகரிக்கப்பட்டால், அது மாற்றுமுறை ஆவணச் சட்டம் (NI Act)-ன் பிரிவு 138-ன் கீழ் குற்றமாகும். குற்றவாளிக்கு 2 ஆண்டுகள் வரை சிறை அல்லது காசோலை தொகையை விட 2 மடங்கு வரை அபராதம் விதிக்கப்படலாம்.

இதற்கான நடைமுறை: வங்கி மெமோ கிடைத்த 30 நாட்களுக்குள் காசோலை கொடுத்தவருக்கு வழக்கறிஞர் மூலம் சட்டப்பூர்வ நோட்டீஸ் அனுப்ப வேண்டும். நோட்டீஸ் கிடைத்த 15 நாட்களுக்குள் அவர் பணம் தராவிட்டால், அடுத்த 30 நாட்களுக்குள் நடுவர் நீதிமன்றத்தில் குற்றவியல் வழக்கு தொடர வேண்டும்.`
      };
    } else {
      return {
        domain: 'finance',
        intent: 'Cheque Dishonour under Section 138 NI Act',
        risk_level: 'high',
        risk_reason: 'Strict 30-day statutory notice and filing timelines apply',
        sources: [
          {
            title: 'Negotiable Instruments Act, 1881',
            section: 'Section 138, Section 142',
            act: 'NI Act 1881',
            source: 'Ministry of Law and Justice',
            url: 'https://indiacode.nic.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'Send 30-Day Demand Notice', description: 'Dispatch a formal legal notice via Registered Post within 30 days of receiving the bank memo.', authority: 'Advocate', timeline: 'Within 30 Days' }
        ],
        follow_up_questions: [
          'How to claim up to 20% interim compensation under Section 143A?',
          'Can company directors be prosecuted for cheque bounce?'
        ],
        answer: `Under Section 138 of the Negotiable Instruments Act, 1881, dishonour of a cheque due to insufficient funds is a criminal offence punishable with up to 2 years imprisonment, a fine up to twice the cheque amount, or both.

There are strict statutory timelines you must follow:
1. Within 30 days of receiving the bank return memo, send a formal Demand Notice via registered post to the drawer.
2. Give them 15 days to clear the payment.
3. If they fail to pay within those 15 days, you must file a criminal complaint before the Judicial Magistrate within the next 30 days.`
      };
    }
  }

  // ==========================================================================
  // 8. Impersonation & Cheating
  // ==========================================================================
  if (cleanQuery.includes('impersonat') || cleanQuery.includes('cheat') || cleanQuery.includes('ஆள்மாறாட்டம்')) {
    if (isTamil) {
      return {
        domain: 'criminal',
        intent: 'Punishment for Cheating and Impersonation under BNS',
        risk_level: 'high',
        risk_reason: 'BNS 2023 கீழ் ஆள்மாறாட்டம் மற்றும் மோசடி குற்றமாகும்',
        sources: [
          {
            title: 'பாரதிய நியாய சன்ஹிதா, 2023 (BNS)',
            section: 'பிரிவு 318, பிரிவு 319',
            act: 'மத்திய குற்றவியல் சட்டம்',
            source: 'மத்திய சட்ட அமைச்சகம்',
            url: 'https://indiacode.nic.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'காவல் நிலையத்தில் புகார்', description: 'ஆள்மாறாட்டம் செய்த விவரங்களுடன் காவல் நிலையத்தில் FIR பதிவு செய்யவும்.', authority: 'காவல் நிலையம்', timeline: 'உடனடியாக' }
        ],
        follow_up_questions: [
          'ஆன்லைன் ஆள்மாறாட்டம் (Cyber Impersonation) நடந்தால் எங்கு புகார் அளிப்பது?',
          'அரசு அதிகாரியைப் போல் நடித்தால் என்ன தண்டனை?'
        ],
        answer: `தண்டனை எந்த மாதிரியான ஆள்மாறாட்டம் மற்றும் எந்த சூழ்நிலையில் நடந்தது என்பதைப் பொறுத்து மாறுபடும்.

ஒருவர் மற்றொரு நபரைப் போல நடித்து ஏமாற்றினால் (Cheating by personation), பாரதிய நியாய சன்ஹிதா பிரிவு 319-ன் கீழ் 5 ஆண்டுகள் வரை சிறை அல்லது அபராதம் விதிக்கப்படலாம். ஒரு அரசு அதிகாரியைப் போல் நடித்து ஏமாற்றினால் அல்லது ஆன்லைனில் கணினி மூலம் போலியாக அடையாளப்படுத்தினால் (IT Act பிரிவு 66D) தனித்தனியான கடுமையான பிரிவுகள் பொருந்தும்.

குறிப்பிட்ட சம்பவம் குறித்து கூடுதல் விவரங்கள் தெரிவித்தால், அதற்குரிய துல்லியமான சட்டப்பிரிவை விளக்க முடியும்.`
      };
    } else {
      return {
        domain: 'criminal',
        intent: 'Punishment for Impersonation under Indian Law',
        risk_level: 'high',
        risk_reason: 'Punishable under Bharatiya Nyaya Sanhita, 2023',
        sources: [
          {
            title: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
            section: 'Section 318, Section 319',
            act: 'Central Act 45 of 2023',
            source: 'Ministry of Law and Justice',
            url: 'https://indiacode.nic.in/'
          }
        ],
        action_plan: [
          { order: 1, title: 'File Police / Cyber Crime Complaint', description: 'Submit a formal complaint with evidence of impersonation and financial or reputational harm.', authority: 'Police / Cyber Crime Cell', timeline: 'Immediate' }
        ],
        follow_up_questions: [
          'What is the punishment for impersonating a public servant?',
          'What section applies to online or cyber impersonation?'
        ],
        answer: `The punishment depends on what kind of impersonation is involved and which law applies. 

Under the Bharatiya Nyaya Sanhita, 2023 (Section 319), cheating by personation carries imprisonment of up to 5 years, a fine, or both. If someone impersonates a public servant or police officer, or uses digital/computer means to cheat by impersonation (Section 66D of the IT Act, which carries up to 3 years imprisonment), distinct specific provisions apply.

If you have a specific situation or context in mind, share a few details and I will tell you the exact applicable section and legal recourse.`
      };
    }
  }

  // ==========================================================================
  // 9. General Legal Catch-All
  // ==========================================================================
  if (isTamil) {
    return {
      domain: 'general',
      intent: 'Legal Research Guidance',
      risk_level: 'low',
      risk_reason: 'பொதுவான சட்ட வழிகாட்டுதல்',
      sources: [],
      action_plan: [],
      follow_up_questions: [
        'இதற்கான குறிப்பிட்ட சட்டப்பிரிவு என்ன?',
        'இதற்கு என்னென்ன ஆவணங்கள் தேவைப்படும்?'
      ],
      answer: `உங்கள் கேள்விக்கான சட்டப்பிரிவு மற்றும் தீர்வு, சம்பந்தப்பட்ட குறிப்பிட்ட உண்மை நிகழ்வுகள் மற்றும் ஆவணங்களைப் பொறுத்தது.

உங்கள் வழக்கின் பின்னணி, நீங்கள் அணுக விரும்பும் துறை அல்லது நடந்த சம்பவத்தின் விவரங்களை சற்று விளக்கமாக கூறினால், இந்திய மற்றும் தமிழ்நாடு சட்டங்களின்படி அதற்குரிய துல்லியமான வழிகாட்டுதலை வழங்க முடியும்.`
    };
  } else {
    return {
      domain: 'general',
      intent: 'Legal Research Guidance',
      risk_level: 'low',
      risk_reason: 'General legal guidance',
      sources: [],
      action_plan: [],
      follow_up_questions: [
        'What specific legal section applies here?',
        'What documents are required to take legal action?'
      ],
      answer: `The applicable legal remedy depends on the specific facts and context of your situation. 

Could you share a few more details about what happened, the parties involved, or the specific outcome you are seeking? Once you share that context, I can identify the relevant legal provisions and explain the exact next steps under Indian and Tamil Nadu law.`
    };
  }
}
