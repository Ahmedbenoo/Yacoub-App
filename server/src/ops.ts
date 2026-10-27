import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import express from 'express';

import { db } from './db.js';
import { login, normalizePhone, userFromAccessToken, userPlatformRole, type PlatformRole } from './users.js';

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

async function count(sql: string, params: readonly unknown[] = []): Promise<number> {
  const result = await db.query<{ n: string | number }>(sql, params);
  return Number(result.rows[0]?.n ?? 0);
}

function bearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

async function markPlatformRole(phone: string, role: PlatformRole): Promise<boolean> {
  const existing = await db.query<{ id: string; platform_role: string | null }>(
    'SELECT id, platform_role FROM users WHERE phone = $1 LIMIT 1',
    [phone],
  );
  if (!existing.rows[0]) return false;
  if (existing.rows[0].platform_role === 'super_admin' && role === 'admin') return true;
  await db.query(
    `UPDATE users SET is_platform_admin = true, platform_role = $2, updated_at = now() WHERE id = $1`,
    [existing.rows[0].id, role],
  );
  return true;
}

export async function ensurePlatformAdmin(): Promise<void> {
  const phone = normalizePhone(process.env.OPS_ADMIN_PHONE ?? '');
  if (phone) {
    const found = await markPlatformRole(phone, 'super_admin');
    if (!found) {
      const password = process.env.OPS_ADMIN_PASSWORD?.trim();
      if (password && password.length >= 8) {
        const id = `user-ops-${randomUUID()}`;
        const firstName = process.env.OPS_ADMIN_NAME?.trim() || 'Platform';
        await db.query(
          `INSERT INTO users (
             id, email, phone, password_hash, first_name, last_name, locale,
             is_email_verified, is_phone_verified, is_platform_admin, platform_role
           ) VALUES ($1, $2, $3, $4, $5, 'Admin', 'ar', true, true, true, 'super_admin')`,
          [id, `ops-${phone.replace(/\D/g, '')}@yacoub.local`, phone, await bcrypt.hash(password, 10), firstName],
        );
      }
    }
  }

  const staff = (process.env.OPS_STAFF_PHONES ?? '')
    .split(',')
    .map((item) => normalizePhone(item))
    .filter(Boolean);
  for (const staffPhone of staff) {
    await markPlatformRole(staffPhone, 'admin');
  }
}

function cairoDay(offset: number): string {
  const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
}

function fillSeries(rows: { day: string; n: string | number }[], days = 30) {
  const map = new Map(rows.map((row) => [String(row.day).slice(0, 10), Number(row.n)]));
  return Array.from({ length: days }, (_, index) => {
    const day = cairoDay(index - (days - 1));
    return { day, count: map.get(day) ?? 0 };
  });
}

function weekChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function dailySeries(sql: string) {
  const result = await db.query<{ day: string; n: string | number }>(sql);
  return fillSeries(result.rows);
}

