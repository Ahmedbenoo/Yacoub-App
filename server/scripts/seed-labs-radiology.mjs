const BASE = 'https://yacoub-api.onrender.com/api/v1';
const PASSWORD = 'password123';

const places = [
  {
    kind: 'lab',
    firstName: 'حسام',
    lastName: 'منير',
    gender: 'male',
    phone: '01581000001',
    placeName: 'معمل البرج',
    street: 'مدينة نصر',
    specialty: 'Clinical Pathology',
    fee: 180,
  },
  {
    kind: 'lab',
    firstName: 'دينا',
    lastName: 'كامل',
    gender: 'female',
    phone: '01581000011',
    placeName: 'معمل المختبر',
    street: 'المهندسين',
    specialty: 'Clinical Pathology',
    fee: 200,
  },
  {
    kind: 'lab',
    firstName: 'عمر',
    lastName: 'سلامة',
    gender: 'male',
    phone: '01581000021',
    placeName: 'معمل ألفا',
    street: 'المعادي',
    specialty: 'Clinical Pathology',
    fee: 160,
  },
  {
    kind: 'radiology',
    firstName: 'نادر',
    lastName: 'فهمي',
    gender: 'male',
    phone: '01581000031',
    placeName: 'مركز القاهرة للأشعة',
    street: 'مدينة نصر',
    specialty: 'Radiology',
    fee: 350,
  },
  {
    kind: 'radiology',
    firstName: 'منى',
    lastName: 'شريف',
    gender: 'female',
    phone: '01581000041',
    placeName: 'مركز النيل للأشعة',
    street: 'الزمالك',
    specialty: 'Radiology',
    fee: 400,
  },
  {
    kind: 'radiology',
    firstName: 'ياسر',
    lastName: 'عدلي',
    gender: 'male',
    phone: '01581000051',
    placeName: 'مركز الرنين التشخيصي',
    street: 'التجمع الخامس',
    specialty: 'Radiology',
    fee: 450,
  },
];

async function req(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
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

const created = [];

for (const place of places) {
  const email = `${place.phone.replace(/\D/g, '')}.center@yacoub.test`;
  let owner;
  try {
    owner = await req('/auth/register-owner', {
      method: 'POST',
      body: {
        firstName: place.firstName,
        lastName: place.lastName,
        email,
        phone: place.phone,
        gender: place.gender,
        password: PASSWORD,
        placeKind: 'center',
        placeName: place.placeName,
        clinicPhone: place.phone,
        street: place.street,
        city: 'Cairo',
        specialty: place.specialty,
        openingHours: '٨ صباحاً – ١٠ مساءً',
        consultationFee: place.fee,
        practices: true,
      },
    });
    console.log('registered', place.placeName);
  } catch (error) {
    if (!String(error.message).includes('PHONE_EXISTS')) throw error;
    owner = await req('/auth/login', { method: 'POST', body: { identifier: place.phone, password: PASSWORD } });
    console.log('exists', place.placeName);
  }

  const token = owner.data.accessToken;
  const clinics = await req('/clinics', { token });
  const clinic = (clinics.data ?? []).find((item) => item.name === place.placeName) ?? clinics.data?.[0];
  if (!clinic) throw new Error(`No clinic for ${place.placeName}`);

  created.push({
    kind: place.kind,
    name: place.placeName,
    specialty: clinic.specialty,
    id: clinic.id,
    phone: place.phone,
    owner: `${place.firstName} ${place.lastName}`,
    isActive: clinic.isActive,
    approvalStatus: clinic.approvalStatus,
    placeKind: clinic.placeKind,
  });
}

const search = await req('/clinics/search?limit=50');
const items = search.data?.data ?? search.data ?? [];
const labs = items.filter((item) => item.specialty === 'Clinical Pathology');
const radiology = items.filter((item) => item.specialty === 'Radiology');

console.log(JSON.stringify({ created, labs: labs.map((item) => item.name), radiology: radiology.map((item) => item.name) }, null, 2));
