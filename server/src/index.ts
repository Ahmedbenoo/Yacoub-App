import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import { z } from 'zod';

import { getClinic, listClinicsForUser, searchClinics, seedClinicDetails, seedClinicOwners, updateClinic, addOwnerClinic, approveClinic, listPendingClinics, listClinicCities } from './clinics.js';
import { migrate, seedDemo } from './db.js';
import {
  callNextAppointment,
  cancelAppointment,
  checkInAppointment,
  confirmAppointment,
  createAppointment,
  getAppointment,
  listAppointments,
  markNoShow,
  queueAppointments,
  rescheduleAppointment,
  seedAppointments,
} from './appointments.js';
import { listAppointmentWhatsApp, seedWhatsAppMessages } from './whatsapp.js';
import { dayClose, getInvoiceForAppointment, issueInvoice, listTodayInvoices, payInvoice } from './invoices.js';
import { getAvailability, getDoctor, listDoctors, seedDoctors, updateAvailability } from './doctors.js';
import { uploadsRoot } from './files.js';
import {
  createPatient,
  getMyPatient,
  getPatient,
  listPatients,
  seedPatients,
  setPatientActive,
  updatePatient,
} from './patients.js';
import { clinicReport, clinicReports, clinicStats } from './reports.js';
import {
  createLabRequest,
  createPrescription,
  issuePrescription,
  listLabRequests,
  listPrescriptions,
  removePrescription,
  updatePrescription,
} from './clinical.js';
import {
  historyForPatient,
  myHistory,
  myLabResult,
  myLabResults,
  myPrescription,
  myPrescriptions,
  recordLabResult,
  staffLabResult,
  staffPrescription,
  visitDetail,
} from './records.js';
import {
  changePassword,
  forgotPassword,
  login,
  loginOrRegisterByPhone,
  logout,
  refreshSession,
  registerPatient,
  resetAllPasswords,
  resendOtp,
  resetPassword,
  releasePersonalPhone,
  seedAdmin,
  updateProfile,
  userFromAccessToken,
  verifyOtp,
  sessionForUser,
} from './users.js';
import { activeVisit, completeVisit, getVisit, listVisits, startVisit, updateVisit } from './visits.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead, registerDeviceToken } from './notifications.js';
import {
  acceptHomeVisit,
  completeHomeVisit,
  createHomeVisit,
  enableHomeVisits,
  getHomeVisit,
  homeVisitSetting,
  listHomeVisits,
} from './home-visits.js';
import {
  acceptNursing,
  assignNursing,
  completeNursing,
  createNursing,
  declineNursing,
  getNurse,
  getNursing,
  listNurses,
  listNursing,
  priceNursing,
  registerNurse,
  seedNurseProfiles,
  setNurseVerification,
} from './nursing.js';
import {
  addAttachment,
  addDose,
  childChart,
  childLink,
  closePregnancy,
  createPregnancy,
  getEncounter,
  getUltrasound,
  listAttachments,
  listMyChildren,
  listPregnancies,
  priorMeasurements,
  saveEncounter,
  saveUltrasound,
  visitSummary,
} from './obgyn.js';
import { createReview, listReviews, reviewForAppointment } from './reviews.js';
import { registerDoctorAccount, registerOwnerAccount } from './registration.js';
import { createDoctor, createSecretary, setDoctorActive, updateDoctor } from './staff.js';

const loginBody = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
});

const registerBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  password: z.string().min(8),
});

const phoneAuthBody = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(8),
  password: z.string().min(8),
  clinicId: z.string().min(1).optional(),
});

const phoneOtpBody = z.object({
  phone: z.string().min(8),
});

const verifyOtpBody = phoneOtpBody.extend({
  otp: z.string().length(6),
});

const resetPasswordBody = z.object({
  phone: z.string().min(8),
  resetToken: z.string().min(1),
  password: z.string().min(8),
});

const profileBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  stampUrl: z.string().optional(),
});

const changePasswordBody = z.object({
  currentPassword: z.string().min(8),
  password: z.string().min(8),
});

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

const clinicPatchBody = z.object({
  openingHours: z.string().min(2).optional(),
  consultationFee: z.number().int().nonnegative().optional(),
  locationUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  replacePhotoIndex: z.number().int().nonnegative().optional(),
  replacePhotoUrl: z.string().optional(),
  logoUrl: z.string().optional(),
});

const clinicSearchQuery = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

