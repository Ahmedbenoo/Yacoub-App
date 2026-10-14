export type InvoicePaymentMethod = 'cash' | 'instapay' | 'wallet';
export type InvoiceStatus = 'open' | 'paid' | 'void';

export interface Invoice {
  id: string;
  appointmentId: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  amount: number;
  doctorSharePercent: number;
  doctorShare: number;
  clinicShare: number;
  paymentMethod?: InvoicePaymentMethod;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
}

export interface DayCloseSummary {
  collected: number;
  open: number;
  doctorShare: number;
  clinicShare: number;
  invoiceCount: number;
  doctors: {
    doctorId: string;
    doctorName: string;
    sharePercent: number;
    amount: number;
    doctorShare: number;
    clinicShare: number;
  }[];
}
