import { isEmailIdentifier, normalizePhone, phoneToPlaceholderEmail, phoneToStaffEmail } from '@/shared/lib/phone';
import { sleep } from '@/shared/lib/utils';
import { Locale, UserRole } from '@/shared/types/enums';
import type { AuthSession, User } from '@/shared/types/models';

import { NurseVerification } from '@/shared/types/enums';
import type { RegisterNursePayload } from '@/shared/types/models/nursing';

import { cloneSeed, resetArray } from './clone';
import { listAssignedClinicIds } from './clinics.mock';
import { insertNurseProfile } from './nursing.mock';
import { ensurePatientForUser, linkPatientFilesByPhone, syncPatientIdentity } from './patients.mock';

import type {
  BookingAuthPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  VerifyOtpPayload,
} from '@/shared/types/models';

const MOCK_CLINIC_ID = 'clinic-001';
const MOCK_OTP = '123456';

interface MockCredential {
  email: string;
  phone?: string;
  password: string;
  user: Omit<User, 'clinicId' | 'createdAt' | 'updatedAt'>;
}

const SEED_CREDENTIALS: MockCredential[] = [
  {
    email: 'doctor@clinic.com',
    phone: '+201005188116',
    password: 'password123',
    user: {
      id: 'user-doctor-001',
      email: 'doctor@clinic.com',
      phone: '+201005188116',
      firstName: 'Eslam',
      lastName: 'Shaban',
      avatarUrl: 'https://i.pravatar.cc/150?u=doctor@clinic.com',
      roles: [UserRole.DOCTOR],
      locale: Locale.EN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'obgyn@clinic.com',
    phone: '+201000000016',
    password: 'password123',
    user: {
      id: 'user-doctor-007',
      email: 'obgyn@clinic.com',
      phone: '+201000000016',
      firstName: 'Mariam',
      lastName: 'Saleh',
      roles: [UserRole.DOCTOR],
      locale: Locale.AR,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'patient@clinic.com',
    phone: '+201092313486',
    password: 'password123',
    user: {
      id: 'user-patient-001',
      email: 'patient@clinic.com',
      phone: '+201092313486',
      firstName: 'Ahmed',
      lastName: 'Fathy',
      roles: [UserRole.PATIENT],
      locale: Locale.EN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'admin@clinic.com',
    phone: '+201000000020',
    password: 'password123',
    user: {
      id: 'user-admin-001',
      email: 'admin@clinic.com',
      phone: '+201000000020',
      firstName: 'Omar',
      lastName: 'Ali',
      roles: [UserRole.ADMIN],
      locale: Locale.EN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'secretary@clinic.com',
    phone: '+201000000099',
    password: 'password123',
    user: {
      id: 'user-secretary-001',
      email: 'secretary@clinic.com',
      phone: '+201000000099',
      firstName: 'Mona',
      lastName: 'Saeed',
      roles: [UserRole.SECRETARY],
      locale: Locale.EN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'multi@clinic.com',
    phone: '+201000000030',
    password: 'password123',
    user: {
      id: 'user-multi-001',
      email: 'multi@clinic.com',
      phone: '+201000000030',
      firstName: 'Layla',
      lastName: 'Ibrahim',
      roles: [UserRole.DOCTOR, UserRole.ADMIN],
      locale: Locale.EN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'nursing-admin@clinsync.com',
    phone: '+201000000201',
    password: 'password123',
    user: {
      id: 'user-nursing-admin-001',
      email: 'nursing-admin@clinsync.com',
      phone: '+201000000201',
      firstName: 'إدارة',
      lastName: 'التمريض',
      roles: [UserRole.NURSING_ADMIN],
      locale: Locale.AR,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'nurse@clinsync.com',
    phone: '+201000000202',
    password: 'password123',
    user: {
      id: 'user-nurse-001',
      email: 'nurse@clinsync.com',
      phone: '+201000000202',
      firstName: 'منى',
      lastName: 'حسن',
      roles: [UserRole.NURSE],
      locale: Locale.AR,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
  {
    email: 'nurse.pending@clinsync.com',
    phone: '+201000000203',
    password: 'password123',
    user: {
      id: 'user-nurse-002',
      email: 'nurse.pending@clinsync.com',
      phone: '+201000000203',
      firstName: 'أحمد',
      lastName: 'ناصر',
      roles: [UserRole.NURSE],
      locale: Locale.AR,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  },
];

const MOCK_CREDENTIALS: MockCredential[] = cloneSeed(SEED_CREDENTIALS);

function findCredentialByIdentifier(identifier: string): MockCredential | undefined {
  const trimmed = identifier.trim();
  if (isEmailIdentifier(trimmed)) {
    return MOCK_CREDENTIALS.find((c) => c.email === trimmed.toLowerCase());
  }

  const phone = normalizePhone(trimmed);
  return MOCK_CREDENTIALS.find((c) => c.phone && normalizePhone(c.phone) === phone);
}

const mockSessions = new Map<string, AuthSession>();

export function resetMockAuthState() {
  resetArray(MOCK_CREDENTIALS, SEED_CREDENTIALS);
  mockSessions.clear();
}

function resolveUserClinicId(userId: string, clinicId?: string): string {
  if (clinicId) return clinicId;
  return listAssignedClinicIds(userId)[0] ?? MOCK_CLINIC_ID;
}

function buildUser(
  userData: Omit<User, 'clinicId' | 'createdAt' | 'updatedAt'>,
  clinicId?: string,
): User {
  const now = new Date().toISOString();
  return {
    ...userData,
    clinicId: resolveUserClinicId(userData.id, clinicId),
    createdAt: now,
    updatedAt: now,
  };
}

function buildSession(
  userData: Omit<User, 'clinicId' | 'createdAt' | 'updatedAt'>,
  clinicId?: string,
): AuthSession {
  const user = buildUser(userData, clinicId);

  const session: AuthSession = {
    user,
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
  };

  mockSessions.set(session.accessToken, session);
  return session;
}

function findUserIdFromMockToken(token: string, prefix: string): string | null {
  if (!token.startsWith(prefix)) return null;
  return token.slice(prefix.length);
}

function findCredentialByUserId(userId: string): MockCredential | undefined {
  return MOCK_CREDENTIALS.find((credential) => credential.user.id === userId);
}

const STAFF_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function randomAlphabetIndex(size: number) {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
    return values[0] % size;
  }
  return Math.floor(Math.random() * size);
}

export function generateUniqueStaffPassword(): string {
  const taken = new Set(MOCK_CREDENTIALS.map((credential) => credential.password));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let password = '';
    for (let index = 0; index < 10; index += 1) {
      password += STAFF_PASSWORD_ALPHABET[randomAlphabetIndex(STAFF_PASSWORD_ALPHABET.length)];
    }
    if (!taken.has(password)) return password;
  }
  return `${Date.now().toString(36)}${randomAlphabetIndex(9)}`;
}

export function createStaffCredential(input: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: UserRole.DOCTOR | UserRole.SECRETARY;
  clinicId: string;
}): { userId: string; email: string; phone: string; linkedExisting: boolean; password?: string } {
  const phone = normalizePhone(input.phone);
  const existing = findCredentialByIdentifier(phone);

  if (existing) {
    const isDoctor = existing.user.roles.includes(UserRole.DOCTOR);
    if (input.role !== UserRole.DOCTOR || !isDoctor) {
      throw {
        code: 'PHONE_EXISTS',
        message: 'An account with this phone already exists',
      };
    }

    return { userId: existing.user.id, email: existing.email, phone, linkedExisting: true };
  }

  const email = phoneToStaffEmail(phone, input.role === UserRole.SECRETARY ? 'secretary' : 'doctor');
  const password = input.password.trim() || generateUniqueStaffPassword();
  const id = `user-${input.role}-${Date.now()}`;
  const user = {
    id,
    email,
    phone,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roles: [input.role],
    locale: Locale.EN,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  MOCK_CREDENTIALS.push({
    email,
    phone,
    password,
    user,
  });

  return { userId: id, email, phone, password, linkedExisting: false };
}

export function createOwnerCredential(input: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  practices: boolean;
}): { userId: string; email: string } {
  const phone = normalizePhone(input.phone);
  if (findCredentialByIdentifier(phone)) {
    throw { code: 'PHONE_EXISTS', message: 'An account with this phone already exists' };
  }

  const email = phoneToStaffEmail(phone, 'owner');
  const id = `user-owner-${Date.now()}`;
  const user = {
    id,
    email,
    phone,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roles: input.practices ? [UserRole.ADMIN, UserRole.DOCTOR] : [UserRole.ADMIN],
    locale: Locale.AR,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  MOCK_CREDENTIALS.push({ email, phone, password: input.password, user });
  return { userId: id, email };
}

export function createNurseCredential(input: RegisterNursePayload): { userId: string; email: string } {
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  if (findCredentialByIdentifier(email) || findCredentialByIdentifier(phone)) {
    throw { code: 'ACCOUNT_EXISTS', message: 'An account with this email or phone already exists' };
  }

  const id = `user-nurse-${Date.now()}`;
  const user = {
    id,
    email,
    phone,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roles: [UserRole.NURSE],
    locale: Locale.AR,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  MOCK_CREDENTIALS.push({ email, phone, password: input.password, user });
  insertNurseProfile({
    userId: id,
    email,
    phone,
    firstName: user.firstName,
    lastName: user.lastName,
    proof: input.proof.trim(),
    verification: NurseVerification.PENDING,
    createdAt: new Date().toISOString(),
  });
  return { userId: id, email };
}

export function getMockDoctorBranding(userId: string): {
  signatureUrl?: string;
  stampUrl?: string;
} {
  const credential = findCredentialByUserId(userId);
  return {
    signatureUrl: credential?.user.signatureUrl,
    stampUrl: credential?.user.stampUrl,
  };
}

export function sessionForUser(userId: string, clinicId?: string): AuthSession {
  const credential = findCredentialByUserId(userId);
  if (!credential) {
    throw { code: 'USER_NOT_FOUND', message: 'Account was not created' };
  }
  return buildSession(credential.user, clinicId);
}

export const mockAuthService = {
  async login(data: LoginPayload): Promise<AuthSession> {
    await sleep(800);

    const match = findCredentialByIdentifier(data.identifier);
    if (!match || match.password !== data.password) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' };
    }

    return buildSession(match.user);
  },

  async register(data: RegisterPayload): Promise<AuthSession> {
    await sleep(1000);

    const phone = normalizePhone(data.phone);
    const existing = findCredentialByIdentifier(phone);
    if (existing) {
      throw { code: 'PHONE_EXISTS', message: 'An account with this phone already exists' };
    }

    const user = {
      id: `user-${Date.now()}`,
      email: phoneToPlaceholderEmail(phone),
      phone,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: [UserRole.PATIENT],
      locale: Locale.EN,
      isEmailVerified: false,
      isPhoneVerified: true,
    };

    MOCK_CREDENTIALS.push({
      email: user.email,
      phone,
      password: data.password,
      user,
    });

    const linked = linkPatientFilesByPhone(user.id, phone);
    if (!linked) {
      ensurePatientForUser({ ...user, clinicId: MOCK_CLINIC_ID });
    }
    return buildSession(user);
  },

  async registerNurse(data: RegisterNursePayload): Promise<AuthSession> {
    await sleep(800);
    const account = createNurseCredential(data);
    return sessionForUser(account.userId);
  },

  async loginOrRegisterByPhone(data: BookingAuthPayload): Promise<AuthSession> {
    await sleep(800);

    const phone = normalizePhone(data.phone);
    const existing = findCredentialByIdentifier(phone);

    if (existing) {
      if (existing.password !== data.password) {
        throw { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' };
      }
      return buildSession(existing.user);
    }

    const firstName = data.firstName?.trim() ?? '';
    const lastName = data.lastName?.trim() ?? '';
    if (firstName.length < 2 || lastName.length < 2) {
      throw { code: 'NAME_REQUIRED', message: 'Name is required to create an account' };
    }

    return mockAuthService.register({
      firstName,
      lastName,
      phone,
      password: data.password,
      confirmPassword: data.password,
    });
  },

  async getMe(accessToken: string): Promise<User> {
    await sleep(400);

    const userId =
      findUserIdFromMockToken(accessToken, 'mock-access-') ??
      mockSessions.get(accessToken)?.user.id;
    const credential = userId ? findCredentialByUserId(userId) : undefined;

    if (credential) {
      return buildUser(credential.user);
    }

    const cachedSession = mockSessions.get(accessToken);
    if (cachedSession) {
      return cachedSession.user;
    }

    throw { code: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' };
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    await sleep(400);

    const cachedSession = [...mockSessions.values()].find((s) => s.refreshToken === refreshToken);
    if (cachedSession) {
      mockSessions.delete(cachedSession.accessToken);
      return buildSession({
        id: cachedSession.user.id,
        email: cachedSession.user.email,
        firstName: cachedSession.user.firstName,
        lastName: cachedSession.user.lastName,
        phone: cachedSession.user.phone,
        avatarUrl: cachedSession.user.avatarUrl,
        roles: cachedSession.user.roles,
        locale: cachedSession.user.locale,
        isEmailVerified: cachedSession.user.isEmailVerified,
        isPhoneVerified: cachedSession.user.isPhoneVerified,
      });
    }

    const userId = findUserIdFromMockToken(refreshToken, 'mock-refresh-');
    const credential = userId ? findCredentialByUserId(userId) : undefined;

    if (credential) {
      return buildSession(credential.user);
    }

    throw { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Please sign in again.' };
  },

  async forgotPassword(_data: ForgotPasswordPayload): Promise<{ message: string }> {
    await sleep(600);
    return { message: 'Verification code sent to your email' };
  },

  async resendOtp(_data: ResendOtpPayload): Promise<{ message: string }> {
    await sleep(600);
    return { message: 'Verification code resent to your email' };
  },

  async verifyOtp(data: VerifyOtpPayload): Promise<{ resetToken: string }> {
    await sleep(600);
    if (data.otp === MOCK_OTP) {
      return { resetToken: `mock-reset-${data.email.toLowerCase()}-${Date.now()}` };
    }
    throw { code: 'INVALID_OTP', message: 'Invalid verification code' };
  },

  async resetPassword(data: ResetPasswordPayload): Promise<{ message: string }> {
    await sleep(600);

    const credential = MOCK_CREDENTIALS.find((c) => c.email === data.email.toLowerCase());
    if (!credential) {
      throw { code: 'USER_NOT_FOUND', message: 'No account found for this email' };
    }

    if (!data.resetToken.startsWith('mock-reset-')) {
      throw { code: 'INVALID_RESET_TOKEN', message: 'Reset token is invalid or expired' };
    }

    credential.password = data.password;
    return { message: 'Password reset successfully' };
  },

  async logout(accessToken: string): Promise<void> {
    await sleep(200);
    mockSessions.delete(accessToken);
  },

  async updateProfile(accessToken: string, data: UpdateProfilePayload): Promise<User> {
    await sleep(500);

    const cachedSession = mockSessions.get(accessToken);
    const userId = cachedSession?.user.id ?? findUserIdFromMockToken(accessToken, 'mock-access-');
    const credential = userId ? findCredentialByUserId(userId) : undefined;

    if (!credential && !cachedSession) {
      throw { code: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' };
    }

    const baseUser = cachedSession?.user ?? buildUser(credential!.user);
    const updatedUser: User = {
      ...baseUser,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || undefined,
      avatarUrl: data.avatarUrl?.trim() || undefined,
      signatureUrl:
        data.signatureUrl === undefined ? baseUser.signatureUrl : data.signatureUrl.trim() || undefined,
      stampUrl: data.stampUrl === undefined ? baseUser.stampUrl : data.stampUrl.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    if (credential) {
      credential.user = {
        ...credential.user,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        signatureUrl: updatedUser.signatureUrl,
        stampUrl: updatedUser.stampUrl,
      };
    }

    if (cachedSession) {
      const nextSession: AuthSession = {
        ...cachedSession,
        user: updatedUser,
      };
      mockSessions.delete(accessToken);
      mockSessions.set(nextSession.accessToken, nextSession);
    }

    syncPatientIdentity({
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
    });

    return updatedUser;
  },

  async changePassword(accessToken: string, data: ChangePasswordPayload): Promise<{ message: string }> {
    await sleep(500);

    const cachedSession = mockSessions.get(accessToken);
    const userId = cachedSession?.user.id ?? findUserIdFromMockToken(accessToken, 'mock-access-');
    const credential = userId ? findCredentialByUserId(userId) : undefined;

    if (!credential && !cachedSession) {
      throw { code: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' };
    }

    const email = cachedSession?.user.email ?? credential!.email;
    const match = MOCK_CREDENTIALS.find((item) => item.email === email.toLowerCase());

    if (!match || match.password !== data.currentPassword) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' };
    }

    match.password = data.password;
    return { message: 'Password changed successfully' };
  },
};
