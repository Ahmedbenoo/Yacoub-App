# Backend Contract Readiness

This document freezes the frontend/domain contracts that a future backend must implement.

It is derived from the current source code and the Master Refactor 4A–4H report.

It does **not** invent product behavior. Where the mock and the types disagree, the disagreement is recorded as an open contract risk.

No public service signatures, query keys, endpoint strings, or seed IDs were changed to produce this document.

## Phase 6 — Future Domain Design

Phase 6 is **design documentation only**. It does not change current frontend or mock behavior.

Detailed proposed contracts live in [backend-domain-design.md](./backend-domain-design.md):

- Electronic Prescription lifecycle (`DRAFT` → `FINALIZED` → `ISSUED`) — now on the application `Prescription` model; create = `DRAFT`; one Issue action
- Future `catalog/medications` ownership — **folders not created**
- Home Care / Home Nursing as a domain **independent of appointments** — **not implemented**
- Proposed APIs marked **Proposed — not implemented**
- No nurse role, nurse routes, pharmacy integration, or home-care UI

Current prescription/lab/visit contracts in the sections below remain the running app’s source of truth until an explicit implementation phase.

## Phase 7 — Backend Architecture & Contract Freeze

Phase 7 is **documentation only**. It does not change the running app.

The architecture blueprint (domain map, frozen `patientId` contract, visit start shape, authorization matrix, API conventions, implementation order, and the freeze rule) lives in [backend-architecture.md](./backend-architecture.md).

Do not treat this readiness file as a duplicate of that blueprint.

## Phase 8 — Contract Decisions

Phase 8 is **documentation only**. It does not change the running app.

