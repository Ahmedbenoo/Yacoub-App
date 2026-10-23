import bcrypt from 'bcryptjs';

import { db } from './db.js';

const PASSWORD = 'password123';
const FEE = { internal: 300, obgyn: 450, urology: 400 } as const;
const SHARE = 60;

type Gender = 'male' | 'female';

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
    'users',
    'clinics',
  ];
  for (const table of tables) {
    await db.query(`DELETE FROM ${table}`);
  }
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
    [input.id, mail(input.localPhone, input.kind), phone(input.localPhone), input.passwordHash, input.firstName, input.lastName, input.gender],
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
       specialty, opening_hours, consultation_fee, is_active, approval_status, owner_user_id, place_kind
     ) VALUES ($1, $2, $2, $1, $3, 'مدينة نصر', 'مدينة نصر', 'Cairo', 'القاهرة', 'Egypt', 'مصر', $4, '٩ صباحاً – ٥ مساءً', $5, true, 'approved', $6, 'clinic')`,
    [input.id, input.name, phone(input.localPhone), input.specialty, input.fee, input.ownerId],
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
       languages, gender, years_experience, share_percent, offers_home_visits
     ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $2, $8, '["Arabic"]', $9, $10, $11, false)`,
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
    [visitId, input.id, input.patientId, input.doctorId, input.clinicId, input.complaint ?? input.reason, input.diagnosis, input.reason, 'كشف ومتابعة.', vitals, input.when],
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
      `RX-${input.id.slice(-6)}`,
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

const INTERNAL_PATIENTS: { first: string; last: string; gender: Gender; birth: string }[] = [
  { first: 'سارة', last: 'علي', gender: 'female', birth: '1994-03-12' },
  { first: 'محمد', last: 'حسن', gender: 'male', birth: '1986-07-02' },
  { first: 'نورهان', last: 'سيد', gender: 'female', birth: '1998-11-20' },
  { first: 'يوسف', last: 'عادل', gender: 'male', birth: '1991-01-15' },
  { first: 'مريم', last: 'خالد', gender: 'female', birth: '1989-05-08' },
  { first: 'عمر', last: 'فاروق', gender: 'male', birth: '1979-09-30' },
  { first: 'هدى', last: 'سمير', gender: 'female', birth: '1996-02-18' },
  { first: 'كريم', last: 'نبيل', gender: 'male', birth: '1984-12-04' },
  { first: 'ليلى', last: 'طارق', gender: 'female', birth: '1993-06-27' },
  { first: 'حسن', last: 'مجدي', gender: 'male', birth: '1975-04-11' },
];

const OBGYN_PATIENTS: { first: string; last: string; birth: string }[] = [
  { first: 'أمل', last: 'حسين', birth: '1992-02-01' },
  { first: 'دينا', last: 'صلاح', birth: '1995-08-14' },
  { first: 'رنا', last: 'عادل', birth: '1988-10-09' },
  { first: 'سلمى', last: 'كمال', birth: '1997-01-22' },
  { first: 'منى', last: 'إبراهيم', birth: '1990-03-03' },
  { first: 'هبة', last: 'يوسف', birth: '1987-07-19' },
  { first: 'ندى', last: 'فؤاد', birth: '1999-05-25' },
  { first: 'ياسمين', last: 'طه', birth: '1993-09-16' },
  { first: 'إيمان', last: 'رضا', birth: '1985-12-28' },
  { first: 'شيماء', last: 'مجدي', birth: '1996-04-06' },
];

const BLOOD = ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B+', 'A+', 'O+', 'AB+'];

const UROLOGY_PATIENTS: { first: string; last: string; gender: Gender; birth: string }[] = [
  { first: 'خالد', last: 'سامي', gender: 'male', birth: '1982-01-19' },
  { first: 'طارق', last: 'فهمي', gender: 'male', birth: '1978-06-11' },
  { first: 'محمود', last: 'رضا', gender: 'male', birth: '1990-09-03' },
  { first: 'وليد', last: 'ناصر', gender: 'male', birth: '1986-04-28' },
  { first: 'حسام', last: 'فتحي', gender: 'male', birth: '1974-11-15' },
  { first: 'ياسر', last: 'كمال', gender: 'male', birth: '1992-02-07' },
  { first: 'نهى', last: 'عادل', gender: 'female', birth: '1989-08-21' },
  { first: 'ريم', last: 'حازم', gender: 'female', birth: '1995-12-02' },
  { first: 'باسم', last: 'شريف', gender: 'male', birth: '1983-05-17' },
  { first: 'علاء', last: 'حمدي', gender: 'male', birth: '1977-10-30' },
];

