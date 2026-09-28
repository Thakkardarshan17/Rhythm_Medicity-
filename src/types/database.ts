// ============================================================
// RHYTHM MEDICITY - DATABASE & APPLICATION TYPES
// ============================================================

export type UserRole = 'admin' | 'user' | 'patient';

export type AvailabilityStatus = 'available' | 'busy' | 'on_leave' | 'unavailable';

export type EntityStatus = 'active' | 'inactive';

export type PaymentStatus = 'INITIATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type AppointmentStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type Gender = 'Male' | 'Female' | 'Other';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  photo_url?: string | null;
  role: UserRole;
  login_count?: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  photo_url?: string | null;
  dob?: string | null;
  age: number | null;
  gender: Gender | null;
  address: string | null;
  mobile: string | null;
  email: string | null;
  status?: EntityStatus;
  login_count?: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Speciality {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  status: EntityStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  speciality_id: string | null;
  qualification: string;
  qualifications?: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  phone: string | null;
  email: string | null;
  availability_status: AvailabilityStatus;
  status: EntityStatus;
  is_active?: boolean;
  registration_number: string | null;
  languages: string[];
  clinic_room: string | null;
  consultation_duration: number; // in minutes
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  show_in_dillo?: boolean; // Show this doctor in Dillo AI recommendations (ON/OFF)
  created_at: string;
  updated_at: string;
  // Join fields
  speciality?: Speciality;
}

export interface HospitalService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  status: EntityStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  display_order: number;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  patient_user_id: string | null;
  patient_name: string;
  patient_age: number;
  patient_gender: Gender;
  patient_address: string;
  patient_mobile: string;
  
  speciality_id: string;
  doctor_id: string;
  
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  
  patient_problem: string;
  diagnosis: string | null; // clinical notes added later
  
  consultation_fee: number;
  currency: string;
  
  terms_accepted: boolean;
  terms_accepted_at: string;
  terms_version: string;
  
  payment_status: PaymentStatus;
  appointment_status: AppointmentStatus;
  
  payment_transaction_id: string | null;
  booking_source: string;
  
  // Snapshots for immutable preservation of financial & hospital records
  doctor_name_snapshot: string;
  speciality_name_snapshot: string;
  consultation_fee_snapshot: number;
  hospital_name_snapshot: string;
  hospital_address_snapshot: string | null;
  hospital_phone_snapshot?: string | null;
  hospital_emergency_snapshot?: string | null;
  hospital_email_snapshot?: string | null;
  hospital_website_snapshot?: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Joins
  doctor?: Doctor;
  speciality?: Speciality;
}