function requestBase(req: express.Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

const doctorQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().optional(),
  specialty: z.string().optional(),
  clinicId: z.string().optional(),
  allClinics: z.union([z.boolean(), z.string()]).optional(),
  includeInactive: z.union([z.boolean(), z.string()]).optional(),
});

const availabilityBody = z.object({
  slotMinutes: z.number().int().positive().max(240).optional(),
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
});

function flag(value: boolean | string | undefined): boolean {
  return value === true || value === 'true';
}

const patientQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().optional(),
  clinicId: z.string().optional(),
  includeInactive: z.union([z.boolean(), z.string()]).optional(),
});

const createPatientBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other']),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
});

const updatePatientBody = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  allergies: z.array(z.string()),
  chronicConditions: z.array(z.string()),
});

function clinicFromRequest(req: express.Request, queryClinicId?: string): string {
  const header = req.header('x-clinic-id')?.trim() ?? '';
  return queryClinicId?.trim() || header;
}

const appointmentQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  clinicId: z.string().optional(),
  scope: z.enum(['today', 'upcoming', 'past', 'all']).optional(),
});

const createAppointmentBody = z.object({
  doctorId: z.string().min(1),
  branchId: z.string().min(1),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().positive().max(240).optional(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  patientId: z.string().optional(),
  desk: z.boolean().optional(),
});

const rescheduleBody = z.object({
  scheduledAt: z.string().min(1),
  by: z.enum(['secretary', 'patient']).optional(),
});

const startVisitBody = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().min(1),
  chiefComplaint: z.string().optional(),
});

const updateVisitBody = z.object({
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  vitals: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      weight: z.number().optional(),
    })
    .optional(),
});

const payInvoiceBody = z.object({
  paymentMethod: z.enum(['cash', 'instapay', 'wallet']),
});

const medicationBody = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  frequencyAr: z.string().optional(),
  duration: z.string().min(1),
  durationAr: z.string().optional(),
  instructions: z.string().optional(),
  instructionsAr: z.string().optional(),
});

const createPrescriptionBody = z.object({
  visitId: z.string().min(1),
  medications: z.array(medicationBody).min(1),
  instructions: z.string().optional(),
});

const updatePrescriptionBody = z.object({
  medications: z.array(medicationBody).min(1),
  instructions: z.string().optional(),
});

const createLabBody = z.object({
  visitId: z.string().min(1),
  type: z.enum(['lab', 'imaging']),
  testName: z.string().min(1),
  priority: z.enum(['routine', 'urgent']),
  notes: z.string().optional(),
});

const labResultBody = z.object({
  resultSummary: z.string().min(1),
});

const visitQuery = z.object({
  patientId: z.string().min(1),
  status: z.string().optional(),
});

function bearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

function sendError(res: express.Response, error: unknown, fallback: string) {
  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
  const message = error instanceof Error ? error.message : fallback;
  res.status(Number.isFinite(status) ? status : 500).json({ code, message });
}

async function requireUser(req: express.Request, res: express.Response) {
  const token = bearerToken(req.header('authorization'));
  if (!token) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    return undefined;
  }
  return userFromAccessToken(token);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Yacoub API',
      message: 'السيرفر شغال. الدخول من POST /api/v1/auth/login',
    },
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Identifier and password are required' });
    return;
  }

  try {
    const session = await login(parsed.data.identifier, parsed.data.password);
    res.json({ success: true, data: session });
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(status).json({ code, message });
  }
});

app.post('/api/v1/auth/refresh', async (req, res) => {
  const parsed = refreshBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Refresh token is required' });
    return;
  }

  try {
    const session = await refreshSession(parsed.data.refreshToken);
    res.json({ success: true, data: session });
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
    const message = error instanceof Error ? error.message : 'Session expired';
    res.status(status).json({ code, message });
  }
});

app.get('/api/v1/auth/me', async (req, res) => {
  const token = bearerToken(req.header('authorization'));
  if (!token) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    return;
  }

  try {
    const user = await userFromAccessToken(token);
    res.json({ success: true, data: user });
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
    const message = error instanceof Error ? error.message : 'Not authenticated';
    res.status(status).json({ code, message });
  }
});

app.post('/api/v1/auth/register', async (req, res) => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name, phone, and password are required' });
    return;
  }
  try {
    res.json({ success: true, data: await registerPatient(parsed.data) });
  } catch (error) {
    sendError(res, error, 'Registration failed');
  }
});

const registerOwnerBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  gender: z.enum(['male', 'female']),
  password: z.string().min(8),
  placeKind: z.enum(['clinic', 'center']),
  placeName: z.string().min(2),
  clinicName: z.string().optional(),
  clinicPhone: z.string().min(3),
  street: z.string().min(2),
  city: z.string().min(2),
  locationUrl: z.string().optional(),
  specialty: z.string().min(2),
  openingHours: z.string().min(2),
  consultationFee: z.number().nonnegative(),
  practices: z.boolean(),
});

app.post('/api/v1/auth/register-owner', async (req, res) => {
  const parsed = registerOwnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic registration is invalid' });
    return;
  }
  try {
    res.status(201).json({ success: true, data: await registerOwnerAccount(parsed.data) });
  } catch (error) {
    sendError(res, error, 'Registration failed');
  }
});

const registerDoctorAccountBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  gender: z.enum(['male', 'female']),
  password: z.string().min(8),
  specialty: z.string().min(2),
});

app.post('/api/v1/auth/register-doctor', async (req, res) => {
  const parsed = registerDoctorAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Doctor registration is invalid' });
    return;
  }
  try {
    res.status(201).json({ success: true, data: await registerDoctorAccount(parsed.data) });
  } catch (error) {
    sendError(res, error, 'Registration failed');
  }
});

app.post('/api/v1/auth/phone', async (req, res) => {
  const parsed = phoneAuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Phone and password are required' });
    return;
  }
  try {
    res.json({ success: true, data: await loginOrRegisterByPhone(parsed.data) });
  } catch (error) {
    sendError(res, error, 'Login failed');
  }
});

app.post('/api/v1/auth/forgot-password', async (req, res) => {
  const parsed = phoneOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Phone is required' });
    return;
  }
  try {
    res.json({ success: true, data: await forgotPassword(parsed.data.phone) });
  } catch (error) {
    sendError(res, error, 'Could not send the verification code');
  }
});

app.post('/api/v1/auth/resend-otp', async (req, res) => {
  const parsed = phoneOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Phone is required' });
    return;
  }
  try {
    res.json({ success: true, data: await resendOtp(parsed.data.phone) });
  } catch (error) {
    sendError(res, error, 'Could not send the verification code');
  }
});

app.post('/api/v1/auth/verify-otp', async (req, res) => {
  const parsed = verifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Phone and verification code are required' });
    return;
  }
  try {
    res.json({ success: true, data: await verifyOtp(parsed.data.phone, parsed.data.otp) });
  } catch (error) {
    sendError(res, error, 'Invalid verification code');
  }
});

app.post('/api/v1/auth/reset-password', async (req, res) => {
  const parsed = resetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Phone, reset token, and password are required' });
    return;
  }
  try {
    res.json({
      success: true,
      data: await resetPassword(parsed.data.phone, parsed.data.resetToken, parsed.data.password),
    });
  } catch (error) {
    sendError(res, error, 'Password reset failed');
  }
});

app.post('/api/v1/auth/logout', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await logout(user.id);
    res.json({ success: true, data: { message: 'Signed out' } });
  } catch (error) {
    sendError(res, error, 'Not authenticated');
  }
});

app.patch('/api/v1/auth/profile', async (req, res) => {
  const parsed = profileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'First and last name are required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await updateProfile(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Profile update failed');
  }
});

app.post('/api/v1/auth/change-password', async (req, res) => {
  const parsed = changePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Current and new passwords are required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.password);
    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    sendError(res, error, 'Password change failed');
  }
});

app.get('/api/v1/clinics/search', async (req, res) => {
  const parsed = clinicSearchQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid clinic search' });
    return;
  }
  const result = await searchClinics(parsed.data, requestBase(req));
  res.json({ success: true, data: result });
});

app.get('/api/v1/clinics', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listClinicsForUser(user.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not load clinics');
  }
});

app.get('/api/v1/clinics/cities', async (_req, res) => {
  try {
    res.json({ success: true, data: await listClinicCities() });
  } catch (error) {
    sendError(res, error, 'Could not load cities');
  }
});

app.get('/api/v1/clinics/pending', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listPendingClinics(user.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not load pending branches');
  }
});

const addClinicBody = z.object({
  name: z.string().min(2),
  phone: z.string().min(3),
  street: z.string().min(2),
  city: z.string().min(2),
  locationUrl: z.string().optional(),
  specialty: z.string().min(2),
});

app.post('/api/v1/clinics', async (req, res) => {
  const parsed = addClinicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Branch details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await addOwnerClinic(user.id, parsed.data, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not add the branch');
  }
});

