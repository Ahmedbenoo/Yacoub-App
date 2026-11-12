import { Linking, Platform, Share } from 'react-native';

import { staffWhatsAppDigits } from '@/shared/lib/staff-welcome';

export async function shareStaffAccessOnWhatsApp(phone: string, message: string): Promise<void> {
  const digits = staffWhatsAppDigits(phone);
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Share.share({ message });
}
