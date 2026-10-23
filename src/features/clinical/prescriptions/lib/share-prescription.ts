import { Linking, Platform, Share } from 'react-native';

import type { Prescription } from '@/shared/types/models/prescription';

import { clinicDisplayName, prescriptionFileUrl } from './prescription-document';

export function prescriptionWhatsAppMessage(prescription: Prescription, arabic: boolean): string {
  const clinic = clinicDisplayName(prescription, arabic);
  const heading = prescription.number
    ? arabic
      ? `روشتة رقم ${prescription.number}`
      : `Prescription ${prescription.number}`
    : arabic
      ? 'روشتة طبية'
      : 'Medical prescription';
  const lines = [heading, clinic, prescriptionFileUrl(prescription.id)].filter(Boolean);
  return lines.join('\n');
}

export async function sharePrescription(
  prescription: Prescription,
  arabic: boolean,
): Promise<'shared' | 'copied' | 'dismissed'> {
  const message = prescriptionWhatsAppMessage(prescription, arabic);
  const title = arabic ? 'روشتة' : 'Prescription';

  if (Platform.OS === 'web') {
    const nav = globalThis as {
      navigator?: {
        share?: (data: { text?: string; title?: string }) => Promise<void>;
        clipboard?: { writeText: (value: string) => Promise<void> };
      };
    };
    if (nav.navigator?.share) {
      try {
        await nav.navigator.share({ text: message, title });
        return 'shared';
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return 'dismissed';
      }
    }
    if (nav.navigator?.clipboard?.writeText) {
      await nav.navigator.clipboard.writeText(message);
      return 'copied';
    }
    return 'dismissed';
  }

  const result = await Share.share({ message, title });
  if (result.action === Share.dismissedAction) return 'dismissed';
  return 'shared';
}

const WHATSAPP_TO = '201068592701';

export async function openPrescriptionWhatsApp(prescription: Prescription, arabic: boolean) {
  const message = prescriptionWhatsAppMessage(prescription, arabic);
  await Linking.openURL(`https://wa.me/${WHATSAPP_TO}?text=${encodeURIComponent(message)}`);
}

export async function sendPrescriptionOnWhatsApp(_phone: string, prescription: Prescription, arabic: boolean) {
  const message = prescriptionWhatsAppMessage(prescription, arabic);
  const url = `https://wa.me/${WHATSAPP_TO}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