app.get('/api/v1/clinics/:id', async (req, res) => {
  try {
    res.json({ success: true, data: await getClinic(req.params.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Clinic not found');
  }
});

app.patch('/api/v1/clinics/:id', async (req, res) => {
  const parsed = clinicPatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const clinic = await updateClinic(user.id, req.params.id, parsed.data, requestBase(req));
    res.json({ success: true, data: clinic });
  } catch (error) {
    sendError(res, error, 'Clinic update failed');
  }
});

app.post('/api/v1/clinics/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await approveClinic(user.id, req.params.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not approve the branch');
  }
});

app.get('/api/v1/patients/me', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getMyPatient(user.id) });
  } catch (error) {
    sendError(res, error, 'Patient not found');
  }
});

app.get('/api/v1/patients/me/history', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await myHistory(user.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the health record');
  }
});

app.get('/api/v1/patients/me/prescriptions', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await myPrescriptions(user.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not load prescriptions');
  }
});

app.get('/api/v1/patients/me/prescriptions/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await myPrescription(user.id, req.params.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Prescription not found');
  }
});

app.get('/api/v1/patients/me/lab-results', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await myLabResults(user.id) });
  } catch (error) {
    sendError(res, error, 'Could not load lab results');
  }
});

app.get('/api/v1/patients/me/lab-results/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await myLabResult(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Lab result not found');
  }
});

app.get('/api/v1/patients/me/visits/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await visitDetail(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Visit not found');
  }
});

app.get('/api/v1/patients', async (req, res) => {
  const parsed = patientQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid patient search' });
    return;
  }
  const clinicId = clinicFromRequest(req, parsed.data.clinicId);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const result = await listPatients(user.id, {
      clinicId,
      search: parsed.data.search,
      includeInactive: flag(parsed.data.includeInactive),
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error, 'Could not load patients');
  }
});

app.get('/api/v1/admin/stats', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await clinicStats(user.id, clinicId) });
  } catch (error) {
    sendError(res, error, 'Could not load clinic stats');
  }
});

app.get('/api/v1/admin/reports', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await clinicReports(user.id, clinicId) });
  } catch (error) {
    sendError(res, error, 'Could not load clinic reports');
  }
});

app.get('/api/v1/admin/reports/:id', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await clinicReport(user.id, clinicId, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Report not found');
  }
});

app.post('/api/v1/admin/patients', async (req, res) => {
  const parsed = createPatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Patient details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const patient = await createPatient(user.id, clinicFromRequest(req), parsed.data);
    res.json({ success: true, data: patient });
  } catch (error) {
    sendError(res, error, 'Could not create the patient file');
  }
});

app.patch('/api/v1/admin/patients/:id', async (req, res) => {
  const parsed = updatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Patient details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await updatePatient(user.id, req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not update the patient file');
  }
});

app.patch('/api/v1/admin/patients/:id/deactivate', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await setPatientActive(user.id, req.params.id, false) });
  } catch (error) {
    sendError(res, error, 'Could not deactivate the patient file');
  }
});

app.patch('/api/v1/admin/patients/:id/reactivate', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await setPatientActive(user.id, req.params.id, true) });
  } catch (error) {
    sendError(res, error, 'Could not reactivate the patient file');
  }
});

app.get('/api/v1/patients/:id/history', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await historyForPatient(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the health record');
  }
});

app.get('/api/v1/patients/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getPatient(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Patient not found');
  }
});

app.get('/api/v1/appointments/queue', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await queueAppointments(user.id, clinicId) });
  } catch (error) {
    sendError(res, error, 'Could not load the queue');
  }
});

app.post('/api/v1/appointments/queue/next', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.body?.clinicId === 'string' ? req.body.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await callNextAppointment(user.id, clinicId) });
  } catch (error) {
    sendError(res, error, 'Could not call the next patient');
  }
});

app.get('/api/v1/appointments', async (req, res) => {
  const parsed = appointmentQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid appointment search' });
    return;
  }
  const clinicId = clinicFromRequest(req, parsed.data.clinicId);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const result = await listAppointments(user.id, {
      clinicId,
      status: parsed.data.status,
      dateFrom: parsed.data.dateFrom,
      dateTo: parsed.data.dateTo,
      doctorId: parsed.data.doctorId,
      patientId: parsed.data.patientId,
      scope: parsed.data.scope,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error, 'Could not load appointments');
  }
});

app.post('/api/v1/appointments', async (req, res) => {
  const parsed = createAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Appointment details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await createAppointment(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not book the appointment');
  }
});

