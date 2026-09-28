import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';
import { DropdownCategory, DropdownOption, DropdownReferenceCheckResult } from '../types/dropdown';
import { AuditService } from './auditService';

// Storage keys for offline / initial state
const LOCAL_CATEGORIES_KEY = 'rhythm_dropdown_categories';
const LOCAL_OPTIONS_KEY = 'rhythm_dropdown_options';

// ============================================================
// DEFAULT SEED CATEGORIES (22 core categories across 5 groups)
// ============================================================
export const DEFAULT_DROPDOWN_CATEGORIES: DropdownCategory[] = [
  // 1. Doctor Related
  {
    id: 'cat-doc-1',
    category_key: 'doctor_specialization',
    name: 'Doctor Specialization',
    group: 'Doctor Related',
    description: 'Clinical specializations and sub-specialities for medical practitioners',
    is_system: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-doc-2',
    category_key: 'doctor_qualification',
    name: 'Doctor Qualification',
    group: 'Doctor Related',
    description: 'Degrees, fellowships, and medical credentials of hospital doctors',
    is_system: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-doc-3',
    category_key: 'doctor_department',
    name: 'Doctor Department',
    group: 'Doctor Related',
    description: 'Clinical units and administrative hospital departments',
    is_system: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-doc-4',
    category_key: 'doctor_experience',
    name: 'Doctor Experience Category',
    group: 'Doctor Related',
    description: 'Seniority brackets and years of clinical practice categories',
    is_system: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-doc-5',
    category_key: 'doctor_consultation_type',
    name: 'Doctor Consultation Type',
    group: 'Doctor Related',
    description: 'Delivery modes for medical consultations (OPD, Video, Emergency)',
    is_system: true,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. Patient Related
  {
    id: 'cat-pat-1',
    category_key: 'gender',
    name: 'Gender',
    group: 'Patient Related',
    description: 'Gender designations for patient records and profile registration',
    is_system: true,
    display_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-pat-2',
    category_key: 'blood_group',
    name: 'Blood Group',
    group: 'Patient Related',
    description: 'ABO and Rh blood group types for patient clinical profiles',
    is_system: true,
    display_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-pat-3',
    category_key: 'age_category',
    name: 'Age Category',
    group: 'Patient Related',
    description: 'Clinical age brackets (Infant, Pediatric, Adult, Geriatric)',
    is_system: true,
    display_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-pat-4',
    category_key: 'patient_type',
    name: 'Patient Type',
    group: 'Patient Related',
    description: 'Patient classification (General, Insured/TPA, Corporate, VIP)',
    is_system: true,
    display_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-pat-5',
    category_key: 'visit_type',
    name: 'Visit Type',
    group: 'Patient Related',
    description: 'Nature of patient visit (New Registration, Routine Follow-up, Second Opinion)',
    is_system: true,
    display_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. Appointment Related
  {
    id: 'cat-app-1',
    category_key: 'appointment_type',
    name: 'Appointment Type',
    group: 'Appointment Related',
    description: 'Booking categories for patient consultations and hospital visits',
    is_system: true,
    display_order: 11,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-app-2',
    category_key: 'appointment_status',
    name: 'Appointment Status',
    group: 'Appointment Related',
    description: 'Lifecycle stages for booked appointments in OPD and queue management',
    is_system: true,
    display_order: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-app-3',
    category_key: 'visit_reason',
    name: 'Visit Reason',
    group: 'Appointment Related',
    description: 'Common medical symptoms and visit reasons in booking forms',
    is_system: true,
    display_order: 13,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-app-4',
    category_key: 'consultation_type',
    name: 'Consultation Type',
    group: 'Appointment Related',
    description: 'Consultation formats offered across hospital departments',
    is_system: true,
    display_order: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-app-5',
    category_key: 'appointment_duration',
    name: 'Appointment Duration',
    group: 'Appointment Related',
    description: 'Standard doctor slot durations in minutes',
    is_system: true,
    display_order: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 4. Payment Related
  {
    id: 'cat-pay-1',
    category_key: 'payment_method',
    name: 'Payment Method',
    group: 'Payment Related',
    description: 'Accepted hospital fee payment channels and gateways',
    is_system: true,
    display_order: 16,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-pay-2',
    category_key: 'payment_status',
    name: 'Payment Status',
    group: 'Payment Related',
    description: 'Transaction accounting statuses for billing and revenue records',
    is_system: true,
    display_order: 17,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-pay-3',
    category_key: 'refund_status',
    name: 'Refund Status',
    group: 'Payment Related',
    description: 'Workflow statuses for patient cancellation refunds',
    is_system: true,
    display_order: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 5. Hospital Related
  {
    id: 'cat-hos-1',
    category_key: 'department',
    name: 'Department',
    group: 'Hospital Related',
    description: 'Hospital departments and clinical specialty units',
    is_system: true,
    display_order: 19,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-hos-2',
    category_key: 'room_type',
    name: 'Room Type',
    group: 'Hospital Related',
    description: 'Inpatient ward categories and accommodation room classifications',
    is_system: true,
    display_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-hos-3',
    category_key: 'bed_type',
    name: 'Bed Type',
    group: 'Hospital Related',
    description: 'Inpatient bed specifications and motorized ICU configurations',
    is_system: true,
    display_order: 21,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-hos-4',
    category_key: 'service_type',
    name: 'Service Type',
    group: 'Hospital Related',
    description: 'Diagnostic, surgical, and therapeutic service classifications',
    is_system: true,
    display_order: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================
// DEFAULT SEED OPTIONS FOR ALL CATEGORIES
// ============================================================
export const DEFAULT_DROPDOWN_OPTIONS: DropdownOption[] = [
  // --- 1. Doctor Specialization ---
  { id: 'opt-spec-1', category_key: 'doctor_specialization', name: 'Cardiology', code: 'CARD', description: 'Heart & Cardiovascular Care', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-2', category_key: 'doctor_specialization', name: 'Neurology', code: 'NEUR', description: 'Brain & Nervous System Disorders', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-3', category_key: 'doctor_specialization', name: 'Orthopedics', code: 'ORTH', description: 'Bones, Joints & Spine Surgery', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-4', category_key: 'doctor_specialization', name: 'General Medicine', code: 'GMED', description: 'Comprehensive Primary & Internal Medicine', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-5', category_key: 'doctor_specialization', name: 'Gastroenterology', code: 'GAST', description: 'Digestive System & Liver Disease', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-6', category_key: 'doctor_specialization', name: 'Pediatrics', code: 'PEDI', description: 'Child & Adolescent Healthcare', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-7', category_key: 'doctor_specialization', name: 'Nephrology', code: 'NEPH', description: 'Kidney Health & Dialysis', display_order: 7, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-8', category_key: 'doctor_specialization', name: 'Oncology', code: 'ONCO', description: 'Cancer Care & Chemotherapy', display_order: 8, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-9', category_key: 'doctor_specialization', name: 'Pulmonology', code: 'PULM', description: 'Respiratory & Chest Medicine', display_order: 9, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-spec-10', category_key: 'doctor_specialization', name: 'Dermatology', code: 'DERM', description: 'Skin, Hair & Aesthetics', display_order: 10, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 2. Doctor Qualification ---
  { id: 'opt-qual-1', category_key: 'doctor_qualification', name: 'MBBS, MD', code: 'MD', description: 'Doctor of Medicine', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-qual-2', category_key: 'doctor_qualification', name: 'MBBS, MS', code: 'MS', description: 'Master of Surgery', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-qual-3', category_key: 'doctor_qualification', name: 'MBBS, MD, DM (Cardiology)', code: 'DM-CARD', description: 'Super-Specialist Doctorate in Cardiology', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-qual-4', category_key: 'doctor_qualification', name: 'MBBS, MD, DM (Neurology)', code: 'DM-NEUR', description: 'Super-Specialist Doctorate in Neurology', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-qual-5', category_key: 'doctor_qualification', name: 'MBBS, MS, MCh (Orthopedics)', code: 'MCH-ORTH', description: 'Magister Chirurgiae in Orthopedics', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-qual-6', category_key: 'doctor_qualification', name: 'MBBS, DNB, MRCP (UK)', code: 'MRCP', description: 'Diplomate National Board & Member of Royal College', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-qual-7', category_key: 'doctor_qualification', name: 'MBBS, DCH, MD (Pediatrics)', code: 'MD-PED', description: 'Pediatric Specialist', display_order: 7, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 3. Doctor Department ---
  { id: 'opt-docdept-1', category_key: 'doctor_department', name: 'Cardiology Department', code: 'DEPT-CARD', description: 'Cardiac ICU & OPD', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-docdept-2', category_key: 'doctor_department', name: 'Neurology Department', code: 'DEPT-NEUR', description: 'Neuro Care & EEG Unit', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-docdept-3', category_key: 'doctor_department', name: 'Orthopedics & Joint Replacement', code: 'DEPT-ORTH', description: 'Arthroplasty & Trauma Wing', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-docdept-4', category_key: 'doctor_department', name: 'General & Internal Medicine', code: 'DEPT-GMED', description: 'Inpatient & Outpatient Care', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-docdept-5', category_key: 'doctor_department', name: 'Critical Care & ICU', code: 'DEPT-ICU', description: 'Intensive Care Unit & Resuscitation', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 4. Doctor Experience Category ---
  { id: 'opt-exp-1', category_key: 'doctor_experience', name: '1 - 3 Years (Junior Consultant)', code: 'EXP-JR', description: 'Resident / Junior Medical Specialist', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-exp-2', category_key: 'doctor_experience', name: '4 - 7 Years (Specialist Consultant)', code: 'EXP-SPEC', description: 'Experienced Clinical Specialist', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-exp-3', category_key: 'doctor_experience', name: '8 - 14 Years (Senior Consultant)', code: 'EXP-SR', description: 'Senior Medical Specialist', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-exp-4', category_key: 'doctor_experience', name: '15+ Years (Chief / HOD / Director)', code: 'EXP-DIR', description: 'Head of Department & Master Clinician', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 5. Doctor Consultation Type ---
  { id: 'opt-doccons-1', category_key: 'doctor_consultation_type', name: 'Physical OPD Consultation', code: 'OPD-PHYS', description: 'In-clinic face-to-face consultation', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-doccons-2', category_key: 'doctor_consultation_type', name: 'Telemedicine / Video Consultation', code: 'OPD-VIDEO', description: 'Encrypted HD telehealth session', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-doccons-3', category_key: 'doctor_consultation_type', name: 'Emergency On-Call Consultation', code: 'OPD-EMERG', description: '24/7 Priority Emergency Evaluation', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-doccons-4', category_key: 'doctor_consultation_type', name: 'Follow-up / Report Review', code: 'OPD-REV', description: 'Post-test review session', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 6. Gender ---
  { id: 'opt-gen-1', category_key: 'gender', name: 'Male', code: 'M', description: 'Male Gender', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-gen-2', category_key: 'gender', name: 'Female', code: 'F', description: 'Female Gender', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-gen-3', category_key: 'gender', name: 'Other', code: 'O', description: 'Other / Non-binary', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 7. Blood Group ---
  { id: 'opt-bg-1', category_key: 'blood_group', name: 'A Positive (A+)', code: 'A+', description: 'A Rh-Positive', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-2', category_key: 'blood_group', name: 'A Negative (A-)', code: 'A-', description: 'A Rh-Negative', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-3', category_key: 'blood_group', name: 'B Positive (B+)', code: 'B+', description: 'B Rh-Positive', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-4', category_key: 'blood_group', name: 'B Negative (B-)', code: 'B-', description: 'B Rh-Negative', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-5', category_key: 'blood_group', name: 'AB Positive (AB+)', code: 'AB+', description: 'AB Rh-Positive (Universal Recipient)', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-6', category_key: 'blood_group', name: 'AB Negative (AB-)', code: 'AB-', description: 'AB Rh-Negative', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-7', category_key: 'blood_group', name: 'O Positive (O+)', code: 'O+', description: 'O Rh-Positive', display_order: 7, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bg-8', category_key: 'blood_group', name: 'O Negative (O-)', code: 'O-', description: 'O Rh-Negative (Universal Donor)', display_order: 8, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 8. Age Category ---
  { id: 'opt-age-1', category_key: 'age_category', name: 'Infant (0 - 1 Year)', code: 'AGE-INF', description: 'Under 12 months of age', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-age-2', category_key: 'age_category', name: 'Pediatric / Child (1 - 12 Years)', code: 'AGE-PED', description: 'Children below 13 years', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-age-3', category_key: 'age_category', name: 'Adolescent (13 - 17 Years)', code: 'AGE-ADO', description: 'Teenage healthcare', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-age-4', category_key: 'age_category', name: 'Adult (18 - 59 Years)', code: 'AGE-ADU', description: 'General adult cohort', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-age-5', category_key: 'age_category', name: 'Senior Citizen (60+ Years)', code: 'AGE-SR', description: 'Geriatric priority care', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 9. Patient Type ---
  { id: 'opt-pt-1', category_key: 'patient_type', name: 'General Patient (Direct)', code: 'PT-GEN', description: 'Standard self-paying OPD patient', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pt-2', category_key: 'patient_type', name: 'Health Insurance / TPA Cardholder', code: 'PT-INS', description: 'Empaneled cashless or reimbursement claims', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pt-3', category_key: 'patient_type', name: 'Corporate Empaneled Member', code: 'PT-CORP', description: 'Company health benefit scheme', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pt-4', category_key: 'patient_type', name: 'Senior Citizen Care Club', code: 'PT-SENIOR', description: 'Subsidized & priority senior citizen queue', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pt-5', category_key: 'patient_type', name: 'Emergency / Trauma Admission', code: 'PT-EMERG', description: 'Acute triage and resuscitation admission', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 10. Visit Type ---
  { id: 'opt-vt-1', category_key: 'visit_type', name: 'First Consultation (New Registration)', code: 'VT-NEW', description: 'First medical visit to Rhythm Medicity', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vt-2', category_key: 'visit_type', name: 'Routine Follow-up', code: 'VT-FOL', description: 'Follow-up review within validity period', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vt-3', category_key: 'visit_type', name: 'Diagnostic / Lab Report Review', code: 'VT-REP', description: 'Reviewing blood or radiology scan reports', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vt-4', category_key: 'visit_type', name: 'Second Opinion', code: 'VT-OPN', description: 'Consulting specialist for case evaluation', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vt-5', category_key: 'visit_type', name: 'Post-Operative Checkup', code: 'VT-POSTOP', description: 'Surgical recovery evaluation', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 11. Appointment Type ---
  { id: 'opt-at-1', category_key: 'appointment_type', name: 'Regular OPD Consultation', code: 'AT-REG', description: 'Scheduled outpatient doctor visit', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-at-2', category_key: 'appointment_type', name: 'Specialist Second Opinion', code: 'AT-SPEC', description: 'Detailed diagnostic & case review', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-at-3', category_key: 'appointment_type', name: 'Master Health Checkup Consultation', code: 'AT-CHECKUP', description: 'Preventive full-body package evaluation', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-at-4', category_key: 'appointment_type', name: 'Telemedicine Video Call', code: 'AT-TELE', description: 'Remote virtual consultation', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-at-5', category_key: 'appointment_type', name: 'Priority VIP Fast-Track', code: 'AT-VIP', description: 'Zero waiting queue expedited consultation', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 12. Appointment Status ---
  { id: 'opt-as-1', category_key: 'appointment_status', name: 'PENDING_PAYMENT', code: 'PENDING_PAYMENT', description: 'Slot held awaiting fee payment', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-as-2', category_key: 'appointment_status', name: 'CONFIRMED', code: 'CONFIRMED', description: 'Appointment confirmed with confirmed token', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-as-3', category_key: 'appointment_status', name: 'COMPLETED', code: 'COMPLETED', description: 'Consultation completed by doctor', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-as-4', category_key: 'appointment_status', name: 'CANCELLED', code: 'CANCELLED', description: 'Appointment cancelled by patient or hospital', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-as-5', category_key: 'appointment_status', name: 'NO_SHOW', code: 'NO_SHOW', description: 'Patient did not arrive for scheduled slot', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 13. Visit Reason ---
  { id: 'opt-vr-1', category_key: 'visit_reason', name: 'General Health Checkup & Wellness', code: 'VR-GEN', description: 'Routine screening and vitality review', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-2', category_key: 'visit_reason', name: 'Chest Pain / Palpitations / Breathlessness', code: 'VR-CARD', description: 'Cardiovascular symptoms requiring ECG/Echo evaluation', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-3', category_key: 'visit_reason', name: 'Severe Headache / Dizziness / Numbness', code: 'VR-NEUR', description: 'Neurological symptoms or migraine', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-4', category_key: 'visit_reason', name: 'Joint Pain / Knee Osteoarthritis / Back Pain', code: 'VR-ORTH', description: 'Bone, ligament, and spine concerns', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-5', category_key: 'visit_reason', name: 'Fever / Infection / Viral Illness', code: 'VR-FEVER', description: 'Acute infectious or seasonal symptoms', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-6', category_key: 'visit_reason', name: 'Diabetes / High Blood Pressure Management', code: 'VR-CHRONIC', description: 'Chronic metabolic disorder regular management', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-7', category_key: 'visit_reason', name: 'Abdominal Pain / Acidity / Digestive Issues', code: 'VR-GASTRO', description: 'Gastrointestinal complaints', display_order: 7, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-vr-8', category_key: 'visit_reason', name: 'Prescription Refill / Lab Report Discussion', code: 'VR-REFILL', description: 'Medication review and ongoing prescription renewal', display_order: 8, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 14. Consultation Type ---
  { id: 'opt-ct-1', category_key: 'consultation_type', name: 'In-Hospital OPD Consultation', code: 'CT-OPD', description: 'Standard outpatient consultation at hospital premises', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ct-2', category_key: 'consultation_type', name: 'Telehealth Video Consultation', code: 'CT-VIDEO', description: 'Online audio-visual consultation', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ct-3', category_key: 'consultation_type', name: 'Emergency Triage Review', code: 'CT-EMERG', description: 'Emergency trauma and intensive assessment', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 15. Appointment Duration ---
  { id: 'opt-ad-1', category_key: 'appointment_duration', name: '10 Minutes (Quick Review)', code: '10_MIN', description: '10 mins duration', display_order: 1, status: 'active', extra_meta: { minutes: 10 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ad-2', category_key: 'appointment_duration', name: '15 Minutes (Standard OPD)', code: '15_MIN', description: '15 mins duration', display_order: 2, status: 'active', extra_meta: { minutes: 15 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ad-3', category_key: 'appointment_duration', name: '20 Minutes (Extended Consultation)', code: '20_MIN', description: '20 mins duration', display_order: 3, status: 'active', extra_meta: { minutes: 20 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ad-4', category_key: 'appointment_duration', name: '30 Minutes (Comprehensive Specialist Evaluation)', code: '30_MIN', description: '30 mins duration', display_order: 4, status: 'active', extra_meta: { minutes: 30 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ad-5', category_key: 'appointment_duration', name: '45 Minutes (Second Opinion & Case Workup)', code: '45_MIN', description: '45 mins duration', display_order: 5, status: 'active', extra_meta: { minutes: 45 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 16. Payment Method ---
  { id: 'opt-pm-1', category_key: 'payment_method', name: 'UPI (GPay / PhonePe / Paytm / BHIM)', code: 'UPI', description: 'Instant zero-fee Indian UPI transfer', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pm-2', category_key: 'payment_method', name: 'Credit / Debit Card (Visa / Mastercard / RuPay)', code: 'CARD', description: 'Secure online & POS card transactions', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pm-3', category_key: 'payment_method', name: 'Net Banking (All Major Indian Banks)', code: 'NETBANKING', description: 'Direct internet banking gateway', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pm-4', category_key: 'payment_method', name: 'Cash at Hospital Billing Desk', code: 'CASH', description: 'Direct cash payment at hospital reception', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-pm-5', category_key: 'payment_method', name: 'Health Insurance / TPA Cashless', code: 'TPA', description: 'Insurance desk pre-authorization', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 17. Payment Status ---
  { id: 'opt-ps-1', category_key: 'payment_status', name: 'INITIATED', code: 'INITIATED', description: 'Payment order generated on gateway', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ps-2', category_key: 'payment_status', name: 'PENDING', code: 'PENDING', description: 'Awaiting bank confirmation', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ps-3', category_key: 'payment_status', name: 'PAID', code: 'PAID', description: 'Payment verified and credited', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ps-4', category_key: 'payment_status', name: 'FAILED', code: 'FAILED', description: 'Transaction declined by bank or user', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-ps-5', category_key: 'payment_status', name: 'REFUNDED', code: 'REFUNDED', description: 'Amount refunded to source account', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 18. Refund Status ---
  { id: 'opt-rs-1', category_key: 'refund_status', name: 'Not Applicable', code: 'NONE', description: 'No refund requested or applicable', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rs-2', category_key: 'refund_status', name: 'Refund Requested', code: 'REQUESTED', description: 'Patient initiated cancellation refund', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rs-3', category_key: 'refund_status', name: 'Under Hospital Audit', code: 'UNDER_REVIEW', description: 'Billing desk verifying cancellation eligibility', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rs-4', category_key: 'refund_status', name: 'Approved & Processing', code: 'APPROVED', description: 'Refund sanctioned; gateway processing', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rs-5', category_key: 'refund_status', name: 'Refund Completed', code: 'PROCESSED', description: 'Credited back to patient bank account', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rs-6', category_key: 'refund_status', name: 'Refund Rejected', code: 'REJECTED', description: 'Claim not eligible under hospital cancellation policy', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 19. Department ---
  { id: 'opt-dept-1', category_key: 'department', name: 'Department of Cardiology', code: 'DEPT-CARD', description: 'Interventional cardiology, electrophysiology, cardiac ICU', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-2', category_key: 'department', name: 'Department of Neurology & Neurosurgery', code: 'DEPT-NEUR', description: 'Stroke care, epilepsy, spine and cranial neurosurgery', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-3', category_key: 'department', name: 'Department of Orthopedics & Joint Replacement', code: 'DEPT-ORTH', description: 'Total knee/hip replacement, arthroscopy, trauma wing', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-4', category_key: 'department', name: 'Department of General & Internal Medicine', code: 'DEPT-MED', description: 'Hypertension, metabolic disorders, multi-system pathology', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-5', category_key: 'department', name: 'Department of Gastroenterology & Hepatology', code: 'DEPT-GAST', description: 'Endoscopy, ERCP, liver disease management', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-6', category_key: 'department', name: 'Department of Pediatrics & Neonatology', code: 'DEPT-PED', description: 'NICU, PICU, child developmental healthcare', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-7', category_key: 'department', name: 'Department of Nephrology & Dialysis', code: 'DEPT-NEPH', description: 'Hemodialysis, renal transplantation and failure management', display_order: 7, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-dept-8', category_key: 'department', name: 'Department of Emergency & Critical Care', code: 'DEPT-EMERG', description: '24/7 Level-1 trauma, resuscitation, advanced life support', display_order: 8, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 20. Room Type ---
  { id: 'opt-rt-1', category_key: 'room_type', name: 'General Air-Cooled Ward (Multi-Bed)', code: 'ROOM-GEN', description: 'Shared economic ward with dedicated nursing station', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rt-2', category_key: 'room_type', name: 'Twin Sharing Semi-Private Room', code: 'ROOM-SEMI', description: 'Two patient room with attached washroom and attendant couch', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rt-3', category_key: 'room_type', name: 'Single Private Deluxe Room', code: 'ROOM-DELUXE', description: 'Independent AC room, motorized bed, smart TV, sofa-cum-bed', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rt-4', category_key: 'room_type', name: 'Super Deluxe Executive Suite', code: 'ROOM-SUITE', description: 'Private suite with patient area, separate visitor lounge & pantry', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rt-5', category_key: 'room_type', name: 'Intensive Care Unit (ICU / CCU / CTVS)', code: 'ROOM-ICU', description: '1:1 nursing, multi-para monitors, dedicated ventilator ports', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-rt-6', category_key: 'room_type', name: 'Neonatal & Pediatric ICU (NICU / PICU)', code: 'ROOM-NICU', description: 'Advanced warmers, phototherapy, specialized neonatal care', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 21. Bed Type ---
  { id: 'opt-bt-1', category_key: 'bed_type', name: 'Standard Manual Fowler Bed', code: 'BED-MANUAL', description: 'Two-crank mechanical hospital bed', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bt-2', category_key: 'bed_type', name: 'Semi-Fowler Electric Bed with Remote', code: 'BED-SEMI-ELEC', description: 'Motorized head and foot elevation', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bt-3', category_key: 'bed_type', name: '5-Function Motorized ICU Bed', code: 'BED-ICU', description: 'Trendelenburg, CPR release, electronic nurse control panel', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bt-4', category_key: 'bed_type', name: 'Pediatric Cot with Safety Railings', code: 'BED-PED', description: 'High-safety protective crib for infants and children', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-bt-5', category_key: 'bed_type', name: 'Bariatric Heavy-Duty Hospital Bed', code: 'BED-BARIATRIC', description: 'Reinforced 300kg weight capacity motorized frame', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // --- 22. Service Type ---
  { id: 'opt-st-1', category_key: 'service_type', name: 'Outpatient Specialty OPD Consultation', code: 'ST-OPD', description: 'Doctor diagnostic and treatment consultation', display_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-st-2', category_key: 'service_type', name: 'Advanced Radiology & Imaging (MRI, CT, 4D Ultrasound)', code: 'ST-RAD', description: 'Diagnostic cross-sectional and radiological imaging', display_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-st-3', category_key: 'service_type', name: 'Pathology & Molecular Laboratory Investigations', code: 'ST-PATH', description: 'Hematology, biochemistry, histopathology, immunology', display_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-st-4', category_key: 'service_type', name: 'Daycare Surgical & Endoscopy Procedure', code: 'ST-DAYCARE', description: 'Short-stay endoscopic, laparoscopic, and cataract surgeries', display_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-st-5', category_key: 'service_type', name: 'Inpatient Major Surgery & Operation Theatre', code: 'ST-SURG', description: 'Cardiac, orthopedic, neurosurgical OT suite admissions', display_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-st-6', category_key: 'service_type', name: '24/7 Advanced Cardiac Life Support Ambulance', code: 'ST-AMB', description: 'Mobile ICU GPS-tracked emergency response', display_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'opt-st-7', category_key: 'service_type', name: 'Physical Therapy & Cardiac Rehabilitation', code: 'ST-REHAB', description: 'Post-op physiotherapy, mobility rehab, kinesiology', display_order: 7, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function getLocalCategories(): DropdownCategory[] {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(DEFAULT_DROPDOWN_CATEGORIES));
      return DEFAULT_DROPDOWN_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DROPDOWN_CATEGORIES;
  } catch {
    return DEFAULT_DROPDOWN_CATEGORIES;
  }
}

function saveLocalCategories(cats: DropdownCategory[]): void {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(cats));
  } catch (_) {}
}

function getLocalOptions(): DropdownOption[] {
  try {
    const raw = localStorage.getItem(LOCAL_OPTIONS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_OPTIONS_KEY, JSON.stringify(DEFAULT_DROPDOWN_OPTIONS));
      return DEFAULT_DROPDOWN_OPTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DROPDOWN_OPTIONS;
  } catch {
    return DEFAULT_DROPDOWN_OPTIONS;
  }
}

function saveLocalOptions(opts: DropdownOption[]): void {
  try {
    localStorage.setItem(LOCAL_OPTIONS_KEY, JSON.stringify(opts));
  } catch (_) {}
}

export class DropdownService {
  // ============================================================
  // CATEGORIES
  // ============================================================

  static async getCategories(): Promise<DropdownCategory[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('dropdown_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          saveLocalCategories(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase getCategories failed, using fallback:', err);
      }
    }
    return getLocalCategories().sort((a, b) => a.display_order - b.display_order);
  }

  static async getCategoryByKey(key: string): Promise<DropdownCategory | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.category_key === key) || null;
  }

  static async createCategory(category: {
    category_key: string;
    name: string;
    group: DropdownCategory['group'];
    description?: string;
  }): Promise<{ success: boolean; data?: DropdownCategory; error?: string }> {
    const categories = await this.getCategories();
    const cleanKey = category.category_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (categories.some((c) => c.category_key === cleanKey)) {
      return { success: false, error: `Category key '${cleanKey}' already exists.` };
    }

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
    const newCat: DropdownCategory = {
      id: generateUUID(),
      category_key: cleanKey,
      name: category.name.trim(),
      group: category.group,
      description: category.description?.trim() || null,
      is_system: false,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = [...categories, newCat];
    saveLocalCategories(updatedList);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('dropdown_categories').insert(newCat);
      } catch (err) {
        console.warn('Supabase createCategory failed:', err);
      }
    }

    await AuditService.logAction(
      'Created Dropdown Category',
      'dropdown_category',
      newCat.id,
      {
        category_key: newCat.category_key,
        name: newCat.name,
        group: newCat.group,
      }
    );

    return { success: true, data: newCat };
  }

  static async updateCategory(
    categoryKey: string,
    updates: Partial<Pick<DropdownCategory, 'name' | 'group' | 'description' | 'display_order'>>
  ): Promise<{ success: boolean; data?: DropdownCategory; error?: string }> {
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.category_key === categoryKey);

    if (index === -1) {
      return { success: false, error: 'Category not found.' };
    }

    const updatedCat: DropdownCategory = {
      ...categories[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    categories[index] = updatedCat;
    saveLocalCategories(categories);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('dropdown_categories')
          .update(updatedCat)
          .eq('category_key', categoryKey);
      } catch (err) {
        console.warn('Supabase updateCategory failed:', err);
      }
    }

    await AuditService.logAction(
      'Updated Dropdown Category',
      'dropdown_category',
      updatedCat.id,
      {
        category_key: categoryKey,
        updates,
      }
    );

    return { success: true, data: updatedCat };
  }

  static async deleteCategory(
    categoryKey: string
  ): Promise<{ success: boolean; error?: string }> {
    const categories = await this.getCategories();
    const target = categories.find((c) => c.category_key === categoryKey);

    if (!target) {
      return { success: false, error: 'Category not found.' };
    }

    if (target.is_system) {
      return {
        success: false,
        error: 'System-defined core categories cannot be permanently deleted. You can manage or deactivate individual options instead.',
      };
    }

    // Also delete associated options
    const filteredCats = categories.filter((c) => c.category_key !== categoryKey);
    saveLocalCategories(filteredCats);

    const allOptions = await this.getAllOptions();
    const filteredOpts = allOptions.filter((o) => o.category_key !== categoryKey);
    saveLocalOptions(filteredOpts);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('dropdown_options').delete().eq('category_key', categoryKey);
        await supabase.from('dropdown_categories').delete().eq('category_key', categoryKey);
      } catch (err) {
        console.warn('Supabase deleteCategory failed:', err);
      }
    }

    await AuditService.logAction(
      'Deleted Dropdown Category',
      'dropdown_category',
      target.id,
      {
        category_key: categoryKey,
        name: target.name,
      }
    );

    return { success: true };
  }

  // ============================================================
  // OPTIONS
  // ============================================================

  static async getAllOptions(): Promise<DropdownOption[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('dropdown_options')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          saveLocalOptions(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase getAllOptions failed, using fallback:', err);
      }
    }
    return getLocalOptions().sort((a, b) => a.display_order - b.display_order);
  }

  static async getOptionsByCategory(
    categoryKey: string,
    onlyActive: boolean = false
  ): Promise<DropdownOption[]> {
    const all = await this.getAllOptions();
    const filtered = all.filter((o) => o.category_key === categoryKey);
    const sorted = filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    if (onlyActive) {
      return sorted.filter((o) => o.status === 'active');
    }
    return sorted;
  }

  static async createOption(option: {
    category_key: string;
    name: string;
    code?: string;
    description?: string;
    display_order?: number;
    status?: 'active' | 'inactive';
    extra_meta?: Record<string, any>;
  }): Promise<{ success: boolean; data?: DropdownOption; error?: string }> {
    const all = await this.getAllOptions();
    const categoryOptions = all.filter((o) => o.category_key === option.category_key);

    const maxOrder = categoryOptions.reduce(
      (max, o) => Math.max(max, o.display_order || 0),
      0
    );

    const autoCode =
      option.code?.trim().toUpperCase() ||
      option.name
        .trim()
        .toUpperCase()
        .slice(0, 8)
        .replace(/[^A-Z0-9]/g, '_');

    const newOption: DropdownOption = {
      id: generateUUID(),
      category_key: option.category_key,
      name: option.name.trim(),
      code: autoCode,
      description: option.description?.trim() || null,
      display_order: option.display_order !== undefined ? option.display_order : maxOrder + 1,
      status: option.status || 'active',
      extra_meta: option.extra_meta || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...all, newOption];
    saveLocalOptions(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('dropdown_options').insert(newOption);
      } catch (err) {
        console.warn('Supabase createOption failed:', err);
      }
    }

    const cat = await this.getCategoryByKey(option.category_key);
    await AuditService.logAction(
      'Added Dropdown Option',
      'dropdown_option',
      newOption.id,
      {
        category: cat?.name || option.category_key,
        category_key: option.category_key,
        value: newOption.name,
        code: newOption.code,
        status: newOption.status,
      }
    );

    return { success: true, data: newOption };
  }

  static async updateOption(
    id: string,
    updates: Partial<Pick<DropdownOption, 'name' | 'code' | 'description' | 'display_order' | 'status' | 'extra_meta'>>
  ): Promise<{ success: boolean; data?: DropdownOption; error?: string }> {
    const all = await this.getAllOptions();
    const index = all.findIndex((o) => o.id === id);

    if (index === -1) {
      return { success: false, error: 'Option not found.' };
    }

    const oldOption = all[index];
    const updatedOption: DropdownOption = {
      ...oldOption,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    all[index] = updatedOption;
    saveLocalOptions(all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('dropdown_options').update(updatedOption).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateOption failed:', err);
      }
    }

    const cat = await this.getCategoryByKey(updatedOption.category_key);
    const actionLabel =
      updates.status && updates.status !== oldOption.status
        ? updates.status === 'active'
          ? 'Activated Dropdown Option'
          : 'Deactivated Dropdown Option'
        : 'Modified Dropdown Option';

    await AuditService.logAction(
      actionLabel,
      'dropdown_option',
      updatedOption.id,
      {
        category: cat?.name || updatedOption.category_key,
        category_key: updatedOption.category_key,
        value: updatedOption.name,
        old_value: oldOption.name !== updatedOption.name ? oldOption.name : undefined,
        status: updatedOption.status,
      }
    );

    return { success: true, data: updatedOption };
  }

  static async toggleOptionStatus(id: string): Promise<{ success: boolean; data?: DropdownOption; error?: string }> {
    const all = await this.getAllOptions();
    const opt = all.find((o) => o.id === id);
    if (!opt) return { success: false, error: 'Option not found.' };

    const newStatus: 'active' | 'inactive' = opt.status === 'active' ? 'inactive' : 'active';
    return this.updateOption(id, { status: newStatus });
  }

  static async reorderOptions(
    categoryKey: string,
    orderedIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const all = await this.getAllOptions();
    const categoryOpts = all.filter((o) => o.category_key === categoryKey);
    const otherOpts = all.filter((o) => o.category_key !== categoryKey);

    const reorderedCategoryOpts = orderedIds.map((id, index) => {
      const existing = categoryOpts.find((o) => o.id === id);
      if (existing) {
        return {
          ...existing,
          display_order: index + 1,
          updated_at: new Date().toISOString(),
        };
      }
      return null;
    }).filter(Boolean) as DropdownOption[];

    // Add any items in this category that weren't in orderedIds (safety)
    categoryOpts.forEach((o) => {
      if (!orderedIds.includes(o.id)) {
        reorderedCategoryOpts.push({
          ...o,
          display_order: reorderedCategoryOpts.length + 1,
        });
      }
    });

    const combined = [...otherOpts, ...reorderedCategoryOpts];
    saveLocalOptions(combined);

    if (isSupabaseConfigured()) {
      try {
        for (const opt of reorderedCategoryOpts) {
          await supabase
            .from('dropdown_options')
            .update({ display_order: opt.display_order, updated_at: opt.updated_at })
            .eq('id', opt.id);
        }
      } catch (err) {
        console.warn('Supabase reorderOptions failed:', err);
      }
    }

    const cat = await this.getCategoryByKey(categoryKey);
    await AuditService.logAction(
      'Reordered Dropdown Options',
      'dropdown_category',
      cat?.id || categoryKey,
      {
        category: cat?.name || categoryKey,
        category_key: categoryKey,
        count: orderedIds.length,
      }
    );

    return { success: true };
  }

  /**
   * Reference Checker: Checks whether an option is referenced in historical records
   * (Doctors, Patients, Appointments, Reports, Services)
   */
  static async checkOptionReferences(
    categoryKey: string,
    optionName: string,
    optionCode?: string
  ): Promise<DropdownReferenceCheckResult> {
    const details: DropdownReferenceCheckResult['details'] = [];
    let totalReferences = 0;

    const optNameLower = (optionName || '').trim().toLowerCase();
    const optCodeLower = (optionCode || '').trim().toLowerCase();

    // Local / In-memory inspection
    try {
      // 1. Check Appointments
      const rawAppts = localStorage.getItem('rhythm_appointments_cache');
      if (rawAppts) {
        const appts = JSON.parse(rawAppts);
        if (Array.isArray(appts)) {
          let apptCount = 0;
          for (const a of appts) {
            const matchStatus = a.appointment_status?.toLowerCase() === optCodeLower || a.appointment_status?.toLowerCase() === optNameLower;
            const matchPayStatus = a.payment_status?.toLowerCase() === optCodeLower || a.payment_status?.toLowerCase() === optNameLower;
            const matchGender = a.patient_gender?.toLowerCase() === optNameLower;
            const matchProblem = a.patient_problem?.toLowerCase().includes(optNameLower);
            const matchSpeciality = a.speciality_name_snapshot?.toLowerCase() === optNameLower;

            if (matchStatus || matchPayStatus || matchGender || matchProblem || matchSpeciality) {
              apptCount++;
            }
          }
          if (apptCount > 0) {
            details.push({
              entity: 'appointments',
              count: apptCount,
              description: `${apptCount} historical appointment records reference this value`,
            });
            totalReferences += apptCount;
          }
        }
      }

      // 2. Check Doctors
      const rawDoctors = localStorage.getItem('rhythm_doctors_cache');
      if (rawDoctors) {
        const doctors = JSON.parse(rawDoctors);
        if (Array.isArray(doctors)) {
          let docCount = 0;
          for (const d of doctors) {
            const matchQual = d.qualification?.toLowerCase().includes(optNameLower);
            const matchRoom = d.clinic_room?.toLowerCase() === optNameLower;
            const matchStatus = d.status?.toLowerCase() === optNameLower;
            if (matchQual || matchRoom || matchStatus) {
              docCount++;
            }
          }
          if (docCount > 0) {
            details.push({
              entity: 'doctors',
              count: docCount,
              description: `${docCount} registered doctor profile(s) reference this qualification/value`,
            });
            totalReferences += docCount;
          }
        }
      }

      // 3. Check Patients
      const rawPatients = localStorage.getItem('rhythm_patient_accounts');
      if (rawPatients) {
        const patients = JSON.parse(rawPatients);
        if (Array.isArray(patients)) {
          let patCount = 0;
          for (const p of patients) {
            const matchGender = p.gender?.toLowerCase() === optNameLower;
            const matchBlood = p.blood_group?.toLowerCase() === optNameLower || p.blood_group?.toLowerCase() === optCodeLower;
            if (matchGender || matchBlood) {
              patCount++;
            }
          }
          if (patCount > 0) {
            details.push({
              entity: 'patients',
              count: patCount,
              description: `${patCount} registered patient account(s) use this gender/blood group`,
            });
            totalReferences += patCount;
          }
        }
      }
    } catch (_) {}

    // Also query Supabase if available
    if (isSupabaseConfigured()) {
      try {
        if (categoryKey === 'gender') {
          const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).ilike('patient_gender', optionName);
          if (count && count > 0 && !details.some((d) => d.entity === 'appointments')) {
            details.push({ entity: 'appointments', count, description: `${count} appointment(s) have this gender` });
            totalReferences += count;
          }
        } else if (categoryKey === 'appointment_status') {
          const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_status', optionCode || optionName);
          if (count && count > 0 && !details.some((d) => d.entity === 'appointments')) {
            details.push({ entity: 'appointments', count, description: `${count} appointment(s) have this status` });
            totalReferences += count;
          }
        } else if (categoryKey === 'payment_status') {
          const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('payment_status', optionCode || optionName);
          if (count && count > 0 && !details.some((d) => d.entity === 'appointments')) {
            details.push({ entity: 'appointments', count, description: `${count} appointment(s) have this payment status` });
            totalReferences += count;
          }
        }
      } catch (_) {}
    }

    return {
      isReferenced: totalReferences > 0,
      totalReferences,
      details,
    };
  }

  static async deleteOption(
    id: string,
    force: boolean = false
  ): Promise<{ success: boolean; isReferenced?: boolean; totalReferences?: number; error?: string }> {
    const all = await this.getAllOptions();
    const target = all.find((o) => o.id === id);

    if (!target) {
      return { success: false, error: 'Option not found.' };
    }

    // Perform reference check
    if (!force) {
      const refCheck = await this.checkOptionReferences(
        target.category_key,
        target.name,
        target.code
      );

      if (refCheck.isReferenced) {
        return {
          success: false,
          isReferenced: true,
          totalReferences: refCheck.totalReferences,
          error: `This option is currently referenced in ${refCheck.totalReferences} active/historical records. Deactivate it instead to prevent broken historical data.`,
        };
      }
    }

    const filtered = all.filter((o) => o.id !== id);
    saveLocalOptions(filtered);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('dropdown_options').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteOption failed:', err);
      }
    }

    const cat = await this.getCategoryByKey(target.category_key);
    await AuditService.logAction(
      'Deleted Dropdown Option',
      'dropdown_option',
      target.id,
      {
        category: cat?.name || target.category_key,
        category_key: target.category_key,
        value: target.name,
        code: target.code,
      }
    );

    return { success: true };
  }

  static async restoreDefaults(categoryKey?: string): Promise<{ success: boolean }> {
    let categoriesToRestore = DEFAULT_DROPDOWN_CATEGORIES;
    let optionsToRestore = DEFAULT_DROPDOWN_OPTIONS;

    if (categoryKey) {
      const currentCats = await this.getCategories();
      const currentOpts = await this.getAllOptions();

      const defaultCategoryOpts = DEFAULT_DROPDOWN_OPTIONS.filter((o) => o.category_key === categoryKey);
      const otherOpts = currentOpts.filter((o) => o.category_key !== categoryKey);

      saveLocalOptions([...otherOpts, ...defaultCategoryOpts]);
      saveLocalCategories(currentCats);
    } else {
      saveLocalCategories(categoriesToRestore);
      saveLocalOptions(optionsToRestore);
    }

    await AuditService.logAction(
      'Restored Dropdown Defaults',
      'dropdown_management',
      categoryKey || 'all_categories',
      {
        target: categoryKey || 'ALL_CATEGORIES',
      }
    );

    return { success: true };
  }
}
