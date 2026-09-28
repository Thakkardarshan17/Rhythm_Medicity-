import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Page, PageStatus, PageContent } from '../types/database';
import { generateUUID } from '../utils/uuid';

const LOCAL_STORAGE_PAGES_KEY = 'rhythm_local_pages_v1';

export const DEFAULT_PAGES: Page[] = [
  // 1. Cardiology
  {
    id: 'p-cardiology',
    title: 'Centre of Advanced Cardiology',
    navigation_title: 'Cardiology',
    slug: 'services/cardiology',
    featured_image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=1200&q=80',
    seo_title: 'Cardiology Department | Rhythm Medicity Hospital',
    seo_description: '24/7 Emergency Interventional Cardiology, Primary Angioplasty, Cath Lab, and Cardiac Critical Care at Rhythm Medicity.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'b1-hero',
          type: 'hero',
          title: 'Centre of Advanced Cardiology & Cath Lab',
          subtitle: 'Comprehensive tertiary cardiovascular care with round-the-clock emergency angioplasty, modern catheterization laboratory, and specialized intensive coronary care.',
          badge: '24x7 EMERGENCY CARDIAC RESPONSE',
          alignment: 'center',
          background_style: 'teal',
          data: {
            primary_button_text: 'Book Cardiac Consultation',
            primary_button_link: '/appointment',
            secondary_button_text: 'Emergency 24/7 Helpline',
            secondary_button_link: 'tel:+917201030048',
          },
        },
        {
          id: 'b2-rich',
          type: 'rich_text',
          title: 'Pioneering Heart Care with Precision & Compassion',
          badge: 'EXCELLENCE IN CLINICAL CARDIOLOGY',
          content: `
            <p class="text-base text-slate-700 leading-relaxed mb-4">
              At <strong>Rhythm Medicity</strong>, our Department of Cardiology is equipped with state-of-the-art flat-panel digital catheterization laboratories designed to offer rapid door-to-balloon interventional treatments for acute myocardial infarction (heart attack).
            </p>
            <p class="text-base text-slate-700 leading-relaxed mb-4">
              Our multidisciplinary heart team comprises internationally recognized interventional cardiologists, electrophysiologists, cardiac anesthetists, and specialized intensive care nurses collaborating to deliver clinical outcomes benchmarked against leading global standards.
            </p>
            <ul class="list-disc pl-5 space-y-2 text-slate-700 font-medium">
              <li><strong>24x7 Dedicated Cath Lab</strong> for emergency Primary Percutaneous Coronary Intervention (PPCI).</li>
              <li>Advanced 3D echocardiography, transesophageal echo (TEE), and automated Holter monitoring.</li>
              <li>Permanent Pacemaker (PPM), ICD, and Cardiac Resynchronization Therapy (CRT) implantations.</li>
              <li>Dedicated 16-bed Intensive Coronary Care Unit (ICCU) with invasive hemodynamic monitoring.</li>
            </ul>
          `,
        },
        {
          id: 'b3-cards',
          type: 'cards_grid',
          title: 'Specialized Cardiac Services & Procedures',
          subtitle: 'Evidence-based interventions performed by seasoned cardiac specialists.',
          badge: 'CLINICAL SERVICES',
          data: {
            columns: 3,
            cards: [
              {
                icon: 'HeartPulse',
                title: 'Coronary Angiography & Angioplasty',
                description: 'Radial and femoral approach catheter interventions with drug-eluting stents for blocked arteries.',
              },
              {
                icon: 'Activity',
                title: 'Emergency Primary PCI (Golden Hour)',
                description: 'Immediate balloon angioplasty within 60 minutes of arrival for acute heart attack patients.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Pacemaker & Device Clinic',
                description: 'Single, dual chamber, and leadless pacemaker implants along with routine device interrogation.',
              },
              {
                icon: 'Stethoscope',
                title: 'Heart Failure Management Clinic',
                description: 'Specialized multi-modal protocols focusing on lifestyle, medication optimization, and device therapies.',
              },
              {
                icon: 'Scan',
                title: 'Non-Invasive Cardiac Lab',
                description: 'Stress Echocardiography, Treadmill Testing (TMT), and 24-48 hr Ambulatory Blood Pressure monitoring.',
              },
              {
                icon: 'Sparkles',
                title: 'Preventive Cardiac Health Checks',
                description: 'Early risk stratification panels, lipid profiling, and coronary calcium assessments.',
              },
            ],
          },
        },
        {
          id: 'b4-faq',
          type: 'faq_accordion',
          title: 'Frequently Asked Questions',
          subtitle: 'Essential insights for heart patients and their family members.',
          badge: 'PATIENT GUIDANCE',
          data: {
            items: [
              {
                question: 'What symptoms indicate a cardiac emergency requiring immediate hospital arrival?',
                answer: 'Sudden retrosternal chest pain (crushing, heavy feeling), radiation of pain to the left arm, neck, or jaw, cold sweating, shortness of breath, or dizziness. Do not wait — call our 24x7 emergency helpline immediately at +91 7201030048.',
              },
              {
                question: 'Is your Cath Lab operational on weekends and holidays?',
                answer: 'Yes. The Rhythm Medicity Interventional Cardiology team operates 24 hours a day, 365 days a year with on-site cardiac intensivists and rapid-response cath lab technicians.',
              },
              {
                question: 'Do you accept cashless mediclaim for emergency angioplasty?',
                answer: 'Yes, our 24x7 TPA Desk assists with emergency pre-authorization for all major government health schemes, public sector insurers, and private health TPAs.',
              },
            ],
          },
        },
        {
          id: 'b5-cta',
          type: 'cta_banner',
          title: 'Consult Rhythm Medicity Heart Specialists Today',
          subtitle: 'Prioritize your cardiovascular wellness. Get your heart screened by premier cardiac consultants.',
          data: {
            button_text: 'Book Consultation',
            button_link: '/appointment',
          },
        },
      ],
    },
  },

  // 2. Neurology
  {
    id: 'p-neurology',
    title: 'Institute of Neurosciences & Stroke Care',
    navigation_title: 'Neurology',
    slug: 'services/neurology',
    featured_image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
    seo_title: 'Neurology & Stroke Clinic | Rhythm Medicity Hospital',
    seo_description: 'Expert neurological care, rapid stroke thrombolysis, epilepsy clinic, and spine management at Rhythm Medicity.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'bn1-hero',
          type: 'hero',
          title: 'Institute of Neurosciences & Comprehensive Stroke Care',
          subtitle: 'Pioneering neurological diagnosis, acute hyper-acute stroke interventions, and dedicated neuro-intensive care for brain and spine disorders.',
          badge: 'ACUTE NEURO CARE',
          alignment: 'center',
          background_style: 'sand',
          data: {
            primary_button_text: 'Book Neurologist Appointment',
            primary_button_link: '/appointment',
            secondary_button_text: 'Stroke Emergency',
            secondary_button_link: 'tel:+917201030048',
          },
        },
        {
          id: 'bn2-cards',
          type: 'cards_grid',
          title: 'Centres of Neurological Focus',
          badge: 'SPECIALIZED UNITS',
          data: {
            columns: 3,
            cards: [
              {
                icon: 'Activity',
                title: 'Hyperacute Stroke Unit',
                description: 'Rapid IV Thrombolysis (r-tPA) within the 4.5-hour golden window with multi-slice neuroimaging.',
              },
              {
                icon: 'Layers',
                title: 'Comprehensive Epilepsy Clinic',
                description: 'Digital Video-EEG monitoring, drug-resistant epilepsy evaluation, and personalized therapy.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Headache & Migraine Centre',
                description: 'Specialized clinic targeting chronic migraines, tension headaches, and trigeminal neuralgia.',
              },
              {
                icon: 'Users',
                title: 'Movement Disorders Clinic',
                description: 'Diagnostic and therapeutic protocols for Parkinsonism, essential tremors, and dystonias.',
              },
              {
                icon: 'Scan',
                title: 'Neuro-Electrophysiology Lab',
                description: 'High-precision EMG, Nerve Conduction Studies (NCS), VEP, and autonomic testing.',
              },
              {
                icon: 'BriefcaseMedical',
                title: 'Neuro-Rehabilitation',
                description: 'Post-stroke gait retraining, speech therapy, and occupational rehabilitation protocols.',
              },
            ],
          },
        },
        {
          id: 'bn3-cta',
          type: 'cta_banner',
          title: 'Schedule a Consultation with our Neuro Team',
          subtitle: 'Early diagnosis is essential for optimal brain and nerve health.',
          data: {
            button_text: 'Book OPD Slot',
            button_link: '/appointment',
          },
        },
      ],
    },
  },

  // 3. Orthopaedics
  {
    id: 'p-orthopaedics',
    title: 'Department of Orthopaedics & Joint Replacement',
    navigation_title: 'Orthopaedics',
    slug: 'services/orthopaedics',
    featured_image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    seo_title: 'Orthopaedics & Joint Replacement | Rhythm Medicity',
    seo_description: 'Joint replacement, knee and hip surgery, arthroscopy, sports trauma, and fracture care at Rhythm Medicity Hospital.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'bo1-hero',
          type: 'hero',
          title: 'Orthopaedics, Joint Replacement & Trauma Care',
          subtitle: 'Restoring mobility and pain-free living with precision knee, hip arthroplasty, and arthroscopic interventions in laminar airflow operation theatres.',
          badge: 'MOBILITY RESTORATION',
          alignment: 'center',
          background_style: 'white',
          data: {
            primary_button_text: 'Consult Orthopaedic Surgeon',
            primary_button_link: '/appointment',
          },
        },
        {
          id: 'bo2-cards',
          type: 'cards_grid',
          title: 'Key Orthopaedic Specialties',
          badge: 'OUR EXPERTISE',
          data: {
            columns: 3,
            cards: [
              {
                icon: 'Activity',
                title: 'Total Knee Replacement (TKR)',
                description: 'Minimally invasive, muscle-sparing knee joint replacements with rapid postoperative recovery protocols.',
              },
              {
                icon: 'Bone',
                title: 'Total Hip Arthroplasty (THA)',
                description: 'Uncemented and cemented ceramic-on-ceramic hip replacements for arthritis and avascular necrosis.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Sports Medicine & Arthroscopy',
                description: 'Keyhole ligament reconstructions (ACL, PCL, Meniscus, Rotator Cuff) with rapid athletic rehab.',
              },
              {
                icon: 'BriefcaseMedical',
                title: '24/7 Complex Trauma Care',
                description: 'Polytrauma stabilization, complex intra-articular fractures, pelvic injuries, and non-union surgeries.',
              },
              {
                icon: 'Users',
                title: 'Spine & Deformity Clinic',
                description: 'Microdiscectomy, spinal fusion, and non-operative management for sciatica and slip disc.',
              },
              {
                icon: 'Sparkles',
                title: 'Physiotherapy & Hydrotherapy',
                description: 'Dedicated post-surgical rehabilitation suites with certified musculoskeletal therapists.',
              },
            ],
          },
        },
        {
          id: 'bo3-cta',
          type: 'cta_banner',
          title: 'Walk Pain-Free Again',
          subtitle: 'Meet our senior joint reconstruction surgeons for personalized consultation.',
          data: {
            button_text: 'Book Joint Consultation',
            button_link: '/appointment',
          },
        },
      ],
    },
  },

  // 4. Diagnostics
  {
    id: 'p-diagnostics',
    title: '24/7 Precision Diagnostics & Pathology Labs',
    navigation_title: 'Diagnostics',
    slug: 'services/diagnostics',
    featured_image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
    seo_title: 'Laboratory & Diagnostic Services | Rhythm Medicity',
    seo_description: 'NABL-standard automated pathology, CT scanning, ultrasound, digital X-ray, and ECG laboratory services.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'bd1-hero',
          type: 'hero',
          title: 'Precision Diagnostics & 24/7 Automated Laboratory',
          subtitle: 'Accurate clinical investigations powered by multi-slice CT, high-definition ultrasonography, and fully automated robotic analyzers.',
          badge: 'PRECISION MEDICINE',
          alignment: 'center',
          background_style: 'sand',
          data: {
            primary_button_text: 'View Test Menu & Book',
            primary_button_link: '/appointment',
          },
        },
        {
          id: 'bd2-cards',
          type: 'cards_grid',
          title: 'Diagnostic Departments',
          badge: 'FACILITIES',
          data: {
            columns: 3,
            cards: [
              {
                icon: 'Scan',
                title: 'Multi-Slice CT Scanner',
                description: 'Ultra-fast sub-millimeter whole body imaging, brain angiography, and pulmonary scans.',
              },
              {
                icon: 'FlaskConical',
                title: 'Clinical Biochemistry & Immunoassay',
                description: 'Fully automated Roche and Beckman analyzers for hormone assays, vitamins, and cardiac markers.',
              },
              {
                icon: 'HeartPulse',
                title: 'Ultrasonography & Color Doppler',
                description: 'High-frequency 4D ultrasound, vascular Doppler, musculoskeletal, and fetal anomaly scans.',
              },
              {
                icon: 'Activity',
                title: 'Digital X-Ray & Bone Densitometry',
                description: 'Low-radiation high-resolution digital radiography with immediate PACS digital delivery.',
              },
              {
                icon: 'FileText',
                title: 'Hematology & Coagulation Lab',
                description: '5-part differential blood counts, automated PT/INR monitoring, and specialized blood panels.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Rapid STAT Emergency Reporting',
                description: 'Critical care blood gas (ABG), troponin, and electrolytes available within 15 minutes 24x7.',
              },
            ],
          },
        },
      ],
    },
  },

  // 5. Patient Information
  {
    id: 'p-patient-info',
    title: 'Patient & Visitor Information Guide',
    navigation_title: 'Patient Information',
    slug: 'patient-care/patient-information',
    featured_image: null,
    seo_title: 'Patient Guide & Visiting Hours | Rhythm Medicity',
    seo_description: 'Complete patient guide: admission formalities, visiting hours, room amenities, and hospital guidelines.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'pi1-hero',
          type: 'hero',
          title: 'Welcome to Rhythm Medicity: Patient Information Guide',
          subtitle: 'We are committed to making your hospital stay comfortable, compassionate, and seamless.',
          badge: 'PATIENT FIRST',
          alignment: 'center',
          background_style: 'teal',
        },
        {
          id: 'pi2-rich',
          type: 'rich_text',
          title: 'Hospital Timings & Visiting Guidelines',
          badge: 'GUIDELINES',
          content: `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div class="p-4 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs">
                <h4 class="font-bold text-[#006655] text-base mb-1">OPD Consultation Hours</h4>
                <p class="text-sm text-slate-600">Monday to Saturday: 09:00 AM – 08:00 PM</p>
                <p class="text-sm text-slate-600">Sunday: 10:00 AM – 01:00 PM (Select Specialties)</p>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs">
                <h4 class="font-bold text-rose-700 text-base mb-1">Emergency & Trauma Service</h4>
                <p class="text-sm text-slate-600">Open 24 Hours / 7 Days a Week, 365 Days</p>
                <p class="text-sm text-slate-600">Immediate Triage & Critical Care Response</p>
              </div>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed mb-3">
              <strong>Visiting Hours for General & Deluxe Wards:</strong> 05:00 PM – 07:00 PM daily. Only two visitors with valid visitor passes are allowed at a time to ensure patient rest and infection prevention.
            </p>
            <p class="text-sm text-slate-700 leading-relaxed">
              <strong>ICU / ICCU Visiting Protocol:</strong> 11:00 AM – 12:00 PM and 05:00 PM – 06:00 PM. One attendant permitted with protective shoe covers and hand hygiene compliance.
            </p>
          `,
        },
        {
          id: 'pi3-contact',
          type: 'contact_box',
          title: 'Hospital Front Desk & Help Line',
          subtitle: 'Our patient coordination executives are available around the clock.',
        },
      ],
    },
  },

  // 6. Insurance & TPA
  {
    id: 'p-insurance',
    title: 'Cashless Insurance & TPA Empanelments',
    navigation_title: 'Insurance & TPA',
    slug: 'patient-care/insurance',
    featured_image: null,
    seo_title: 'Cashless Mediclaim & TPAs | Rhythm Medicity',
    seo_description: 'Empaneled insurance companies, TPAs, and cashless hospitalization guidelines at Rhythm Medicity.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'ins1-hero',
          type: 'hero',
          title: 'Hassle-Free Cashless Mediclaim & TPA Desk',
          subtitle: 'Empaneled with all prominent national health insurance companies and Third Party Administrators (TPAs) for smooth, transparent cashless admissions.',
          badge: 'CASHLESS HOSPITALIZATION',
          alignment: 'center',
          background_style: 'sand',
        },
        {
          id: 'ins2-cards',
          type: 'cards_grid',
          title: 'Leading Empaneled Health Insurers & TPAs',
          badge: 'OUR PARTNERS',
          data: {
            columns: 3,
            cards: [
              { icon: 'ShieldCheck', title: 'Star Health & Allied Insurance', description: 'Direct cashless network with pre-approved fast turnaround.' },
              { icon: 'ShieldCheck', title: 'HDFC ERGO Health Insurance', description: 'Seamless cashless authorization for planned and emergency care.' },
              { icon: 'ShieldCheck', title: 'Care Health Insurance', description: 'Comprehensive cashless coverage across general and deluxe suites.' },
              { icon: 'ShieldCheck', title: 'ICICI Lombard General Insurance', description: 'Digital pre-auth processing and quick discharge settlement.' },
              { icon: 'ShieldCheck', title: 'Niva Bupa Health Insurance', description: '24x7 cashless processing for critical procedures and surgeries.' },
              { icon: 'ShieldCheck', title: 'Medi Assist / Vidal / Paramount TPA', description: 'Cashless desks across all major corporate and retail policies.' },
            ],
          },
        },
        {
          id: 'ins3-faq',
          type: 'faq_accordion',
          title: 'Cashless Claim Process & Documents Required',
          badge: 'HOW IT WORKS',
          data: {
            items: [
              {
                question: 'What documents do I need to bring for cashless admission?',
                answer: 'Please carry: 1) Original Health Insurance Card or Policy copy, 2) Patient Govt Photo ID (Aadhaar / Voter ID / PAN), 3) Treating Doctor Prescription & Investigation reports, 4) Corporate Employee ID (if corporate group policy).',
              },
              {
                question: 'How much time does pre-authorization approval take?',
                answer: 'For planned surgeries, pre-authorization is usually granted within 2-4 hours of submission. For emergency admissions, initial emergency approval is processed immediately upon clinical assessment.',
              },
            ],
          },
        },
      ],
    },
  },

  // 7. Health Packages
  {
    id: 'p-health-packages',
    title: 'Comprehensive Preventive Health Packages',
    navigation_title: 'Health Packages',
    slug: 'patient-care/health-packages',
    featured_image: null,
    seo_title: 'Preventive Health Checkup Packages | Rhythm Medicity',
    seo_description: 'Affordable preventive health checkup packages for cardiac wellness, executive health, women, and senior citizens.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'hp1-hero',
          type: 'hero',
          title: 'Comprehensive Health & Wellness Packages',
          subtitle: 'Invest in your health before symptoms arise. Accurate screenings designed by senior physicians for total peace of mind.',
          badge: 'PREVENTIVE WELLNESS',
          alignment: 'center',
          background_style: 'white',
        },
        {
          id: 'hp2-cards',
          type: 'cards_grid',
          title: 'Popular Wellness Checkups',
          badge: 'CURATED HEALTH PLANS',
          data: {
            columns: 3,
            cards: [
              {
                icon: 'HeartPulse',
                title: 'Comprehensive Cardiac Screen',
                description: 'ECG, 2D Echo, TMT, Lipid Profile, Hs-CRP, HbA1c, and Cardiologist Consultation.',
              },
              {
                icon: 'Sparkles',
                title: 'Executive Master Health Package',
                description: '65+ essential tests including Complete Hemogram, Kidney Profile, Liver Function, Ultrasound, and X-Ray.',
              },
              {
                icon: 'Users',
                title: 'Well Woman Health Checkup',
                description: 'CBC, Thyroid Profile, Mammography/Breast Exam, Pap Smear, and Gynecologist Consultation.',
              },
              {
                icon: 'Bone',
                title: 'Senior Citizen Wellness Plan',
                description: 'Bone Mineral Density (DEXA), Vitamin D & B12, Prostate/Pelvic USG, and Physician Review.',
              },
              {
                icon: 'Activity',
                title: 'Diabetic Care & Renal Assessment',
                description: 'Fasting/PP Blood Sugar, Microalbuminuria, HbA1c, Fundoscopy, and Diabetic Foot Exam.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Basic Life Screening',
                description: 'Essential CBC, Urine Routine, Fasting Glucose, Serum Creatinine, and Physician review.',
              },
            ],
          },
        },
        {
          id: 'hp3-cta',
          type: 'cta_banner',
          title: 'Book Your Health Checkup Package',
          subtitle: 'Available daily with fasting instructions. Same-day digital reports.',
          data: {
            button_text: 'Book Package',
            button_link: '/appointment',
          },
        },
      ],
    },
  },

  // 8. Hospital History
  {
    id: 'p-about-history',
    title: 'Hospital History & Milestone Journey',
    navigation_title: 'Hospital History',
    slug: 'about/history',
    featured_image: null,
    seo_title: 'Hospital History & Legacy | Rhythm Medicity',
    seo_description: 'Discover the inception, founding vision, and remarkable healthcare milestones of Rhythm Medicity.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'hh1-hero',
          type: 'hero',
          title: 'Our Journey & Clinical Legacy',
          subtitle: 'Founded with a profound mission to make tertiary, compassionate, and ethical medical care accessible to every citizen.',
          badge: 'OUR STORY',
          alignment: 'center',
          background_style: 'sand',
        },
        {
          id: 'hh2-rich',
          type: 'rich_text',
          title: 'From A Medical Dream to A Regional Beacon of Healing',
          badge: 'FOUNDING LEGACY',
          content: `
            <p class="text-base text-slate-700 leading-relaxed mb-4">
              <strong>Rhythm Medicity</strong> was established by visionary physicians seeking to bridge the gap between high-end metropolitan medical technology and localized, personalized patient care.
            </p>
            <p class="text-base text-slate-700 leading-relaxed mb-4">
              Starting as a specialized critical care setup, the hospital quickly evolved into a multi-speciality tertiary centre with dedicated centres of clinical excellence in Cardiology, Neurology, Orthopaedics, and Critical Care.
            </p>
            <p class="text-base text-slate-700 leading-relaxed">
              Today, with over 150+ beds, advanced digital flat-panel cath labs, modern modular operation suites, and a 24x7 emergency and trauma division, Rhythm Medicity continues to touch hundreds of thousands of lives every year.
            </p>
          `,
        },
      ],
    },
  },

  // 9. Vision & Mission
  {
    id: 'p-about-vision',
    title: 'Vision, Mission & Core Values',
    navigation_title: 'Vision & Mission',
    slug: 'about/vision-mission',
    featured_image: null,
    seo_title: 'Vision & Mission | Rhythm Medicity Hospital',
    seo_description: 'Our guiding philosophy, patient-first pledge, and ethical clinical commitments at Rhythm Medicity.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'vm1-hero',
          type: 'hero',
          title: 'Our Vision, Mission & Core Pillars',
          subtitle: 'The clinical ethics and patient-centred principles that guide every medical decision we make.',
          badge: 'GUIDING PRINCIPLES',
          alignment: 'center',
          background_style: 'teal',
        },
        {
          id: 'vm2-cards',
          type: 'cards_grid',
          title: 'The Pillars of Rhythm Medicity',
          badge: 'FOUNDATIONAL VALUES',
          data: {
            columns: 3,
            cards: [
              { icon: 'Target', title: 'Our Vision', description: 'To be the most trusted healthcare institution renowned for clinical excellence, innovative technology, and compassionate patient care.' },
              { icon: 'HeartPulse', title: 'Our Mission', description: 'To heal with empathy, practice evidence-based ethical medicine, and continually raise clinical benchmarks for affordable care.' },
              { icon: 'ShieldCheck', title: 'Patient Safety First', description: 'Strict compliance with NABH protocols, zero-tolerance infection control, and continuous quality monitoring.' },
              { icon: 'Users', title: 'Compassionate Care', description: 'Treating each patient and their loved ones with dignity, transparency, and warmth.' },
              { icon: 'Award', title: 'Clinical Integrity', description: 'Honest medical advice, transparent billing, and rational clinical decision-making.' },
              { icon: 'Sparkles', title: 'Continuous Innovation', description: 'Investing in cutting-edge surgical robotics, imaging systems, and ongoing medical training.' },
            ],
          },
        },
      ],
    },
  },

  // 10. Infrastructure
  {
    id: 'p-about-infrastructure',
    title: 'Hospital Infrastructure & Technology',
    navigation_title: 'Infrastructure',
    slug: 'about/infrastructure',
    featured_image: null,
    seo_title: 'Hospital Infrastructure & Facilities | Rhythm Medicity',
    seo_description: 'Explore the modular operation theatres, intensive care units, and hospital infrastructure at Rhythm Medicity.',
    status: 'published',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    published_at: '2026-01-01T00:00:00.000Z',
    content: {
      blocks: [
        {
          id: 'inf1-hero',
          type: 'hero',
          title: 'World-Class Clinical Infrastructure',
          subtitle: 'Designed according to international health architecture standards with strict HEPA laminar airflow, healing natural lighting, and intelligent medical systems.',
          badge: 'MODERN CAMPUS',
          alignment: 'center',
          background_style: 'white',
        },
        {
          id: 'inf2-cards',
          type: 'cards_grid',
          title: 'Campus Highlights & Facilities',
          badge: 'FACILITY TOUR',
          data: {
            columns: 3,
            cards: [
              { icon: 'Layers', title: 'Modular Operation Theatres', description: 'Seamless antibacterial wall panels, laminar air flow, and integrated surgical visualization.' },
              { icon: 'HeartPulse', title: 'Multi-Disciplinary ICUs', description: 'Invasive monitoring, Drager ventilators, isolated cubicles, and 1:1 nurse-to-patient ratio.' },
              { icon: 'Scan', title: 'Flat-Panel Cath Lab', description: 'Low radiation dose interventional suite equipped for complex coronary and vascular stenting.' },
              { icon: 'Building2', title: 'Inpatient Suites & Deluxe Rooms', description: 'Ergonomic electric beds, attendant lounges, dedicated nurse call stations, and wifi.' },
              { icon: 'Activity', title: '24/7 Power & Oxygen Backup', description: 'Dedicated on-site Liquid Medical Oxygen (LMO) cryogenic plant and dual redundant generators.' },
              { icon: 'BriefcaseMedical', title: 'Automated Central Pharmacy', description: 'Temperature-controlled storage, genuine pharmaceuticals, and direct bedside dispensing.' },
            ],
          },
        },
      ],
    },
  },
];