async function overview() {
  const [usersDaily, clinicsDaily, patientsDaily, appointmentsDaily] = await Promise.all([
    dailySeries(
      `SELECT to_char((created_at AT TIME ZONE 'Africa/Cairo')::date, 'YYYY-MM-DD') AS day, count(*) AS n
       FROM users WHERE created_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1`,
    ),
    dailySeries(
      `SELECT to_char((created_at AT TIME ZONE 'Africa/Cairo')::date, 'YYYY-MM-DD') AS day, count(*) AS n
       FROM clinics WHERE created_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1`,
    ),
    dailySeries(
      `SELECT to_char((created_at AT TIME ZONE 'Africa/Cairo')::date, 'YYYY-MM-DD') AS day, count(*) AS n
       FROM patients WHERE created_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1`,
    ),
    dailySeries(
      `SELECT to_char((scheduled_at AT TIME ZONE 'Africa/Cairo')::date, 'YYYY-MM-DD') AS day, count(*) AS n
       FROM appointments WHERE scheduled_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1`,
    ),
  ]);

  const sumLast = (series: { count: number }[], from: number, to: number) =>
    series.slice(from, to).reduce((total, item) => total + item.count, 0);

  return {
    clinics: await count('SELECT count(*) AS n FROM clinics'),
    clinicsActive: await count('SELECT count(*) AS n FROM clinics WHERE is_active = true'),
    clinicsPending: await count(`SELECT count(*) AS n FROM clinics WHERE approval_status = 'pending'`),
    users: await count('SELECT count(*) AS n FROM users'),
    usersBlocked: await count('SELECT count(*) AS n FROM users WHERE is_blocked = true'),
    doctors: await count('SELECT count(*) AS n FROM doctors'),
    patients: await count('SELECT count(*) AS n FROM patients'),
    appointmentsToday: await count(
      `SELECT count(*) AS n FROM appointments
       WHERE (scheduled_at AT TIME ZONE 'Africa/Cairo')::date = (now() AT TIME ZONE 'Africa/Cairo')::date`,
    ),
    appointmentsOpen: await count(
      `SELECT count(*) AS n FROM appointments WHERE status IN ('scheduled', 'confirmed', 'in_progress')`,
    ),
    nursingOpen: await count(
      `SELECT count(*) AS n FROM nursing_requests WHERE status IN ('requested', 'priced', 'assigned', 'accepted')`,
    ),
    nursesPending: await count(`SELECT count(*) AS n FROM nurse_profiles WHERE verification = 'pending'`),
    homeVisitsOpen: await count(
      `SELECT count(*) AS n FROM home_visit_requests WHERE status IN ('requested', 'accepted')`,
    ),
    growth: {
      usersThisWeek: sumLast(usersDaily, 23, 30),
      usersChange: weekChange(sumLast(usersDaily, 23, 30), sumLast(usersDaily, 16, 23)),
      clinicsThisWeek: sumLast(clinicsDaily, 23, 30),
      clinicsChange: weekChange(sumLast(clinicsDaily, 23, 30), sumLast(clinicsDaily, 16, 23)),
      patientsThisWeek: sumLast(patientsDaily, 23, 30),
      patientsChange: weekChange(sumLast(patientsDaily, 23, 30), sumLast(patientsDaily, 16, 23)),
      appointmentsThisWeek: sumLast(appointmentsDaily, 23, 30),
      appointmentsChange: weekChange(sumLast(appointmentsDaily, 23, 30), sumLast(appointmentsDaily, 16, 23)),
      usersDaily,
      clinicsDaily,
      patientsDaily,
      appointmentsDaily,
    },
  };
}

async function listClinics(query?: string) {
  const q = query?.trim() ?? '';
  const like = `%${q}%`;
  const result = await db.query<{
    id: string;
    name: string;
    name_ar: string | null;
    phone: string | null;
    city: string | null;
    specialty: string | null;
    is_active: boolean;
    approval_status: string | null;
    owner_user_id: string | null;
    owner_name: string | null;
    owner_phone: string | null;
    doctors: string | number;
    created_at: string;
  }>(
    `SELECT c.id, c.name, c.name_ar, c.phone, c.city, c.specialty, c.is_active, c.approval_status,
            c.owner_user_id, c.created_at,
            trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) AS owner_name,
            u.phone AS owner_phone,
            (SELECT count(*) FROM doctors d WHERE d.clinic_id = c.id) AS doctors
     FROM clinics c
     LEFT JOIN users u ON u.id = c.owner_user_id
     WHERE $1 = '' OR c.name ILIKE $2 OR c.name_ar ILIKE $2 OR coalesce(c.phone, '') ILIKE $2 OR coalesce(c.city, '') ILIKE $2
     ORDER BY c.created_at DESC`,
    [q, like],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name_ar || row.name,
    phone: row.phone,
    city: row.city,
    specialty: row.specialty,
    isActive: row.is_active,
    approvalStatus: row.approval_status === 'pending' ? 'pending' : 'approved',
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name?.trim() || null,
    ownerPhone: row.owner_phone,
    doctors: Number(row.doctors),
    createdAt: iso(row.created_at),
  }));
}