app.get('/api/v1/appointments/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getAppointment(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Appointment not found');
  }
});

app.get('/api/v1/appointments/:id/whatsapp', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await getAppointment(user.id, req.params.id);
    res.json({ success: true, data: await listAppointmentWhatsApp(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load WhatsApp messages');
  }
});

app.post('/api/v1/appointments/:id/confirm', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await confirmAppointment(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not confirm the appointment');
  }
});

app.post('/api/v1/appointments/:id/cancel', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await cancelAppointment(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not cancel the appointment');
  }
});

app.post('/api/v1/appointments/:id/no-show', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await markNoShow(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not mark the no-show');
  }
});

app.post('/api/v1/appointments/:id/check-in', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await checkInAppointment(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not check in');
  }
});

app.patch('/api/v1/appointments/:id/reschedule', async (req, res) => {
  const parsed = rescheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Appointment time is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await rescheduleAppointment(user.id, req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not reschedule the appointment');
  }
});

app.get('/api/v1/visits', async (req, res) => {
  const parsed = visitQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Patient is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (parsed.data.status === 'in_progress') {
      res.json({ success: true, data: await activeVisit(user.id, parsed.data.patientId) });
      return;
    }
    res.json({ success: true, data: await listVisits(user.id, parsed.data.patientId) });
  } catch (error) {
    sendError(res, error, 'Could not load visits');
  }
});

app.post('/api/v1/visits/start', async (req, res) => {
  const parsed = startVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Visit details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await startVisit(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not start the visit');
  }
});

app.get('/api/v1/visits/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getVisit(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Visit not found');
  }
});

app.patch('/api/v1/visits/:id', async (req, res) => {
  const parsed = updateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Visit details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await updateVisit(user.id, req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not update the visit');
  }
});

app.post('/api/v1/visits/:id/complete', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await completeVisit(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not complete the visit');
  }
});

app.get('/api/v1/visits/:id/prescriptions', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listPrescriptions(user.id, req.params.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not load prescriptions');
  }
});

app.get('/api/v1/visits/:id/lab-requests', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listLabRequests(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load lab requests');
  }
});

app.post('/api/v1/prescriptions', async (req, res) => {
  const parsed = createPrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Prescription details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await createPrescription(user.id, parsed.data, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not save the prescription');
  }
});

app.patch('/api/v1/prescriptions/:id', async (req, res) => {
  const parsed = updatePrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Prescription details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await updatePrescription(user.id, req.params.id, parsed.data, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not update the prescription');
  }
});

app.post('/api/v1/prescriptions/:id/issue', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await issuePrescription(user.id, req.params.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Could not issue the prescription');
  }
});

app.delete('/api/v1/prescriptions/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await removePrescription(user.id, req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    sendError(res, error, 'Could not delete the prescription');
  }
});

app.post('/api/v1/lab-requests', async (req, res) => {
  const parsed = createLabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Lab request details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await createLabRequest(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not save the lab request');
  }
});

app.get('/api/v1/clinical/prescriptions/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await staffPrescription(user.id, req.params.id, requestBase(req)) });
  } catch (error) {
    sendError(res, error, 'Prescription not found');
  }
});

app.get('/api/v1/clinical/lab-results/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await staffLabResult(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Lab result not found');
  }
});

app.patch('/api/v1/clinical/lab-results/:id', async (req, res) => {
  const parsed = labResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Result is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await recordLabResult(user.id, req.params.id, parsed.data.resultSummary) });
  } catch (error) {
    sendError(res, error, 'Could not record the result');
  }
});

app.get('/api/v1/clinical/visits/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await visitDetail(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Visit not found');
  }
});

app.get('/api/v1/appointments/:id/invoice', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getInvoiceForAppointment(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Invoice not found');
  }
});

app.post('/api/v1/appointments/:id/invoice', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await issueInvoice(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not issue the invoice');
  }
});

app.post('/api/v1/appointments/:id/invoice/pay', async (req, res) => {
  const parsed = payInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Payment method is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await payInvoice(user.id, req.params.id, parsed.data.paymentMethod) });
  } catch (error) {
    sendError(res, error, 'Could not record the payment');
  }
});

app.get('/api/v1/invoices/today', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listTodayInvoices(user.id, clinicId) });
  } catch (error) {
    sendError(res, error, 'Could not load today invoices');
  }
});

