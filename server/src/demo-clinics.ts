import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bcrypt from 'bcryptjs';

import { clinicCoverList } from './clinic-covers.js';
import { db } from './db.js';

const PASSWORD = 'password123';
const SHARE = 60;

type Gender = 'male' | 'female';

const SPECIALTIES: { id: string; nameEn: string; nameAr: string }[] = [
  { id: 'generalMedicine', nameEn: 'General Medicine', nameAr: 'طب عام' },
  { id: 'generalSurgery', nameEn: 'General Surgery', nameAr: 'جراحة عامة' },
  { id: 'dentistry', nameEn: 'Dentistry', nameAr: 'أسنان' },
  { id: 'internalMedicine', nameEn: 'Internal Medicine', nameAr: 'باطنة' },
  { id: 'urology', nameEn: 'Urology', nameAr: 'مسالك بولية' },
  { id: 'obstetricsGynecology', nameEn: 'Obstetrics and Gynecology', nameAr: 'نساء وتوليد' },
  { id: 'neonatology', nameEn: 'Neonatology', nameAr: 'حديثي الولادة' },
  { id: 'pediatrics', nameEn: 'Pediatrics', nameAr: 'أطفال' },
  { id: 'nutrition', nameEn: 'Clinical Nutrition', nameAr: 'تغذية علاجية' },
  { id: 'physiotherapy', nameEn: 'Physiotherapy', nameAr: 'علاج طبيعي' },
];

const FEMALE_LEAD = new Set(['obstetricsGynecology', 'neonatology']);

const MALE_LEAD = new Set(['urology', 'generalSurgery']);

const MEN = [
  ['أحمد', 'فؤاد'],
  ['محمد', 'سالم'],
  ['عمر', 'ناجي'],
  ['كريم', 'فهمي'],
  ['يوسف', 'راضي'],
  ['حسام', 'شوقي'],
  ['تامر', 'لطفي'],
  ['وليد', 'عطية'],
] as const;

const WOMEN = [
  ['نورا', 'فؤاد'],
  ['هدى', 'سالم'],
  ['ياسمين', 'ناجي'],
  ['سلمى', 'فهمي'],
  ['رنا', 'راضي'],
  ['دينا', 'شوقي'],
] as const;

const SECRETARIES = [
  ['منى', 'جابر'],
  ['داليا', 'حسن'],
  ['إيمان', 'سعد'],
  ['هالة', 'زكي'],
] as const;

const PATIENTS: { first: string; last: string; gender: Gender; birth: string }[] = [
  { first: 'سارة', last: 'علي', gender: 'female', birth: '1994-03-12' },
  { first: 'محمود', last: 'حسن', gender: 'male', birth: '1986-07-02' },
  { first: 'نورهان', last: 'سيد', gender: 'female', birth: '1998-11-20' },
  { first: 'يوسف', last: 'عادل', gender: 'male', birth: '1991-01-15' },
  { first: 'مريم', last: 'خالد', gender: 'female', birth: '1989-05-08' },
  { first: 'عمر', last: 'فاروق', gender: 'male', birth: '1979-09-30' },
];

const BLOOD = ['A+', 'O+', 'B+', 'AB+', 'A-', 'O+'];
const DIAGNOSES = ['متابعة دورية', 'التهاب بسيط', 'ارتفاع ضغط', 'نقص فيتامين', 'ألم ومتابعة'];
const MEDS = ['باراسيتامول 500', 'أوجمنتين 1 جم', 'فيتامين د', 'أوميبرازول 20', 'بروفين 400'];