async function setClinicActive(clinicId: string, active: boolean) {
  const row = await db.query<{ id: string }>('SELECT id FROM clinics WHERE id = $1', [clinicId]);
  if (!row.rows[0]) throw httpError(404, 'NOT_FOUND', 'العيادة غير موجودة');
  await db.query('UPDATE clinics SET is_active = $2, updated_at = now() WHERE id = $1', [clinicId, active]);
  await db.query('UPDATE doctors SET is_active = $2, updated_at = now() WHERE clinic_id = $1', [clinicId, active]);
  return { id: clinicId, isActive: active };
}

async function approveClinicOps(clinicId: string) {
  const row = await db.query<{ id: string }>('SELECT id FROM clinics WHERE id = $1', [clinicId]);
  if (!row.rows[0]) throw httpError(404, 'NOT_FOUND', 'العيادة غير موجودة');
  await db.query(
    `UPDATE clinics SET approval_status = 'approved', is_active = true, updated_at = now() WHERE id = $1`,
    [clinicId],
  );
  return { id: clinicId, approvalStatus: 'approved', isActive: true };
}

async function listUsers(query?: string) {
  const q = query?.trim() ?? '';
  const like = `%${q}%`;
  const users = await db.query<{
    id: string;
    email: string | null;
    phone: string | null;
    first_name: string;
    last_name: string;
    is_platform_admin: boolean;
    is_blocked: boolean;
    platform_role: string | null;
    created_at: string;
  }>(
    `SELECT id, email, phone, first_name, last_name, is_platform_admin, is_blocked, platform_role, created_at
     FROM users
     WHERE $1 = '' OR first_name ILIKE $2 OR last_name ILIKE $2 OR coalesce(phone, '') ILIKE $2 OR coalesce(email, '') ILIKE $2
     ORDER BY created_at DESC
     LIMIT 300`,
    [q, like],
  );
  const memberships = await db.query<{ user_id: string; role: string; clinic_id: string }>(
    'SELECT user_id, role, clinic_id FROM memberships',
  );
  const byUser = new Map<string, { role: string; clinicId: string }[]>();
  for (const item of memberships.rows) {
    const list = byUser.get(item.user_id) ?? [];
    list.push({ role: item.role, clinicId: item.clinic_id });
    byUser.set(item.user_id, list);
  }
  return users.rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    phone: row.phone,
    isPlatformAdmin: row.is_platform_admin || row.platform_role === 'super_admin' || row.platform_role === 'admin',
    platformRole: row.platform_role === 'admin' ? 'admin' : row.is_platform_admin || row.platform_role === 'super_admin' ? 'super_admin' : null,
    isBlocked: row.is_blocked,
    roles: [...new Set((byUser.get(row.id) ?? []).map((item) => item.role))],
    createdAt: iso(row.created_at),
  }));
}

async function setUserBlocked(actorId: string, userId: string, blocked: boolean) {
  if (actorId === userId) throw httpError(400, 'SELF', 'ماينفعش توقف حسابك');
  const row = await db.query<{ id: string; is_platform_admin: boolean }>(
    'SELECT id, is_platform_admin FROM users WHERE id = $1',
    [userId],
  );
  if (!row.rows[0]) throw httpError(404, 'NOT_FOUND', 'المستخدم غير موجود');
  if (row.rows[0].is_platform_admin) throw httpError(403, 'FORBIDDEN', 'حساب إدارة المنصة ماينفعش يتوقف من هنا');
  await db.query('UPDATE users SET is_blocked = $2, updated_at = now() WHERE id = $1', [userId, blocked]);
  if (blocked) await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  return { id: userId, isBlocked: blocked };
}