export interface PaymentTransaction {
  id: string;
  appointment_id: string;
  provider: string;
  order_id: string;
  payment_id: string | null;
  signature: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_response: Record<string, any>;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HospitalSettings {
  id: string;
  hospital_name: string;
  tagline: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  emergency_number: string | null;
  ambulance_number?: string | null;
  google_maps_url?: string | null;
  opd_timings?: string | null;
  emergency_department_info?: string | null;
  logo_url: string | null;
  logo_height?: number;
  stamp_url: string | null;
  website_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentLetterSettings {
  id: string;
  letter_title: string;
  watermark_opacity: number;
  watermark_logo_url?: string | null;
  watermark_type?: 'logo' | 'emblem' | 'custom';
  show_stamp: boolean;
  stamp_size?: number;
  authorization_text: string;
  footer_text: string;
  contact_information: string | null;
  terms_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BookingFormData {
  // Step 1: Patient details
  patientName: string;
  patientAge: number;
  patientGender: Gender;
  patientAddress: string;
  patientMobile: string;
  
  // Step 2: Appointment details
  specialityId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  patientProblem: string;
  
  // Step 3: Terms
  termsAccepted: boolean;
  termsVersion: string;
}

export interface HospitalStats {
  id?: string;
  total_beds: number;
  total_icu_beds: number;
  icu_beds?: number;
  total_general_beds: number;
  total_private_rooms: number;
  total_doctors: number;
  doctors_count?: number;
  total_departments: number;
  departments_count?: number;
  total_nurses: number;
  total_ambulances: number;
  ambulances_count?: number;
  total_operation_theatres: number;
  operation_theatres?: number;
  total_labs: number;
  total_pharmacy_counters: number;
  emergency_beds: number;
  available_beds: number;
  occupied_beds: number;
  updated_at?: string;
}

export interface WebsiteUISettings {
  id?: string;
  // Branding
  hospital_name: string;
  logo_url: string;
  logo_height?: number;
  favicon_url: string;
  website_title: string;
  website_description: string;

  // Theme Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_color: string;
  header_color: string;
  footer_color: string;

  // Homepage Settings
  hero_heading: string;
  hero_description: string;
  hero_image_url: string;
  emergency_number: string;
  appointment_button_text: string;
  cta_text: string;
  about_hospital_content: string;
  show_hospital_statistics: boolean;
  featured_departments_count: number;
  featured_doctors_count: number;

  // Footer Settings
  footer_hospital_name: string;
  footer_address: string;
  footer_phone: string;
  footer_emergency_number: string;
  footer_whatsapp: string;
  footer_email: string;
  social_facebook: string;
  social_twitter: string;
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
  copyright_text: string;
  updated_at?: string;
}

export interface BannerCarouselSettings {
  auto_scroll_interval: number; // in seconds, e.g. 3, 5, 7, 10
  auto_play: boolean;
  transition_animation: 'fade' | 'slide' | 'zoom' | 'smooth';
  transition_speed: 'fast' | 'normal' | 'slow';
  pause_on_hover: boolean;
  show_navigation_arrows: boolean;
  show_pagination_dots: boolean;
  updated_at?: string;
}

export * from './dropdown';

// ============================================================
// DYNAMIC NAVIGATION & PAGE MANAGEMENT TYPES
// ============================================================

export type MenuType = 'internal' | 'external' | 'dropdown_parent';

export interface Menu {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  page_id: string | null;
  menu_type: MenuType;
  icon: string | null;
  external_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Menu[];
}

export type PageStatus = 'published' | 'draft' | 'hidden';

export type PageBlockType =
  | 'hero'
  | 'rich_text'
  | 'cards_grid'
  | 'doctor_cards'
  | 'service_cards'
  | 'image_gallery'
  | 'video_embed'
  | 'faq_accordion'
  | 'contact_box'
  | 'cta_banner';

export interface PageBlock {
  id: string;
  type: PageBlockType;
  title?: string;
  subtitle?: string;
  badge?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  background_style?: 'default' | 'sand' | 'teal' | 'white';
  data?: any;
}

export interface PageContent {
  blocks: PageBlock[];
}

export interface Page {
  id: string;
  title: string;
  navigation_title?: string | null;
  slug: string;
  content: PageContent;
  featured_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: PageStatus;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

// ==========================================
// DILLO AI VOICE ASSISTANT TYPES
// ==========================================

export interface DilloSupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  active: boolean;
  voiceCode?: string;
}

export type DilloActionType =
  | 'voice'
  | 'find_doctor'
  | 'book_appointment'
  | 'departments'
  | 'fees'
  | 'timings'
  | 'location'
  | 'my_appointments'
  | 'emergency'
  | 'custom';

export interface DilloQuickAction {
  id: string;
  label: string;
  icon: string;
  actionType: DilloActionType;
  actionPayload?: string;
  active: boolean;
  display_order: number;
}

export interface DilloFAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  active: boolean;
}

export interface DilloKnowledgeItem {
  id: string;
  title: string;
  question: string;
  answer: string;
  answer_en?: string;
  answer_hi?: string;
  answer_gu?: string;
  category: string;
  keywords: string[];
  language?: string; // 'all' | 'en' | 'hi' | 'gu'
  priority?: 'high' | 'medium' | 'low';
  display_order?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DilloActionPayload {
  action: 'call_ambulance' | 'call_emergency' | 'call_hospital' | 'whatsapp_hospital' | 'hospital_location' | 'book_appointment' | 'find_doctor';
  type?: string;
  title: string;
  target: string;
  label?: string;
  phoneNumber?: string;
  url?: string;
  requiresConfirmation?: boolean;
  confirmed?: boolean;
  emergencyContact?: string;
}

export interface DilloSpecialityMapping {
  id: string;
  speciality_name: string;
  keywords: string[];
  suggested_doctor_ids?: string[]; // IDs of specific doctors prioritized by Admin
  priority?: number;
  active: boolean;
}

export interface DilloSettings {
  id: string;
  assistant_name: string;
  assistant_title: string;
  assistant_avatar: string;
  welcome_message: string;
  short_description: string;
  voice_enabled: boolean;
  text_chat_enabled: boolean;
  ai_enabled: boolean;
  default_language: string;
  supported_languages: DilloSupportedLanguage[];
  voice_speed: number;
  voice_pitch: number;
  voice_volume?: number;
  voice_gender: 'female' | 'male' | 'neutral';
  auto_introduction?: boolean;
  voice_response_enabled?: boolean;
  auto_language_detection?: boolean;
  auto_listen_after_speak?: boolean;
  gujarati_voice_name?: string;
  hindi_voice_name?: string;
  english_voice_name?: string;
  greeting_message: string;
  emergency_message: string;
  quick_actions: DilloQuickAction[];
  faqs: DilloFAQ[];
  knowledge_base?: DilloKnowledgeItem[]; // Custom Multilingual AI Knowledge Base
  speciality_mappings: DilloSpecialityMapping[];
  updated_at: string;
}

export interface DilloChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  language?: string;
  intent?: string;
  isEmergency?: boolean;
  suggestedSpeciality?: string;
  suggestedDoctors?: Doctor[];
  appointmentsList?: Appointment[];
  quickReplies?: string[];
  emergencyContact?: string;
  actionPayload?: DilloActionPayload;
}




