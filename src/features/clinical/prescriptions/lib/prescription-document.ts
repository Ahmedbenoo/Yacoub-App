import type { TFunction } from 'i18next';
import QRCode from 'qrcode';
import { Platform } from 'react-native';

import { listMockClinicsMainFirst } from '@/shared/api/mock/clinics.mock';
import { MOCK_CLINIC_IDS } from '@/shared/api/mock/constants';
import { formatPhoneForDisplay } from '@/shared/lib/phone';
import { Locale } from '@/shared/types/enums';
import { getPrescriptionDisplayDate, localizedMedicationText, type Prescription } from '@/shared/types/models/prescription';

export interface PrescriptionDocumentLabels {
  title: string;
  doctor: string;
  medications: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  signature: string;
  qr: string;
  addressLabel: string;
  contactLabel: string;
  number: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function prescriptionFileUrl(id: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/rx/${id}`;
  }
  return `doctorsapp://rx/${id}`;
}

export function prescriptionQrSvg(value: string) {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const quiet = 2;
  const cells: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      cells.push(`<rect x="${col + quiet}" y="${row + quiet}" width="1" height="1" fill="#0F172A"/>`);
    }
  }

  const total = size + quiet * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#FFFFFF"/>${cells.join('')}</svg>`;
}

export function prescriptionQrDataUri(id: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(prescriptionQrSvg(prescriptionFileUrl(id)))}`;
}

export function electronicSignatureName(name: string | undefined) {
  const cleaned = (name ?? '').replace(/^Dr\.\s*/i, '').trim();
  return cleaned || 'Doctor';
}

const LETTER_CLINIC_IDS = new Set<string>([MOCK_CLINIC_IDS.MAIN, MOCK_CLINIC_IDS.DOWNTOWN]);

export function prescriptionClinicAddresses(arabic: boolean) {
  return listMockClinicsMainFirst()
    .filter((clinic) => LETTER_CLINIC_IDS.has(clinic.id))
    .map((clinic) => {
      const street = arabic ? clinic.address.streetAr || clinic.address.street : clinic.address.street;
      const city = arabic ? clinic.address.cityAr || clinic.address.city : clinic.address.city;
      return arabic ? `${street} , ${city}` : `${street}, ${city}`;
    });
}

function formatClinicPhone(phone: string) {
  const local = formatPhoneForDisplay(phone);
  if (/^02\d{8}$/.test(local)) return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
  return local;
}

export function prescriptionClinicPhones() {
  return listMockClinicsMainFirst()
    .filter((clinic) => LETTER_CLINIC_IDS.has(clinic.id))
    .map((clinic) => formatClinicPhone(clinic.phone))
    .filter(Boolean);
}

export function clinicDisplayName(prescription: Prescription, arabic: boolean) {
  if (arabic) return prescription.clinicNameAr || prescription.clinicName || '';
  return prescription.clinicName || prescription.clinicNameAr || '';
}

export function buildPrescriptionHtml(
  prescription: Prescription,
  labels: PrescriptionDocumentLabels,
  arabic: boolean,
) {
  const clinic = escapeHtml(clinicDisplayName(prescription, arabic));
  const note = localizedMedicationText(
    prescription.instructions,
    prescription.instructionsAr,
    arabic ? Locale.AR : Locale.EN,
  );
  const logo = prescription.clinicLogoUrl
    ? `<img src="${escapeHtml(prescription.clinicLogoUrl)}" alt="" style="height:42px;object-fit:contain" />`
    : '';
  const meds = prescription.medications
    .map(
      (medication) => `<tr>
        <td>${escapeHtml(medication.name)}</td>
        <td>${escapeHtml(medication.dosage)}</td>
        <td>${escapeHtml(medication.frequency)}</td>
        <td>${escapeHtml(medication.duration)}</td>
      </tr>`,
    )
    .join('');
  const clinicAddress = `<div class="address-row"><span>${escapeHtml(labels.addressLabel)} :</span><div class="address-lines">${prescriptionClinicAddresses(
    arabic,
  )
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('')}</div></div>`;
  const clinicPhones = `<div class="address-row"><span>${escapeHtml(labels.contactLabel)} :</span><div class="phones">${prescriptionClinicPhones()
    .map(
      (phone, index) =>
        `${index ? '<span class="sep"> | </span>' : ''}<span class="num">${escapeHtml(phone)}</span>`,
    )
    .join('')}</div></div>`;
  const signature = prescription.doctorSignatureUrl
    ? `<img src="${escapeHtml(prescription.doctorSignatureUrl)}" alt="" style="height:48px;object-fit:contain" />`
    : `<div class="e-sign">${escapeHtml(electronicSignatureName(prescription.doctorName))}</div>`;
  const qr = prescriptionQrSvg(prescriptionFileUrl(prescription.id));

  return `<!DOCTYPE html>
