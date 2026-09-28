import {
  DilloSettings,
  DilloSupportedLanguage,
  DilloQuickAction,
  DilloFAQ,
  DilloKnowledgeItem,
  DilloActionPayload,
  DilloSpecialityMapping,
  Doctor,
  Appointment,
  HospitalSettings,
  HospitalStats,
} from '../types/database';
import { DoctorService } from './doctorService';
import { SpecialityService } from './specialityService';
import { AppointmentService } from './appointmentService';
import { SettingsService, DEFAULT_HOSPITAL_STATS } from './settingsService';

export const DEFAULT_DILLO_LANGUAGES: DilloSupportedLanguage[] = [
  { code: 'en-IN', name: 'English', nativeName: 'English', active: true, voiceCode: 'en-IN' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', active: true, voiceCode: 'hi-IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', active: true, voiceCode: 'gu-IN' },
];

export const DEFAULT_DILLO_QUICK_ACTIONS: DilloQuickAction[] = [
  { id: 'qa-1', label: '🎙️ Speak', icon: 'Mic', actionType: 'voice', active: true, display_order: 1 },
  { id: 'qa-type', label: '⌨️ Type', icon: 'Keyboard', actionType: 'custom', actionPayload: '', active: true, display_order: 2 },
  { id: 'qa-2', label: '👨‍⚕️ Find Doctor', icon: 'UserCheck', actionType: 'find_doctor', active: true, display_order: 3 },
  { id: 'qa-3', label: '📅 Book Appointment', icon: 'Calendar', actionType: 'book_appointment', active: true, display_order: 4 },
  { id: 'qa-4', label: '🏥 Departments', icon: 'Building2', actionType: 'departments', active: true, display_order: 5 },
  { id: 'qa-9', label: '🚨 Emergency', icon: 'AlertCircle', actionType: 'emergency', active: true, display_order: 6 },
];

export const DEFAULT_DILLO_SPECIALITY_MAPPINGS: DilloSpecialityMapping[] = [
  {
    id: 'sm-1',
    speciality_name: 'Cardiology',
    keywords: [
      'heart', 'chest', 'cardiac', 'blood pressure', 'bp', 'attack', 'palpitations',
      'chhati', 'seena', 'dhadkan', 'angina', 'chest pain',
      // Hindi
      'dil', 'dil ka daura', 'seene me dard', 'chhati me dard', 'dil ki dhadkan',
      // Gujarati
      'chhati ma dukhavo', 'hriday', 'dhabkara', 'chhati', 'bp vadhu',
    ],
    active: true,
  },
  {
    id: 'sm-2',
    speciality_name: 'Dermatology',
    keywords: [
      'skin', 'rash', 'itching', 'acne', 'pimples', 'eczema', 'psoriasis',
      'chamdi', 'khujli', 'hair fall', 'fungal', 'daad',
      // Hindi
      'tvacha', 'skin problem', 'khujali', 'dane', 'phode',
      // Gujarati
      'chamdi', 'kharjavu', 'khujli', 'tvacha ni samasya', 'vaalno khedvano',
    ],
    active: true,
  },
  {
    id: 'sm-3',
    speciality_name: 'Orthopedics',
    keywords: [
      'bone', 'joint', 'knee', 'fracture', 'arthritis', 'back pain', 'spine', 'neck',
      'ligament', 'shoulder', 'haddi', 'ghutna', 'sandhi',
      // Hindi
      'haddi me dard', 'ghutne me dard', 'kamar dard', 'tutna', 'gathiya',
      // Gujarati
      'haadka', 'sandhi', 'ghuntano', 'kamar dukhavo', 'ghodhan ma dukhavo', 'haadka tutvu',
    ],
    active: true,
  },
  {
    id: 'sm-4',
    speciality_name: 'Ophthalmology',
    keywords: [
      'eye', 'vision', 'sight', 'blur', 'cataract', 'aankh', 'drashti',
      'motiyabind', 'chashma', 'conjunctivitis',
      // Hindi
      'aankhon me problem', 'dhundhla dikhna', 'nazar kamzor',
      // Gujarati
      'aankh ma taklif', 'aankh dukhvu', 'drishti', 'motiyabind', 'dhundhlu dekhavu',
    ],
    active: true,
  },
  {
    id: 'sm-5',
    speciality_name: 'ENT',
    keywords: [
      'ear', 'nose', 'throat', 'sinus', 'tonsil', 'kaan', 'naak', 'gala',
      'hearing', 'voice', 'tinnitus',
      // Hindi
      'kaan me dard', 'naak band', 'gale me dard', 'sunai na dena',
      // Gujarati
      'kan ma dukhavo', 'nak band', 'gala ma dukhavo', 'sambhlatu nathi',
    ],
    active: true,
  },
  {
    id: 'sm-6',
    speciality_name: 'Neurology',
    keywords: [
      'brain', 'headache', 'migraine', 'nerve', 'dizziness', 'stroke',
      'paralysis', 'seizure', 'sar dard', 'chakkar', 'epilepsy', 'vertigo',
      // Hindi
      'sir me dard', 'sar dard', 'dimag', 'lakwa', 'mirgi',
      // Gujarati
      'mathano dukhavo', 'mathu dukhvu', 'dimag ni taklif', 'lakvo', 'chakkar avva',
    ],
    active: true,
  },
  {
    id: 'sm-7',
    speciality_name: 'Gastroenterology',
    keywords: [
      'stomach', 'digestion', 'gas', 'acidity', 'bloating', 'vomit', 'nausea',
      'ulcer', 'abdomen', 'pet', 'kabz', 'jaundice', 'liver', 'gut',
      // Hindi
      'pet me dard', 'pet kharab', 'ulti', 'ji machlana', 'gas ki problem',
      // Gujarati
      'pet ma dukhavo', 'pet ni taklif', 'acidity', 'ulti', 'pet barvu', 'gas thay che',
    ],
    active: true,
  },
  {
    id: 'sm-8',
    speciality_name: 'Nephrology & Urology',
    keywords: [
      'kidney', 'urine', 'urinary', 'stone', 'bladder', 'prostate', 'dialysis',
      'peshab', 'gurda', 'pathri',
      // Hindi
      'gurde me dard', 'peshab me problem', 'pathri', 'kidney stone',
      // Gujarati
      'kidney ma taklif', 'peshab ma problem', 'pathri', 'gurda ni taklif',
    ],
    active: true,
  },
  {
    id: 'sm-9',
    speciality_name: 'Gynecology & Obstetrics',
    keywords: [
      'women', 'female', 'period', 'pregnancy', 'delivery', 'pcos', 'ovary',
      'uterus', 'mahila', 'garbh', 'menstruation',
      // Hindi
      'mahila rog', 'periods ki problem', 'garbhvati', 'prasav',
      // Gujarati
      'mahila ni taklif', 'periods ni problem', 'garbh', 'prasuti',
    ],
    active: true,
  },
  {
    id: 'sm-10',
    speciality_name: 'Pediatrics',
    keywords: [
      'child', 'baby', 'kid', 'infant', 'newborn', 'vaccination', 'immunization',
      'baccha', 'bal rog',
      // Hindi
      'bachche ko bukhar', 'bachche ka doctor', 'bal rog visheshagya',
      // Gujarati
      'baalkano doctor', 'baalkane taav', 'nanu bacchu', 'bacchano doctor',
    ],
    active: true,
  },
  {
    id: 'sm-11',
    speciality_name: 'Dentistry',
    keywords: [
      'tooth', 'teeth', 'gum', 'cavity', 'root canal', 'braces', 'daant',
      'masuda', 'dental',
      // Hindi
      'daant me dard', 'masude se khoon', 'daant ka doctor',
      // Gujarati
      'daant ma dukhavo', 'daant no doctor', 'masuda ma samasya',
    ],
    active: true,
  },
  {
    id: 'sm-12',
    speciality_name: 'Pulmonology',
    keywords: [
      'lungs', 'breathing', 'breathless', 'asthma', 'cough', 'wheezing',
      'pneumonia', 'saans', 'khasi', 'dam',
      // Hindi
      'saans me takleef', 'khansi', 'dama', 'fefdo me problem',
      // Gujarati
      'shvas levama taklif', 'khansi', 'daman', 'fefsa ni taklif',
    ],
    active: true,
  },
  {
    id: 'sm-13',
    speciality_name: 'Oncology',
    keywords: [
      'cancer', 'tumor', 'lump', 'chemotherapy', 'biopsy', 'gaanth',
      // Hindi
      'cancer ka ilaj', 'gaanth', 'gilti',
      // Gujarati
      'cancer ni sarvar', 'gaanth aavvu', 'tumor',
    ],
    active: true,
  },
  {
    id: 'sm-14',
    speciality_name: 'General Medicine',
    keywords: [
      'fever', 'weakness', 'fatigue', 'cold', 'flu', 'infection', 'diabetes',
      'sugar', 'bukhar', 'kamzori', 'sardi',
      // Hindi
      'bukhar aaya hai', 'sardi ho gayi', 'thakan', 'sugar ki bimari',
      // Gujarati
      'taav avyo che', 'shardi thay che', 'thak lage che', 'sugar ni bimari',
    ],
    active: true,
  },
];

export const DEFAULT_DILLO_FAQS: DilloFAQ[] = [
  {
    id: 'faq-1',
    question: 'What are the hospital visiting and OPD timings?',
    answer: 'Rhythm Medicity OPD operates Monday to Saturday from 9:00 AM to 8:00 PM. Emergency services and critical care units are open 24x7.',
    keywords: ['timing', 'hours', 'open', 'opd', 'samay', 'kab khulta hai'],
    category: 'Hospital Services',
    active: true,
  },
  {
    id: 'faq-2',
    question: 'How do I book an appointment?',
    answer: 'You can book an appointment easily by selecting your preferred doctor or department, choosing an available date and time slot, confirming patient details, and completing payment. An instant digital appointment slip and confirmed letter are generated.',
    keywords: ['book', 'appointment kaise kare', 'schedule', 'booking process', 'token'],
    category: 'Appointments',
    active: true,
  },
  {
    id: 'faq-3',
    question: 'Is emergency service available 24/7?',
    answer: 'Yes! Rhythm Medicity provides round-the-clock 24x7 trauma care, ACLS ambulances, ICU support, and immediate cardiac triage services.',
    keywords: ['emergency', '24/7', 'ambulance', 'urgent', 'trauma'],
    category: 'Emergency',
    active: true,
  },
  {
    id: 'faq-4',
    question: 'Where is Rhythm Medicity located?',
    answer: 'Rhythm Medicity is conveniently located with multi-lane road access and dedicated ambulance bays. You can click the Hospital Location button for direct GPS directions.',
    keywords: ['location', 'address', 'kaha hai', 'map', 'directions', 'kaha par'],
    category: 'Location',
    active: true,
  },
  {
    id: 'faq-5',
    question: 'What payment modes are accepted for appointments?',
    answer: 'We accept UPI (Google Pay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and direct hospital counter payments.',
    keywords: ['payment', 'upi', 'fees', 'fees kitni hai', 'cost', 'charge'],
    category: 'Billing',
    active: true,
  },
];

/* ─────────────────────────────────────────────
   DEFAULT MULTILINGUAL AI KNOWLEDGE BASE
   ───────────────────────────────────────────── */
export const DEFAULT_DILLO_KNOWLEDGE_BASE: DilloKnowledgeItem[] = [
  {
    id: 'kb-1',
    title: 'Cashless Health Insurance & Mediclaim TPAs',
    question: 'Does Rhythm Medicity provide cashless insurance services?',
    answer: 'Yes, Rhythm Medicity has cashless tie-ups with all major health insurance providers and TPAs including Star Health, HDFC ERGO, ICICI Lombard, Care Health, Niva Bupa, and Government Ayushman Bharat (PMJAY). Our 24x7 TPA desk assists with instant pre-authorization and claim processing.',
    answer_en: 'Yes, Rhythm Medicity provides cashless hospitalization with all major health insurance companies and TPAs including Star Health, HDFC ERGO, ICICI Lombard, Care Health, Niva Bupa, and Government Ayushman Bharat (PMJAY). Our 24x7 TPA desk assists with instant pre-authorization.',
    answer_hi: 'हाँ, रिदम मेडिसिटी में स्टार हेल्थ, एचडीएफसी एर्गो, आईसीआईसीआई लोम्बार्ड, केयर हेल्थ, निवा बूपा और आयुष्मान भारत (PMJAY) सहित सभी प्रमुख स्वास्थ्य बीमा कंपनियों और टीपीए के साथ कैशलेस इलाज की सुविधा उपलब्ध है। हमारा 24x7 टीपीए हेल्पडेस्क तुरंत अप्रूवल में सहायता करता है।',
    answer_gu: 'હા, રિધમ મેડિસિટીમાં સ્ટાર હેલ્થ, HDFC એર્ગો, ICICI લોમ્બાર્ડ, કેર હેલ્થ, નિવા બૂપા અને આયુષ્માન ભારત (PMJAY) સહિત તમામ મુખ્ય વીમા કંપનીઓ અને TPA સાથે કેશલેસ સુવિધા ઉપલબ્ધ છે. અમારું 24x7 TPA ડેસ્ક તાત્કાલિક મંજૂરીમાં મદદ કરે છે.',
    category: 'Insurance & Mediclaim',
    keywords: ['insurance', 'cashless', 'mediclaim', 'tpa', 'claim', 'star health', 'ayushman', 'pmjay', 'policy', 'bima', 'bimo'],
    priority: 'high',
    display_order: 1,
    active: true,
  },
  {
    id: 'kb-2',
    title: 'Hospital Bed Capacity & Critical Care Infrastructure',
    question: 'What is the bed capacity and ICU infrastructure of Rhythm Medicity?',
    answer: 'Rhythm Medicity is a 250+ bed premier multi-speciality tertiary care hospital equipped with 35 Level-3 ICU & Critical Care beds, 6 Ultra-Clean Modular Operation Theatres, 20 Emergency Trauma beds, and luxury private/semi-private rooms.',
    answer_en: 'Rhythm Medicity features 250+ Total Beds, including 35 Level-3 ICU & Critical Care beds, 6 Ultra-Clean Modular Operation Theatres, 20 Emergency Trauma beds, and dedicated pediatric/neonatal intensive care.',
    answer_hi: 'रिदम मेडिसिटी 250+ बिस्तरों वाला प्रमुख मल्टी-स्पेशियलिटी अस्पताल है, जिसमें 35 लेवल-3 आईसीयू व क्रिटिकल केयर बेड्स, 6 आधुनिक मॉड्यूलर ऑपरेशन थियेटर और 20 इमरजेंसी ट्रॉमा बेड्स उपलब्ध हैं।',
    answer_gu: 'રિધમ મેડિસિટી 250+ પથારી ધરાવતી અગ્રણી મલ્ટી-સ્પેશિયાલિટી હોસ્પિટલ છે, જેમાં 35 લેવલ-3 આઈસીયુ બેડ, 6 મોડ્યુલર ઓપરેશન થિયેટર અને 20 ઈમરજન્સી ટ્રોમા બેડ ઉપલબ્ધ છે.',
    category: 'Facilities & Infrastructure',
    keywords: ['beds', 'bed', 'icu', 'capacity', 'kitne bed', 'ketla bed', 'rooms', 'deluxe', 'general bed', 'theatre', 'ot'],
    priority: 'high',
    display_order: 2,
    active: true,
  },
  {
    id: 'kb-3',
    title: '24x7 Emergency, Trauma & ACLS Ambulance Fleet',
    question: 'Is emergency and ambulance service available 24 hours?',
    answer: 'Yes! Rhythm Medicity operates a 24x7 Level-1 Emergency & Trauma Center with dedicated cardiac triage, on-site intensivists, and a fleet of Advanced Cardiac Life Support (ACLS) ambulances equipped with ventilators, monitors, and defibrillators.',
    answer_en: 'Yes, Rhythm Medicity operates a 24x7 Level-1 Emergency & Trauma Center with dedicated cardiac triage, on-site intensivists, and a fleet of Advanced Cardiac Life Support (ACLS) ambulances equipped with ventilators and defibrillators.',
    answer_hi: 'हाँ, रिदम मेडिसिटी में 24x7 इमरजेंसी एवं ट्रॉमा सेंटर और वेंटिलेटर से सुसज्जित एसीएलएस (ACLS) एम्बुलेंस सेवा 24 घंटे उपलब्ध है।',
    answer_gu: 'હા, રિધમ મેડિસિટીમાં 24 કલાક ઈમરજન્સી અને ટ્રોમા સેન્ટર તેમજ વેન્ટિલેટર યુક્ત આધુનિક ACLS એમ્બ્યુલન્સ સેવા 24x7 કાર્યરત છે.',
    category: 'Emergency Services',
    keywords: ['emergency', 'ambulance', '24x7', '24 hours', 'trauma', 'urgent', 'tatkalik', 'emergency number'],
    priority: 'high',
    display_order: 3,
    active: true,
  },
  {
    id: 'kb-4',
    title: 'Patient Visiting Hours and Attendant Guidelines',
    question: 'What are the patient visiting hours and attendant rules?',
    answer: 'General ward visiting hours are 4:00 PM to 7:00 PM daily. In the ICU, to maintain infection control and patient rest, strictly 1 attendant is permitted between 5:00 PM and 6:00 PM with an authorized visitor pass.',
    answer_en: 'Visiting hours for general patient rooms are 4:00 PM to 7:00 PM daily. In the ICU, to ensure highest patient safety and sterility, only 1 immediate family member is permitted between 5:00 PM and 6:00 PM with visitor pass.',
    answer_hi: 'जनरल वार्ड में मरीजों से मिलने का समय प्रतिदिन शाम 4:00 से 7:00 बजे तक है। आईसीयू में मरीज की सुरक्षा और संक्रमण नियंत्रण के लिए शाम 5:00 से 6:00 बजे केवल 1 परिजन को अनुमति है।',
    answer_gu: 'જનરલ રૂમમાં દર્દીને મળવાનો સમય દરરોજ સાંજે 4:00 થી 7:00 સુધીનો છે. આઈસીયુમાં સાંજે 5:00 થી 6:00 દરમિયાન માત્ર 1 સગાને પરવાનગી આપવામાં આવે છે.',
    category: 'Hospital Guidelines',
    keywords: ['visiting', 'visit', 'timing', 'milne ka time', 'malva no samay', 'hours', 'pass', 'attendant', 'relative'],
    priority: 'medium',
    display_order: 4,
    active: true,
  },
  {
    id: 'kb-5',
    title: '24x7 Diagnostic Pathology & Radiology (CT / MRI / Ultrasound)',
    question: 'What diagnostic and laboratory facilities are available?',
    answer: 'Our diagnostic center operates 24x7 with NABL-standard automated pathology, digital X-Ray, High-Resolution Ultrasound, 128-slice CT Scan, 3T MRI, 2D Echocardiography, and TMT testing for comprehensive clinical investigations.',
    answer_en: 'Our diagnostic center is fully operational 24x7 featuring NABL-standard automated pathology, digital X-Ray, High-Resolution Ultrasound, 128-slice CT Scan, 3T MRI, 2D Echocardiography, and TMT testing.',
    answer_hi: 'हमारा डायग्नोस्टिक सेंटर 24x7 संचालित है, जिसमें डिजिटल एक्स-रे, अल्ट्रासाउंड, 128-स्लाइस सीटी स्कैन, 3T एमआरआई, 2D इकोकार्डियोग्राफी और संपूर्ण पैथोलॉजी लैब परीक्षण उपलब्ध हैं।',
    answer_gu: 'અમારું ડાયગ્નોસ્ટિક સેન્ટર 24 કલાક કાર્યરત છે, જેમાં ડિજિટલ એક્સ-રે, સોનોગ્રાફી, 128-સ્લાઈસ સીટી સ્કેન, 3T એમઆરઆઈ, ઇકોકાર્ડિયોગ્રાફી અને સંપૂર્ણ લેબોરેટરી તપાસ ઉપલબ્ધ છે.',
    category: 'Diagnostics & Lab',
    keywords: ['lab', 'pathology', 'xray', 'ct scan', 'mri', 'test', 'blood test', 'ultrasound', 'sonography', 'echo', 'tmt'],
    priority: 'medium',
    display_order: 5,
    active: true,
  },
  {
    id: 'kb-6',
    title: 'Hospital Admission & Payment Methods',
    question: 'What payment modes are accepted and how to get admitted?',
    answer: 'Admissions can be initiated through our Front Desk with a doctor consultation slip. We accept UPI (GPay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and Cash. Our TPA desk coordinates direct cashless billing with health insurance companies.',
    answer_en: 'Planned admissions can be completed via our Front Desk with doctor consultation advice. We accept UPI (GPay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and Cash. TPA desk handles direct insurer approvals.',
    answer_hi: 'हॉस्पिटल में भर्ती के लिए रिसेप्शन पर डॉक्टर का परामर्श पत्र आवश्यक है। हम यूपीआई, नेट बैंकिंग, कार्ड और नकद भुगतान स्वीकार करते हैं। टीपीए डेस्क बीमा अप्रूवल संभालता है।',
    answer_gu: 'હોસ્પિટલમાં દાખલ થવા માટે રિસેપ્શન પર ડોક્ટરની સલાહ જરૂરી છે. અમે UPI, નેટ બેન્કિંગ, કાર્ડ અને રોકડ સ્વીકારીએ છીએ. TPA ડેસ્ક વીમા પ્રક્રિયા સંભાળે છે.',
    category: 'Billing & Admission',
    keywords: ['admission', 'payment', 'upi', 'card', 'cash', 'discharge', 'bharti', 'dakhil'],
    priority: 'medium',
    display_order: 6,
    active: true,
  },
];

/* ─────────────────────────────────────────────
   MULTILINGUAL INTRODUCTION MESSAGES
   ───────────────────────────────────────────── */
export const DILLO_INTRODUCTIONS: Record<string, string> = {
  'en-IN': `Hello! I'm Dillo, the Rhythm Medicity AI Assistant. You can tell me about your concern or problem. I can help you find the relevant medical speciality and doctors available at Rhythm Medicity, and guide you through the appointment booking process. How can I help you today?`,
  'hi-IN': `नमस्ते! मैं Dillo हूँ, Rhythm Medicity का AI Assistant। आप अपनी समस्या या तकलीफ़ मुझे बता सकते हैं। आपकी समस्या के आधार पर मैं संबंधित speciality और Rhythm Medicity में उपलब्ध doctors की जानकारी दे सकता हूँ और appointment booking में आपकी मदद कर सकता हूँ। मैं आपकी कैसे मदद करूँ?`,
  'gu-IN': `નમસ્તે! હું Dillo છું, Rhythm Medicity નો AI Assistant. તમે તમારી તકલીફ મને જણાવી શકો છો. તમારી સમસ્યા મુજબ હું યોગ્ય speciality અને અહીં ઉપલબ્ધ doctors વિશે માહિતી આપી શકું છું અને appointment booking માં તમારી મદદ કરી શકું છું. હું તમારી કેવી રીતે મદદ કરી શકું?`,
};

export const DEFAULT_DILLO_SETTINGS: DilloSettings = {
  id: 'default',
  assistant_name: 'Dillo',
  assistant_title: 'Rhythm Medicity AI Healthcare Navigator',
  assistant_avatar: '',
  welcome_message: DILLO_INTRODUCTIONS['gu-IN'],
  short_description: 'Friendly digital hospital receptionist & healthcare navigation assistant',
  voice_enabled: true,
  text_chat_enabled: true,
  ai_enabled: true,
  default_language: 'gu-IN',
  supported_languages: DEFAULT_DILLO_LANGUAGES,
  voice_speed: 1.0,
  voice_pitch: 1.0,
  voice_volume: 1.0,
  voice_gender: 'female',
  auto_introduction: true,
  voice_response_enabled: true,
  auto_language_detection: true,
  auto_listen_after_speak: false,
  gujarati_voice_name: '',
  hindi_voice_name: '',
  english_voice_name: '',
  greeting_message: 'Namaste! Welcome to Rhythm Medicity. I can help guide you to the right medical department or book a doctor appointment.',
  emergency_message: 'This may require urgent medical care. Please contact Rhythm Medicity Emergency immediately or visit our nearest casualty center.',
  quick_actions: DEFAULT_DILLO_QUICK_ACTIONS,
  faqs: DEFAULT_DILLO_FAQS,
  knowledge_base: DEFAULT_DILLO_KNOWLEDGE_BASE,
  speciality_mappings: DEFAULT_DILLO_SPECIALITY_MAPPINGS,
  updated_at: new Date().toISOString(),
};

const DILLO_STORAGE_KEY = 'rhythm_dillo_settings';

export interface DilloIntentResult {
  intent:
    | 'emergency'
    | 'speciality'
    | 'doctor_query'
    | 'appointment_guidance'
    | 'my_appointments'
    | 'faq'
    | 'knowledge'
    | 'general'
    | 'fees'
    | 'timings'
    | 'location'
    | 'stats'
    | 'facilities'
    | 'action_confirmation'
    | 'confirmation'
    | 'departments';
  detectedLanguage: string;
  responseMessage: string;
  speechText: string;
  isEmergency?: boolean;
  suggestedSpeciality?: string;
  suggestedDoctors?: Doctor[];
  emergencyContact?: string;
  quickReplies?: string[];
  actionRequired?: string;
  actionPayload?: DilloActionPayload;
}

export class DilloService {
  /**
   * Get active Dillo settings from LocalStorage or Default
   */
  static getSettings(): DilloSettings {
    try {
      const stored = localStorage.getItem(DILLO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_DILLO_SETTINGS,
          ...parsed,
          supported_languages: parsed.supported_languages || DEFAULT_DILLO_LANGUAGES,
          quick_actions: parsed.quick_actions || DEFAULT_DILLO_QUICK_ACTIONS,
          faqs: parsed.faqs || DEFAULT_DILLO_FAQS,
          knowledge_base: parsed.knowledge_base || DEFAULT_DILLO_KNOWLEDGE_BASE,
          speciality_mappings: parsed.speciality_mappings || DEFAULT_DILLO_SPECIALITY_MAPPINGS,
        };
      }
    } catch (e) {
      console.error('Failed to load Dillo settings:', e);
    }
    return DEFAULT_DILLO_SETTINGS;
  }

  /**
   * Save Dillo settings
   */
  static saveSettings(settings: DilloSettings): DilloSettings {
    const updated = {
      ...settings,
      updated_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(DILLO_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save Dillo settings:', e);
    }
    return updated;
  }

  /**
   * Get the introduction message for a given language
   */
  static getIntroduction(langCode: string, assistantName: string = 'Dillo'): string {
    const intro = DILLO_INTRODUCTIONS[langCode] || DILLO_INTRODUCTIONS['en-IN'];
    // Replace 'Dillo' with the actual assistant name if admin changed it
    if (assistantName !== 'Dillo') {
      return intro.replace(/Dillo/g, assistantName);
    }
    return intro;
  }

  /**
   * Multilingual Language Detection
   * Recognizes Gujarati, Hindi/Devanagari, and common transliterated phrases (Hinglish/Gujlish).
   */
  static detectLanguage(text: string, fallbackLang: string = 'en-IN'): string {
    const trimmed = text.trim();
    if (!trimmed) return fallbackLang;

    // Unicode script checks
    if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu-IN'; // Gujarati
    if (/[\u0900-\u097F]/.test(trimmed)) return 'hi-IN'; // Hindi (Devanagari)

    const lower = trimmed.toLowerCase();

    // Transliterated Gujarati patterns (Gujlish) — extensive for natural voice
    const gujlishPatterns = /\b(mane|dukhe|che|chhe|tame|aapo|kem|chho|chhu|mari|maro|tamari|hova|kariye|maru|taklif|dukhavo|aankh|ghuntano|chhati|fefsa|haadka|shvas|lage|karo|batavo|saru|nathi|karavvu|dekhado|joiye|dekhavu|book karavu|karavvu che|doctor ne batavvu|batavvu joiye)\b/i;
    if (gujlishPatterns.test(lower)) return 'gu-IN';

    // Transliterated Hindi patterns (Hinglish) — extensive
    const hinglishPatterns = /\b(mujhe|chahiye|dard|kya|hai|hain|mere|meri|mera|hoga|karna|kaise|bukhar|dikhaye|milenge|kal|aaj|mujhko|ho raha|batao|doctor dikhao|appointment chahiye|dekhna|karana|specialist|pareshani|takleef|problem hai|taklif|dikkat|bimari|samajh|bata|dena|karein)\b/i;
    if (hinglishPatterns.test(lower)) return 'hi-IN';

    return fallbackLang;
  }

  /**
   * Check for emergency keywords across languages
   */
  static isEmergencyQuery(text: string): boolean {
    const lower = text.toLowerCase();
    const emergencyKeywords = [
      // English
      'chest pain', 'heart attack', 'cardiac arrest', 'severe breathing', 'difficulty breathing',
      'unconscious', 'fainted', 'unresponsive', 'heavy bleeding', 'bleeding heavily', 'stroke',
      'paralysis', 'facial drooping', 'sudden weakness', 'seizure', 'snake bite', 'poison',
      'head injury', 'severe trauma', 'dying', 'emergency', 'ambulance now',
      // Hindi / Hinglish
      'chhati me dard', 'seene me dard', 'saans lene me takleef', 'behosh', 'khoon beh raha',
      'heart attack', 'dil ka daura', 'chhati me jalan', 'lakwa', 'emergency chahiye',
      // Gujarati / Gujlish
      'chhati ma dukhavo', 'sans levama taklif', 'behosh', 'chati ma dard', 'loh nikle che',
      'chhati ma dhabkara', 'akasmaat', 'tatkalik',
      // Devanagari
      'सीने में दर्द', 'सांस लेने में तकलीफ', 'बेहोश', 'दिल का दौरा', 'खून बह रहा',
      // Gujarati script
      'છાતીમાં દુખાવો', 'શ્વાસ લેવામાં તકલીફ', 'બેહોશ', 'તાત્કાલિક'
    ];

    return emergencyKeywords.some((kw) => lower.includes(kw));
  }

  /**
   * Check if user is giving a YES / affirmation response
   */
  static isAffirmation(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const affirmations = [
      'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'book', 'haan', 'ha', 'ji', 'ji haan',
      'bilkul', 'theek hai', 'theek', 'zaroor', 'kar do', 'karo', 'book karo', 'book kar do',
      'ha karo', 'ho', 'haa', 'barabar', 'saru', 'chale', 'ha chale', 'book karavo',
      'karavo', 'kariyo', 'ha kariyo',
      'हाँ', 'हां', 'जी', 'जी हाँ', 'ठीक है', 'ज़रूर', 'कर दो', 'बुक करो',
      'હા', 'હાં', 'બરાબર', 'ચાલે', 'સારું', 'કરાવો', 'બુક કરાવો',
    ];
    return affirmations.some((a) => lower === a || lower.startsWith(a + ' ') || lower.endsWith(' ' + a));
  }

  /**
   * Primary Multilingual Conversational Processing Engine
   */
  static async processMessage(
    userText: string,
    currentLanguage: string,
    settings: DilloSettings,
    hospitalSettings: HospitalSettings,
    authenticatedUserId?: string | null,
    lastSuggestedSpeciality?: string | null,
    hospitalStats?: HospitalStats | null,
    pendingAction?: DilloActionPayload | null
  ): Promise<DilloIntentResult> {
    const assistantName = settings.assistant_name || 'Dillo';
    const ambulancePhone = hospitalSettings.ambulance_number || hospitalSettings.emergency_number || hospitalSettings.phone || '108';
    const emergencyPhone = hospitalSettings.emergency_number || hospitalSettings.phone || '+91 98765 43210';
    const hospitalPhone = hospitalSettings.phone || hospitalSettings.emergency_number || '+91 79 1234 5678';
    const hospitalWhatsApp = hospitalSettings.whatsapp_number || hospitalSettings.phone || '+91 98250 12345';
    const hospitalAddress = hospitalSettings.address || 'Rhythm Medicity Campus, Medical Enclave';
    const opdTimings = hospitalSettings.opd_timings || 'Monday to Saturday, 9:00 AM - 8:00 PM';
    const googleMapsUrl = hospitalSettings.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((hospitalSettings.hospital_name || 'Rhythm Medicity') + ' ' + hospitalAddress)}`;

    // 1. Language detection
    const lang = this.detectLanguage(userText, currentLanguage);
    const lower = userText.toLowerCase().trim();

    // 2. Pending Action Confirmation Flow (Ambulance / Emergency / Hospital Call)
    if (pendingAction && pendingAction.requiresConfirmation) {
      if (this.isAffirmation(lower)) {
        if (pendingAction.action === 'call_ambulance') {
          const msg = this.translate(
            lang,
            `Connecting call to Rhythm Medicity Ambulance at ${pendingAction.target.replace('tel:', '')} now.`,
            `Rhythm Medicity ambulance number पर call connect कर रहा हूँ।`,
            `બરાબર, હું Rhythm Medicity ambulance number પર call શરૂ કરી રહ્યો છું.`
          );
          return {
            intent: 'action_confirmation',
            detectedLanguage: lang,
            responseMessage: msg,
            speechText: msg,
            actionPayload: { ...pendingAction, confirmed: true },
            quickReplies: ['Call Ambulance', 'Hospital Location', 'Emergency Info'],
          };
        }

        if (pendingAction.action === 'call_emergency') {
          const msg = this.translate(
            lang,
            `Connecting emergency call to ${pendingAction.target.replace('tel:', '')} immediately.`,
            `इमरजेंसी नंबर पर तुरंत कॉल कनेक्ट कर रहा हूँ।`,
            `ઇમરજન્સી નંબર પર તાત્કાલિક કૉલ જોડી રહ્યો છું.`
          );
          return {
            intent: 'action_confirmation',
            detectedLanguage: lang,
            responseMessage: msg,
            speechText: msg,
            actionPayload: { ...pendingAction, confirmed: true },
            quickReplies: ['Emergency Call', 'Hospital Location'],
          };
        }

        if (pendingAction.action === 'call_hospital') {
          const msg = this.translate(
            lang,
            `Calling Rhythm Medicity reception at ${pendingAction.target.replace('tel:', '')}.`,
            `हॉस्पिटल रिसेप्शन पर कॉल कनेक्ट कर रहा हूँ।`,
            `હોસ્પિટલ રિસેપ્શન પર કૉલ શરૂ કરી રહ્યો છું.`
          );
          return {
            intent: 'action_confirmation',
            detectedLanguage: lang,
            responseMessage: msg,
            speechText: msg,
            actionPayload: { ...pendingAction, confirmed: true },
            quickReplies: ['Book Appointment', 'OPD Timings'],
          };
        }
      }

      // Check if user cancelled
      if (/\b(no|cancel|stop|reva do|nahi|nathi|band|nah|mat karo)\b/i.test(lower) || lower.includes('ना') || lower.includes('ના')) {
        const cancelMsg = this.translate(
          lang,
          `Action cancelled. How else can I assist you today?`,
          `कार्रवाई रद्द कर दी गई। मैं आपकी और क्या मदद कर सकता हूँ?`,
          `ક્રિયા રદ કરવામાં આવી છે. હું તમારી બીજી શું મદદ કરી શકું?`
        );
        return {
          intent: 'general',
          detectedLanguage: lang,
          responseMessage: cancelMsg,
          speechText: cancelMsg,
          quickReplies: this.translate3Array(
            lang,
            ['Find Doctor', 'Book Appointment', 'Hospital Timings'],
            ['डॉक्टर खोजें', 'अपॉइंटमेंट बुक करें', 'हॉस्पिटल टाइमिंग'],
            ['ડોક્ટર શોધો', 'એપોઇન્ટમેન્ટ બુક કરો', 'હોસ્પિટલ સમય']
          ),
        };
      }
    }

    // 3. Ambulance Voice Flow & Action Detection
    if (
      /\b(ambulance|ambulence|108|ambulans)\b/i.test(lower) ||
      lower.includes('एम्बुलेंस') ||
      lower.includes('એમ્બ્યુલન્સ')
    ) {
      const askConfirm = this.translate(
        lang,
        `Sure. Would you like me to call the Rhythm Medicity ambulance number now?`,
        `बिल्कुल। क्या आप Rhythm Medicity ambulance को call करना चाहते हैं?`,
        `બરાબર. શું તમે Rhythm Medicity ની ambulance service ને call કરવા માંગો છો?`
      );

      return {
        intent: 'action_confirmation',
        detectedLanguage: lang,
        responseMessage: askConfirm,
        speechText: askConfirm,
        actionPayload: {
          action: 'call_ambulance',
          target: `tel:${ambulancePhone.replace(/\s+/g, '')}`,
          title: '🚑 Call Ambulance',
          label: ambulancePhone,
          requiresConfirmation: true,
          emergencyContact: ambulancePhone,
        },
        quickReplies: this.translate3Array(
          lang,
          ['Yes, Call Ambulance', 'Cancel', 'Hospital Location'],
          ['हाँ, एम्बुलेंस को कॉल करें', 'रद्द करें', 'हॉस्पिटल लोकेशन'],
          ['હા, એમ્બ્યુલન્સને કૉલ કરો', 'રદ કરો', 'હોસ્પિટલ લોકેશન']
        ),
      };
    }

    // 4. Emergency keywords check
    if (this.isEmergencyQuery(lower)) {
      return this.buildEmergencyResponse(lang, assistantName, emergencyPhone);
    }

    // 5. Emergency Call intent explicitly
    if (
      /\b(call emergency|emergency call|emergency number|emergency helpline|tatkalik)\b/i.test(lower) ||
      lower.includes('इमरजेंसी कॉल') ||
      lower.includes('ઇમરજન્સી કૉલ')
    ) {
      const askEmergency = this.translate(
        lang,
        `Rhythm Medicity 24x7 Emergency helpline is **${emergencyPhone}**. Would you like me to connect an emergency call now?`,
        `रिदम मेडिसिटी 24x7 इमरजेंसी हेल्पलाइन नंबर **${emergencyPhone}** है। क्या आप अभी इमरजेंसी कॉल करना चाहते हैं?`,
        `રિધમ મેડિસિટી 24x7 ઈમરજન્સી હેલ્પલાઇન નંબર **${emergencyPhone}** છે. શું તમે અત્યારે કૉલ કરવા માંગો છો?`
      );
      return {
        intent: 'action_confirmation',
        detectedLanguage: lang,
        responseMessage: askEmergency,
        speechText: this.translate(
          lang,
          `Rhythm Medicity emergency helpline is ${emergencyPhone}. Would you like me to connect an emergency call now?`,
          `रिदम मेडिसिटी इमरजेंसी नंबर ${emergencyPhone} है। क्या आप अभी कॉल करना चाहते हैं?`,
          `રિધમ મેડિસિટી ઈમરજન્સી નંબર ${emergencyPhone} છે. શું તમે અત્યારે કૉલ કરવા માંગો છો?`
        ),
        actionPayload: {
          action: 'call_emergency',
          target: `tel:${emergencyPhone.replace(/\s+/g, '')}`,
          title: '🚨 Emergency Call',
          label: emergencyPhone,
          requiresConfirmation: true,
          emergencyContact: emergencyPhone,
        },
        quickReplies: this.translate3Array(
          lang,
          ['Yes, Call Emergency', 'Call Ambulance', 'Hospital Location'],
          ['हाँ, इमरजेंसी कॉल करें', 'एम्बुलेंस बुलाएं', 'हॉस्पिटल लोकेशन'],
          ['હા, ઇમરજન્સી કૉલ કરો', 'એમ્બ્યુલન્સ બોલાવો', 'હોસ્પિટલ લોકેશન']
        ),
      };
    }

    // 6. Direct Hospital Call / Reception Phone Inquiry
    if (
      /\b(call hospital|contact number|phone number|reception number|hospital number|phone kare|call karvu)\b/i.test(lower) ||
      lower.includes('कॉल करें') ||
      lower.includes('ફોન નંબર')
    ) {
      const askCall = this.translate(
        lang,
        `Rhythm Medicity hospital reception number is **${hospitalPhone}**. Would you like to call the hospital?`,
        `रिदम मेडिसिटी हॉस्पिटल रिसेप्शन का नंबर **${hospitalPhone}** है। क्या आप अभी कॉल करना चाहते हैं?`,
        `રિધમ મેડિસિટી હોસ્પિટલ રિસેપ્શન નંબર **${hospitalPhone}** છે. શું તમે અત્યારે કૉલ કરવા માંગો છો?`
      );
      return {
        intent: 'action_confirmation',
        detectedLanguage: lang,
        responseMessage: askCall,
        speechText: this.translate(
          lang,
          `Rhythm Medicity reception number is ${hospitalPhone}. Would you like to call now?`,
          `हॉस्पिटल रिसेप्शन नंबर ${hospitalPhone} है। क्या आप अभी कॉल करना चाहते हैं?`,
          `હોસ્પિટલ રિસેપ્શન નંબર ${hospitalPhone} છે. શું તમે અત્યારે કૉલ કરવા માંગો છો?`
        ),
        actionPayload: {
          action: 'call_hospital',
          target: `tel:${hospitalPhone.replace(/\s+/g, '')}`,
          title: '📞 Call Hospital',
          label: hospitalPhone,
          requiresConfirmation: true,
        },
        quickReplies: this.translate3Array(
          lang,
          ['Call Reception', 'Book Appointment', 'WhatsApp Hospital'],
          ['रिसेप्शन को कॉल करें', 'अपॉइंटमेंट बुक करें', 'व्हाट्सएप चैट'],
          ['રિસેપ્શનને કૉલ કરો', 'એપોઇન્ટમેન્ટ બુક કરો', 'વોટ્સએપ ચેટ']
        ),
      };
    }

    // 7. WhatsApp Hospital Action
    if (/\b(whatsapp|whats app|chat)\b/i.test(lower) || lower.includes('व्हाट्सएप') || lower.includes('વોટ્સએપ')) {
      const cleanWa = hospitalWhatsApp.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent('Hello Rhythm Medicity, I would like to inquire about hospital services.')}`;
      const msg = this.translate(
        lang,
        `You can connect directly with our hospital helpdesk on WhatsApp at **${hospitalWhatsApp}**.`,
        `आप हमारे व्हाट्सएप हेल्पडेस्क **${hospitalWhatsApp}** पर सीधे चैट कर सकते हैं।`,
        `તમે અમારા વોટ્સએપ હેલ્પડેસ્ક **${hospitalWhatsApp}** પર સીધો સંપર્ક કરી શકો છો.`
      );
      return {
        intent: 'action_confirmation',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: msg,
        actionPayload: {
          action: 'whatsapp_hospital',
          target: waUrl,
          title: '💬 WhatsApp Hospital',
          label: hospitalWhatsApp,
        },
        quickReplies: ['Open WhatsApp', 'Book Appointment', 'Call Hospital'],
      };
    }

    // 8. Hospital Location & GPS Directions
    if (
      /\b(location|address|kaha hai|kaha par|kya pata|map|directions|rasta|kaha aaveli|surat|navsari)\b/i.test(lower) ||
      lower.includes('कहाँ') || lower.includes('ક્યાં') || lower.includes('સરનામું') || lower.includes('पता')
    ) {
      const msg = this.translate(
        lang,
        `📍 **Rhythm Medicity Location**:\n\n${hospitalAddress}\n\nOur campus features dedicated ambulance bays, multi-level visitor parking, and 24x7 emergency drive-through access. Click below to get Google Maps directions.`,
        `📍 **रिदम मेडिसिटी का पता**:\n\n${hospitalAddress}\n\nयहाँ 24x7 एम्बुलेंस वे और सुगम पार्किंग उपलब्ध है। गूगल मैप्स दिशा-निर्देश देखने के लिए नीचे क्लिक करें।`,
        `📍 **રિધમ મેડિસિટીનું સરનામું**:\n\n${hospitalAddress}\n\nઅહીં 24 કલાક એમ્બ્યુલન્સ અને પાર્કિંગની પૂરતી સુવિધા છે. ગૂગલ મેપ્સ ડિરેક્શન જોવા નીચે ક્લિક કરો.`
      );
      return {
        intent: 'location',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: this.translate(
          lang,
          `Rhythm Medicity is located at ${hospitalAddress}. You can click the Get Directions button for Google Maps navigation.`,
          `रिदम मेडिसिटी का पता है ${hospitalAddress}। आप गेट डायरेक्शंस बटन दबाकर मैप नेविगेशन देख सकते हैं।`,
          `રિધમ મેડિસિટી ${hospitalAddress} ખાતે આવેલી છે. તમે ગેટ ડિરેક્શન્સ બટન દબાવીને મેપ નેવિગેશન મેળવી શકો છો.`
        ),
        actionPayload: {
          action: 'hospital_location',
          target: googleMapsUrl,
          title: '📍 Get Directions',
          label: 'Open in Google Maps',
        },
        quickReplies: ['Get Directions', 'Call Hospital', 'OPD Timings'],
      };
    }

    // 9. Hospital Capacity & Statistics Inquiries (Beds, ICU Beds, Doctors, OTs, Ambulances)
    if (
      /\b(bed|beds|kitne bed|ketla bed|icu bed|bed status|available bed|statistics|stats|capacity|theatre|ot count|ketli bed)\b/i.test(lower) ||
      lower.includes('बेड') || lower.includes('પથારી') || lower.includes('બેડ')
    ) {
      const stats = hospitalStats || DEFAULT_HOSPITAL_STATS;
      const msg = this.translate(
        lang,
        `🏥 **Rhythm Medicity Hospital Capacity & Infrastructure**:\n\n• **Total Beds**: ${stats.total_beds}+\n• **ICU & Critical Care Beds**: ${stats.icu_beds}\n• **Emergency Trauma Beds**: ${stats.emergency_beds || 20}\n• **Available Beds (Real-time)**: ${stats.available_beds}\n• **Specialist Doctors**: ${stats.doctors_count}+\n• **Medical Departments**: ${stats.departments_count}+\n• **Operation Theatres**: ${stats.operation_theatres}\n• **24x7 ACLS Ambulances**: ${stats.ambulances_count}`,
        `🏥 **रिदम मेडिसिटी अस्पताल क्षमता एवं बुनियादी ढांचा**:\n\n• **कुल बेड्स**: ${stats.total_beds}+\n• **आईसीयू बेड्स**: ${stats.icu_beds}\n• **इमरजेंसी ट्रॉमा बेड्स**: ${stats.emergency_beds || 20}\n• **वर्तमान में उपलब्ध बेड्स**: ${stats.available_beds}\n• **विशेषज्ञ डॉक्टर्स**: ${stats.doctors_count}+\n• **चिकित्सा विभाग**: ${stats.departments_count}+\n• **मॉड्यूलर ऑपरेशन थियेटर्स**: ${stats.operation_theatres}\n• **24x7 एम्बुलेंस**: ${stats.ambulances_count}`,
        `🏥 **રિધમ મેડિસિટી હોસ્પિટલ ક્ષમતા અને સુવિધાઓ**:\n\n• **કુલ બેડ**: ${stats.total_beds}+\n• **આઈસીયુ બેડ**: ${stats.icu_beds}\n• **ઇમરજન્સી ટ્રોમા બેડ**: ${stats.emergency_beds || 20}\n• **હાલમાં ઉપલબ્ધ બેડ**: ${stats.available_beds}\n• **નિષ્ણાત ડોક્ટર્સ**: ${stats.doctors_count}+\n• **તબીબી વિભાગો**: ${stats.departments_count}+\n• **મોડ્યુલર ઓપરેશન થિયેટર**: ${stats.operation_theatres}\n• **24x7 એમ્બ્યુલન્સ**: ${stats.ambulances_count}`
      );

      const speech = this.translate(
        lang,
        `Rhythm Medicity has over ${stats.total_beds} total beds, including ${stats.icu_beds} ICU beds, ${stats.available_beds} currently available beds, ${stats.operation_theatres} modular operation theatres, and ${stats.ambulances_count} ambulances.`,
        `रिदम मेडिसिटी में ${stats.total_beds} से अधिक बेड्स की क्षमता है, जिसमें ${stats.icu_beds} आईसीयू बेड्स, ${stats.available_beds} उपलब्ध बेड्स और ${stats.operation_theatres} ऑपरेशन थियेटर्स शामिल हैं।`,
        `રિધમ મેડિસિટીમાં ${stats.total_beds} થી વધુ બેડની ક્ષમતા છે, જેમાં ${stats.icu_beds} આઈસીયુ બેડ, ${stats.available_beds} ઉપલબ્ધ બેડ અને ${stats.operation_theatres} ઓપરેશન થિયેટર સામેલ છે.`
      );

      return {
        intent: 'stats',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: speech,
        quickReplies: ['Book Appointment', 'Find Doctor', 'Call Ambulance', 'Hospital Facilities'],
      };
    }

    // 10. Hospital Facilities Inquiries (ICU, OT, Lab, Pharmacy, Rooms)
    if (
      /\b(facility|facilities|suvidha|suvidhao|icu hai|pharmacy|medical store|lab|laboratory|blood bank|room|rooms|deluxe)\b/i.test(lower) ||
      lower.includes('सुविधा') || lower.includes('સુવિધા')
    ) {
      const msg = this.translate(
        lang,
        `🏥 **Rhythm Medicity World-Class Facilities**:\n\n• **24x7 Level-1 Emergency & Trauma**: Dedicated cardiac resuscitation & rapid response team.\n• **Critical Care & ICU**: Level-3 multi-disciplinary intensive care units.\n• **Operation Theatres**: 6+ Ultra-Clean laminar flow modular surgical suites.\n• **24x7 Diagnostic & Imaging**: 128-slice CT Scan, 3T MRI, Digital X-Ray, 2D Echo, Automated Pathology.\n• **24x7 In-House Pharmacy**: Genuine medicines & surgical supplies.\n• **Patient Rooms**: Presidential Suites, Deluxe Private, Semi-Private, and General Wards.`,
        `🏥 **रिदम मेडिसिटी की प्रमुख सुविधाएं**:\n\n• **24x7 इमरजेंसी एवं ट्रॉमा सेंटर**\n• **लेवल-3 क्रिटिकल केयर व आईसीयू**\n• **6 मॉड्यूलर ऑपरेशन थियेटर्स**\n• **24x7 डायग्नोस्टिक लैब, सीटी स्कैन व एमआरआई**\n• **24x7 इन-हाउस फार्मेसी**\n• **डीलक्स प्राइवेट एवं जनरल रूम्स**`,
        `🏥 **રિધમ મેડિસિટીની મુખ્ય સુવિધાઓ**:\n\n• **24 કલાક ઈમરજન્સી અને ટ્રોમા સેન્ટર**\n• **લેવલ-3 ક્રિટિકલ કેર અને આઈસીયુ**\n• **6 મોડ્યુલર ઓપરેશન થિયેટર**\n• **24 કલાક લેબોરેટરી, સીટી સ્કેન અને એમઆરઆઈ**\n• **24 કલાક હોસ્પિટલ ફાર્મસી**\n• **ડીલક્સ પ્રાઈવેટ અને જનરલ રૂમ્સ**`
      );

      const speech = this.translate(
        lang,
        `Rhythm Medicity provides round-the-clock emergency, Level-3 ICU, 6 modular operation theatres, 24-hour diagnostic CT scan and MRI, in-house pharmacy, and comfortable private rooms.`,
        `रिदम मेडिसिटी में 24 घंटे इमरजेंसी, आईसीयू, 6 ऑपरेशन थियेटर्स, डायग्नोस्टिक पैथोलॉजी, सीटी स्कैन, एमआरआई और इन-हाउस फार्मेसी उपलब्ध है।`,
        `રિધમ મેડિસિટીમાં 24 કલાક ઈમરજન્સી, આઈસીયુ, 6 ઓપરેશન થિયેટર, સીટી સ્કેન, એમઆરઆઈ અને 24 કલાક ફાર્મસી ઉપલબ્ધ છે.`
      );

      return {
        intent: 'facilities',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: speech,
        quickReplies: ['Total Beds & ICU', 'Find Doctor', 'Hospital Timings', 'Call Ambulance'],
      };
    }

    // 11. Search Admin-Managed Multilingual AI Knowledge Base
    const activeKnowledgeBase = (settings.knowledge_base || DEFAULT_DILLO_KNOWLEDGE_BASE).filter(
      (k) => k.active !== false
    );

    // Sort by priority (high > medium > low)
    const sortedKnowledge = [...activeKnowledgeBase].sort((a, b) => {
      const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (pMap[b.priority || 'medium'] || 2) - (pMap[a.priority || 'medium'] || 2);
    });

    const matchedKnowledge = sortedKnowledge.find((k) => {
      const titleMatch = (k.title || '').toLowerCase().includes(lower) || lower.includes((k.title || '').toLowerCase());
      const qMatch = (k.question || '').toLowerCase().includes(lower) || lower.includes((k.question || '').toLowerCase());
      const kwMatch = (k.keywords || []).some((kw) => {
        const kwLower = kw.toLowerCase().trim();
        return lower.includes(kwLower) || kwLower.includes(lower);
      });
      return titleMatch || qMatch || kwMatch;
    });

    if (matchedKnowledge) {
      let approvedAnswer = matchedKnowledge.answer;
      if (lang === 'gu-IN' && matchedKnowledge.answer_gu) {
        approvedAnswer = matchedKnowledge.answer_gu;
      } else if (lang === 'hi-IN' && matchedKnowledge.answer_hi) {
        approvedAnswer = matchedKnowledge.answer_hi;
      } else if (lang === 'en-IN' && matchedKnowledge.answer_en) {
        approvedAnswer = matchedKnowledge.answer_en;
      }

      return {
        intent: 'knowledge',
        detectedLanguage: lang,
        responseMessage: approvedAnswer,
        speechText: approvedAnswer,
        quickReplies: this.translate3Array(
          lang,
          ['Book Appointment', 'Find Doctor', 'Hospital Timings', 'Contact Hospital'],
          ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'हॉस्पिटल टाइमिंग', 'हॉस्पिटल से संपर्क करें'],
          ['એપોઇન્ટમેન્ટ બુક કરો', 'ડોક્ટર શોધો', 'હોસ્પિટલ સમય', 'સંપર્ક કરો']
        ),
      };
    }

    // 12. YES / Affirmation to continue appointment booking after speciality suggested
    if (this.isAffirmation(lower) && lastSuggestedSpeciality) {
      let matchingDoctors: Doctor[] = [];
      try {
        const allDocs = await DoctorService.getActiveDoctors();
        matchingDoctors = allDocs.filter((d) => {
          if (d.show_in_dillo === false) return false;
          const specName = typeof d.speciality === 'object' && d.speciality !== null
            ? (d.speciality as any).name || ''
            : (d.speciality || '');
          return (
            specName.toLowerCase().includes(lastSuggestedSpeciality.toLowerCase()) ||
            lastSuggestedSpeciality.toLowerCase().includes(specName.toLowerCase())
          );
        });
      } catch (e) {
        console.error('Error fetching doctors for affirmation:', e);
      }

      if (matchingDoctors.length === 0) {
        const noDocMsg = this.translate(
          lang,
          `I couldn't find a matching doctor in the current Rhythm Medicity doctor directory for **${lastSuggestedSpeciality}**. Would you like to check our general departments or call reception?`,
          `मुझे वर्तमान Rhythm Medicity डॉक्टर डायरेक्टरी में **${lastSuggestedSpeciality}** के लिए कोई उपयुक्त डॉक्टर नहीं मिला। क्या आप अन्य विभाग देखना चाहते हैं?`,
          `મને વર્તમાન Rhythm Medicity ડોક્ટર ડિરેક્ટરીમાં **${lastSuggestedSpeciality}** માટે કોઈ યોગ્ય ડોક્ટર મળ્યા નથી. શું તમે અન્ય વિભાગો જોવા માંગો છો?`
        );
        return {
          intent: 'doctor_query',
          detectedLanguage: lang,
          responseMessage: noDocMsg,
          speechText: noDocMsg,
          quickReplies: ['Departments', 'Call Reception', 'All Doctors'],
        };
      }

      const guidanceText = this.translate(
        lang,
        `Great. Here are the available **${lastSuggestedSpeciality}** specialists. You can select a doctor and book an appointment.`,
        `बिल्कुल। यहाँ उपलब्ध **${lastSuggestedSpeciality}** विशेषज्ञ हैं। आप doctor चुनकर appointment book कर सकते हैं।`,
        `બરાબર. અહીં ઉપલબ્ધ **${lastSuggestedSpeciality}** છે. તમે doctor પસંદ કરીને appointment book કરી શકો છો.`
      );

      const guidanceSpeech = this.translate(
        lang,
        `Great. Here are the available ${lastSuggestedSpeciality} specialists. You can select a doctor and book an appointment.`,
        `बिल्कुल। यहाँ उपलब्ध ${lastSuggestedSpeciality} विशेषज्ञ हैं। आप doctor चुनकर appointment book कर सकते हैं।`,
        `બરાબર. અહીં ઉપલબ્ધ ${lastSuggestedSpeciality} છે. તમે doctor પસંદ કરીને appointment book કરી શકો છો.`
      );

      return {
        intent: 'confirmation',
        detectedLanguage: lang,
        responseMessage: guidanceText,
        speechText: guidanceSpeech,
        suggestedSpeciality: lastSuggestedSpeciality,
        suggestedDoctors: matchingDoctors.slice(0, 4),
        quickReplies: this.translate3Array(
          lang,
          ['Book Appointment', 'Show More Doctors', 'Hospital Timings'],
          ['अपॉइंटमेंट बुक करें', 'और डॉक्टर दिखाएँ', 'हॉस्पिटल टाइमिंग'],
          ['એપોઇન્ટમેન્ટ બુક કરો', 'વધુ ડોક્ટર બતાવો', 'હોસ્પિટલ સમય']
        ),
      };
    }

    // 13. User account / my appointment check
    if (
      /\b(my appointment|mera appointment|maru appointment|appointment status|booking status|mera token|track appointment|slip|letter)\b/i.test(lower) ||
      lower.includes('अपॉइंटमेंट') ||
      lower.includes('મારી એપોઇન્ટમેન્ટ')
    ) {
      if (authenticatedUserId) {
        try {
          const userAppointments = await AppointmentService.getUserAppointments(authenticatedUserId);
          if (userAppointments && userAppointments.length > 0) {
            const msg = this.translate(
              lang,
              `I found ${userAppointments.length} appointment(s) in your Rhythm Medicity patient account. Here are your upcoming details:`,
              `आपके रिदम मेडिसिटी अकाउंट में ${userAppointments.length} अपॉइंटमेंट मिले हैं। विवरण नीचे देखें:`,
              `તમારા રિધમ મેડિસિટી એકાઉન્ટમાં ${userAppointments.length} એપોઇન્ટમેન્ટ મળ્યા છે. વિગતો નીચે મુજબ છે:`
            );
            return {
              intent: 'my_appointments',
              detectedLanguage: lang,
              responseMessage: msg,
              speechText: msg,
              quickReplies: ['Book New Appointment', 'Hospital Timings', 'Contact Hospital'],
            };
          } else {
            const msg = this.translate(
              lang,
              `You currently have no active appointments booked. Would you like me to help you schedule one with our doctors?`,
              `वर्तमान में आपका कोई सक्रिय अपॉइंटमेंट नहीं है। क्या आप किसी डॉक्टर से अपॉइंटमेंट बुक करना चाहते हैं?`,
              `હાલમાં તમારી કોઈ સક્રિય એપોઇન્ટમેન્ટ નથી. શું તમે અમારા કોઈ ડોક્ટર સાથે એપોઇન્ટમેન્ટ બુક કરવા માંગો છો?`
            );
            return {
              intent: 'my_appointments',
              detectedLanguage: lang,
              responseMessage: msg,
              speechText: msg,
              quickReplies: ['Book Appointment', 'Find Doctor', 'Departments'],
            };
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const msg = this.translate(
          lang,
          `To view your appointment records or download confirmed slips, please log in to your Rhythm Medicity patient account.`,
          `अपने अपॉइंटमेंट रिकॉर्ड देखने के लिए कृपया अपने पेशेंट अकाउंट में लॉगिन करें।`,
          `તમારા એપોઇન્ટમેન્ટ રેકોર્ડ જોવા માટે કૃપા કરીને તમારા પેશન્ટ એકાઉન્ટમાં લોગિન કરો.`
        );
        return {
          intent: 'my_appointments',
          detectedLanguage: lang,
          responseMessage: msg,
          speechText: msg,
          quickReplies: ['Log In to Account', 'Book New Appointment', 'Hospital Emergency'],
        };
      }
    }

    // 14. Speciality and Symptom Matching Engine (Admin-controlled Speciality Mapping)
    const matchedSpecialityObj = this.findMatchingSpecialityObject(lower, settings.speciality_mappings);

    if (matchedSpecialityObj) {
      const matchedSpecialityName = matchedSpecialityObj.speciality_name;
      try {
        const allDoctors = await DoctorService.getActiveDoctors();
        // Filter strictly: only active doctors where show_in_dillo !== false
        const activeDilloDocs = allDoctors.filter((d) => d.is_active !== false && d.show_in_dillo !== false);

        let matchingDoctors: Doctor[] = [];

        // Check if admin manually configured suggested doctors for this speciality
        if (matchedSpecialityObj.suggested_doctor_ids && matchedSpecialityObj.suggested_doctor_ids.length > 0) {
          const idSet = new Set(matchedSpecialityObj.suggested_doctor_ids);
          matchingDoctors = activeDilloDocs.filter((d) => idSet.has(d.id));
        }

        // Fallback to department / speciality match among active doctors
        if (matchingDoctors.length === 0) {
          matchingDoctors = activeDilloDocs.filter((d) => {
            const specName = typeof d.speciality === 'object' && d.speciality !== null
              ? (d.speciality as any).name || ''
              : (d.speciality || '');
            return (
              specName.toLowerCase().includes(matchedSpecialityName.toLowerCase()) ||
              matchedSpecialityName.toLowerCase().includes(specName.toLowerCase())
            );
          });
        }

        // Dillo should NEVER invent doctors
        if (matchingDoctors.length === 0) {
          const noMatchMsg = this.translate(
            lang,
            `I couldn't find a matching doctor in the current Rhythm Medicity doctor directory for **${matchedSpecialityName}**. Would you like to call hospital reception for personal assistance?`,
            `मुझे वर्तमान Rhythm Medicity डॉक्टर डायरेक्टरी में **${matchedSpecialityName}** के लिए कोई उपयुक्त डॉक्टर नहीं मिला। क्या आप रिसेप्शन से संपर्क करना चाहते हैं?`,
            `મને વર્તમાન Rhythm Medicity ડોક્ટર ડિરેક્ટરીમાં **${matchedSpecialityName}** માટે કોઈ યોગ્ય ડોક્ટર મળ્યા નથી. શું તમે હોસ્પિટલ રિસેપ્શનનો સંપર્ક કરવા માંગો છો?`
          );

          return {
            intent: 'speciality',
            detectedLanguage: lang,
            responseMessage: noMatchMsg,
            speechText: this.translate(
              lang,
              `I couldn't find a matching doctor in the current Rhythm Medicity doctor directory for ${matchedSpecialityName}.`,
              `मुझे वर्तमान Rhythm Medicity डॉक्टर डायरेक्टरी में कोई उपयुक्त डॉक्टर नहीं मिला।`,
              `મને વર્તમાન Rhythm Medicity ડોક્ટર ડિરેક્ટરીમાં કોઈ યોગ્ય ડોક્ટર મળ્યા નથી.`
            ),
            suggestedSpeciality: matchedSpecialityName,
            suggestedDoctors: [],
            quickReplies: ['Call Reception', 'All Departments', 'Hospital Timings'],
          };
        }

        const responseTemplate = this.buildSpecialityGuidance(
          lang,
          assistantName,
          matchedSpecialityName,
          matchingDoctors.length
        );

        return {
          intent: 'speciality',
          detectedLanguage: lang,
          responseMessage: responseTemplate.text,
          speechText: responseTemplate.speech,
          suggestedSpeciality: matchedSpecialityName,
          suggestedDoctors: matchingDoctors.slice(0, 4),
          quickReplies: this.translate3Array(
            lang,
            ['Book Appointment', 'Show More Doctors', 'Hospital Timings', 'Consultation Fees'],
            ['अपॉइंटमेंट बुक करें', 'और डॉक्टर दिखाएँ', 'हॉस्पिटल टाइमिंग', 'फीस जानें'],
            ['એપોઇન્ટમેન્ટ બુક કરો', 'વધુ ડોક્ટર બતાવો', 'હોસ્પિટલ સમય', 'ફી જાણો']
          ),
        };
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    }

    // 15. Department listing
    if (
      /\b(department|departments|vibhag|speciality|medical department|ward|section)\b/i.test(lower) ||
      lower.includes('विभाग') || lower.includes('વિભાગ')
    ) {
      const msg = this.translate(
        lang,
        `Rhythm Medicity features world-class departments including:\n\n🫀 Cardiology\n🦴 Orthopedics\n🧠 Neurology\n👶 Pediatrics\n👩‍⚕️ Gynecology & Obstetrics\n🫁 Pulmonology\n🔬 Gastroenterology\n👁️ Ophthalmology\n👂 ENT\n🦷 Dentistry\n💊 General Medicine\n🧬 Oncology\n\nTell me your symptoms and I'll suggest the right department, or select one to see available doctors.`,
        `रिदम मेडिसिटी में उपलब्ध प्रमुख विभाग:\n\n🫀 कार्डियोलॉजी\n🦴 ऑर्थोपेडिक्स\n🧠 न्यूरोलॉजी\n👶 पीडियाट्रिक्स\n👩‍⚕️ गायनोकोलॉजी\n🫁 पल्मोनोलॉजी\n🔬 गैस्ट्रोएंट्रोलॉजी\n👁️ नेत्र रोग\n👂 ईएनटी\n🦷 डेंटिस्ट्री\n💊 जनरल मेडिसिन\n\nअपने लक्षण बताएं या कोई विभाग चुनें।`,
        `રિધમ મેડિસિટીમાં ઉપલબ્ધ મુખ્ય વિભાગો:\n\n🫀 કાર્ડિયોલોજી\n🦴 ઓર્થોપેડિક્સ\n🧠 ન્યુરોલોજી\n👶 બાળ રોગ\n👩‍⚕️ ગાયનેકોલોજી\n🫁 પલ્મોનોલોજી\n🔬 ગેસ્ટ્રોએન્ટ્રોલોજી\n👁️ નેત્ર રોગ\n👂 ઇએનટી\n🦷 ડેન્ટિસ્ટ્રી\n💊 જનરલ મેડિસિન\n\nતમારા લક્ષણો જણાવો અથવા કોઈ વિભાગ પસંદ કરો.`
      );
      return {
        intent: 'departments',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: this.translate(
          lang,
          `Rhythm Medicity has departments including Cardiology, Orthopedics, Neurology, Pediatrics, Gynecology, Pulmonology, Gastroenterology, Ophthalmology, ENT, Dentistry and General Medicine. Tell me your symptoms and I'll suggest the right department.`,
          `रिदम मेडिसिटी में कार्डियोलॉजी, ऑर्थोपेडिक्स, न्यूरोलॉजी, पीडियाट्रिक्स, गायनोकोलॉजी सहित कई विभाग हैं। अपने लक्षण बताएं।`,
          `રિધમ મેડિસિટીમાં કાર્ડિયોલોજી, ઓર્થોપેડિક્સ, ન્યુરોલોજી, બાળ રોગ, ગાયનેકોલોજી સહિત ઘણા વિભાગો છે. તમારા લક્ષણો જણાવો.`
        ),
        quickReplies: ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine'],
      };
    }

    // 16. Booking Guidance Question
    if (
      /\b(how to book|kaise book kare|kem book karvu|appointment process|booking procedure|appointment kaise le|step)\b/i.test(lower) ||
      lower.includes('બુક કેવી રીતે') ||
      lower.includes('बुक कैसे करें')
    ) {
      const guidance = this.translate(
        lang,
        `Booking an appointment at Rhythm Medicity is simple:\n\n1️⃣ Choose your preferred Doctor or Department.\n2️⃣ Select an available date and consultation time slot.\n3️⃣ Enter patient details.\n4️⃣ Complete the secure consultation payment.\n5️⃣ Your confirmed appointment letter with QR code is generated instantly.`,
        `रिदम मेडिसिटी में अपॉइंटमेंट बुक करना बहुत आसान है:\n\n1️⃣ अपना पसंदीदा डॉक्टर या विभाग चुनें।\n2️⃣ उपलब्ध तारीख और समय चुनें।\n3️⃣ मरीज की जानकारी भरें।\n4️⃣ सुरक्षित ऑनलाइन भुगतान पूरा करें।\n5️⃣ आपका कन्फर्म अपॉइंटमेंट लेटर तुरंत तैयार हो जाएगा।`,
        `રિધમ મેડિસિટીમાં એપોઇન્ટમેન્ટ બુક કરવી ખૂબ જ સરળ છે:\n\n1️⃣ તમારા પસંદગીના ડોક્ટર અથવા વિભાગ પસંદ કરો.\n2️⃣ ઉપલબ્ધ તારીખ અને સમય પસંદ કરો.\n3️⃣ દર્દીની વિગતો દાખલ કરો.\n4️⃣ સુરક્ષિત પેમેન્ટ પૂર્ણ કરો.\n5️⃣ તમારું કન્ફર્મ્ડ એપોઇન્ટમેન્ટ લેટર તરત જ બની જશે.`
      );

      const speech = this.translate(
        lang,
        `Booking an appointment is very easy. First select a doctor or department, choose your preferred date and time, confirm patient details, and complete payment. You will receive an instant appointment confirmation letter.`,
        `अपॉइंटमेंट बुक करना बहुत आसान है। पहले डॉक्टर या विभाग चुनें, तारीख और समय का चयन करें, मरीज की जानकारी भरें, और पेमेंट पूरा करें।`,
        `એપોઇન્ટમેન્ટ બુક કરવી ખૂબ જ સરળ છે. પ્રથમ ડોક્ટર અથવા વિભાગ પસંદ કરો, અનુકૂળ સમય પસંદ કરો અને પેમેન્ટ પૂર્ણ કરો.`
      );

      return {
        intent: 'appointment_guidance',
        detectedLanguage: lang,
        responseMessage: guidance,
        speechText: speech,
        quickReplies: this.translate3Array(
          lang,
          ['Book Appointment', 'Find Doctor', 'Departments', 'Fees'],
          ['अपॉइंटमेंट बुक करें', 'डॉक्टर खोजें', 'विभाग', 'फीस'],
          ['એપોઇન્ટમેન્ટ બુક કરો', 'ડોક્ટર શોધો', 'વિભાગો', 'ફી']
        ),
      };
    }

    // 17. Fees and Consultation Charges
    if (/\b(fee|fees|cost|charge|kitna charge|kharch|kimat|rate|consultation fee)\b/i.test(lower) || lower.includes('फीस') || lower.includes('ફી')) {
      const msg = this.translate(
        lang,
        `Doctor consultation fees at Rhythm Medicity range from ₹300 to ₹1,000 depending on the specialist's seniority and clinical department. All fees are transparently displayed on each doctor's profile card with zero hidden charges.`,
        `रिदम मेडिसिटी में डॉक्टर कंसल्टेशन फीस ₹300 से ₹1,000 के बीच होती है, जो विशेषज्ञता और विभाग पर निर्भर करती है। प्रत्येक डॉक्टर की फीस उनकी प्रोफाइल पर स्पष्ट रूप से दर्शित है।`,
        `રિધમ મેડિસિટીમાં ડોક્ટર કન્સલ્ટેશન ફી ₹300 થી ₹1,000 સુધીની હોય છે જે ડોક્ટરની વિશેષજ્ઞતા પર આધારિત છે. તમામ ફી પ્રોફાઇલ પર પારદર્શક રીતે ઉપલબ્ધ છે.`
      );
      return {
        intent: 'fees',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: msg,
        quickReplies: ['Find Doctor', 'Book Appointment', 'Departments'],
      };
    }

    // 18. Hospital Timings & "Hospital kab open hota hai?"
    if (
      /\b(timing|timings|hours|samay|kab khula|kab khulta|time table|schedule|open time|visiting hour)\b/i.test(lower) ||
      lower.includes('समय') || lower.includes('સમય') || lower.includes('कब खुलता') || lower.includes('ક્યારે ખુલે')
    ) {
      const msg = this.translate(
        lang,
        `🕒 **Rhythm Medicity Operating Hours**:\n\n• **OPD Consultations**: ${opdTimings}\n• **Emergency Department**: Open 24 Hours / 7 Days\n• **ICU & Critical Care**: 24 Hours / 7 Days\n• **24x7 Ambulance Helpline**: ${ambulancePhone}\n• **Diagnostic Labs & Pharmacy**: Open 24x7`,
        `🕒 **रिदम मेडिसिटी समय सारणी**:\n\n• **ओपीडी कंसल्टेशन**: ${opdTimings}\n• **इमरजेंसी विभाग**: 24 घंटे / सातों दिन\n• **आईसीयू सेवा**: 24x7 उपलब्ध\n• **24x7 एम्बुलेंस हेल्पलाइन**: ${ambulancePhone}\n• **डायग्नोस्टिक लैब व फार्मेसी**: 24x7 उपलब्ध`,
        `🕒 **રિધમ મેડિસિટી હોસ્પિટલ સમય**:\n\n• **ઓપીડી સમય**: ${opdTimings}\n• **ઇમરજન્સી વિભાગ**: 24 કલાક / સાતેય દિવસ\n• **આઈસીયુ સેવા**: 24 કલાક ઉપલબ્ધ\n• **24 કલાક એમ્બ્યુલન્સ સેવા**: ${ambulancePhone}\n• **લેબોરેટરી અને ફાર્મસી**: 24 કલાક કાર્યરત`
      );
      return {
        intent: 'timings',
        detectedLanguage: lang,
        responseMessage: msg,
        speechText: this.translate(
          lang,
          `Rhythm Medicity OPD operates ${opdTimings}. Our Emergency Department, ICU, Diagnostic Lab, and Ambulance fleet are open 24 hours a day, 7 days a week.`,
          `रिदम मेडिसिटी ओपीडी का समय ${opdTimings} है। इमरजेंसी, आईसीयू और एम्बुलेंस 24 घंटे उपलब्ध हैं।`,
          `રિધમ મેડિસિટી ઓપીડી સમય ${opdTimings} છે. ઇમરજન્સી અને એમ્બ્યુલન્સ 24 કલાક કાર્યરત છે.`
        ),
        quickReplies: ['Book Appointment', 'Emergency Contact', 'Call Ambulance', 'Hospital Location'],
      };
    }

    // 19. Doctor search by name or general doctor query (STRICT: NEVER INVENT DOCTORS)
    if (/\b(doctor|specialist|physician|surgeon|dr|dr\.)\b/i.test(lower) || lower.includes('डॉक्टर') || lower.includes('ડોક્ટર')) {
      try {
        const allDocs = await DoctorService.getActiveDoctors();
        // Filter strictly for active doctors with show_in_dillo !== false
        const activeDilloDocs = allDocs.filter((d) => d.is_active !== false && d.show_in_dillo !== false);

        // Check if user mentioned a specific doctor's name
        const found = activeDilloDocs.filter((d) => {
          const docName = (d.full_name || '').toLowerCase();
          return (
            lower.includes(docName) ||
            docName.split(' ').some((part) => part.length > 3 && lower.includes(part))
          );
        });

        if (found.length > 0) {
          const doc = found[0];
          const specTitle = typeof doc.speciality === 'object' && doc.speciality !== null
            ? (doc.speciality as any).name || 'Specialist'
            : (doc.speciality || 'Specialist');

          const msg = this.translate(
            lang,
            `👨‍⚕️ **${doc.full_name}** (${specTitle})\n\n• **Qualification**: ${doc.qualifications || 'MD / MS'}\n• **Experience**: ${doc.experience_years} years\n• **Consultation Fee**: ₹${doc.consultation_fee}\n• **Timings**: ${doc.available_time_start || '09:00'} - ${doc.available_time_end || '17:00'}\n• **Available Days**: ${doc.available_days || 'Mon - Sat'}\n\nWould you like to book an appointment with ${doc.full_name}?`,
            `👨‍⚕️ **${doc.full_name}** (${specTitle})\n\n• **योग्यता**: ${doc.qualifications || 'MD / MS'}\n• **अनुभव**: ${doc.experience_years} वर्ष\n• **कंसल्टेशन फीस**: ₹${doc.consultation_fee}\n• **समय**: ${doc.available_time_start || '09:00'} से ${doc.available_time_end || '17:00'}\n\nक्या आप ${doc.full_name} से अपॉइंटमेंट बुक करना चाहते हैं?`,
            `👨‍⚕️ **${doc.full_name}** (${specTitle})\n\n• **લાયકાત**: ${doc.qualifications || 'MD / MS'}\n• **અનુભવ**: ${doc.experience_years} વર્ષ\n• **કન્સલ્ટેશન ફી**: ₹${doc.consultation_fee}\n• **સમય**: ${doc.available_time_start || '09:00'} થી ${doc.available_time_end || '17:00'}\n\nશું તમે ${doc.full_name} સાથે એપોઇન્ટમેન્ટ બુક કરવા માંગો છો?`
          );
          return {
            intent: 'doctor_query',
            detectedLanguage: lang,
            responseMessage: msg,
            speechText: this.translate(
              lang,
              `Here are the details for ${doc.full_name}, ${specTitle}. Experience ${doc.experience_years} years, consultation fee ₹${doc.consultation_fee}. Would you like to book an appointment?`,
              `${doc.full_name}, ${specTitle} का विवरण: अनुभव ${doc.experience_years} वर्ष, फीस ₹${doc.consultation_fee}। क्या आप अपॉइंटमेंट बुक करना चाहते हैं?`,
              `${doc.full_name}, ${specTitle} ની વિગતો: અનુભવ ${doc.experience_years} વર્ષ, ફી ₹${doc.consultation_fee}. શું તમે એપોઇન્ટમેન્ટ બુક કરવા માંગો છો?`
            ),
            suggestedDoctors: found.slice(0, 3),
            quickReplies: [`Book with ${doc.full_name}`, 'View All Doctors', 'Hospital Timings'],
          };
        } else if (activeDilloDocs.length > 0) {
          const msg = this.translate(
            lang,
            `Rhythm Medicity has senior specialists across Cardiology, Orthopedics, Neurology, Pediatrics, General Medicine, and other branches. Here are some of our active specialists:`,
            `रिदम मेडिसिटी में कार्डियोलॉजी, ऑर्थोपेडिक्स, न्यूरोलॉजी सहित कई विभागों के अनुभवी विशेषज्ञ उपलब्ध हैं। यहाँ कुछ विशेषज्ञ डॉक्टर दिए गए हैं:`,
            `રિધમ મેડિસિટીમાં કાર્ડિયોલોજી, ઓર્થોપેડિક્સ, ન્યુરોલોજી સહિત તમામ વિભાગોના નિષ્ણાત ડોક્ટરો ઉપલબ્ધ છે. ઉપલબ્ધ ડોક્ટરો નીચે મુજબ છે:`
          );
          return {
            intent: 'doctor_query',
            detectedLanguage: lang,
            responseMessage: msg,
            speechText: msg,
            suggestedDoctors: activeDilloDocs.slice(0, 4),
            quickReplies: ['Cardiologist', 'Orthopedic', 'Pediatrician', 'All Doctors'],
          };
        } else {
          // No active doctors in DB
          const noDocsMsg = this.translate(
            lang,
            `I couldn't find a matching doctor in the current Rhythm Medicity doctor directory.`,
            `मुझे वर्तमान Rhythm Medicity डॉक्टर डायरेक्टरी में कोई उपयुक्त डॉक्टर नहीं मिला।`,
            `મને વર્તમાન Rhythm Medicity ડોક્ટર ડિરેક્ટરીમાં કોઈ યોગ્ય ડોક્ટર મળ્યા નથી.`
          );
          return {
            intent: 'doctor_query',
            detectedLanguage: lang,
            responseMessage: noDocsMsg,
            speechText: noDocsMsg,
            suggestedDoctors: [],
            quickReplies: ['Call Reception', 'Hospital Timings', 'Departments'],
          };
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 20. FAQs Search
    const matchedFaq = settings.faqs.find((f) => {
      if (!f.active) return false;
      return (
        f.keywords.some((kw) => lower.includes(kw.toLowerCase())) ||
        lower.includes(f.question.toLowerCase())
      );
    });

    if (matchedFaq) {
      return {
        intent: 'faq',
        detectedLanguage: lang,
        responseMessage: matchedFaq.answer,
        speechText: matchedFaq.answer,
        quickReplies: ['Book Appointment', 'Find Doctor', 'Hospital Timings'],
      };
    }

    // 21. General Greetings & Auto-Introduction
    if (/\b(hi|hello|hey|namaste|kem cho|kem cho tame|namaskar|good morning|good evening|pranam)\b/i.test(lower)) {
      const greeting = this.getIntroduction(lang, assistantName);
      return {
        intent: 'general',
        detectedLanguage: lang,
        responseMessage: greeting,
        speechText: greeting,
        quickReplies: this.translate3Array(
          lang,
          ['Find Doctor', 'Book Appointment', 'Hospital Timings', 'Call Ambulance'],
          ['डॉक्टर खोजें', 'अपॉइंटमेंट बुक करें', 'हॉस्पिटल टाइमिंग', 'एम्बुलेंस बुलाएं'],
          ['ડોક્ટર શોધો', 'એપોઇન્ટમેન્ટ બુક કરો', 'હોસ્પિટલ સમય', 'એમ્બ્યુલન્સ બોલાવો']
        ),
      };
    }

    // 22. About Hospital Inquiry ("Rhythm Medicity ke baare mein batao")
    if (
      /\b(about hospital|hospital ke baare mein|hospital vishe|about rhythm|overview|about us|su che rhythm)\b/i.test(lower) ||
      lower.includes('के बारे में') || lower.includes('વિશે જણાવો')
    ) {
      const stats = hospitalStats || DEFAULT_HOSPITAL_STATS;
      const aboutMsg = this.translate(
        lang,
        `🏥 **About Rhythm Medicity**:\n\nRhythm Medicity is a premier multi-speciality tertiary care hospital dedicated to providing compassionate, technologically advanced, and affordable healthcare.\n\n• **Bed Capacity**: ${stats.total_beds}+ Beds (${stats.icu_beds} ICU Beds)\n• **Doctors**: ${stats.doctors_count}+ Senior Specialists\n• **Departments**: ${stats.departments_count}+ Specialities\n• **24x7 Services**: Level-1 Trauma Emergency, ACLS Ambulance, ICU, Lab & Pharmacy\n• **Address**: ${hospitalAddress}\n• **Emergency Helpline**: ${emergencyPhone}`,
        `🏥 **रिदम मेडिसिटी के बारे में**:\n\nरिदम मेडिसिटी एक प्रमुख मल्टी-स्पेशियलिटी अस्पताल है जहाँ अत्याधुनिक चिकित्सा सेवाएं और करुणामय देखभाल प्रदान की जाती है।\n\n• **कुल बेड्स**: ${stats.total_beds}+ बेड्स (${stats.icu_beds} आईसीयू बेड्स)\n• **स्पेशलिस्ट डॉक्टर्स**: ${stats.doctors_count}+\n• **विभाग**: ${stats.departments_count}+\n• **24x7 सेवाएं**: इमरजेंसी, एम्बुलेंस, आईसीयू, पैथोलॉजी लैब व फार्मेसी\n• **पता**: ${hospitalAddress}\n• **इमरजेंसी नंबर**: ${emergencyPhone}`,
        `🏥 **રિધમ મેડિસિટી વિશે**:\n\nરિધમ મેડિસિટી એક અગ્રણી મલ્ટી-સ્પેશિયાલિટી હોસ્પિટલ છે જે ઉત્તમ સારવાર અને આધુનિક તબીબી સુવિધાઓ પ્રદાન કરે છે.\n\n• **કુલ બેડ**: ${stats.total_beds}+ બેડ (${stats.icu_beds} આઈસીયુ બેડ)\n• **નિષ્ણાત ડોક્ટર્સ**: ${stats.doctors_count}+\n• **વિભાગો**: ${stats.departments_count}+\n• **24 કલાક સેવાઓ**: ઈમરજન્સી, એમ્બ્યુલન્સ, આઈસીયુ, લેબ અને ફાર્મસી\n• **સરનામું**: ${hospitalAddress}\n• **ઇમરજન્સી નંબર**: ${emergencyPhone}`
      );

      return {
        intent: 'knowledge',
        detectedLanguage: lang,
        responseMessage: aboutMsg,
        speechText: this.translate(
          lang,
          `Rhythm Medicity is a premier multi-speciality tertiary care hospital with ${stats.total_beds} beds, over ${stats.doctors_count} specialist doctors, and round-the-clock emergency and ambulance care.`,
          `रिदम मेडिसिटी ${stats.total_beds} बेड्स और ${stats.doctors_count} से अधिक विशेषज्ञ डॉक्टरों वाला आधुनिक अस्पताल है, जहाँ 24 घंटे इमरजेंसी और एम्बुलेंस सेवा उपलब्ध है।`,
          `રિધમ મેડિસિટી ${stats.total_beds} બેડ અને ${stats.doctors_count} થી વધુ નિષ્ણાત ડોક્ટરો ધરાવતી આધુનિક હોસ્પિટલ છે, જ્યાં 24 કલાક ઈમરજન્સી સેવા ઉપલબ્ધ છે.`
        ),
        quickReplies: ['Departments', 'Find Doctor', 'Hospital Location', 'Call Ambulance'],
      };
    }

    // 23. Default Helpful & Non-Diagnostic Navigation Response
    const defaultResponse = this.translate(
      lang,
      `I'm ${assistantName}, the Rhythm Medicity digital navigation assistant. While I cannot diagnose conditions, I can help you find the right medical speciality, check doctor availability, provide hospital information, and guide you through appointment booking. Could you tell me a little more about your symptoms or what you're looking for?`,
      `मैं ${assistantName} हूँ, रिदम मेडिसिटी का डिजिटल नेविगेटर। मैं बीमारी का निदान नहीं कर सकता, लेकिन आपको सही स्पेशलिस्ट डॉक्टर खोजने, अस्पताल की जानकारी देने और अपॉइंटमेंट बुक करने में पूरी मदद कर सकता हूँ। कृपया अपने लक्षण या विभाग बताएं।`,
      `હું ${assistantName} છું, રિધમ મેડિસિટીનો ડિજિટલ નેવિગેટર. હું રોગનું નિદાન કરી શકતો નથી, પરંતુ યોગ્ય વિભાગના ડોક્ટર શોધવા, હોસ્પિટલની માહિતી આપવા અને એપોઇન્ટમેન્ટ બુક કરવામાં મદદ કરી શકું છું. કૃપા કરીને તમારા લક્ષણો અથવા વિભાગ જણાવો.`
    );

    return {
      intent: 'general',
      detectedLanguage: lang,
      responseMessage: defaultResponse,
      speechText: defaultResponse,
      quickReplies: this.translate3Array(
        lang,
        ['Cardiologist', 'Orthopedic Doctor', 'Book Appointment', 'Hospital Emergency'],
        ['हृदय रोग विशेषज्ञ', 'हड्डी रोग विशेषज्ञ', 'अपॉइंटमेंट बुक करें', 'इमरजेंसी'],
        ['હૃદય રોગ નિષ્ણાત', 'હાડકા નિષ્ણાત', 'એપોઇન્ટમેન્ટ બુક કરો', 'ઇમરજન્સી']
      ),
    };
  }

  /**
   * Helper: Matches user queries to clinical specialities and returns the mapping object
   */
  private static findMatchingSpecialityObject(
    query: string,
    mappings: DilloSpecialityMapping[]
  ): DilloSpecialityMapping | null {
    // Sort mappings so active ones with more keywords or specific priority match accurately
    for (const mapping of mappings) {
      if (!mapping.active) continue;
      for (const kw of mapping.keywords) {
        const kwLower = kw.toLowerCase().trim();
        if (query.includes(kwLower)) {
          return mapping;
        }
        // Try word-boundary match for single-word keywords
        if (kwLower.indexOf(' ') === -1) {
          const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
          if (regex.test(query)) {
            return mapping;
          }
        }
      }
    }
    return null;
  }

  /**
   * Helper: Matches user queries to clinical specialities using admin-configured mappings
   */
  private static findMatchingSpeciality(
    query: string,
    mappings: DilloSpecialityMapping[]
  ): string | null {
    for (const mapping of mappings) {
      if (!mapping.active) continue;
      for (const kw of mapping.keywords) {
        const kwLower = kw.toLowerCase();
        if (query.includes(kwLower)) {
          return mapping.speciality_name;
        }
        // Try word-boundary match for single-word keywords
        if (kwLower.indexOf(' ') === -1) {
          const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
          if (regex.test(query)) {
            return mapping.speciality_name;
          }
        }
      }
    }
    return null;
  }

  /**
   * Helper: Builds safe, friendly speciality guidance without diagnosing
   */
  private static buildSpecialityGuidance(
    lang: string,
    assistantName: string,
    speciality: string,
    doctorCount: number
  ): { text: string; speech: string } {
    let text = '';
    let speech = '';

    if (lang === 'gu-IN') {
      text = `તમે જણાવેલી તકલીફ માટે **${speciality}** ની સલાહ લેવી યોગ્ય હોઈ શકે છે. હું Rhythm Medicity માં ઉપલબ્ધ ${speciality}s તમને બતાવી શકું છું.\n\nશું તમે appointment book કરવા માટે doctor પસંદ કરવા માંગો છો?`;
      speech = `તમે જણાવેલી તકલીફ માટે ${speciality} ની સલાહ લેવી યોગ્ય હોઈ શકે છે. હું Rhythm Medicity માં ઉપલબ્ધ ${speciality} તમને બતાવી શકું છું.`;
    } else if (lang === 'hi-IN') {
      text = `आपकी समस्या के आधार पर **${speciality}** विशेषज्ञ से सलाह लेना उचित हो सकता है। मैं Rhythm Medicity में उपलब्ध ${speciality}s आपको दिखा सकता हूँ।\n\nक्या आप appointment book करने के लिए doctor चुनना चाहते हैं?`;
      speech = `आपकी समस्या के आधार पर ${speciality} विशेषज्ञ से सलाह लेना उचित हो सकता है। मैं Rhythm Medicity में उपलब्ध ${speciality} आपको दिखा सकता हूँ।`;
    } else {
      text = `Based on what you've described, consulting a **${speciality}** specialist may be appropriate. I can show you the ${speciality} doctors available at Rhythm Medicity.\n\nWould you like to select a doctor and book an appointment?`;
      speech = `Based on what you've described, consulting a ${speciality} specialist may be appropriate. I can show you the available ${speciality} doctors at Rhythm Medicity.`;
    }

    return { text, speech };
  }

  /**
   * Helper: Emergency response generator
   */
  private static buildEmergencyResponse(
    lang: string,
    assistantName: string,
    emergencyPhone: string
  ): DilloIntentResult {
    let msg = '';
    let speech = '';

    if (lang === 'gu-IN') {
      msg = `🚨 **ઇમરજન્સી ચેતવણી**: આ લક્ષણો માટે તાત્કાલિક તબીબી સારવાર જરૂરી હોઈ શકે છે!\n\nકૃપા કરીને રિધમ મેડિસિટી ઇમરજન્સી સેલ પર તરત જ સંપર્ક કરો અથવા નજીકના ઈમરજન્સી વિભાગમાં જાઓ.\n\n📞 ઇમરજન્સી નંબર: **${emergencyPhone}** (24x7 ઉપલબ્ધ)`;
      speech = `આ લક્ષણો માટે તાત્કાલિક સારવારની જરૂર છે. કૃપા કરીને રિધમ મેડિસિટી ઇમરજન્સી નંબર ${emergencyPhone} પર તાત્કાલિક સંપર્ક કરો અથવા નજીકની હોસ્પિટલ પહોંચો.`;
    } else if (lang === 'hi-IN') {
      msg = `🚨 **इमरजेंसी अलर्ट**: इन लक्षणों के लिए तत्काल आपातकालीन चिकित्सा सहायता की आवश्यकता हो सकती है!\n\nकृपया तुरंत रिदम मेडिसिटी इमरजेंसी विभाग से संपर्क करें या निकटतम कैजुअल्टी केंद्र पहुंचें।\n\n📞 इमरजेंसी नंबर: **${emergencyPhone}** (24x7 उपलब्ध)`;
      speech = `इन लक्षणों के लिए तत्काल चिकित्सा सहायता जरूरी है। कृपया तुरंत रिदम मेडिसिटी इमरजेंसी नंबर ${emergencyPhone} पर संपर्क करें या अस्पताल पहुंचें।`;
    } else {
      msg = `🚨 **URGENT MEDICAL NOTICE**: These symptoms may require immediate medical attention!\n\nPlease contact Rhythm Medicity Emergency immediately or proceed to the nearest emergency department without delay.\n\n📞 Emergency Contact: **${emergencyPhone}** (Available 24x7)`;
      speech = `This may require urgent medical care. Please contact Rhythm Medicity Emergency at ${emergencyPhone} immediately or go to the nearest emergency hospital.`;
    }

    return {
      intent: 'emergency',
      detectedLanguage: lang,
      responseMessage: msg,
      speechText: speech,
      isEmergency: true,
      emergencyContact: emergencyPhone,
      quickReplies: this.translate3Array(
        lang,
        ['Call Emergency Now', 'Hospital Location', 'Call Ambulance'],
        ['इमरजेंसी कॉल करें', 'हॉस्पिटल लोकेशन', 'एम्बुलेंस बुलाएं'],
        ['ઇમરજન્સી કૉલ કરો', 'હોસ્પિટલ લોકેશન', 'એમ્બ્યુલન્સ બોલાવો']
      ),
    };
  }

  /**
   * Helper: Multi-language fallback translator
   */
  private static translate(lang: string, english: string, hindi: string, gujarati: string): string {
    if (lang === 'gu-IN') return gujarati;
    if (lang === 'hi-IN') return hindi;
    return english;
  }

  /**
   * Helper: Multi-language array translator for quick replies
   */
  private static translate3Array(lang: string, english: string[], hindi: string[], gujarati: string[]): string[] {
    if (lang === 'gu-IN') return gujarati;
    if (lang === 'hi-IN') return hindi;
    return english;
  }
}