app.get('/api/v1/invoices/day-close', async (req, res) => {
  const clinicId = clinicFromRequest(req, typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined);
  if (!clinicId) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Clinic is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await dayClose(user.id, clinicId) });
  } catch (error) {
    sendError(res, error, 'Could not close the day');
  }
});

app.get('/api/v1/doctors', async (req, res) => {
  const parsed = doctorQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid doctor search' });
    return;
  }
  const clinicId = parsed.data.clinicId?.trim() ?? '';
  const result = await listDoctors({
    page: parsed.data.page,
    limit: parsed.data.limit,
    search: parsed.data.search,
    specialty: parsed.data.specialty,
    clinicId,
    includeInactive: flag(parsed.data.includeInactive),
  });
  res.json({ success: true, data: result });
});

app.get('/api/v1/doctors/me/home-visits', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await homeVisitSetting(user.id) });
  } catch (error) {
    sendError(res, error, 'Could not load home visits');
  }
});

app.post('/api/v1/doctors/me/home-visits', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await enableHomeVisits(user.id) });
  } catch (error) {
    sendError(res, error, 'Could not enable home visits');
  }
});

app.get('/api/v1/doctors/:id/availability', async (req, res) => {
  try {
    res.json({ success: true, data: await getAvailability(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Schedule not found');
  }
});

app.put('/api/v1/doctors/:id/availability', async (req, res) => {
  const parsed = availabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Schedule hours are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const schedule = await updateAvailability(user.id, req.params.id, parsed.data);
    res.json({ success: true, data: schedule });
  } catch (error) {
    sendError(res, error, 'Schedule update failed');
  }
});

app.get('/api/v1/doctors/:id', async (req, res) => {
  try {
    res.json({ success: true, data: await getDoctor(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Doctor not found');
  }
});

const staffDoctorBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  specialty: z.string().min(2),
  branchName: z.string().min(1),
  languages: z.array(z.string()).default([]),
  bio: z.string().optional(),
});

const updateDoctorBody = z.object({
  specialty: z.string().min(2),
  phone: z.string().optional(),
  bio: z.string().optional(),
  branchName: z.string().min(1),
  languages: z.array(z.string()).default([]),
  sharePercent: z.number().optional(),
  avatarUrl: z.string().optional(),
});

const secretaryBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
});

app.post('/api/v1/admin/doctors', async (req, res) => {
  const parsed = staffDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Doctor details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const doctor = await createDoctor(user.id, clinicFromRequest(req), parsed.data);
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    sendError(res, error, 'Could not add the doctor');
  }
});

app.patch('/api/v1/admin/doctors/:id', async (req, res) => {
  const parsed = updateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Doctor details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await updateDoctor(user.id, clinicFromRequest(req), req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not update the doctor');
  }
});

app.patch('/api/v1/admin/doctors/:id/deactivate', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await setDoctorActive(user.id, clinicFromRequest(req), req.params.id, false) });
  } catch (error) {
    sendError(res, error, 'Could not deactivate the doctor');
  }
});

app.patch('/api/v1/admin/doctors/:id/reactivate', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await setDoctorActive(user.id, clinicFromRequest(req), req.params.id, true) });
  } catch (error) {
    sendError(res, error, 'Could not reactivate the doctor');
  }
});

app.post('/api/v1/admin/secretaries', async (req, res) => {
  const parsed = secretaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Secretary details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await createSecretary(user.id, clinicFromRequest(req), parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not add the secretary');
  }
});

app.post('/api/v1/devices/register', async (req, res) => {
  const parsed = z.object({ token: z.string().min(8), platform: z.string().min(2) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Device token is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await registerDeviceToken(user.id, parsed.data.token, parsed.data.platform);
    res.json({ success: true, data: { registered: true } });
  } catch (error) {
    sendError(res, error, 'Could not register the device');
  }
});

app.get('/api/v1/notifications', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listNotifications(user.id) });
  } catch (error) {
    sendError(res, error, 'Could not load notifications');
  }
});

app.post('/api/v1/notifications/read-all', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await markAllNotificationsRead(user.id);
    res.json({ success: true, data: { message: 'ok' } });
  } catch (error) {
    sendError(res, error, 'Could not mark notifications');
  }
});

app.post('/api/v1/notifications/:id/read', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await markNotificationRead(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not mark the notification');
  }
});

