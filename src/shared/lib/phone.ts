export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('20') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 10) return `+20${digits.slice(1)}`;
  if (digits.startsWith('1') && digits.length === 10) return `+20${digits}`;
  return `+${digits}`;
}

export function isValidPhone(input: string): boolean {
  return /^\+\d{10,15}$/.test(normalizePhone(input));
}

export function isEmailIdentifier(input: string): boolean {
  return input.includes('@');
}

export function phoneToPlaceholderEmail(phone: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return `${digits}@patient.clinsync`;
}

export function phoneToStaffEmail(phone: string, kind: 'doctor' | 'secretary' | 'owner'): string {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return `${digits}@${kind}.clinsync`;
}

/** Display Egyptian numbers as 01xxxxxxxxx instead of +20. */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;

  if (digits.startsWith('20') && digits.length >= 11) return `0${digits.slice(2)}`;
  if (digits.startsWith('0')) return digits;
  return digits;
}