async function listPatientsOps(query?: string) {
  const q = query?.trim() ?? '';
  const like = `%${q}%`;
  const result = await db.query<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    gender: string | null;
    is_active: boolean;
    clinic_id: string;
    clinic_name: string | null;
    created_at: string;
  }>(
    `SELECT p.id, p.first_name, p.last_name, p.phone, p.gender, p.is_active, p.clinic_id, p.created_at,
            coalesce(c.name_ar, c.name) AS clinic_name
     FROM patients p
     JOIN clinics c ON c.id = p.clinic_id
     WHERE $1 = '' OR p.first_name ILIKE $2 OR p.last_name ILIKE $2 OR coalesce(p.phone, '') ILIKE $2 OR coalesce(c.name_ar, c.name) ILIKE $2
     ORDER BY p.created_at DESC
     LIMIT 400`,
    [q, like],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone,
    gender: row.gender,
    isActive: row.is_active,
    clinicId: row.clinic_id,
    clinicName: row.clinic_name,
    createdAt: iso(row.created_at),
  }));
}

async function listAppointmentsOps(filters: { clinicId?: string; status?: string; query?: string }) {
  const result = await db.query<{
    id: string;
    clinic_id: string;
    clinic_name: string | null;
    doctor_name: string;
    patient_name: string;
    patient_phone: string | null;
    scheduled_at: string;
    status: string;
    reason: string | null;
  }>(
    `SELECT a.id, a.clinic_id, c.name_ar AS clinic_name, a.status, a.scheduled_at, a.reason,
            trim(concat(d.first_name, ' ', d.last_name)) AS doctor_name,
            trim(concat(p.first_name, ' ', p.last_name)) AS patient_name,
            p.phone AS patient_phone
     FROM appointments a
     JOIN clinics c ON c.id = a.clinic_id
     JOIN doctors d ON d.id = a.doctor_id
     JOIN patients p ON p.id = a.patient_id
     WHERE ($1 = '' OR a.clinic_id = $1)
       AND ($2 = '' OR a.status = $2)
     ORDER BY a.scheduled_at DESC
     LIMIT 250`,
    [filters.clinicId?.trim() ?? '', filters.status?.trim() ?? ''],
  );
  const q = filters.query?.trim().toLowerCase() ?? '';
  return result.rows
    .map((row) => ({
      id: row.id,
      clinicId: row.clinic_id,
      clinicName: row.clinic_name,
      doctorName: row.doctor_name,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      scheduledAt: iso(row.scheduled_at),
      status: row.status,
      reason: row.reason,
    }))
    .filter((row) => {
      if (!q) return true;
      return [row.patientName, row.doctorName, row.clinicName, row.patientPhone].some((value) =>
        (value ?? '').toLowerCase().includes(q),
      );
    });
}

async function cancelAppointmentOps(id: string) {
  const row = await db.query<{ id: string; status: string }>('SELECT id, status FROM appointments WHERE id = $1', [id]);
  if (!row.rows[0]) throw httpError(404, 'NOT_FOUND', 'الحجز غير موجود');
  if (row.rows[0].status === 'completed') throw httpError(400, 'INVALID_STATUS', 'الحجز المكتمل ماينفعش يتلغي');
  await db.query(
    `UPDATE appointments SET status = 'cancelled', updated_at = now() WHERE id = $1`,
    [id],
  );
  return { id, status: 'cancelled' };
}

async function listDoctorsOps(query?: string) {
  const q = query?.trim() ?? '';
  const like = `%${q}%`;
  const result = await db.query<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    specialty: string;
    is_active: boolean;
    clinic_id: string;
    clinic_name: string | null;
    offers_home_visits: boolean;
  }>(
    `SELECT d.id, d.first_name, d.last_name, d.phone, d.specialty, d.is_active, d.clinic_id, d.offers_home_visits,
            c.name_ar AS clinic_name
     FROM doctors d
     JOIN clinics c ON c.id = d.clinic_id
     WHERE $1 = '' OR d.first_name ILIKE $2 OR d.last_name ILIKE $2 OR d.specialty ILIKE $2 OR coalesce(d.phone, '') ILIKE $2
     ORDER BY d.last_name, d.first_name
     LIMIT 300`,
    [q, like],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone,
    specialty: row.specialty,
    isActive: row.is_active,
    clinicId: row.clinic_id,
    clinicName: row.clinic_name,
    offersHomeVisits: row.offers_home_visits,
  }));
}