Each previously OPEN item is marked **DECIDED** or left **OPEN** in [backend-architecture.md](./backend-architecture.md#phase-8--contract-decisions) (Phase 8 section and summary).

Product follow-up: Decision 5 is **Create = DRAFT**. Decision 6: an **ISSUED** prescription is the shared row (in-place update + soft delete). See the architecture document.

Do not duplicate the decision list here.

---

## 1. Identity

### User ID

- Type: `User.id` (`src/shared/types/models/index.ts`)
- Auth identity. Examples in mock: `user-patient-001`, `user-doctor-001`, `user-admin-001`
- Used for: session, notifications, clinic membership lookup, appointment list filters for the logged-in patient/doctor, patient-clinical **read** calls (`listPrescriptions(userId)`, …)
- Doctor catalog IDs are the same namespace as user IDs (`user-doctor-001` is both `User.id` and `DoctorProfile.id`)

### Patient ID

- Type: `PatientProfile.id`
- Clinical/chart identity. Examples: `patient-001`, `patient-002`
- `PatientProfile.userId` points at the auth user (`user-patient-001`)
- Used for: visit / prescription / lab / history records; doctor/admin/secretary patient routes; Start Visit after `patientsService.getById`

### Doctor ID

- Type: `DoctorProfile.id` / `User.id` for doctor-role users
- Same string in mock (`user-doctor-001`)
- Used for: appointment.doctorId, visit.doctorId, prescription.doctorId, lab.doctorId, availability lookup, doctor appointment filters (`user?.id`)

### Clinic ID

- Type: `User.clinicId`, `Clinic.id`, `Visit.clinicId`, `Appointment.clinicId`
- Active clinic is `useAuthStore.activeClinicId` (client tenancy scope)
- Appointment lists are scoped with `clinicId: activeClinicId`

### Relationships

```
User.id  <── PatientProfile.userId
PatientProfile.id  ← canonical clinical patient key
DoctorProfile.id   ← currently equals User.id for doctors
Clinic.id          ← tenancy key on most records
```

### Canonical future backend IDs (proposal — not implemented)

| Field | Canonical value |
| --- | --- |
| `Appointment.patientId` | `PatientProfile.id` |
| `Visit.patientId` | `PatientProfile.id` |
| `Prescription.patientId` | `PatientProfile.id` |
| `LabRequest.patientId` | `PatientProfile.id` |
| `MedicalHistoryEntry.patientId` | `PatientProfile.id` |
| Session / notifications / “my appointments” | `User.id` via auth, not a client-supplied patientId |

### Current mock mismatch (do not change now)

Appointment **seed** stores `patientId: user-patient-001` (auth id).

Appointment **create** from secretary stores `patient.id` (`patient-001`) after `getById`.

Patient appointment lists filter with `patientId: user?.id` (auth id). That is why seeded appointments appear for the logged-in patient.

Visit/Rx/Lab/History already use `patient-001`.

Start Visit from an appointment calls `patientsService.getById(appointment.patient.id)` then `start({ patientId: patient.id })`. Mock `getById` accepts **either** id.

### Consumers that would need migration later

If the backend stores `Appointment.patientId = PatientProfile.id`:

- `AppointmentsListScreen` patient filter (`user?.id`)
- `DashboardStats` / `TodayOverview` patient filter (`user?.id`)
- Appointment seed data
- Mock `getById` dual-key lookup (`id || userId`)
- `patient-clinical` `resolvePatientId(userId)` (backend should use the session instead of a client userId argument)
- Query keys `patients.prescriptions(userId)` / `labResults(userId)` (hooks pass auth id; keys must stay unless a dedicated query-key phase is approved)

If the backend instead kept appointment.patientId as User.id, visit/Rx/lab would remain on PatientProfile.id and the split would stay permanent. That is **not** recommended; it is recorded as the current accident.

---

## 2. Appointment

### Current model

`Appointment` (`src/shared/types/models/appointment.ts`):

Required: `id`, `clinicId`, `doctorId`, `patientId`, `branchId`, `branchName`, `scheduledAt`, `durationMinutes`, `status`, embedded `doctor` / `patient` participants, `createdAt`, `updatedAt`.

Optional: `reason`, `notes`.

Statuses in code (`AppointmentStatus`): `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`.

### Current lifecycle (what the code actually does)

| Action | Appointment status change? |
| --- | --- |
| create, patient online | `scheduled`, waiting for the secretary. Phase 9 overrides any older “auto-confirmed” sentence. |
| create, secretary desk | `confirmed` immediately |
| confirm | `SCHEDULED` → `CONFIRMED` |
| cancel | → `CANCELLED` (blocked if already completed/cancelled) |
| reschedule | updates `scheduledAt`, sets `CONFIRMED` |
| **start visit** | **does not write appointment** |
| **complete visit** | **does not write appointment** |

`useCompleteVisitMutation` **invalidates** `queryKeys.appointments.all`. That is a React Query refresh, not a mock state transition.

`AppointmentStatus.IN_PROGRESS` is used by:

- doctor appointment status filters
- AppointmentDetailScreen “start visit” eligibility (`SCHEDULED | CONFIRMED | IN_PROGRESS`)

The mock **never assigns** `IN_PROGRESS` on start visit.

Seed inconsistency: `visit-002.appointmentId = appt-006` while `appt-006` is `CANCELLED`.

### Required backend contract

Keep the public methods already exposed:

- `list(filters)` including `doctorId`, `patientId`, `clinicId`, `scope`, `status`
- `getById`, `create`, `cancel`, `confirm`, `reschedule`

`CreateAppointmentPayload`: `doctorId`, `branchId`, `scheduledAt`, `reason`, optional `durationMinutes`, `notes`, `patientId`.

Patient self-booking omits `patientId`; `appointmentsService.create` fills it from the session user (currently the **user** id). Secretary booking sends `patientId: patient.id` (profile id).

### Known ambiguities

1. `Appointment.patientId` auth id vs profile id (section 1).
2. Embedded participant names on seed appointments do not match doctor/patient catalog names.
3. Whether start/complete visit should set `IN_PROGRESS` / `COMPLETED` on the appointment. **Types allow it; mock does not do it.** Do not assume a side effect until the backend contract is decided.
4. Superseded by Phase 9 in `backend-architecture.md`: online booking stays `scheduled` until the secretary confirms. Desk booking is `confirmed` immediately.
5. Create does not write a notification record.

---

## 3. Visit

### Current model

`Visit`: `id`, `patientId`, `doctorId`, `clinicId`, `status` (`in_progress` | `completed`), `startedAt`, `createdAt`, `updatedAt`.

Optional: `appointmentId`, `chiefComplaint`, `diagnosis`, `symptoms`, `notes`, `vitals`, `completedAt`.

`PatientVisitDetail` extends Visit with `doctorName`, `linkedPrescriptionIds`, `linkedLabResultIds` (derived in mock from the unified Rx/Lab arrays).

### Start contract (current frontend — Option C)

Public payload already in code (`StartVisitPayload`):

```ts
{
  appointmentId?: string;
  patientId: string;       // PatientProfile.id after UI lookup
  chiefComplaint?: string;
}
```

This is **not** Option A (`start(appointmentId)` only): `PatientProfileScreen` starts a visit with `{ patientId }` and **no** appointmentId.

This is **not** Option B (`start({ appointmentId, doctorId, clinicId })`): `doctorId` and `clinicId` are **not** on the public payload.

### Current mock implementation

`mockVisitsService.start` hardcodes:

- `doctorId = user-doctor-001`
- `clinicId = clinic-001`
- status `IN_PROGRESS`
- returns existing in-progress visit for the same `patientId` if present

### Required backend contract

Implement the **existing** public start payload (Option C).

The backend should **derive** `doctorId` from the authenticated doctor and `clinicId` from the appointment (if present) or the active clinic. The client does not send those fields today.

Do not require `appointmentId` (walk-in / chart start exists).

### Update contract

`UpdateVisitPayload`: optional `chiefComplaint`, `diagnosis`, `symptoms`, `notes`, `vitals`.

`PATCH /visits/:id`

### Complete contract

`POST /visits/:id/complete` — no body.

Mock sets `status = completed`, `completedAt`, `updatedAt`. Does not update the appointment.

### Relationships

- Optional `appointmentId`
- `patientId` = patient profile id
- `doctorId` / `clinicId` stored on the visit
- Prescriptions and labs reference `visitId`

---

## 4. Prescription

### Current model

`Prescription`:

| Field | Required | Notes |
| --- | --- | --- |
| id | yes | `rx-*` |
| visitId | yes | |
| patientId | yes | patient profile id |
| doctorId | yes | |
| medications | yes | `Medication[]` |
| issuedAt | yes | ISO string; mock sets **now** on create |
| doctorName | no | seed/read convenience; **create does not set it** |
| instructions | no | prescription-level |

`Medication`: `name`, `dosage`, `frequency`, `duration`; optional `instructions`.

**No status field.** Do not add Draft / Finalized / Issued on the frontend until a later lifecycle phase.

### Create input

`CreatePrescriptionPayload`: `{ visitId, medications, instructions? }`

Doctor UI currently sends a **single** medication in `medications: [form]`.

### Read models

| Surface | Method | Source |
| --- | --- | --- |
| Doctor by visit | `prescriptionsService.byVisit(visitId)` | same mock array |
| Patient list/detail | `patientClinicalService.listPrescriptions/getPrescription(userId, id)` | same array, scoped via user→patient |
| Staff getById | `clinicalService.getPrescription(id)` | same array, no patient scope |

### Relationships

Prescription → Visit → Patient. `doctorId` copied from the visit at create time (mock uses hardcoded doctor).

### Future lifecycle considerations (not in current contract)

A later backend may add status, signer, or print/pdf. That is **not** required for the current app. `issuedAt` already means “created/issued immediately” in the mock.

If the backend returns `doctorName`, the patient/staff detail screens will show it; they already treat it as optional.

---

## 5. Lab

### Current frontend model

There is **one type**: `LabRequest`.

There is **no** `LabResult` type.

Optional result-shaped fields live on `LabRequest`:

- `status`: `pending` | `completed` | `cancelled`
- `completedAt?`
- `resultSummary?`
- `doctorName?`

UI naming (“lab result”, routes `/lab-results/[id]`, `linkedLabResultIds`, `listLabResults`) refers to the **same** `LabRequest` id and object.

### Current LabRequest contract

**Create** (`CreateLabRequestPayload`): `visitId`, `type` (`lab` | `imaging`), `testName`, `priority` (`routine` | `urgent`), `notes?`.

Mock create: `status = PENDING`, `requestedAt = now()`, **no** `completedAt` / `resultSummary` / `doctorName`.

**Doctor byVisit:** `labRequestsService.byVisit(visitId)` — all requests for that visit, including pending.

**Patient list/detail / staff getById:** same array. Patient/staff screens render `resultSummary` and `completedAt` when present; pending items still match the type (badge uses status).

**Visit links:** `linkedLabResultIds` = ids of `LabRequest` rows for that visit+patient.

### Result fields

They are optional display fields on the request. The app has **no** public method to attach a result.

### Potential backend separation

Internally the backend **may** store request vs result as two tables.

The **API the current app consumes** is still a single `LabRequest` resource with optional result fields.

Splitting a `LabResult` type in the frontend would require UI, routes, and service changes that this phase forbids.

### Open contract decision

**Recommendation for the current app:** treat the published contract as **one LabRequest entity containing optional result data** (model A).

A later product phase may introduce a result-write API. Until then the backend can:

- return pending requests without result fields, and
- return completed requests with `completedAt` + `resultSummary`

Do not require a separate LabResult collection for the existing screens.

Unresolved: who completes a lab request (lab staff vs doctor vs system). The current app never writes that transition.

---

## 6. Availability

### Current model

`DoctorAvailability`: `doctorId`, `branchId`, `branchName`, `slots[]` where each slot is `{ dayOfWeek, startTime, endTime }`.

`UpdateAvailabilityPayload`: `{ slots }` only.

### Current input / output

| Surface | Input | Output |
| --- | --- | --- |
| Catalog `doctorsService.getAvailability(id)` | doctor id | `DoctorAvailability` |
| Doctor `availabilityService.get/update` | **none** (reads `useAuthStore.user.id`) | same shape; update sends `slots` |

`doctorId` **is** on the response. It is **not** on `UpdateAvailabilityPayload`. The logged-in doctor is implied.

`clinicId` is **not** on the availability type. Branch is (`branchId` / `branchName`).

### Global vs doctor-specific

The **contract** is per `doctorId`.

The **mock** stores **one** slots array and returns it for every doctor id (overlaying that doctor’s branch from the catalog). This is mock-only.

### Booking consumption

`useDoctorAvailabilityQuery(doctorId)` → `generateBookingSlots(availability.slots)` → concrete `scheduledAt` instants.

Booking then sends `CreateAppointmentPayload` with `doctorId`, `branchId` from **DoctorProfile**, and `scheduledAt`. It does not send the weekly slot row.

### Required backend model

- `GET /doctors/:id/availability` returns slots **for that doctor** (and branch metadata)
- `PUT /doctors/:id/availability` (doctor self-update uses session id) replaces weekly slots for **that** doctor
- Booking generates calendar slots client-side from the weekly pattern; the backend must persist per-doctor patterns, not one global pattern

Whether availability is also clinic-specific is **not specified** by the current type (only branch). Do not invent a clinicId on availability until product requires it.

---

## 7. Medical History

### Current fixture

`src/shared/api/mock/history.mock.ts` — static `MedicalHistoryEntry[]`.

Fields: `id`, `patientId` (profile id), `type: 'visit' | 'prescription' | 'lab'`, `title`, `description`, `date`, optional `resourceId`.

`resourceId` is a visit/rx/lab id. Navigation uses `type + resourceId`.

Nothing in the app **writes** history when a visit/Rx/lab is created.

### Current read APIs

- `patientsService.getHistory(patientId)` → `GET /patients/:id/history`
- `patientRecordsService.getMyHistory(userId)` → mock resolves profile then `getHistory`; real path `GET /patients/me/history`

### Recommended backend representation

A **projection / read model** (or event-derived timeline), not a client-written entity.

The frontend never posts history entries. Titles/descriptions in the fixture are denormalized copies of clinical data.

### Why it should not be client-written

The doctor already writes Visit / Prescription / LabRequest. A second client write would duplicate source of truth and drift (the mock already drifted: history is static).

The backend should build history from those entities (or a server-side event log) using the existing `type` + `resourceId` shape.

---

## 8. Service Architecture

### Current state

```
Screens / role UI
  → domain hooks (TanStack Query)
    → domain services (public method names/signatures)
      → if (env.useMockApi) mock module
      → else apiClient + endpoints.*
```

Hooks do **not** import mock files.

Endpoint strings live in `src/shared/api/endpoints.ts` and must stay stable.

### Future target (not implemented)

```
Hooks
  → Domain Service Contract (unchanged method names)
    → Mock adapter  OR  Real API adapter
```

Today the branch is **inside** each service method (`if (env.useMockApi)`). Consumers already depend only on the service object. Replacing the `if` with an injected adapter later does not require hook/UI changes.

### Services already ready for adapter swap

Auth, clinics, patients, patient-records, appointments, visits, prescriptions, lab-requests, patient-clinical, clinical (staff reads), doctors catalog list/detail, notifications, admin.

### Services needing small boundary changes later

These mix **session/store reads** into the service, which a pure HTTP adapter would take from the token/session instead of `useAuthStore`:

- `appointmentsService.create` — reads current user for default patient id / name
- `availabilityService.get/update` — reads current user id
- `authService.getMe/updateProfile/changePassword/logout` — reads token from store in the mock branch
- `patientClinicalService.*` — hooks pass `userId`; real endpoints are `/patients/me/...` and should ignore a client userId

### Mock logic mixed with domain logic

- Dual-key patient lookup (`id || userId`)
- Hardcoded visit `doctorId` / `clinicId` on start
- Global availability slots
- Appointment create resolving patient id two different ways
- History not updated from clinical writes
- `clinicsService.getCities()` / `doctorsService.getSpecialties()` return `[]` on the real-API branch

---

## 9. Known Contract Risks

1. **Appointment.patientId** is auth user id in seed/list filters and patient profile id on secretary create.
2. **patientsService.getById** accepts both ids in mock; a strict backend will break Start Visit / history unless the client is migrated.
3. **Visit.start** public payload has no doctorId/clinicId; mock hardcodes them.
4. **Appointment ↔ Visit** are not synchronized; `IN_PROGRESS` exists on appointments but is never written by start visit.
5. **complete visit** invalidates appointment queries without changing appointment status.
6. **Prescription** has no status; `issuedAt` is set at create; `doctorName` is optional and omitted on create.
7. **LabRequest vs LabResult**: one type, two names in UI/routes; no result-write API.
8. **Availability** contract is per doctor; mock is global.
9. **History** is a static fixture, not a live projection.
10. **Embedded appointment participant names** do not match catalog users.
11. **visit-002** linked to a **cancelled** appointment in seed.
12. **Notifications** are not written on book/cancel/confirm.
13. **getSpecialties / getCities** have no real-API implementation.
14. **Patient clinical service** takes `userId` while REST paths are session-scoped `/me/`.
15. **Doctor id = user id** is a mock convenience; a backend may use a separate practitioner id (would be a breaking change; not implied by current types).
16. Shared shell still imports features (`AppProviders`, `SettingsPanel`, `TabTopBar`, `EditableAvatar`). Not a backend contract issue; leftover layering. Unsafe to move without `app/` import changes (forbidden in this phase).

---

## 10. Backend Implementation Order

Factual dependency order only (not a score):

1. **Auth + session + clinic membership** — every other call is tenant- and user-scoped.
2. **Patients** and **Doctors catalog** — required before appointments and visits can store stable foreign keys.
3. **Doctor availability** (per doctorId) — required before booking can generate real slots.
4. **Appointments** — decide `patientId` canonicalization before writing production data.
5. **Visits** (start/update/complete) — depend on patient + doctor + optional appointment; derive doctor/clinic server-side.
6. **Prescriptions** and **Lab requests** — depend on an existing visit; lab results stay optional fields on LabRequest until a later write API exists.
7. **Medical history projection** — depends on visits, prescriptions, and labs already being stored.
8. **Notifications** — can follow appointments (and later prescriptions/labs) as server-generated events.
9. **Admin stats/reports** — aggregates of the above; mock reports are static fixtures today.

Do not implement the real backend from this document until identity (`Appointment.patientId`) and visit-start derivation are explicitly accepted.