export async function seedDemoClinics(options?: { force?: boolean }): Promise<void> {
  const existing = await db.query<{ id: string }>(`SELECT id FROM clinics WHERE id = 'clinic-test-internal'`);
  if (existing.rows.length > 0 && !options?.force) return;

  await wipe();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const internalId = 'clinic-test-internal';
  const internalName = 'عيادة الاختبار';
  const ownerId = 'user-demo-internal';
  await addUser({
    id: ownerId,
    localPhone: '01092313486',
    kind: 'owner',
    firstName: 'أحمد',
    lastName: 'فتحي',
    gender: 'male',
    passwordHash,
  });
  await addClinic({
    id: internalId,
    name: internalName,
    localPhone: '01092313486',
    specialty: 'Internal Medicine',
    ownerId,
    fee: FEE.internal,
  });
  await addMembership(ownerId, internalId, 'admin');
  await addMembership(ownerId, internalId, 'doctor');
  await addDoctor({
    id: ownerId,
    clinicId: internalId,
    clinicName: internalName,
    localPhone: '01092313486',
    firstName: 'أحمد',
    lastName: 'فتحي',
    specialty: 'Internal Medicine',
    gender: 'male',
    years: 12,
  });

  const extraDoctors = [
    { id: 'user-demo-mostafa', phone: '01098745515', first: 'مصطفى', last: 'محمود', years: 7 },
    { id: 'user-demo-fathy', phone: '01117581840', first: 'فتحي', last: 'محمود', years: 9 },
  ];
  for (const doctor of extraDoctors) {
    await addUser({
      id: doctor.id,
      localPhone: doctor.phone,
      kind: 'doctor',
      firstName: doctor.first,
      lastName: doctor.last,
      gender: 'male',
      passwordHash,
    });
    await addMembership(doctor.id, internalId, 'doctor');
    await addDoctor({
      id: doctor.id,
      clinicId: internalId,
      clinicName: internalName,
      localPhone: doctor.phone,
      firstName: doctor.first,
      lastName: doctor.last,
      specialty: 'Internal Medicine',
      gender: 'male',
      years: doctor.years,
    });
  }

  await addUser({
    id: 'user-demo-shakira',
    localPhone: '01142842452',
    kind: 'secretary',
    firstName: 'شاكيرا',
    lastName: 'محمود',
    gender: 'female',
    passwordHash,
  });
  await addMembership('user-demo-shakira', internalId, 'secretary');

  for (let index = 0; index < INTERNAL_PATIENTS.length; index += 1) {
    const person = INTERNAL_PATIENTS[index];
    const suffix = String(101 + index);
    await addPatient({
      id: `user-demo-int-p-${index + 1}`,
      clinicId: internalId,
      localPhone: `01000000${suffix}`,
      firstName: person.first,
      lastName: person.last,
      gender: person.gender,
      birth: person.birth,
      blood: BLOOD[index],
      passwordHash,
    });
  }

  const internalDoctors = [
    { id: ownerId, name: 'أحمد فتحي' },
    { id: 'user-demo-mostafa', name: 'مصطفى محمود' },
    { id: 'user-demo-fathy', name: 'فتحي محمود' },
  ];
  const diagnoses = ['ارتفاع ضغط الدم', 'حموضة وارتجاع', 'متابعة سكر', 'أنيميا نقص حديد', 'التهاب معدة'];
  const meds = ['كونكور 5 مجم', 'نيكسيوم 40 مجم', 'جلوكوفاج 500 مجم', 'فيروجلوبين', 'موتيليوم'];
  for (let index = 0; index < INTERNAL_PATIENTS.length; index += 1) {
    const person = INTERNAL_PATIENTS[index];
    const doctor = internalDoctors[index % internalDoctors.length];
    await addRecord({
      id: `appt-int-past-${index + 1}`,
      clinicId: internalId,
      clinicName: internalName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      patientId: `user-demo-int-p-${index + 1}`,
      patientName: `${person.first} ${person.last}`,
      when: at(-12 + index, 9 + (index % 4), (index % 2) * 30),
      status: 'completed',
      reason: 'متابعة باطنة',
      complaint: 'تعب ومتابعة دورية',
      diagnosis: diagnoses[index % diagnoses.length],
      medication: meds[index % meds.length],
      fee: FEE.internal,
    });
  }
  const upcoming = [
    { day: 0, status: 'confirmed' as const, hour: 10 },
    { day: 1, status: 'confirmed' as const, hour: 11 },
    { day: 4, status: 'scheduled' as const, hour: 12 },
  ];
  for (const slot of upcoming) {
    for (let doctorIndex = 0; doctorIndex < internalDoctors.length; doctorIndex += 1) {
      const patientIndex = doctorIndex + (slot.day === 0 ? 0 : slot.day === 1 ? 3 : 6);
      const person = INTERNAL_PATIENTS[patientIndex];
      const doctor = internalDoctors[doctorIndex];
      await addRecord({
        id: `appt-int-${slot.day}-${doctorIndex + 1}`,
        clinicId: internalId,
        clinicName: internalName,
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId: `user-demo-int-p-${patientIndex + 1}`,
        patientName: `${person.first} ${person.last}`,
        when: at(slot.day, slot.hour, doctorIndex * 20),
        status: slot.status,
        reason: slot.day === 0 ? 'كشف النهاردة' : slot.day === 1 ? 'كشف بكرة' : 'كشف الأسبوع الجاي',
        fee: FEE.internal,
      });
    }
  }

  const obgynId = 'clinic-test-obgyn';
  const obgynName = 'عيادة نسا وتوليد';
  const fatmaId = 'user-demo-fatma';
  await addUser({
    id: fatmaId,
    localPhone: '01024307135',
    kind: 'owner',
    firstName: 'فاطمه',
    lastName: 'محمود فتحي',
    gender: 'female',
    passwordHash,
  });
  await addClinic({
    id: obgynId,
    name: obgynName,
    localPhone: '01024307135',
    specialty: 'Obstetrics and Gynecology',
    ownerId: fatmaId,
    fee: FEE.obgyn,
  });
  await addMembership(fatmaId, obgynId, 'admin');
  await addMembership(fatmaId, obgynId, 'doctor');
  await addDoctor({
    id: fatmaId,
    clinicId: obgynId,
    clinicName: obgynName,
    localPhone: '01024307135',
    firstName: 'فاطمه',
    lastName: 'محمود فتحي',
    specialty: 'Obstetrics and Gynecology',
    gender: 'female',
    years: 11,
  });
  await addUser({
    id: 'user-demo-ghadeer',
    localPhone: '01094360326',
    kind: 'secretary',
    firstName: 'غدير',
    lastName: 'أحمد',
    gender: 'female',
    passwordHash,
  });
  await addMembership('user-demo-ghadeer', obgynId, 'secretary');

  for (let index = 0; index < OBGYN_PATIENTS.length; index += 1) {
    const person = OBGYN_PATIENTS[index];
    const suffix = String(index + 1).padStart(3, '0');
    await addPatient({
      id: `user-demo-ob-p-${index + 1}`,
      clinicId: obgynId,
      localPhone: `01000000${suffix}`,
      firstName: person.first,
      lastName: person.last,
      gender: 'female',
      birth: person.birth,
      blood: BLOOD[index],
      passwordHash,
    });
    await addRecord({
      id: `appt-ob-past-${index + 1}`,
      clinicId: obgynId,
      clinicName: obgynName,
      doctorId: fatmaId,
      doctorName: 'فاطمه محمود فتحي',
      patientId: `user-demo-ob-p-${index + 1}`,
      patientName: `${person.first} ${person.last}`,
      when: at(-14 + index, 10, 0),
      status: 'completed',
      reason: 'متابعة نسا',
      complaint: 'متابعة دورية',
      diagnosis: index % 2 === 0 ? 'متابعة حمل' : 'التهاب بسيط',
      medication: index % 2 === 0 ? 'حمض الفوليك' : 'فلاجيل 500 مجم',
      fee: FEE.obgyn,
    });
  }
  const obgynUpcoming = [
    { day: 0, status: 'confirmed' as const, patients: [0, 1, 2] },
    { day: 1, status: 'confirmed' as const, patients: [3, 4] },
    { day: 5, status: 'scheduled' as const, patients: [5, 6] },
  ];
  for (const slot of obgynUpcoming) {
    for (let index = 0; index < slot.patients.length; index += 1) {
      const patientIndex = slot.patients[index];
      const person = OBGYN_PATIENTS[patientIndex];
      await addRecord({
        id: `appt-ob-${slot.day}-${index + 1}`,
        clinicId: obgynId,
        clinicName: obgynName,
        doctorId: fatmaId,
        doctorName: 'فاطمه محمود فتحي',
        patientId: `user-demo-ob-p-${patientIndex + 1}`,
        patientName: `${person.first} ${person.last}`,
        when: at(slot.day, 10 + index, 0),
        status: slot.status,
        reason: slot.day === 0 ? 'كشف النهاردة' : slot.day === 1 ? 'كشف بكرة' : 'كشف قادم',
        fee: FEE.obgyn,
      });
    }
  }

  const urologyId = 'clinic-test-urology';
  const urologyName = 'عيادة إسلام شعبان';
  const eslamId = 'user-demo-eslam';
  await addUser({
    id: eslamId,
    localPhone: '01005188116',
    kind: 'owner',
    firstName: 'إسلام',
    lastName: 'شعبان',
    gender: 'male',
    passwordHash,
  });
  await addClinic({
    id: urologyId,
    name: urologyName,
    localPhone: '01005188116',
    specialty: 'Urology',
    ownerId: eslamId,
    fee: FEE.urology,
  });
  await addMembership(eslamId, urologyId, 'admin');
  await addMembership(eslamId, urologyId, 'doctor');
  await addDoctor({
    id: eslamId,
    clinicId: urologyId,
    clinicName: urologyName,
    localPhone: '01005188116',
    firstName: 'إسلام',
    lastName: 'شعبان',
    specialty: 'Urology',
    gender: 'male',
    years: 12,
  });
  await addUser({
    id: 'user-demo-shaimaa',
    localPhone: '01018012930',
    kind: 'secretary',
    firstName: 'شيماء',
    lastName: 'السيد',
    gender: 'female',
    passwordHash,
  });
  await addMembership('user-demo-shaimaa', urologyId, 'secretary');

  const urologyDiagnoses = ['حصوة حالب', 'التهاب مجرى بول', 'تضخم بروستاتا', 'متابعة بعد منظار'];
  const urologyMeds = ['روسيفاج 500', 'بروفين 400', 'تامسولوسين', 'سيبروفلوكساسين 500'];
  for (let index = 0; index < UROLOGY_PATIENTS.length; index += 1) {
    const person = UROLOGY_PATIENTS[index];
    const suffix = String(201 + index);
    await addPatient({
      id: `user-demo-ur-p-${index + 1}`,
      clinicId: urologyId,
      localPhone: `01000000${suffix}`,
      firstName: person.first,
      lastName: person.last,
      gender: person.gender,
      birth: person.birth,
      blood: BLOOD[index],
      passwordHash,
    });
    await addRecord({
      id: `appt-ur-past-${index + 1}`,
      clinicId: urologyId,
      clinicName: urologyName,
      doctorId: eslamId,
      doctorName: 'إسلام شعبان',
      patientId: `user-demo-ur-p-${index + 1}`,
      patientName: `${person.first} ${person.last}`,
      when: at(-16 + index, 11, 0),
      status: 'completed',
      reason: 'متابعة مسالك',
      complaint: 'ألم ومتابعة',
      diagnosis: urologyDiagnoses[index % urologyDiagnoses.length],
      medication: urologyMeds[index % urologyMeds.length],
      fee: FEE.urology,
    });
  }
  const urologyUpcoming = [
    { day: 0, status: 'confirmed' as const, patients: [0, 1, 2] },
    { day: 1, status: 'confirmed' as const, patients: [3, 4] },
    { day: 3, status: 'scheduled' as const, patients: [5, 6] },
  ];
  for (const slot of urologyUpcoming) {
    for (let index = 0; index < slot.patients.length; index += 1) {
      const patientIndex = slot.patients[index];
      const person = UROLOGY_PATIENTS[patientIndex];
      await addRecord({
        id: `appt-ur-${slot.day}-${index + 1}`,
        clinicId: urologyId,
        clinicName: urologyName,
        doctorId: eslamId,
        doctorName: 'إسلام شعبان',
        patientId: `user-demo-ur-p-${patientIndex + 1}`,
        patientName: `${person.first} ${person.last}`,
        when: at(slot.day, 12 + index, 0),
        status: slot.status,
        reason: slot.day === 0 ? 'كشف النهاردة' : slot.day === 1 ? 'كشف بكرة' : 'كشف قادم',
        fee: FEE.urology,
      });
    }
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