app.get('/api/v1/doctors/:id/reviews', async (req, res) => {
  try {
    res.json({ success: true, data: await listReviews(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load reviews');
  }
});

app.get('/api/v1/appointments/:id/review', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await reviewForAppointment(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the review');
  }
});

const reviewBody = z.object({
  doctorId: z.string().min(1),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

app.post('/api/v1/reviews', async (req, res) => {
  const parsed = reviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Review is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await createReview(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not save the review');
  }
});

app.get('/api/v1/home-visits', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined;
    const patientUserId = typeof req.query.patientUserId === 'string' ? req.query.patientUserId : undefined;
    res.json({ success: true, data: await listHomeVisits(user.id, { doctorId, patientUserId }) });
  } catch (error) {
    sendError(res, error, 'Could not load home visits');
  }
});

app.get('/api/v1/home-visits/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getHomeVisit(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Home visit not found');
  }
});

const homeVisitBody = z.object({
  patientName: z.string().min(2),
  patientPhone: z.string().optional(),
  specialty: z.string().min(2),
  address: z.string().min(2),
  scheduledAt: z.string().min(1),
  notes: z.string().optional(),
});

app.post('/api/v1/home-visits', async (req, res) => {
  const parsed = homeVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Home visit details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await createHomeVisit(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not request the home visit');
  }
});

app.post('/api/v1/home-visits/:id/accept', async (req, res) => {
  const parsed = z.object({ doctorId: z.string().min(1), doctorName: z.string().min(1), price: z.number().positive() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Accept details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await acceptHomeVisit(user.id, req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not accept the home visit');
  }
});

app.post('/api/v1/home-visits/:id/complete', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await completeHomeVisit(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not complete the home visit');
  }
});

app.get('/api/v1/nursing/requests', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const nurseUserId = typeof req.query.nurseUserId === 'string' ? req.query.nurseUserId : undefined;
    const patientUserId = typeof req.query.patientUserId === 'string' ? req.query.patientUserId : undefined;
    res.json({ success: true, data: await listNursing(user.id, { nurseUserId, patientUserId }) });
  } catch (error) {
    sendError(res, error, 'Could not load nursing requests');
  }
});

app.get('/api/v1/nursing/requests/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getNursing(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Nursing request not found');
  }
});

const nursingBody = z.object({
  patientName: z.string().min(2),
  patientPhone: z.string().optional(),
  serviceId: z.string().min(1),
  serviceIds: z.array(z.string()).optional(),
  address: z.string().min(2),
  scheduledAt: z.string().min(1),
});

app.post('/api/v1/nursing/requests', async (req, res) => {
  const parsed = nursingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Nursing request is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await createNursing(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not create the nursing request');
  }
});

app.post('/api/v1/nursing/requests/:id/price', async (req, res) => {
  const parsed = z.object({ price: z.number().positive() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Price is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await priceNursing(user.id, req.params.id, parsed.data.price) });
  } catch (error) {
    sendError(res, error, 'Could not price the request');
  }
});

app.post('/api/v1/nursing/requests/:id/assign', async (req, res) => {
  const parsed = z.object({ nurseUserId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Nurse is required' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await assignNursing(user.id, req.params.id, parsed.data.nurseUserId) });
  } catch (error) {
    sendError(res, error, 'Could not assign the nurse');
  }
});

app.post('/api/v1/nursing/requests/:id/accept', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await acceptNursing(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not accept the request');
  }
});

app.post('/api/v1/nursing/requests/:id/decline', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await declineNursing(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not decline the request');
  }
});

app.post('/api/v1/nursing/requests/:id/complete', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await completeNursing(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not complete the request');
  }
});

app.get('/api/v1/nursing/nurses', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listNurses() });
  } catch (error) {
    sendError(res, error, 'Could not load nurses');
  }
});

app.get('/api/v1/nursing/nurses/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getNurse(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Nurse not found');
  }
});

app.get('/api/v1/nursing/nurses/:id/verification', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getNurse(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Nurse not found');
  }
});

app.post('/api/v1/nursing/nurses/:id/verification', async (req, res) => {
  const parsed = z.object({ verification: z.enum(['pending', 'approved', 'rejected']) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Verification is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await setNurseVerification(user.id, req.params.id, parsed.data.verification) });
  } catch (error) {
    sendError(res, error, 'Could not update verification');
  }
});

const registerNurseBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  proof: z.string().min(1),
});

app.post('/api/v1/auth/register-nurse', async (req, res) => {
  const parsed = registerNurseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Nurse registration is invalid' });
    return;
  }
  try {
    const created = await registerNurse(parsed.data);
    res.status(201).json({ success: true, data: await sessionForUser(created.userId) });
  } catch (error) {
    sendError(res, error, 'Could not register the nurse');
  }
});

