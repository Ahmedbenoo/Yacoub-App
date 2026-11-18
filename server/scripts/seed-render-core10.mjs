const BASE = 'https://yacoub-api.onrender.com/api/v1';
const PASSWORD = 'password123';

const SPECIALTIES = [
  { id: 'generalMedicine', nameEn: 'General Medicine', nameAr: 'طب عام', owner: ['أحمد', 'فؤاد', 'male'], extra: ['سلمى', 'فهمي', 'female'] },
  { id: 'generalSurgery', nameEn: 'General Surgery', nameAr: 'جراحة عامة', owner: ['وليد', 'عطية', 'male'], extra: ['دينا', 'شوقي', 'female'] },
  { id: 'dentistry', nameEn: 'Dentistry', nameAr: 'أسنان', owner: ['هدى', 'سالم', 'female'], extra: ['عمر', 'ناجي', 'male'] },
  { id: 'internalMedicine', nameEn: 'Internal Medicine', nameAr: 'باطنة', owner: ['يوسف', 'راضي', 'male'], extra: ['رنا', 'راضي', 'female'] },
  { id: 'urology', nameEn: 'Urology', nameAr: 'مسالك بولية', owner: ['تامر', 'لطفي', 'male'], extra: ['ياسمين', 'ناجي', 'female'] },
  { id: 'obstetricsGynecology', nameEn: 'Obstetrics and Gynecology', nameAr: 'نساء وتوليد', owner: ['نورا', 'فؤاد', 'female'], extra: ['حسام', 'شوقي', 'male'] },
  { id: 'neonatology', nameEn: 'Neonatology', nameAr: 'حديثي الولادة', owner: ['رنا', 'راضي', 'female'], extra: ['كريم', 'فهمي', 'male'] },
  { id: 'pediatrics', nameEn: 'Pediatrics', nameAr: 'أطفال', owner: ['دينا', 'شوقي', 'female'], extra: ['محمد', 'سالم', 'male'] },
  { id: 'nutrition', nameEn: 'Clinical Nutrition', nameAr: 'تغذية علاجية', owner: ['سلمى', 'فهمي', 'female'], extra: ['أحمد', 'فؤاد', 'male'] },
  { id: 'physiotherapy', nameEn: 'Physiotherapy', nameAr: 'علاج طبيعي', owner: ['عمر', 'ناجي', 'male'], extra: ['هدى', 'سالم', 'female'] },
];

const SECRETARIES = [
  ['منى', 'جابر'],
  ['داليا', 'حسن'],
  ['إيمان', 'سعد'],
  ['هالة', 'زكي'],
];

const PATIENTS = [
  ['سارة', 'علي', 'female', '1994-03-12'],
  ['محمود', 'حسن', 'male', '1986-07-02'],
  ['نورهان', 'سيد', 'female', '1998-11-20'],
  ['يوسف', 'عادل', 'male', '1991-01-15'],
];

function specPhone(index, slot) {
  const n = 1000000 + index * 20 + slot;
  return `0157${String(n).slice(-7)}`;
}

function emailFor(phone, kind) {
  return `${phone.replace(/\D/g, '')}.${kind}@yacoub.test`;
}

