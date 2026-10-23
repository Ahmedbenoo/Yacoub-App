import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { db } from './db.js';
import { ensurePatientForAccount } from './patients.js';
import { deliverAppWhatsApp } from './whatsapp.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 30;

export type PublicUser = {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  roles: string[];
  locale: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
};

type UserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  first_name: string;
  last_name: string;
  locale: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  avatar_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  clinic_id: string;
  role: string;
};

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return secret;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

type SeedUser = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  locale: string;
  memberships: { clinicId: string; role: string }[];
};

const SEED_USERS: SeedUser[] = [
  {
    id: 'user-doctor-001',
    email: 'doctor@clinic.com',
    phone: '+201005188116',
    firstName: 'Eslam',
    lastName: 'Shaban',
    locale: 'en',
    memberships: [{ clinicId: 'clinic-001', role: 'doctor' }],
  },
  {
    id: 'user-doctor-007',
    email: 'obgyn@clinic.com',
    phone: '+201000000016',
    firstName: 'Mariam',
    lastName: 'Saleh',
    locale: 'ar',
    memberships: [{ clinicId: 'clinic-001', role: 'doctor' }],
  },
  {
    id: 'user-patient-001',
    email: 'patient@clinic.com',
    phone: '+201000000001',
    firstName: 'Ahmed',
    lastName: 'Fathy',
    locale: 'en',
    memberships: [{ clinicId: 'clinic-001', role: 'patient' }],
  },
  {
    id: 'user-admin-001',
    email: 'admin@clinic.com',
    phone: '+201000000020',
    firstName: 'Omar',
    lastName: 'Ali',
    locale: 'en',
    memberships: [
      { clinicId: 'clinic-001', role: 'admin' },
      { clinicId: 'clinic-003', role: 'admin' },
      { clinicId: 'clinic-002', role: 'admin' },
    ],
  },
  {
    id: 'user-secretary-001',
    email: 'secretary@clinic.com',
    phone: '+201000000099',
    firstName: 'Mona',
    lastName: 'Saeed',
    locale: 'en',
    memberships: [{ clinicId: 'clinic-001', role: 'secretary' }],
  },
  {
    id: 'user-multi-001',
    email: 'multi@clinic.com',
    phone: '+201000000030',
    firstName: 'Layla',
    lastName: 'Ibrahim',
    locale: 'en',
    memberships: [
      { clinicId: 'clinic-001', role: 'doctor' },
      { clinicId: 'clinic-003', role: 'doctor' },
      { clinicId: 'clinic-002', role: 'doctor' },
      { clinicId: 'clinic-001', role: 'admin' },
      { clinicId: 'clinic-003', role: 'admin' },
      { clinicId: 'clinic-002', role: 'admin' },
    ],
  },
  {
    id: 'user-nursing-admin-001',
    email: 'nursing-admin@clinsync.com',
    phone: '+201000000201',
    firstName: 'إدارة',
    lastName: 'التمريض',
    locale: 'ar',
    memberships: [{ clinicId: 'clinic-001', role: 'nursing_admin' }],
  },
  {
    id: 'user-nurse-001',
    email: 'nurse@clinsync.com',
    phone: '+201000000202',
    firstName: 'منى',
    lastName: 'حسن',
    locale: 'ar',
    memberships: [{ clinicId: 'clinic-001', role: 'nurse' }],
  },
  {
    id: 'user-nurse-002',
    email: 'nurse.pending@clinsync.com',
    phone: '+201000000203',
    firstName: 'أحمد',
    lastName: 'ناصر',
    locale: 'ar',
    memberships: [{ clinicId: 'clinic-001', role: 'nurse' }],
  },
];

export async function releasePersonalPhone(): Promise<void> {
  const testPhone = '+201000000001';
  const like = '%1092313486%';
  const clash = await db.query<{ id: string }>('SELECT id FROM users WHERE phone = $1 AND phone NOT LIKE $2', [
    testPhone,
    like,
  ]);
  if (clash.rows.length > 0) return;
  const tables = [
    ['users', 'phone'],
    ['patients', 'phone'],
    ['clinics', 'phone'],
    ['doctors', 'phone'],
    ['whatsapp_messages', 'to_phone'],
    ['staff_whatsapp', 'to_phone'],
    ['nursing_requests', 'patient_phone'],
    ['nurse_profiles', 'phone'],
    ['home_visit_requests', 'patient_phone'],
  ] as const;
  for (const [table, column] of tables) {
    await db.query(`UPDATE ${table} SET ${column} = $1 WHERE ${column} LIKE $2`, [testPhone, like]);
  }
}