app.get('/api/v1/obgyn/pregnancies', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : '';
    res.json({ success: true, data: await listPregnancies(patientId) });
  } catch (error) {
    sendError(res, error, 'Could not load pregnancies');
  }
});

app.post('/api/v1/obgyn/pregnancies', async (req, res) => {
  const parsed = z.object({
    patientId: z.string().min(1),
    lmp: z.string().min(1),
    edd: z.string().optional(),
    gravida: z.number().optional(),
    para: z.number().optional(),
    riskNotes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Pregnancy details are invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const { patientId, ...input } = parsed.data;
    res.status(201).json({ success: true, data: await createPregnancy(user.id, patientId, input) });
  } catch (error) {
    sendError(res, error, 'Could not open the pregnancy');
  }
});

app.post('/api/v1/obgyn/pregnancies/:id/close', async (req, res) => {
  const parsed = z.object({
    outcomeKind: z.enum(['live_birth', 'ended']),
    outcome: z.string().min(1),
    childFirstName: z.string().optional(),
    childGender: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Outcome is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await closePregnancy(user.id, req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not close the pregnancy');
  }
});

app.get('/api/v1/obgyn/pregnancies/:id/child', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await childLink(user.id, req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the child link');
  }
});

app.get('/api/v1/visits/:id/obgyn', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getEncounter(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the encounter');
  }
});

app.put('/api/v1/visits/:id/obgyn', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await saveEncounter(user.id, req.params.id, req.body ?? {}) });
  } catch (error) {
    sendError(res, error, 'Could not save the encounter');
  }
});

app.get('/api/v1/visits/:id/obgyn/prior', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const pregnancyId = typeof req.query.pregnancyId === 'string' ? req.query.pregnancyId : '';
    const before = typeof req.query.before === 'string' ? req.query.before : new Date().toISOString();
    res.json({ success: true, data: await priorMeasurements(pregnancyId, before) });
  } catch (error) {
    sendError(res, error, 'Could not load prior measurements');
  }
});

app.get('/api/v1/visits/:id/obgyn/summary', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await visitSummary(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the summary');
  }
});

app.get('/api/v1/lab-requests/:id/ultrasound', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await getUltrasound(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Could not load the ultrasound');
  }
});

app.put('/api/v1/lab-requests/:id/ultrasound', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await saveUltrasound(user.id, req.params.id, req.body ?? {}) });
  } catch (error) {
    sendError(res, error, 'Could not save the ultrasound');
  }
});

app.get('/api/v1/clinical/attachments', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const visitId = typeof req.query.visitId === 'string' ? req.query.visitId : '';
    res.json({ success: true, data: await listAttachments(visitId) });
  } catch (error) {
    sendError(res, error, 'Could not load attachments');
  }
});

app.post('/api/v1/clinical/attachments', async (req, res) => {
  const parsed = z.object({
    visitId: z.string().min(1),
    dataUrl: z.string().min(1),
    mediaType: z.string().min(1),
    fileName: z.string().optional(),
    labRequestId: z.string().optional(),
    pregnancyId: z.string().optional(),
    patientVisible: z.boolean().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Attachment is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await addAttachment(user.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not save the attachment');
  }
});

app.get('/api/v1/children/mine', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await listMyChildren(user.id) });
  } catch (error) {
    sendError(res, error, 'Could not load children');
  }
});

app.get('/api/v1/children/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ success: true, data: await childChart(req.params.id) });
  } catch (error) {
    sendError(res, error, 'Child chart not found');
  }
});

app.post('/api/v1/children/:id/doses', async (req, res) => {
  const parsed = z.object({ label: z.string().min(1), dueAt: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Dose is invalid' });
    return;
  }
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json({ success: true, data: await addDose(user.id, req.params.id, parsed.data) });
  } catch (error) {
    sendError(res, error, 'Could not add the dose');
  }
});

const port = Number(process.env.PORT ?? 3000);

await migrate();
const resetCount = await resetAllPasswords();
console.log(`Reset ${resetCount} account passwords`);
if (seedDemo) {
  await seedAdmin();
  await seedClinicDetails();
  await seedDoctors();
  await seedPatients();
  await seedAppointments();
  await seedWhatsAppMessages();
  await seedClinicOwners();
  await seedNurseProfiles();
  await releasePersonalPhone();
}

app.listen(port, () => {
  console.log(`Yacoub API listening on http://localhost:${port}/api/v1`);
});
