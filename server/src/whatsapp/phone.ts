export function digitsPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  return digits;
}

export function egyptInternationalDigits(input: string): string {
  const digits = digitsPhone(input);
  if (!digits) return '';
  if (digits.startsWith('20') && digits.length >= 11) return digits;
  if (digits.startsWith('1') && digits.length === 10) return `20${digits}`;
  return digits;
}

export function otpAllowlist(): string[] {
  return (process.env.WHATSAPP_OTP_ALLOWLIST ?? '')
    .split(',')
    .map((item) => egyptInternationalDigits(item.trim()))
    .filter(Boolean);
}

export function isOtpDestinationAllowed(phone: string): boolean {
  const allowed = otpAllowlist();
  if (allowed.length === 0) return process.env.WHATSAPP_PROVIDER !== 'web';
  return allowed.includes(egyptInternationalDigits(phone));
}