async function req(path, { method = 'GET', token, clinicId, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clinicId) headers['x-clinic-id'] = clinicId;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

function pickPassword(payload) {
  const blob = JSON.stringify(payload ?? {});
  const match = blob.match(/password123|[A-Za-z0-9]{8,14}/);
  return payload?.data?.password || payload?.data?.credentialsWhatsApp?.password || match?.[0] || '';
}

const accounts = [];

const ops = await req('/ops/login', {
  method: 'POST',
  body: { phone: '01092313486', password: PASSWORD },
});
const opsToken = ops.data.accessToken;
const OLD_CLINICS = [
  'clinic-baa4383b-b447-47ea-9225-1f2fff9d2550',
  'clinic-c9bd22dc-57ce-4f38-8a1e-ee2c85a1cd11',
  'clinic-3e7b0863-4e60-4706-9e8f-4c062a5f07c2',
  'clinic-5a93e1d6-27d3-4040-a2ed-b230cef18b7b',
];
for (const id of OLD_CLINICS) {
  try {
    await req(`/ops/clinics/${id}/deactivate`, { method: 'POST', token: opsToken });
    console.log('deactivated', id);
  } catch (error) {
    console.warn('deactivate failed', id, error.message);
  }
}

for (let index = 0; index < SPECIALTIES.length; index += 1) {
  const spec = SPECIALTIES[index];
  const ownerPhone = specPhone(index, 1);
  const extraPhone = specPhone(index, 2);
  const secretaryPhone = specPhone(index, 3);
  const clinicName = `عيادة ${spec.nameAr}`;
  const [ownerFirst, ownerLast, ownerGender] = spec.owner;
  const [extraFirst, extraLast, extraGender] = spec.extra;
  const [secFirst, secLast] = SECRETARIES[index % SECRETARIES.length];

  let owner;
  try {
    owner = await req('/auth/register-owner', {
      method: 'POST',
      body: {
        firstName: ownerFirst,
        lastName: ownerLast,
        email: emailFor(ownerPhone, 'owner'),
        phone: ownerPhone,
        gender: ownerGender,
        password: PASSWORD,
        placeKind: 'clinic',
        placeName: clinicName,
        clinicPhone: ownerPhone,
        street: 'مدينة نصر',
        city: 'Cairo',
        specialty: spec.nameEn,
        openingHours: '٩ صباحاً – ٥ مساءً',
        consultationFee: 250 + (index % 4) * 50,
        practices: true,
      },
    });
  } catch (error) {
    if (!String(error.message).includes('PHONE_EXISTS')) throw error;
    owner = await req('/auth/login', { method: 'POST', body: { identifier: ownerPhone, password: PASSWORD } });
  }

  const token = owner.data.accessToken;
  const clinics = await req('/clinics', { token });
  const clinic = (clinics.data ?? []).find((item) => item.name === clinicName) ?? clinics.data?.[0];
  if (!clinic) throw new Error(`No clinic for ${clinicName}`);
  const clinicId = clinic.id;
  try {
    await req(`/ops/clinics/${clinicId}/activate`, { method: 'POST', token: opsToken });
  } catch (error) {
    console.warn('activate', clinicId, error.message);
  }

  let extra;
  try {
    extra = await req('/admin/doctors', {
      method: 'POST',
      token,
      clinicId,
      body: {
        firstName: extraFirst,
        lastName: extraLast,
        phone: extraPhone,
        specialty: spec.nameEn,
        branchName: clinicName,
        languages: ['Arabic'],
      },
    });
  } catch (error) {
    extra = { data: { phone: extraPhone, credentialsWhatsApp: { password: '(already exists)' } } };
    console.warn('extra doctor', extraPhone, error.message);
  }
  let secretary;
  try {
    secretary = await req('/admin/secretaries', {
      method: 'POST',
      token,
      clinicId,
      body: { firstName: secFirst, lastName: secLast, phone: secretaryPhone },
    });
  } catch (error) {
    secretary = { data: { phone: secretaryPhone, credentialsWhatsApp: { password: '(already exists)' } } };
    console.warn('secretary', secretaryPhone, error.message);
  }

  const extraPassword = extra.data?.credentialsWhatsApp?.password || pickPassword(extra.data) || '(generated)';
  const secretaryPassword = secretary.data?.password || secretary.data?.credentialsWhatsApp?.password || pickPassword(secretary.data) || '(generated)';

  const doctors = await req(`/doctors?clinicId=${encodeURIComponent(clinicId)}&limit=20`);
  const doctorId = (doctors.data?.data ?? doctors.data ?? []).find((item) => item.clinicId === clinicId)?.id
    ?? extra.data?.id;

  const patientAccounts = [];
  for (let p = 0; p < PATIENTS.length; p += 1) {
    const [first, last, gender, birth] = PATIENTS[p];
    const patientPhone = specPhone(index, 4 + p);
    const created = await req('/admin/patients', {
      method: 'POST',
      token,
      clinicId,
      body: {
        firstName: first,
        lastName: last,
        email: emailFor(patientPhone, 'patient'),
        phone: patientPhone,
        dateOfBirth: birth,
        gender,
        allergies: [],
        chronicConditions: [],
      },
    });
    try {
      await req('/auth/register', {
        method: 'POST',
        body: {
          firstName: first,
          lastName: last,
          phone: patientPhone,
          password: PASSWORD,
          clinicId,
        },
      });
    } catch (error) {
      console.warn('patient login', patientPhone, error.message);
    }
    const when = new Date(Date.now() + (p + 1) * 36e5).toISOString();
    if (doctorId && created.data?.id) {
      try {
        await req('/appointments', {
          method: 'POST',
          token,
          clinicId,
          body: {
            doctorId,
            branchId: clinicId,
            scheduledAt: when,
            reason: `متابعة ${spec.nameAr}`,
            patientId: created.data.id,
            desk: true,
          },
        });
      } catch (error) {
        console.warn('appointment', spec.id, error.message);
      }
    }
    patientAccounts.push({ name: `${first} ${last}`, phone: patientPhone });
  }

  const row = {
    specialty: spec.nameAr,
    clinic: clinicName,
    clinicId,
    ownerDoctor: { name: `${ownerFirst} ${ownerLast}`, phone: ownerPhone, password: PASSWORD },
    doctor: { name: `${extraFirst} ${extraLast}`, phone: extraPhone, password: extraPassword },
    secretary: { name: `${secFirst} ${secLast}`, phone: secretaryPhone, password: secretaryPassword },
    patients: patientAccounts.map((item) => ({ ...item, password: PASSWORD })),
  };
  accounts.push(row);
  console.log('seeded', spec.nameAr, clinicId);
}

console.log(JSON.stringify({ password: PASSWORD, accounts }, null, 2));