async function setDoctorActiveOps(id: string, active: boolean) {
  const result = await db.query<{ id: string }>(
    'UPDATE doctors SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING id',
    [id, active],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'الدكتور غير موجود');
  return { id, isActive: active };
}

async function listNursesOps() {
  const result = await db.query<{
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    verification: string;
    created_at: string;
  }>('SELECT user_id, first_name, last_name, phone, verification, created_at FROM nurse_profiles ORDER BY created_at DESC');
  return result.rows.map((row) => ({
    userId: row.user_id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone,
    verification: row.verification,
    createdAt: iso(row.created_at),
  }));
}

async function setNurseVerificationOps(userId: string, verification: string) {
  if (!['pending', 'approved', 'rejected'].includes(verification)) {
    throw httpError(400, 'VALIDATION_ERROR', 'حالة التحقق غير صحيحة');
  }
  const result = await db.query<{ user_id: string }>(
    'UPDATE nurse_profiles SET verification = $2 WHERE user_id = $1 RETURNING user_id',
    [userId, verification],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'الممرض غير موجود');
  return { userId, verification };
}

async function listNursingOps() {
  const result = await db.query(
    `SELECT id, patient_name, patient_phone, service_id, address, scheduled_at, status, price, nurse_name, created_at
     FROM nursing_requests
     ORDER BY created_at DESC
     LIMIT 200`,
  );
  return result.rows;
}

async function listHomeVisitsOps() {
  const result = await db.query(
    `SELECT id, patient_name, patient_phone, specialty, address, scheduled_at, status, price, doctor_name, created_at
     FROM home_visit_requests
     ORDER BY created_at DESC
     LIMIT 200`,
  );
  return result.rows;
}

function sendError(res: express.Response, error: unknown, fallback: string) {
  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
  const message = error instanceof Error ? error.message : fallback;
  res.status(Number.isFinite(status) ? status : 500).json({ code, message });
}

export const opsRouter = express.Router();

opsRouter.post('/login', async (req, res) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!phone || !password) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'رقم الموبايل وكلمة المرور مطلوبين' });
    return;
  }
  try {
    const session = await login(phone, password);
    const role = await userPlatformRole(session.user.id);
    if (!role) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'الحساب ده مش حساب إدارة المنصة' });
      return;
    }
    res.json({
      success: true,
      data: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: session.user.id,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          phone: session.user.phone,
          role,
        },
      },
    });
  } catch (error) {
    sendError(res, error, 'تعذر تسجيل الدخول');
  }
});

opsRouter.use(async (req, res, next) => {
  try {
    const token = bearerToken(req.header('authorization'));
    if (!token) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }
    const user = await userFromAccessToken(token);
    const role = await userPlatformRole(user.id);
    if (!role) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'الحساب ده مش حساب إدارة المنصة' });
      return;
    }
    res.locals.opsUserId = user.id;
    res.locals.opsRole = role;
    next();
  } catch (error) {
    sendError(res, error, 'Not authenticated');
  }
});

function requireSuper(res: express.Response): boolean {
  if (res.locals.opsRole !== 'super_admin') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'الإجراء ده للسوبر أدمن فقط' });
    return false;
  }
  return true;
}

opsRouter.get('/me', async (_req, res) => {
  res.json({
    success: true,
    data: {
      id: res.locals.opsUserId,
      role: res.locals.opsRole,
    },
  });
});

opsRouter.get('/overview', async (_req, res) => {
  try {
    res.json({ success: true, data: await overview() });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل النظرة العامة');
  }
});