<html dir="${arabic ? 'rtl' : 'ltr'}" lang="${arabic ? 'ar' : 'en'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #0f172a; margin: 24px; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 2px solid #0d9488; padding-bottom: 12px; }
    h1 { font-size: 20px; margin: 0; }
    .meta { color: #64748b; margin-top: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: start; }
    th { background: #f8fafc; }
    footer { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; gap: 24px; }
    .mark { text-align: start; color: #64748b; font-size: 12px; }
    .sign img { height: 32px; object-fit: contain; display: block; margin-top: 0; }
    .sign-line { display: flex; align-items: center; justify-content: flex-start; gap: 8px; }
    .e-sign { font-family: "Segoe Script", "Brush Script MT", cursive; font-size: 18px; line-height: 1.2; color: #1e3a5f; }
    .address-row { display: flex; align-items: flex-start; justify-content: flex-start; gap: 6px; margin-top: 4px; }
    .address-lines { display: flex; flex-direction: column; align-items: flex-start; }
    .phones { direction: rtl; display: inline-flex; align-items: center; }
    .phones .num { direction: ltr; unicode-bidi: isolate; }
    .qr-box { width: 72px; height: 72px; margin: 4px auto 0; }
    .qr-box svg { width: 72px; height: 72px; display: block; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${clinic || escapeHtml(labels.title)}</h1>
      <div>${escapeHtml(prescription.number ? labels.number : '')}</div>
    </div>
    ${logo}
  </header>
  <p class="meta">${escapeHtml(getPrescriptionDisplayDate(prescription).slice(0, 10))}<br />${escapeHtml(labels.doctor)}: ${escapeHtml(prescription.doctorName ?? '')}</p>
  <table>
    <thead><tr><th>${escapeHtml(labels.medications)}</th><th>${escapeHtml(labels.dosage)}</th><th>${escapeHtml(labels.frequency)}</th><th>${escapeHtml(labels.duration)}</th></tr></thead>
    <tbody>${meds}</tbody>
  </table>
  ${note ? `<p><strong>${escapeHtml(labels.instructions)}</strong><br />${escapeHtml(note)}</p>` : ''}
  <footer>
    <div class="mark sign"><div class="sign-line"><span>${escapeHtml(labels.signature)} :</span>${signature}</div>${clinicAddress ? `<div class="clinic-address">${clinicPhones}${clinicAddress}</div>` : ''}</div>
    <div class="mark"><div class="qr-box">${qr}</div></div>
  </footer>
</body>
</html>`;
}

export function labelsFromT(t: TFunction<'patient'>, prescription: Prescription): PrescriptionDocumentLabels {
  return {
    title: t('prescription.title'),
    doctor: t('prescription.doctor'),
    medications: t('prescription.medications'),
    dosage: t('prescription.dosageHeader'),
    frequency: t('prescription.frequencyHeader'),
    duration: t('prescription.durationHeader'),
    instructions: t('prescription.instructions'),
    signature: t('prescription.signature'),
    qr: t('prescription.qr'),
    addressLabel: t('prescription.addressLabel'),
    contactLabel: t('prescription.contactLabel'),
    number: prescription.number ? t('prescription.number', { value: prescription.number }) : '',
  };
}

export async function printIssuedPrescription(
  prescription: Prescription,
  labels: PrescriptionDocumentLabels,
  arabic: boolean,
) {
  return printPrescriptionDocument(buildPrescriptionHtml(prescription, labels, arabic));
}

type PrintFrame = {
  setAttribute: (name: string, value: string) => void;
  contentDocument: { open: () => void; write: (html: string) => void; close: () => void } | null;
  contentWindow: { focus: () => void; print: () => void } | null;
  remove: () => void;
};

export async function printPrescriptionDocument(html: string) {
  const root = globalThis as {
    document?: {
      body: { appendChild: (node: PrintFrame) => void };
      createElement: (tag: string) => PrintFrame;
    };
  };
  if (Platform.OS !== 'web' || !root.document) {
    return false;
  }

  const frame = root.document.createElement('iframe');
  frame.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0');
  root.document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  win.focus();
  win.print();
  setTimeout(() => frame.remove(), 1500);
  return true;
}