export async function seedAdmin(): Promise<void> {
  const clinics = [
    ['clinic-001', 'Clinsync Main Clinic', 'العيادة الرئيسية'],
    ['clinic-003', 'North Branch', 'الفرع الشمالي'],
    ['clinic-002', 'Downtown Branch', 'فرع وسط البلد'],
  ];
  for (const [id, name, nameAr] of clinics) {
    await db.query(
      `INSERT INTO clinics (id, name, name_ar)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [id, name, nameAr],
    );
  }

  await db.query(`UPDATE users SET phone = $2 WHERE id = $1 AND phone = $3`, [
    'user-admin-001',
    '+201000000020',
    '+201000000001',
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);
  for (const user of SEED_USERS) {
    const existing = await db.query<{ id: string }>('SELECT id FROM users WHERE id = $1', [user.id]);
    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO users (
           id, email, phone, password_hash, first_name, last_name, locale,
           is_email_verified, is_phone_verified
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)`,
        [user.id, user.email, user.phone, passwordHash, user.firstName, user.lastName, user.locale],
      );
    }

    for (const membership of user.memberships) {
      await db.query(
        `INSERT INTO memberships (id, user_id, clinic_id, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, clinic_id, role) DO NOTHING`,
        [`membership-${user.id}-${membership.clinicId}-${membership.role}`, user.id, membership.clinicId, membership.role],
      );
    }
  }
}

async function membershipsFor(userId: string): Promise<MembershipRow[]> {
  const result = await db.query<MembershipRow>(
    'SELECT clinic_id, role FROM memberships WHERE user_id = $1 ORDER BY created_at',
    [userId],
  );
  return result.rows;
}

function toPublicUser(row: UserRow, memberships: MembershipRow[]): PublicUser {
  const clinicId = memberships[0]?.clinic_id ?? '';
  const roles = memberships.length > 0 ? [...new Set(memberships.map((item) => item.role))] : ['patient'];

  return {
    id: row.id,
    email: row.email ?? '',
    phone: row.phone ?? undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url ?? undefined,
    signatureUrl: row.signature_url ?? undefined,
    stampUrl: row.stamp_url ?? undefined,
    roles,
    locale: row.locale,
    isEmailVerified: row.is_email_verified,
    isPhoneVerified: row.is_phone_verified,
    clinicId,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('20') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 10) return `+20${digits.slice(1)}`;
  if (digits.startsWith('1') && digits.length === 10) return `+20${digits}`;
  return `+${digits}`;
}

function phoneToPatientEmail(phone: string): string {
  return `${normalizePhone(phone).replace(/\D/g, '')}@patient.clinsync`;
}

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

async function findByIdentifier(identifier: string): Promise<UserRow | undefined> {
  const trimmed = identifier.trim();
  const phone = trimmed.includes('@') ? '' : normalizePhone(trimmed);
  const result = await db.query<UserRow>(
    `SELECT * FROM users
     WHERE lower(email) = lower($1) OR phone = $1 OR ($2 <> '' AND phone = $2)
     LIMIT 1`,
    [trimmed, phone],
  );
  return result.rows[0];
}

export async function sessionForUser(userId: string) {
  const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'User not found');
  return issueSession(row);
}

async function issueSession(row: UserRow) {
  const memberships = await membershipsFor(row.id);
  const user = toPublicUser(row, memberships);
  const accessToken = jwt.sign({ sub: user.id, clinicId: user.clinicId }, jwtSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  const refreshToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), user.id, hashToken(refreshToken), expiresAt],
  );

  return { user, accessToken, refreshToken };
}

export async function login(identifier: string, password: string) {
  const row = await findByIdentifier(identifier);
  const passwordOk = row ? await bcrypt.compare(password, row.password_hash) : false;
  if (!row || !passwordOk) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  return issueSession(row);
}

export async function refreshSession(refreshToken: string) {
  const stored = await db.query<{ id: string; user_id: string; expires_at: string }>(
    `SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = $1`,
    [hashToken(refreshToken)],
  );
  const row = stored.rows[0];
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    throw Object.assign(new Error('Session expired. Please sign in again.'), {
      status: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
  }

  const userResult = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [row.user_id]);
  const userRow = userResult.rows[0];
  if (!userRow) {
    throw Object.assign(new Error('Not authenticated'), { status: 401, code: 'UNAUTHORIZED' });
  }

  await db.query('DELETE FROM refresh_tokens WHERE id = $1', [row.id]);
  return issueSession(userRow);
}

