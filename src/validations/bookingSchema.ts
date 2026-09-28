import { z } from 'zod';

export const patientDetailsSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(2, { message: 'Patient name must be at least 2 characters.' })
    .max(100, { message: 'Patient name must not exceed 100 characters.' }),
  patientAge: z
    .number({ invalid_type_error: 'Please enter a valid age.' })
    .int({ message: 'Age must be a whole number.' })
    .min(1, { message: 'Age must be at least 1.' })
    .max(125, { message: 'Please enter a realistic age.' }),
  patientGender: z.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: 'Please select a gender.' }),
  }),
  patientEmail: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')),
  patientAddress: z
    .string()
    .trim()
    .min(5, { message: 'Please enter full residential address (min 5 characters).' })
    .max(250, { message: 'Address must not exceed 250 characters.' }),
  patientMobile: z
    .string()
    .trim()
    .regex(/^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/, {
      message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
    }),
});

export const appointmentDetailsSchema = z.object({
  specialityId: z.string().uuid({ message: 'Please select a medical speciality.' }),
  doctorId: z.string().uuid({ message: 'Please select a doctor.' }),
  appointmentDate: z
    .string()
    .min(1, { message: 'Please select an appointment date.' })
    .refine((dateStr) => {
      const selected = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, { message: 'Appointment date cannot be in the past.' }),
  appointmentTime: z.string().min(1, { message: 'Please select an appointment time slot.' }),
  patientProblem: z
    .string()
    .trim()
    .min(3, { message: 'Please describe your health concern or symptoms (min 3 characters).' })
    .max(1000, { message: 'Symptoms description cannot exceed 1000 characters.' }),
});

export const termsSchema = z.object({
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Conditions to proceed to payment.' }),
  }),
  termsVersion: z.string().default('v1.0'),
});

export const fullBookingSchema = patientDetailsSchema
  .merge(appointmentDetailsSchema)
  .merge(termsSchema);

export type PatientDetailsValues = z.infer<typeof patientDetailsSchema>;
export type AppointmentDetailsValues = z.infer<typeof appointmentDetailsSchema>;
export type TermsValues = z.infer<typeof termsSchema>;
export type FullBookingValues = z.infer<typeof fullBookingSchema>;