function phone(local: string): string {
  const digits = local.replace(/\D/g, '');
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('20') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`;
  return `+${digits}`;
}

function mail(local: string, kind: 'owner' | 'doctor' | 'secretary' | 'patient'): string {
  return `${phone(local).replace(/\D/g, '')}@${kind}.clinsync`;
}

/** Fresh 0157 numbers. Slot 1 owner, 2 extra doctor, 3 secretary, 4–7 patients. */
function specPhone(specIndex: number, slot: number): string {
  const n = 1000000 + specIndex * 20 + slot;
  return `0157${String(n).slice(-7)}`;
}

function at(dayOffset: number, hour: number, minute: number): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + dayOffset, hour - 3, minute, 0)).toISOString();
}

function leadGender(specId: string, index: number): Gender {
  if (FEMALE_LEAD.has(specId)) return 'female';
  if (MALE_LEAD.has(specId)) return 'male';
  return index % 2 === 0 ? 'male' : 'female';
}

function person(gender: Gender, index: number): { first: string; last: string } {
  const pool = gender === 'female' ? WOMEN : MEN;
  const [first, last] = pool[index % pool.length];
  return { first, last };
}

function patientsFor(specId: string): { first: string; last: string; gender: Gender; birth: string }[] {
  if (specId === 'obstetricsGynecology' || specId === 'fertility') {
    return PATIENTS.filter((item) => item.gender === 'female').concat([
      { first: 'أمل', last: 'حسين', gender: 'female', birth: '1992-02-01' },
      { first: 'دينا', last: 'صلاح', gender: 'female', birth: '1995-08-14' },
    ]);
  }
  if (specId === 'andrology') {
    return PATIENTS.filter((item) => item.gender === 'male').concat([
      { first: 'خالد', last: 'سامي', gender: 'male', birth: '1982-01-19' },
      { first: 'طارق', last: 'فهمي', gender: 'male', birth: '1978-06-11' },
    ]);
  }
  return PATIENTS.slice(0, 4);
}

async function wipe(): Promise<void> {
  const tables = [
    'device_tokens',
    'vaccination_doses',
    'newborn_links',
    'clinical_attachments',
    'ultrasound_reports',
    'obgyn_encounters',
    'pregnancies',
    'home_visit_requests',
    'nursing_requests',
    'nurse_profiles',
    'reviews',
    'notifications',
    'staff_whatsapp',
    'whatsapp_messages',
    'lab_requests',
    'prescriptions',
    'invoices',
    'visits',
    'appointments',
    'doctor_slots',
    'patients',
    'doctors',
    'memberships',
    'refresh_tokens',
    'login_otps',
    'password_resets',
    'clinics',
  ];
  try {
    await db.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE`);
  } catch {
    for (const table of tables) {
      try {
        await db.query(`DELETE FROM ${table}`);
      } catch (error) {
        console.warn(`wipe skipped ${table}:`, error instanceof Error ? error.message : error);
      }
    }
  }
  await db.query(`DELETE FROM users WHERE COALESCE(is_platform_admin, false) = false`);
}

async function addUser(input: {
  id: string;
  localPhone: string;
  kind: 'owner' | 'doctor' | 'secretary' | 'patient';
  firstName: string;
  lastName: string;
  gender: Gender;
  passwordHash: string;
}): Promise<void> {
  await db.query(
    `INSERT INTO users (
       id, email, phone, password_hash, first_name, last_name, locale, gender, is_email_verified, is_phone_verified
     ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', $7, true, true)`,
    [
      input.id,
      mail(input.localPhone, input.kind),
      phone(input.localPhone),
      input.passwordHash,
      input.firstName,
      input.lastName,
      input.gender,
    ],
  );
}

async function addClinic(input: {
  id: string;
  name: string;
  localPhone: string;
  specialty: string;
  ownerId: string;
  fee: number;
}): Promise<void> {
  await db.query(
    `INSERT INTO clinics (
       id, name, name_ar, slug, phone, street, street_ar, city, city_ar, country, country_ar,
       specialty, opening_hours, consultation_fee, is_active, approval_status, owner_user_id, place_kind, photo_urls
     ) VALUES ($1, $2, $2, $1, $3, 'مدينة نصر', 'مدينة نصر', 'Cairo', 'القاهرة', 'Egypt', 'مصر', $4, '٩ صباحاً – ٥ مساءً', $5, true, 'approved', $6, 'clinic', $7)`,
    [
      input.id,
      input.name,
      phone(input.localPhone),
      input.specialty,
      input.fee,
      input.ownerId,
      JSON.stringify(clinicCoverList(input.id, input.specialty)),
    ],
  );
}

