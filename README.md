# Clinify — Smart Clinic Management

Production-ready React Native / Expo mobile application for multi-tenant clinic management.

## Tech Stack

- **React Native** + **Expo SDK 57**
- **Expo Router** (file-based navigation)
- **TypeScript** (strict)
- **NativeWind v4** (Tailwind CSS)
- **Zustand** (client state)
- **TanStack Query** (server state)
- **React Hook Form** + **Zod** (forms & validation)
- **i18next** (EN / AR localization + RTL)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo Go app (mobile) or Android Studio / Xcode (simulators)

### Installation

```bash
cd doctors-app
npm install
cp .env.example .env   # if .env doesn't exist
npm start
```

### Run

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator (macOS only)
npm run web       # Web browser
```

## Project Structure

```
doctors-app/
├── app/                    # Expo Router routes (thin re-exports)
│   ├── (auth)/             # Unauthenticated flows
│   ├── (doctor)/           # Doctor role tabs
│   ├── (patient)/          # Patient role tabs
│   └── (admin)/            # Admin role tabs
├── src/
│   ├── features/           # Feature modules (auth, doctor, patient, admin)
│   ├── shared/             # Shared UI, API, i18n, stores, theme
│   └── config/             # Environment config
└── docs/                   # Architecture documentation
```

## Mock Authentication (Phase 1)

Set `EXPO_PUBLIC_USE_MOCK_API=true` in `.env`.

| Email | Password | Role |
|-------|----------|------|
| `doctor@clinic.com` | `password123` | Doctor |
| `patient@clinic.com` | `password123` | Patient |
| `admin@clinic.com` | `password123` | Admin |
| `multi@clinic.com` | `password123` | Doctor + Admin (role selection) |

**Forgot password OTP:** `123456`

## Phase 1 Features

- [x] Project scaffold with TypeScript strict mode
- [x] NativeWind design system + core UI components
- [x] EN / AR localization + RTL infrastructure
- [x] Light / Dark / System theme
- [x] Zustand stores (auth, theme, locale, app)
- [x] API client + mock auth service
- [x] Auth flow screens (onboarding → login → register → forgot → OTP → reset)
- [x] Role-based navigation with route guards
- [x] Placeholder tabs for Doctor, Patient, Admin roles

## Phase 2 Features (Authentication)

- [x] `auth/me` session validation on app bootstrap
- [x] Token refresh flow (401 interceptor + mock/real support)
- [x] Persisted active role across app restarts (multi-role users)
- [x] Connected forgot-password flow (email → OTP → reset token → new password)
- [x] OTP resend with cooldown timer
- [x] TanStack Query hooks (`useAuthMeQuery`, logout/resend mutations)
- [x] Session expired handler → auto-redirect to login
- [x] Logout loading state + graceful API failure handling
- [x] Platform-aware secure storage (SecureStore native / AsyncStorage web)

## Phase 3 Features (Appointments Core)

- [x] `Appointment` and `Notification` domain models
- [x] Mock appointments + notifications API
- [x] Appointments & notifications services + TanStack Query hooks
- [x] Shared UI: `AppointmentCard`, `AppointmentStatusBadge`, `AppointmentList`, `Badge`
- [x] Doctor dashboard — today's appointments + notifications preview
- [x] Patient home — upcoming appointments + notifications preview
- [x] Appointments tabs (doctor, patient, admin) with upcoming/past filters
- [x] Appointment detail screen with stack routes `[id]`
- [x] Patient cancel + reschedule (mock API)
- [x] Loading, empty, error, skeleton, and pull-to-refresh states
- [x] EN / AR `appointments` i18n namespace

## Phase 4 Features (Doctor Module)

- [x] Patient domain models (profile, medical history, visit, prescription, lab request, availability)
- [x] Mock patients + doctor clinical API (visits, Rx, lab requests, availability)
- [x] Patients service + doctor services with TanStack Query hooks
- [x] Doctor UI: `PatientCard`, `PatientList`, `MedicalHistoryList`
- [x] Patients tab — searchable list with pull-to-refresh
- [x] Patient profile — demographics, allergies, medical history, start visit
- [x] Visit screen — clinical notes, vitals, prescriptions, lab requests, complete visit
- [x] Availability screen — weekly schedule toggle per day
- [x] Stack routes: `patients/[id]`, `visits/[id]`, `availability`
- [x] Doctor appointment detail actions — view patient profile, start visit
- [x] EN / AR `doctor` i18n namespace + validation keys

## Phase 5 Features (Patient Module)

- [x] `DoctorProfile` type + mock doctors API (search, specialty filter, detail)
- [x] Doctor search tab — searchable list with specialty chips
- [x] Doctor profile screen — bio, rating, languages, book CTA
- [x] Booking flow — availability slots, reason form, create appointment API
- [x] `CreateAppointmentPayload` + mock/real appointment create
- [x] Medical records tab — patient profile summary + history list
- [x] `/patients/me` resolver (user id → patient profile)
- [x] Patient profile tab — demographics, allergies, conditions
- [x] Stack routes: `doctors/[id]`, `doctors/[id]/book`
- [x] EN / AR `patient` i18n namespace + booking validation keys

## Phase 6 Features (Admin Module)

- [x] `ClinicStats` and `ClinicReport` domain models
- [x] Mock admin API — aggregated clinic stats + reports
- [x] Admin dashboard — KPI grid, upcoming appointments, reports preview
- [x] Doctors tab — searchable list + read-only doctor profile
- [x] Patients tab — searchable list + read-only patient profile with history
- [x] Appointments tab (all clinic appointments, view detail)
- [x] Stack routes: `doctors/[id]`, `patients/[id]`
- [x] EN / AR `admin` i18n namespace

## Phase 7 Features (Production Hardening)

- [x] Environment validation (Zod) + monitoring hooks (`EXPO_PUBLIC_ENABLE_MONITORING`, optional Sentry DSN)
- [x] Global error boundary with retry UI
- [x] Offline detection banner (`@react-native-community/netinfo`)
- [x] Push notifications setup (`expo-notifications`) + device token registration
- [x] Push notification toggle in Settings
- [x] Full notifications screen — list, mark read, mark all read, pull-to-refresh
- [x] Deep link from push / notification tap → appointment detail
- [x] Mutation error capture + query client hardening
- [x] Maestro E2E smoke flows (`.maestro/`)

### E2E (Maestro)

```bash
# Install Maestro CLI, then from doctors-app/
maestro test .maestro/smoke-launch.yaml
maestro test .maestro/patient-login.yaml
```

## Phase 8 Features (Multi-tenancy & Offline Cache)

- [x] Mock clinics API — multi-clinic access for admin / multi-role users
- [x] `ClinicSwitcher` component + clinic selection screen after login
- [x] Persisted active clinic (`AsyncStorage` + `X-Clinic-Id` header)
- [x] Post-auth navigation resolves role → clinic → home
- [x] TanStack Query offline persistence (`PersistQueryClientProvider` + AsyncStorage)
- [x] Offline-first query `networkMode` + 24h cache retention
- [x] Settings — clinic switcher + API mode indicator
- [x] EN / AR `clinic` i18n namespace

**Try multi-clinic:** log in as `admin@clinic.com` or `multi@clinic.com` (password: `password123`).

## Phase 9 Features (Clinic-Scoped Data & Discovery)

- [x] Centralized mock clinic constants + `getMockClinicScope()` helper
- [x] Clinic-scoped mock data — doctors, patients, appointments, admin stats/reports filter by active clinic
- [x] Seeded `clinic-002` data (2 doctors, 1 patient, 3 appointments)
- [x] Patient search hub — **Clinics | Doctors** segmented tab
- [x] Clinic search API + `ClinicCard`, `ClinicList` components
- [x] Clinic profile screen — contact info + doctors at clinic
- [x] Route: `clinics/[id]` under patient stack
- [x] Admin dashboard shows active clinic name; KPIs change on clinic switch
- [x] Tenant-isolated query keys for admin stats/reports and appointments
- [x] Settings language/theme labels fully i18n (EN/AR)

**Try clinic discovery:** log in as `patient@clinic.com` → Search tab → Clinics.

## Phase 10 Features (Clinical Records & UX Polish)

- [x] Patient prescriptions API + detail screen (medications, dosage, instructions)
- [x] Patient lab results API + detail screen (status, summary, dates)
- [x] Records tab filters — All | Prescriptions | Lab results | Visits
- [x] Tappable history entries navigate to detail routes
- [x] Routes: `records/prescriptions/[id]`, `records/lab-results/[id]`
- [x] Shared `ConfirmDialog` component (replaces native Alert for cancel appointment)
- [x] Auth require-cycle fix — `auth-store.ts` + `active-role.ts` split from session barrel
- [x] Maestro E2E — `.maestro/patient-records.yaml`
- [x] EN / AR patient clinical i18n keys

**Try records:** log in as `patient@clinic.com` → Records → tap a prescription or lab result.

## Phase 11 Features (Admin Actions & Profile Edit)

- [x] Admin report detail — metrics, highlights, summary
- [x] Tappable reports list → `reports/[id]` route
- [x] Admin appointment confirm + cancel actions on detail screen
- [x] `PATCH /auth/profile` mock + real endpoint wiring
- [x] Edit profile screen (all roles) with form validation
- [x] Settings → Edit Profile link
- [x] EN / AR i18n for reports detail, appointment confirm, profile edit
- [x] Maestro E2E — `.maestro/admin-report-detail.yaml`

**Try admin reports:** log in as `admin@clinic.com` → Dashboard → tap a report.

**Try profile edit:** any role → More/Profile tab → Edit Profile.

## Phase 12 Features (Visit Detail & Account Security)

- [x] Patient visit detail — chief complaint, diagnosis, vitals, linked Rx/lab
- [x] Tappable visit records → `records/visits/[id]` route
- [x] In-app change password from Settings (all roles)
- [x] Doctor appointment confirm + cancel (parity with admin)
- [x] Avatar picker in edit profile
- [x] EN / AR i18n for visit detail, change password, avatar
- [x] Maestro E2E — updated `.maestro/patient-records.yaml`

**Try visit detail:** log in as `patient@clinic.com` → Records → tap "General checkup".

**Try change password:** any role → Settings → Change Password (current: `password123`).

## Phase 13 Features (Admin Operations & Clinical Navigation)

- [x] Tappable medical history for doctor/admin patient profiles
- [x] Staff clinical record routes — prescriptions, lab results, visits (read-only for admin)
- [x] Admin edit doctor + patient profiles (mock PATCH)
- [x] Full admin reports list screen with dashboard “View all”
- [x] Admin appointment status filters (All | Scheduled | Confirmed | Completed | Cancelled)
- [x] Appointment mutation i18n + Toast error polish (removed last Alert.alert)
- [x] EN / AR i18n for admin edit, reports list, appointment filters

**Try admin edit:** `admin@clinic.com` → Patients → open patient → Edit Patient.

**Try history navigation:** `doctor@clinic.com` → Patients → open patient → tap a prescription in history.

## Phase 14 Features (i18n Polish, Admin Create Staff & Filter Parity)

- [x] Mutation toast i18n sweep — auth, admin, and doctor hooks
- [x] Admin create doctor + patient (mock POST, forms, routes)
- [x] Shared `ProfileHeroCard` + localized age/gender subtitle
- [x] Doctor & patient appointment status filters (role-specific sets)
- [x] Maestro E2E for Phase 13 flows + fixed `admin-report-detail` appId
- [x] EN / AR i18n for create staff, toasts, profile subtitles

**Try create doctor:** `admin@clinic.com` → Doctors → Add → fill form → Create Doctor.

**Try appointment filters:** log in as doctor or patient → Appointments → tap status chips.

## Phase 15 Features (Admin Deactivate, Notification Prefs & Doctor E2E)

- [x] Admin deactivate doctor + patient (ConfirmDialog, mock PATCH, list filter)
- [x] Notification category preferences (persisted toggles in Settings)
- [x] Gender/day name i18n refactor + BookAppointment doctor title fix
- [x] Shared `ProfileInfoRow` component
- [x] Doctor & patient Maestro — appointment filter flows
- [x] Maestro — admin create doctor branch select
- [x] EN / AR i18n for deactivate, notification categories, gender/days

**Try deactivate:** `admin@clinic.com` → Doctors → open doctor → Deactivate Doctor.

**Try notification prefs:** any role → Profile/More → Settings → toggle notification categories.

## Phase 16 Features (Reactivate Staff, Notification Prefs Integration & E2E Gaps)

- [x] Admin reactivate doctor + patient (mock PATCH, detail action, toast)
- [x] Show inactive toggle on admin doctor/patient lists (`includeInactive` filter)
- [x] Notification prefs applied to preview, tab badge, push handler + shared filter helper
- [x] Specialty `FormSelect` on create/edit doctor + stricter patient DOB validation
- [x] testIDs on login, appointment confirm/start, deactivate/reactivate, create submit
- [x] Maestro — doctor confirm/start visit, admin deactivate, complete create doctor/patient flows
- [x] EN / AR i18n for reactivate, show inactive, specialty placeholder, DOB validation

**Try reactivate:** deactivate a doctor → Doctors → Show inactive → open profile → Reactivate Doctor.

**Try notification badge:** disable Appointment notifications in Settings → badge/preview hide appointment alerts.

## Phase 17 Features (Patient E2E, Staff Lifecycle Maestro & Settings Polish)

- [x] Maestro — admin reactivate doctor (deactivate → show inactive → reactivate cycle)
- [x] Maestro — admin deactivate patient + admin edit doctor
- [x] Maestro — patient book appointment + cancel appointment flows
- [x] Maestro — notification category prefs (home preview hides filtered alerts)
- [x] testIDs on booking, cancel/reschedule, ConfirmDialog, notification prefs/badge
- [x] Settings language labels i18n + localized vitals BP placeholder

**Try book appointment:** `patient@clinic.com` → Search → Doctors → Dr. Mona Farid → Book appointment.

**Try notification prefs E2E:** `patient@clinic.com` → Home (see alert) → Profile → toggle Appointments off → Home shows empty notifications.

## Development Phases

| Phase | Scope |
|-------|-------|
| **1** | Foundation (complete) |
| **2** | Authentication (complete) |
| **3** | Appointments core + shared infrastructure (complete) |
| **4** | Doctor module (complete) |
| **5** | Patient module (complete) |
| **6** | Admin module (complete) |
| **7** | Production hardening (complete) |
| **8** | Multi-tenancy & offline cache (complete) |
| **9** | Clinic-scoped data & patient clinic discovery (complete) |
| **10** | Clinical records detail & confirmation UX (complete) |
| **11** | Admin report detail, appointment confirm/cancel, profile edit (complete) |
| **12** | Visit detail, change password, doctor actions, avatar picker (complete) |
| **13** | Admin operations, clinical navigation, edit profiles, reports list (complete) |
| **14** | i18n toast polish, admin create staff, ProfileHeroCard, filter parity (complete) |
| **15** | Admin deactivate, notification prefs, formatter i18n, ProfileInfoRow, E2E (complete) |
| **16** | Reactivate staff, notification prefs integration, create polish, E2E gaps (complete) |
| **17** | Patient booking/cancel E2E, staff lifecycle Maestro, testIDs, settings i18n (complete) |

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full architecture details.

**Arabic project guide (features, tech stack, issues & fixes):** [docs/PROJECT_GUIDE.ar.md](./docs/PROJECT_GUIDE.ar.md)

## Build APK (Android)

The project is configured for **EAS Build** with a `preview` profile that outputs an **APK** (not AAB).

### Option A — Cloud build (recommended)

Requires a free [Expo account](https://expo.dev/signup).

```bash
cd doctors-app
npx eas-cli login          # if not already logged in
npm run build:apk
```

When the build finishes, EAS prints a download link for the `.apk` file.

**Expected APK size:** ~35–45 MB (arm64-only, optimized). Older universal builds were ~100 MB because they bundled all CPU architectures.

### Option B — Local build

Requires **Java 17+**, **Android SDK**, and admin install of Android Studio or command-line tools.

```bash
npx eas-cli login
npm run build:apk:local
```

### Android package name

`com.clinify.app` (set in `app.json`)

## Path Aliases

`@/*` maps to `src/*` — e.g. `@/shared/components/ui/Button`.
