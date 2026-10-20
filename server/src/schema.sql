CREATE TABLE IF NOT EXISTS clinics (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE,
  phone text UNIQUE,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  locale text NOT NULL DEFAULT 'ar',
  is_email_verified boolean NOT NULL DEFAULT false,
  is_phone_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  clinic_id text NOT NULL REFERENCES clinics(id),
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, clinic_id, role)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stamp_url text;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id text PRIMARY KEY,
  email text NOT NULL,
  otp_hash text NOT NULL,
  reset_token_hash text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS description_ar text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS street_ar text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city_ar text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS country_ar text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS location_url text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS consultation_fee integer;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS opening_hours text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS photo_urls text NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS doctors (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id),
  clinic_id text NOT NULL REFERENCES clinics(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  specialty text NOT NULL,
  bio text,
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  years_experience integer NOT NULL DEFAULT 0,
  branch_id text NOT NULL,
  branch_name text NOT NULL,
  avatar_url text,
  languages text NOT NULL DEFAULT '[]',
  share_percent integer,
  is_active boolean NOT NULL DEFAULT true,
  offers_home_visits boolean NOT NULL DEFAULT false,
  slot_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_slots (
  id text PRIMARY KEY,
  doctor_id text NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  UNIQUE (doctor_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY,
  user_id text,
  clinic_id text NOT NULL REFERENCES clinics(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  blood_type text,
  allergies text NOT NULL DEFAULT '[]',
  chronic_conditions text NOT NULL DEFAULT '[]',
  last_visit_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics(id),
  doctor_id text NOT NULL REFERENCES doctors(id),
  patient_id text NOT NULL REFERENCES patients(id),
  branch_id text NOT NULL,
  branch_name text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL,
  reason text,
  notes text,
  source text,
  awaiting text,
  queue text,
  queue_number integer,
  arrived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id text PRIMARY KEY,
  appointment_id text REFERENCES appointments(id),
  patient_id text NOT NULL REFERENCES patients(id),
  doctor_id text NOT NULL REFERENCES doctors(id),
  clinic_id text NOT NULL REFERENCES clinics(id),
  status text NOT NULL,
  chief_complaint text,
  diagnosis text,
  symptoms text,
  notes text,
  vitals text NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id),
  clinic_id text NOT NULL REFERENCES clinics(id),
  doctor_id text NOT NULL REFERENCES doctors(id),
  patient_id text NOT NULL REFERENCES patients(id),
  patient_name text NOT NULL,
  doctor_name text NOT NULL,
  amount integer NOT NULL,
  doctor_share_percent integer NOT NULL,
  doctor_share integer NOT NULL,
  clinic_share integer NOT NULL,
  payment_method text,
  status text NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id text PRIMARY KEY,
  visit_id text NOT NULL REFERENCES visits(id),
  patient_id text NOT NULL REFERENCES patients(id),
  doctor_id text NOT NULL REFERENCES doctors(id),
  doctor_name text,
  number text,
  clinic_id text,
  clinic_name text,
  clinic_name_ar text,
  clinic_logo_url text,
  doctor_signature_url text,
  doctor_stamp_url text,
  medications text NOT NULL DEFAULT '[]',
  instructions text,
  status text NOT NULL,
  issued_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_requests (
  id text PRIMARY KEY,
  visit_id text NOT NULL REFERENCES visits(id),
  patient_id text NOT NULL REFERENCES patients(id),
  doctor_id text NOT NULL REFERENCES doctors(id),
  doctor_name text,
  type text NOT NULL,
  test_name text NOT NULL,
  priority text NOT NULL,
  notes text,
  status text NOT NULL,
  result_summary text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id),
  clinic_id text NOT NULL,
  patient_id text NOT NULL,
  kind text NOT NULL,
  body text NOT NULL,
  status text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  to_phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS to_phone text;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS owner_user_id text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS place_kind text NOT NULL DEFAULT 'clinic';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id text;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS offers_home_visits boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS staff_whatsapp (
  id text PRIMARY KEY,
  to_phone text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  message_key text,
  data text NOT NULL DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  doctor_id text NOT NULL,
  appointment_id text NOT NULL UNIQUE,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nursing_requests (
  id text PRIMARY KEY,
  patient_user_id text NOT NULL,
  patient_name text NOT NULL,
  patient_phone text,
  service_id text NOT NULL,
  service_ids text NOT NULL DEFAULT '[]',
  address text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL,
  price_min integer,
  price_max integer,
  price integer,
  patient_notified boolean NOT NULL DEFAULT false,
  nurse_user_id text,
  nurse_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nurse_profiles (
  user_id text PRIMARY KEY,
  email text,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  proof text NOT NULL DEFAULT '',
  verification text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS home_visit_requests (
  id text PRIMARY KEY,
  patient_user_id text NOT NULL,
  patient_name text NOT NULL,
  patient_phone text,
  specialty text NOT NULL,
  address text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL,
  price integer,
  doctor_id text,
  doctor_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pregnancies (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinic_id text NOT NULL,
  author_user_id text NOT NULL,
  status text NOT NULL,
  lmp text NOT NULL,
  edd text,
  gravida integer,
  para integer,
  risk_notes text,
  outcome text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS obgyn_encounters (
  id text PRIMARY KEY,
  visit_id text NOT NULL UNIQUE,
  payload text NOT NULL
);

CREATE TABLE IF NOT EXISTS ultrasound_reports (
  id text PRIMARY KEY,
  lab_request_id text NOT NULL UNIQUE,
  payload text NOT NULL
);

CREATE TABLE IF NOT EXISTS clinical_attachments (
  id text PRIMARY KEY,
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newborn_links (
  id text PRIMARY KEY,
  pregnancy_id text NOT NULL UNIQUE,
  mother_patient_id text NOT NULL,
  child_patient_id text NOT NULL,
  delivered_at timestamptz NOT NULL,
  clinic_id text NOT NULL,
  author_user_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS vaccination_doses (
  id text PRIMARY KEY,
  child_patient_id text NOT NULL,
  label text NOT NULL,
  due_at timestamptz NOT NULL,
  status text NOT NULL
);

CREATE TABLE IF NOT EXISTS device_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