async function addMembership(userId: string, clinicId: string, role: string): Promise<void> {
  await db.query(`INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, $4)`, [
    `mem-${userId}-${role}`,
    userId,
    clinicId,
    role,
  ]);
}

async function addDoctor(input: {
  id: string;
  clinicId: string;
  clinicName: string;
  localPhone: string;
  firstName: string;
  lastName: string;
  specialty: string;
  gender: Gender;
  years: number;
}): Promise<void> {
  await db.query(
    `INSERT INTO doctors (
       id, user_id, clinic_id, first_name, last_name, email, phone, specialty, branch_id, branch_name,
       languages, gender, years_experience, share_percent, offers_home_visits, rating, review_count
     ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $2, $8, '["Arabic"]', $9, $10, $11, false, $12, $13)`,
    [
      input.id,
      input.clinicId,
      input.firstName,
      input.lastName,
      mail(input.localPhone, 'doctor'),
      phone(input.localPhone),
      input.specialty,
      input.clinicName,
      input.gender,
      input.years,
      SHARE,
      4.6 + (input.years % 4) / 10,
      18 + input.years * 3,
    ],
  );
  for (let day = 0; day < 7; day += 1) {
    await db.query(
      `INSERT INTO doctor_slots (id, doctor_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, '09:00', '17:00')`,
      [`${input.id}-day-${day}`, input.id, day],
    );
  }
}

async function addPatient(input: {
  id: string;
  clinicId: string;
  localPhone: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birth: string;
  blood: string;
  passwordHash: string;
}): Promise<void> {
  await addUser({
    id: input.id,
    localPhone: input.localPhone,
    kind: 'patient',
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    passwordHash: input.passwordHash,
  });
  await addMembership(input.id, input.clinicId, 'patient');
  await db.query(
    `INSERT INTO patients (
       id, user_id, clinic_id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, allergies, chronic_conditions
     ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, '[]', '[]')`,
    [
      input.id,
      input.clinicId,
      input.firstName,
      input.lastName,
      mail(input.localPhone, 'patient'),
      phone(input.localPhone),
      input.birth,
      input.gender,
      input.blood,
    ],
  );
}

async function addRecord(input: {
  id: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  when: string;
  status: 'completed' | 'confirmed' | 'scheduled';
  reason: string;
  diagnosis?: string;
  complaint?: string;
  medication?: string;
  fee: number;
}): Promise<void> {
  const source = input.status === 'scheduled' ? 'online' : 'desk';
  const awaiting = input.status === 'scheduled' ? 'secretary' : null;
  await db.query(
    `INSERT INTO appointments (
       id, clinic_id, doctor_id, patient_id, branch_id, branch_name, scheduled_at, duration_minutes,
       status, reason, source, awaiting
     ) VALUES ($1, $2, $3, $4, $2, $5, $6, 30, $7, $8, $9, $10)`,
    [
      input.id,
      input.clinicId,
      input.doctorId,
      input.patientId,
      input.clinicName,
      input.when,
      input.status,
      input.reason,
      source,
      awaiting,
    ],
  );
  if (input.status !== 'completed' || !input.diagnosis) return;
  const visitId = `visit-${input.id}`;
  const vitals = JSON.stringify({ bloodPressure: '120/80', heartRate: 76, temperature: 36.8, weight: 70 });
  await db.query(
    `INSERT INTO visits (
       id, appointment_id, patient_id, doctor_id, clinic_id, status, chief_complaint, diagnosis, symptoms, notes, vitals, started_at, completed_at
     ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9, $10, $11, $11)`,
    [
      visitId,
      input.id,
      input.patientId,
      input.doctorId,
      input.clinicId,
      input.complaint ?? input.reason,
      input.diagnosis,
      input.reason,
      'كشف ومتابعة.',
      vitals,
      input.when,
    ],
  );
  await db.query(`UPDATE patients SET last_visit_at = $2 WHERE id = $1`, [input.patientId, input.when]);
  const meds = JSON.stringify([
    {
      name: input.medication ?? 'علاج المتابعة',
      dosage: 'قرص',
      frequency: 'Once daily',
      frequencyAr: 'مرة يومياً',
      duration: '14 days',
      durationAr: '14 يوم',
    },
  ]);
  await db.query(
    `INSERT INTO prescriptions (
       id, visit_id, patient_id, doctor_id, doctor_name, number, clinic_id, clinic_name, clinic_name_ar,
       medications, instructions, status, issued_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, 'issued', $11)`,
    [
      `rx-${input.id}`,
      visitId,
      input.patientId,
      input.doctorId,
      input.doctorName,
      `RX-${input.id.slice(-8)}`,
      input.clinicId,
      input.clinicName,
      meds,
      'بعد الأكل. لو الأعراض زادت ارجع العيادة.',
      input.when,
    ],
  );
  const doctorShare = Math.round((input.fee * SHARE) / 100);
  await db.query(
    `INSERT INTO invoices (
       id, appointment_id, clinic_id, doctor_id, patient_id, patient_name, doctor_name, amount,
       doctor_share_percent, doctor_share, clinic_share, payment_method, status, paid_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'cash', 'paid', $12)`,
    [
      `inv-${input.id}`,
      input.id,
      input.clinicId,
      input.doctorId,
      input.patientId,
      input.patientName,
      input.doctorName,
      input.fee,
      SHARE,
      doctorShare,
      input.fee - doctorShare,
      input.when,
    ],
  );
}