opsRouter.get('/clinics', async (req, res) => {
  try {
    res.json({ success: true, data: await listClinics(typeof req.query.q === 'string' ? req.query.q : '') });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل العيادات');
  }
});

opsRouter.post('/clinics/:id/activate', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await setClinicActive(req.params.id, true) });
  } catch (error) {
    sendError(res, error, 'تعذر تفعيل العيادة');
  }
});

opsRouter.post('/clinics/:id/deactivate', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await setClinicActive(req.params.id, false) });
  } catch (error) {
    sendError(res, error, 'تعذر إيقاف العيادة');
  }
});

opsRouter.post('/clinics/:id/approve', async (req, res) => {
  try {
    res.json({ success: true, data: await approveClinicOps(req.params.id) });
  } catch (error) {
    sendError(res, error, 'تعذر اعتماد العيادة');
  }
});

opsRouter.get('/users', async (req, res) => {
  try {
    res.json({ success: true, data: await listUsers(typeof req.query.q === 'string' ? req.query.q : '') });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل المستخدمين');
  }
});

opsRouter.get('/patients', async (req, res) => {
  try {
    res.json({ success: true, data: await listPatientsOps(typeof req.query.q === 'string' ? req.query.q : '') });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل المرضى');
  }
});

opsRouter.post('/users/:id/block', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await setUserBlocked(String(res.locals.opsUserId), req.params.id, true) });
  } catch (error) {
    sendError(res, error, 'تعذر إيقاف الحساب');
  }
});

opsRouter.post('/users/:id/unblock', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await setUserBlocked(String(res.locals.opsUserId), req.params.id, false) });
  } catch (error) {
    sendError(res, error, 'تعذر فتح الحساب');
  }
});

opsRouter.get('/appointments', async (req, res) => {
  try {
    res.json({
      success: true,
      data: await listAppointmentsOps({
        clinicId: typeof req.query.clinicId === 'string' ? req.query.clinicId : '',
        status: typeof req.query.status === 'string' ? req.query.status : '',
        query: typeof req.query.q === 'string' ? req.query.q : '',
      }),
    });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل الحجوزات');
  }
});

opsRouter.post('/appointments/:id/cancel', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await cancelAppointmentOps(req.params.id) });
  } catch (error) {
    sendError(res, error, 'تعذر إلغاء الحجز');
  }
});

opsRouter.get('/doctors', async (req, res) => {
  try {
    res.json({ success: true, data: await listDoctorsOps(typeof req.query.q === 'string' ? req.query.q : '') });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل الدكاترة');
  }
});

opsRouter.post('/doctors/:id/activate', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await setDoctorActiveOps(req.params.id, true) });
  } catch (error) {
    sendError(res, error, 'تعذر تفعيل الدكتور');
  }
});

opsRouter.post('/doctors/:id/deactivate', async (req, res) => {
  if (!requireSuper(res)) return;
  try {
    res.json({ success: true, data: await setDoctorActiveOps(req.params.id, false) });
  } catch (error) {
    sendError(res, error, 'تعذر إيقاف الدكتور');
  }
});

opsRouter.get('/nurses', async (_req, res) => {
  try {
    res.json({ success: true, data: await listNursesOps() });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل التمريض');
  }
});

opsRouter.post('/nurses/:id/verify', async (req, res) => {
  const verification = typeof req.body?.verification === 'string' ? req.body.verification : '';
  try {
    res.json({ success: true, data: await setNurseVerificationOps(req.params.id, verification) });
  } catch (error) {
    sendError(res, error, 'تعذر تحديث حالة الممرض');
  }
});

opsRouter.get('/nursing', async (_req, res) => {
  try {
    res.json({ success: true, data: await listNursingOps() });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل طلبات التمريض');
  }
});

opsRouter.get('/home-visits', async (_req, res) => {
  try {
    res.json({ success: true, data: await listHomeVisitsOps() });
  } catch (error) {
    sendError(res, error, 'تعذر تحميل الزيارات المنزلية');
  }
});
