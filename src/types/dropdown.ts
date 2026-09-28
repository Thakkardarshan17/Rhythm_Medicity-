// ============================================================
// RHYTHM MEDICITY - MASTER DATA & DROPDOWN MANAGEMENT TYPES
// ============================================================

export type DropdownCategoryGroup =
  | 'Doctor Related'
  | 'Patient Related'
  | 'Appointment Related'
  | 'Payment Related'
  | 'Hospital Related'
  | 'Custom Categories';

export interface DropdownCategory {
  id: string;
  category_key: string; // e.g. 'doctor_specialization', 'blood_group'
  name: string; // e.g. 'Doctor Specialization'
  group: DropdownCategoryGroup;
  description: string | null;
  is_system: boolean; // true for core default categories
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DropdownOption {
  id: string;
  category_key: string;
  name: string; // e.g. 'Cardiology'
  code: string; // Short code, e.g. 'CARD'
  description?: string | null;
  display_order: number;
  status: 'active' | 'inactive';
  is_default?: boolean;
  extra_meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DropdownReferenceCheckResult {
  isReferenced: boolean;
  totalReferences: number;
  details: {
    entity: 'doctors' | 'patients' | 'appointments' | 'services' | 'reports';
    count: number;
    description: string;
  }[];
}