export async function seedDemoClinics(options?: { force?: boolean }): Promise<void> {
  const wanted = SPECIALTIES.map((spec) => `clinic-spec-${spec.id}`);
  const existing = await db.query<{ id: string }>(`SELECT id FROM clinics`);
  const have = new Set(existing.rows.map((row) => row.id));
  if (!options?.force && have.size === wanted.length && wanted.every((id) => have.has(id))) return;

  await wipe();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const accounts: Record<string, unknown>[] = [];

  for (let index = 0; index < SPECIALTIES.length; index += 1) {
    const spec = SPECIALTIES[index];
    const clinicId = `clinic-spec-${spec.id}`;
    const clinicName = `عيادة ${spec.nameAr}`;
    const fee = 250 + (index % 8) * 50;
    const ownerGender = leadGender(spec.id, index);
    const extraGender = ownerGender === 'female' ? 'male' : 'female';
    const owner = person(ownerGender, index);
    const extra = person(extraGender, index + 3);
    const secretary = SECRETARIES[index % SECRETARIES.length];
    const ownerPhone = specPhone(index, 1);
    const extraPhone = specPhone(index, 2);
    const secretaryPhone = specPhone(index, 3);
    const ownerId = `user-spec-${spec.id}-owner`;
    const extraId = `user-spec-${spec.id}-doc`;
    const secretaryId = `user-spec-${spec.id}-sec`;
    const ownerYears = 8 + (index % 10);
    const extraYears = 5 + (index % 8);
    const clinicPatients = patientsFor(spec.id).slice(0, 4);

    await addUser({
      id: ownerId,
      localPhone: ownerPhone,
      kind: 'owner',
      firstName: owner.first,
      lastName: owner.last,
      gender: ownerGender,
      passwordHash,
    });
    await addClinic({
      id: clinicId,
      name: clinicName,
      localPhone: ownerPhone,
      specialty: spec.nameEn,
      ownerId,
      fee,
    });
    await addMembership(ownerId, clinicId, 'admin');
    await addMembership(ownerId, clinicId, 'doctor');
    await addDoctor({
      id: ownerId,
      clinicId,
      clinicName,
      localPhone: ownerPhone,
      firstName: owner.first,
      lastName: owner.last,
      specialty: spec.nameEn,
      gender: ownerGender,
      years: ownerYears,
    });

    await addUser({
      id: extraId,
      localPhone: extraPhone,
      kind: 'doctor',
      firstName: extra.first,
      lastName: extra.last,
      gender: extraGender,
      passwordHash,
    });
    await addMembership(extraId, clinicId, 'doctor');
    await addDoctor({
      id: extraId,
      clinicId,
      clinicName,
      localPhone: extraPhone,
      firstName: extra.first,
      lastName: extra.last,
      specialty: spec.nameEn,
      gender: extraGender,
      years: extraYears,
    });

    await addUser({
      id: secretaryId,
      localPhone: secretaryPhone,
      kind: 'secretary',
      firstName: secretary[0],
      lastName: secretary[1],
      gender: 'female',
      passwordHash,
    });
    await addMembership(secretaryId, clinicId, 'secretary');

    const doctors = [
      { id: ownerId, name: `${owner.first} ${owner.last}`, phone: ownerPhone },
      { id: extraId, name: `${extra.first} ${extra.last}`, phone: extraPhone },
    ];
    const patientAccounts: { name: string; phone: string }[] = [];

    for (let p = 0; p < clinicPatients.length; p += 1) {
      const personRow = clinicPatients[p];
      const patientId = `user-spec-${spec.id}-p-${p + 1}`;
      const patientPhone = specPhone(index, 4 + p);
      const doctor = doctors[p % doctors.length];
      await addPatient({
        id: patientId,
        clinicId,
        localPhone: patientPhone,
        firstName: personRow.first,
        lastName: personRow.last,
        gender: personRow.gender,
        birth: personRow.birth,
        blood: BLOOD[p % BLOOD.length],
        passwordHash,
      });
      await addRecord({
        id: `appt-${spec.id}-past-${p + 1}`,
        clinicId,
        clinicName,
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId,
        patientName: `${personRow.first} ${personRow.last}`,
        when: at(-10 + p, 9 + (p % 4), (p % 2) * 20),
        status: 'completed',
        reason: `متابعة ${spec.nameAr}`,
        complaint: 'كشف ومتابعة',
        diagnosis: DIAGNOSES[p % DIAGNOSES.length],
        medication: MEDS[p % MEDS.length],
        fee,
      });
      await addRecord({
        id: `appt-${spec.id}-next-${p + 1}`,
        clinicId,
        clinicName,
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId,
        patientName: `${personRow.first} ${personRow.last}`,
        when: at(p === 0 ? 0 : p === 1 ? 1 : 3, 10 + p, 0),
        status: p < 2 ? 'confirmed' : 'scheduled',
        reason: p === 0 ? 'كشف النهاردة' : p === 1 ? 'كشف بكرة' : 'كشف قادم',
        fee,
      });
      patientAccounts.push({ name: `${personRow.first} ${personRow.last}`, phone: patientPhone });
    }

    accounts.push({
      specialty: spec.nameAr,
      clinic: clinicName,
      fee,
      password: PASSWORD,
      ownerDoctor: { name: `${owner.first} ${owner.last}`, phone: ownerPhone, roles: 'admin + doctor' },
      doctor: { name: `${extra.first} ${extra.last}`, phone: extraPhone },
      secretary: { name: `${secretary[0]} ${secretary[1]}`, phone: secretaryPhone },
      patients: patientAccounts,
    });
  }

  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    writeFileSync(path.join(here, '..', 'demo-accounts.json'), JSON.stringify({ password: PASSWORD, accounts }, null, 2));
  } catch {
    // Render's disk is ephemeral; accounts are still inserted.
  }
}

const calledDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('demo-clinics.ts');
if (calledDirectly) {
  const { migrate } = await import('./db.js');
  await migrate();
  await seedDemoClinics({ force: true });
  const counts = await db.query<{ clinics: number; users: number; appointments: number; visits: number }>(
    `SELECT
       (SELECT count(*)::int FROM clinics) AS clinics,
       (SELECT count(*)::int FROM users) AS users,
       (SELECT count(*)::int FROM appointments) AS appointments,
       (SELECT count(*)::int FROM visits) AS visits`,
  );
  console.log(JSON.stringify(counts.rows[0]));
}
