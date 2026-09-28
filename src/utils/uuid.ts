/**
 * UUID Validation and Sanitization Utility
 * Ensures that empty strings (""), invalid format strings, or non-UUID tokens
 * are safely converted to `null` before passing to PostgreSQL / Supabase,
 * preventing `invalid input syntax for type uuid: ""` errors.
 */

export function isValidUUID(val: any): boolean {
  if (typeof val !== 'string' || !val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

export function sanitizeUUID(val: any): string | null {
  if (isValidUUID(val)) {
    return val.trim();
  }
  return null;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