function getStoredLocalPages(): Page[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(DEFAULT_PAGES));
      return DEFAULT_PAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PAGES;
  } catch (err) {
    console.warn('Failed to parse local pages, using defaults:', err);
    return DEFAULT_PAGES;
  }
}

function saveLocalPages(pages: Page[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(pages));
    notifyPagesUpdate();
  } catch (err) {
    console.error('Failed to save local pages:', err);
  }
}

export function notifyPagesUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rhythm_pages_changed'));
  }
}

export const PageService = {
  /**
   * Normalize slug to standard format (no leading/trailing slashes, lowercase)
   */
  normalizeSlug(rawSlug: string): string {
    if (!rawSlug) return '';
    return rawSlug
      .toLowerCase()
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/\s+/g, '-');
  },

  /**
   * Automatically generate SEO-friendly slug
   */
  generateSlug(title: string, parentPrefix?: string): string {
    const cleanTitle = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (parentPrefix) {
      const cleanPrefix = this.normalizeSlug(parentPrefix);
      return cleanPrefix ? `${cleanPrefix}/${cleanTitle}` : cleanTitle;
    }
    return cleanTitle;
  },

  /**
   * Get page by slug for public or admin viewing
   */
  async getPageBySlug(rawSlug: string, allowUnpublished = false): Promise<Page | null> {
    const slug = this.normalizeSlug(rawSlug);

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('pages').select('*').eq('slug', slug);
        if (!allowUnpublished) {
          query = query.eq('status', 'published');
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          return data as Page;
        }
      } catch (err) {
        console.warn('Supabase getPageBySlug error, falling back to local:', err);
      }
    }

    const localPages = getStoredLocalPages();
    const found = localPages.find((p) => this.normalizeSlug(p.slug) === slug);
    if (!found) return null;

    if (!allowUnpublished && found.status !== 'published') {
      return null;
    }
    return found;
  },

  /**
   * Get page by ID
   */
  async getPageById(id: string): Promise<Page | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('pages').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data as Page;
      } catch (err) {
        console.warn('Supabase getPageById error, fallback to local:', err);
      }
    }

    const localPages = getStoredLocalPages();
    return localPages.find((p) => p.id === id) || null;
  },

  /**
   * Get all pages for Admin console
   */
  async getAllPagesAdmin(): Promise<Page[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Page[];
        }
      } catch (err) {
        console.warn('Supabase getAllPagesAdmin error, fallback to local:', err);
      }
    }

    return getStoredLocalPages();
  },

  /**
   * Get all published pages for public website, smart search, and navigation
   */
  async getPublishedPages(): Promise<Page[]> {
    const all = await this.getAllPagesAdmin();
    return all.filter((p) => p.status === 'published');
  },

  /**
   * Create a new page
   */
  async createPage(pageData: Partial<Page>): Promise<Page> {
    const now = new Date().toISOString();
    const slug = this.normalizeSlug(pageData.slug || this.generateSlug(pageData.title || 'new-page'));

    // Check duplicate slug
    const existing = await this.getPageBySlug(slug, true);
    if (existing) {
      throw new Error(`A page with slug "/${slug}" already exists. Please choose a unique slug.`);
    }

    const newPage: Page = {
      id: generateUUID(),
      title: pageData.title || 'Untitled Page',
      navigation_title: pageData.navigation_title || null,
      slug,
      content: pageData.content || { blocks: [] },
      featured_image: pageData.featured_image || null,
      seo_title: pageData.seo_title || pageData.title || null,
      seo_description: pageData.seo_description || null,
      status: pageData.status || 'draft',
      created_at: now,
      updated_at: now,
      published_at: pageData.status === 'published' ? now : null,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('pages')
          .insert([newPage])
          .select()
          .single();

        if (!error && data) {
          notifyPagesUpdate();
          return data as Page;
        }
      } catch (err) {
        console.warn('Supabase createPage error, saving to local fallback:', err);
      }
    }

    const current = getStoredLocalPages();
    const updated = [newPage, ...current];
    saveLocalPages(updated);
    return newPage;
  },

  /**
   * Update an existing page
   */
  async updatePage(id: string, updates: Partial<Page>): Promise<Page> {
    const now = new Date().toISOString();
    const current = getStoredLocalPages();
    const existing = current.find((p) => p.id === id);

    let updatedSlug = updates.slug ? this.normalizeSlug(updates.slug) : existing?.slug;
    if (updatedSlug && existing && updatedSlug !== existing.slug) {
      const duplicate = current.find((p) => p.id !== id && this.normalizeSlug(p.slug) === updatedSlug);
      if (duplicate) {
        throw new Error(`A page with slug "/${updatedSlug}" already exists. Please choose a unique slug.`);
      }
    }

    const updatedData: Partial<Page> = {
      ...updates,
      slug: updatedSlug,
      updated_at: now,
      ...(updates.status === 'published' && !existing?.published_at ? { published_at: now } : {}),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('pages')
          .update(updatedData)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          notifyPagesUpdate();
          return data as Page;
        }
      } catch (err) {
        console.warn('Supabase updatePage error, updating local:', err);
      }
    }

    const index = current.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Page not found');

    const updatedPage: Page = {
      ...current[index],
      ...updatedData,
    };
    current[index] = updatedPage;
    saveLocalPages(current);
    return updatedPage;
  },

  /**
   * Delete a page
   */
  async deletePage(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('pages').delete().eq('id', id);
        notifyPagesUpdate();
        return;
      } catch (err) {
        console.warn('Supabase deletePage error, deleting local:', err);
      }
    }

    const current = getStoredLocalPages();
    const filtered = current.filter((p) => p.id !== id);
    saveLocalPages(filtered);
  },

  /**
   * Duplicate a page
   */
  async duplicatePage(id: string): Promise<Page> {
    const original = await this.getPageById(id);
    if (!original) throw new Error('Page to duplicate not found');

    const newTitle = `${original.title} (Copy)`;
    const newSlug = this.generateSlug(newTitle);

    return this.createPage({
      title: newTitle,
      navigation_title: original.navigation_title ? `${original.navigation_title} (Copy)` : null,
      slug: newSlug,
      content: JSON.parse(JSON.stringify(original.content)),
      featured_image: original.featured_image,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      status: 'draft',
    });
  },

  /**
   * Publish a page
   */
  async publishPage(id: string): Promise<Page> {
    return this.updatePage(id, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
  },

  /**
   * Unpublish a page (set to draft)
   */
  async unpublishPage(id: string): Promise<Page> {
    return this.updatePage(id, {
      status: 'draft',
    });
  },
};