export async function userFromAccessToken(token: string): Promise<PublicUser> {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, jwtSecret()) as jwt.JwtPayload;
  } catch {
    throw Object.assign(new Error('Not authenticated'), { status: 401, code: 'UNAUTHORIZED' });
  }

  const userId = typeof payload.sub === 'string' ? payload.sub : '';
  const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  if (!row) {
    throw Object.assign(new Error('Not authenticated'), { status: 401, code: 'UNAUTHORIZED' });
  }

  return toPublicUser(row, await membershipsFor(row.id));
}

export async function logout(userId: string): Promise<void> {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

async function clinicForNewPatient(requested?: string): Promise<string | null> {
  const clinicId = requested?.trim();
  if (clinicId) {
    const clinic = await db.query<{ id: string }>('SELECT id FROM clinics WHERE id = $1', [clinicId]);
    if (!clinic.rows[0]) throw httpError(404, 'NOT_FOUND', 'العيادة غير موجودة');
    return clinicId;
  }
  const demo = await db.query<{ id: string }>(`SELECT id FROM clinics WHERE id = 'clinic-001'`);
  return demo.rows[0]?.id ?? null;
}

export async function ensureBookingPatient(userId: string, clinicId: string): Promise<void> {
  const memberships = await membershipsFor(userId);
  if (memberships.some((item) => item.clinic_id === clinicId && item.role === 'patient')) return;
  if (memberships.some((item) => item.role !== 'patient')) return;

  const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  if (!row) return;

  await attachPatientToClinic({
    userId,
    clinicId,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
  });
}

async function attachPatientToClinic(input: {
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}) {
  await db.query(
    `INSERT INTO memberships (id, user_id, clinic_id, role)
     VALUES ($1, $2, $3, 'patient')
     ON CONFLICT (user_id, clinic_id, role) DO NOTHING`,
    [`membership-${input.userId}-${input.clinicId}-patient`, input.userId, input.clinicId],
  );
  await ensurePatientForAccount(input);
}

export async function registerPatient(input: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  clinicId?: string;
}) {
  const phone = normalizePhone(input.phone);
  if (!/^\+\d{10,15}$/.test(phone)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Phone number is invalid');
  }
  const clinicId = await clinicForNewPatient(input.clinicId);
  if (!clinicId) throw httpError(400, 'VALIDATION_ERROR', 'اختار العيادة الأول عشان الحساب يتربط بيها');

  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = `user-${randomUUID()}`;
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = phoneToPatientEmail(phone);
  try {
    await db.query(
      `INSERT INTO users (
         id, email, phone, password_hash, first_name, last_name, locale, is_phone_verified
       ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', true)`,
      [id, email, phone, passwordHash, firstName, lastName],
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
    throw error;
  }

  await attachPatientToClinic({ userId: id, clinicId, firstName, lastName, email, phone });

  const created = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return issueSession(created.rows[0]);
}

export async function loginOrRegisterByPhone(input: {
  phone: string;
  password: string;
  firstName?: string;
  lastName?: string;
  clinicId?: string;
}) {
  const phone = normalizePhone(input.phone);
  const row = await assertPatientPhone(phone);
  if (row) {
    const passwordOk = await bcrypt.compare(input.password, row.password_hash);
    if (!passwordOk) {
      throw httpError(401, 'INVALID_CREDENTIALS', 'الرقم ده مسجل قبل كده، وكلمة المرور غير مطابقة');
    }
    const clinicId = await clinicForNewPatient(input.clinicId);
    if (clinicId) {
      await attachPatientToClinic({
        userId: row.id,
        clinicId,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email ?? phoneToPatientEmail(phone),
        phone,
      });
    }
    return issueSession(row);
  }

  const firstName = input.firstName?.trim() ?? '';
  const lastName = input.lastName?.trim() ?? '';
  if (firstName.length < 2 || lastName.length < 2) {
    throw httpError(400, 'NAME_REQUIRED', 'Name is required to create an account');
  }

  return registerPatient({ firstName, lastName, phone, password: input.password, clinicId: input.clinicId });
}

function hashesMatch(stored: string, next: string): boolean {
  const left = Buffer.from(stored);
  const right = Buffer.from(next);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function assertPatientPhone(phone: string): Promise<UserRow | null> {
  const existing = await db.query<UserRow>('SELECT * FROM users WHERE phone = $1', [phone]);
  const row = existing.rows[0] ?? null;
  if (!row) return null;
  const staff = await db.query<{ role: string }>(
    `SELECT m.role
     FROM memberships m
     JOIN clinics c ON c.id = m.clinic_id
     WHERE m.user_id = $1 AND m.role <> 'patient' AND c.is_active = true`,
    [row.id],
  );
  if (staff.rows.length > 0) {
    throw httpError(403, 'STAFF_USE_PASSWORD', 'الحساب ده للعيادة. ادخل برقم الموبايل وكلمة المرور.');
  }
  return row;
}

export async function requestLoginOtp(phoneInput: string, intent: 'login' | 'signup'): Promise<{ message: string }> {
  const phone = normalizePhone(phoneInput);
  if (!/^\+\d{10,15}$/.test(phone)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Phone number is invalid');
  }

  const user = await assertPatientPhone(phone);
  if (!user && intent === 'login') {
    throw httpError(404, 'PHONE_NOT_FOUND', 'مفيش حساب على الرقم ده. اعمل حساب الأول.');
  }

  const otp = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.query('DELETE FROM login_otps WHERE phone = $1', [phone]);
  await db.query(
    `INSERT INTO login_otps (id, phone, otp_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), phone, hashToken(otp), expiresAt],
  );
  const sent = await deliverAppWhatsApp(`رمز الدخول في يعقوب: ${otp}`, phone);
  if (!sent) {
    await db.query('DELETE FROM login_otps WHERE phone = $1', [phone]);
    throw httpError(503, 'OTP_NOT_SENT', 'تعذر إرسال الرمز على واتساب');
  }
  return { message: 'Verification code sent on WhatsApp' };
}

export async function verifyLoginOtp(input: {
  phone: string;
  otp: string;
  firstName?: string;
  lastName?: string;
  clinicId?: string;
}) {
  const phone = normalizePhone(input.phone);
  if (!/^\+\d{10,15}$/.test(phone)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Phone number is invalid');
  }

  const stored = await db.query<{ otp_hash: string; expires_at: string }>(
    `SELECT otp_hash, expires_at FROM login_otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  const code = stored.rows[0];
  if (!code || new Date(code.expires_at).getTime() <= Date.now() || !hashesMatch(code.otp_hash, hashToken(input.otp))) {
    throw httpError(400, 'INVALID_OTP', 'الكود غير صحيح أو انتهت صلاحيته');
  }

  const existing = await assertPatientPhone(phone);
  if (existing) {
    await db.query('DELETE FROM login_otps WHERE phone = $1', [phone]);
    const clinicId = await clinicForNewPatient(input.clinicId);
    if (clinicId) {
      await attachPatientToClinic({
        userId: existing.id,
        clinicId,
        firstName: existing.first_name,
        lastName: existing.last_name,
        email: existing.email ?? phoneToPatientEmail(phone),
        phone,
      });
    }
    return issueSession(existing);
  }

  const firstName = input.firstName?.trim() ?? '';
  const lastName = input.lastName?.trim() ?? '';
  if (firstName.length < 2 || lastName.length < 2) {
    throw httpError(400, 'NAME_REQUIRED', 'اكتب الاسم الأول واسم العائلة');
  }

  const clinicId = await clinicForNewPatient(input.clinicId);
  const id = `user-${randomUUID()}`;
  const email = phoneToPatientEmail(phone);
  const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
  try {
    await db.query(
      `INSERT INTO users (
         id, email, phone, password_hash, first_name, last_name, locale, is_phone_verified
       ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', true)`,
      [id, email, phone, passwordHash, firstName, lastName],
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
    throw error;
  }

  if (clinicId) {
    await attachPatientToClinic({ userId: id, clinicId, firstName, lastName, email, phone });
  }
  await db.query('DELETE FROM login_otps WHERE phone = $1', [phone]);
  const created = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return issueSession(created.rows[0]);
}

export async function updateProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    signatureUrl?: string;
    stampUrl?: string;
  },
): Promise<PublicUser> {
  const current = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  const row = current.rows[0];
  if (!row) throw httpError(401, 'UNAUTHORIZED', 'Not authenticated');

  const phone = input.phone?.trim() ? normalizePhone(input.phone) : null;
  const textOrCurrent = (value: string | undefined, currentValue: string | null) => {
    if (value === undefined) return currentValue;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  try {
    await db.query(
      `UPDATE users
       SET first_name = $2,
           last_name = $3,
           phone = $4,
           avatar_url = $5,
           signature_url = $6,
           stamp_url = $7,
           updated_at = now()
       WHERE id = $1`,
      [
        userId,
        input.firstName.trim(),
        input.lastName.trim(),
        phone,
        textOrCurrent(input.avatarUrl, row.avatar_url),
        textOrCurrent(input.signatureUrl, row.signature_url),
        textOrCurrent(input.stampUrl, row.stamp_url),
      ],
    );
    if (input.avatarUrl !== undefined) {
      const avatarUrl = textOrCurrent(input.avatarUrl, row.avatar_url);
      await db.query(
        `UPDATE doctors SET avatar_url = $2, updated_at = now() WHERE id = $1 OR user_id = $1`,
        [userId, avatarUrl],
      );
    }
  } catch (error) {
    if (isUniqueViolation(error)) throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
    throw error;
  }

  const updated = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  return toPublicUser(updated.rows[0], await membershipsFor(userId));
}

export async function changePassword(userId: string, currentPassword: string, nextPassword: string): Promise<void> {
  const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  if (!row) throw httpError(401, 'UNAUTHORIZED', 'Not authenticated');

  const passwordOk = await bcrypt.compare(currentPassword, row.password_hash);
  if (!passwordOk) throw httpError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');

  await db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
    userId,
    await bcrypt.hash(nextPassword, 10),
  ]);
}

async function storeResetOtp(phone: string): Promise<void> {
  const user = await findByIdentifier(phone);
  if (!user?.email || !user.phone) return;

  const otp = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.query('DELETE FROM password_resets WHERE lower(email) = lower($1)', [user.email]);
  await db.query(
    `INSERT INTO password_resets (id, email, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), user.email.toLowerCase(), hashToken(otp), expiresAt],
  );
  const sent = await deliverAppWhatsApp(`رمز التحقق في يعقوب: ${otp}`, user.phone);
  if (!sent) throw httpError(503, 'OTP_NOT_SENT', 'تعذر إرسال الرمز على واتساب');
}

export async function forgotPassword(phone: string): Promise<{ message: string }> {
  await storeResetOtp(phone);
  return { message: 'Verification code sent on WhatsApp' };
}

export async function resendOtp(phone: string): Promise<{ message: string }> {
  await storeResetOtp(phone);
  return { message: 'Verification code resent on WhatsApp' };
}

export async function verifyOtp(phone: string, otp: string): Promise<{ resetToken: string }> {
  const user = await findByIdentifier(phone);
  const stored = await db.query<{ id: string; otp_hash: string; expires_at: string }>(
    `SELECT id, otp_hash, expires_at
     FROM password_resets
     WHERE lower(email) = lower($1) AND reset_token_hash IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [user?.email ?? ''],
  );
  const row = stored.rows[0];
  if (!row || new Date(row.expires_at).getTime() <= Date.now() || row.otp_hash !== hashToken(otp)) {
    throw httpError(400, 'INVALID_OTP', 'Invalid verification code');
  }

  const resetToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.query(
    `UPDATE password_resets
     SET reset_token_hash = $2, expires_at = $3
     WHERE id = $1`,
    [row.id, hashToken(resetToken), expiresAt],
  );
  return { resetToken };
}

export async function resetPassword(phone: string, resetToken: string, password: string): Promise<{ message: string }> {
  const user = await findByIdentifier(phone);
  const stored = await db.query<{ id: string }>(
    `SELECT id FROM password_resets
     WHERE lower(email) = lower($1)
       AND reset_token_hash = $2
       AND expires_at > now()
     LIMIT 1`,
    [user?.email ?? '', hashToken(resetToken)],
  );
  if (!stored.rows[0]) {
    throw httpError(400, 'INVALID_RESET_TOKEN', 'Reset token is invalid or expired');
  }
  if (!user) throw httpError(404, 'USER_NOT_FOUND', 'No account found for this email');

  await db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
    user.id,
    await bcrypt.hash(password, 10),
  ]);
  await db.query('DELETE FROM password_resets WHERE lower(email) = lower($1)', [user.email]);
  await logout(user.id);
  return { message: 'Password reset successfully' };
}
