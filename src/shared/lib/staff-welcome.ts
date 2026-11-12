import { formatPhoneForDisplay, normalizePhone } from '@/shared/lib/phone';

export function buildStaffWelcomeMessage(input: {
  role: 'doctor' | 'secretary';
  personName: string;
  clinicName: string;
  phone: string;
  password: string;
}): string {
  const greeting = input.role === 'doctor' ? `د. ${input.personName}` : input.personName;
  const username = formatPhoneForDisplay(input.phone);
  return [
    `أهلاً ${greeting} 👋`,
    '',
    `اتضاف حسابك في ${input.clinicName}.`,
    '',
    'سجّل الدخول بالتفاصيل دي:',
    `اسم المستخدم: ${username}`,
    `كلمة المرور: ${input.password}`,
    '',
    'تقدر تغيّر كلمة المرور من البروفايل بعد الدخول.',
  ].join('\n');
}

export function staffWhatsAppDigits(phone: string): string {
  return normalizePhone(phone).replace(/\D/g, '');
}
