# Backend Architecture

**Phase 7 — architecture blueprint and contract freeze.**

Design / documentation only. No backend, database, API client, or application code is implemented by this document.

Sources of truth for current and proposed contracts:

- [backend-contract-readiness.md](./backend-contract-readiness.md) — current app contracts and mock/API gaps (Phases 5–6 index)
- [backend-domain-design.md](./backend-domain-design.md) — Electronic Prescription and Home Care design (Phase 6)

This document **freezes** backend domain ownership, identity, and relationships that implementation must follow. Phase 7 listed unresolved items in [§15](#15-open--must-be-decided-before-backend-implementation). Phase 8 reviews each decision and marks **DECIDED** or **OPEN** — see [Phase 8 — Contract Decisions](#phase-8--contract-decisions). Do not treat an OPEN item as decided.

Principle:

> Roles consume domains. Domains do not belong to roles.

Current application roles: `patient`, `doctor`, `admin`, `secretary`.  
Future actors (documentation only): nurse, pharmacy. Do not add them to the app.

---

## 1. Domain map

| Domain | Owns | Consumed by |
| --- | --- | --- |
| **Auth** | User account, credentials, session, profile-of-account | All roles |
| **Clinic / Tenancy** | Clinic, membership, active tenant context | All clinic-owned domains |
| **Catalog / Doctors** | DoctorProfile, per-doctor availability | Patient booking, secretary booking, admin staff, doctor self |
| **Catalog / Clinics** | Public clinic discovery (search/detail) | Patient guest/search |
| **Catalog / Medications** | Medication reference data (future; folder not created) | Prescription authoring |
| **Patients** | PatientProfile | Clinical, appointments, home care, admin/secretary |
| **Appointments** | Appointment scheduling lifecycle | Patient, doctor, secretary, admin |
| **Clinical / Visits** | Clinic Visit | Doctor, patient, staff reads |
| **Clinical / Prescriptions** | Prescription + PrescriptionItem | Doctor, patient, staff; future pharmacy |
| **Clinical / Lab Orders** | LabRequest (optional result fields) | Doctor, patient, staff |
| **Home Care** | Services, requests, assignments, nursing visits, addresses | Patient, secretary/admin; future nurse |
| **Notifications** | User-targeted notifications | All authenticated roles |
| **Admin / Reporting** | Stats and reports (aggregates / read models) | Admin |

Home Care is **not** a subtype of Appointments.

Medical history is **not** a write domain. It is a read model over clinical (and later home-care) sources.

---

## 2. Core entities

| Entity | Purpose | Owner domain | Primary ID | Important FKs | Truth | Lifecycle |
| --- | --- | --- | --- | --- | --- | --- |
| **User** | Authentication account | Auth | `User.id` | `clinicId` (default/home tenant; membership is authoritative) | Source of truth for account | Account active / credentials |
| **Clinic** | Tenant organization | Clinic / Tenancy | `Clinic.id` | — | Source of truth | `isActive` |
| **ClinicMembership** | User ↔ clinic access | Clinic / Tenancy | membership id | `userId`, `clinicId`, role(s) in tenant | Source of truth | Join / leave / role change. Current mock uses a static user→clinic map. Exact membership schema is not frozen beyond these keys. |
| **DoctorProfile** | Practitioner catalog + clinical author | Catalog / Doctors | `DoctorProfile.id` | `clinicId`, `branchId` | Source of truth for catalog | Active / inactive. Whether `id` equals `User.id` is **OPEN**. |
| **PatientProfile** | Clinical chart identity | Patients | `PatientProfile.id` | `userId` → `User.id`, `clinicId` | Source of truth for the patient | Create / update / deactivate |
| **Appointment** | Scheduled clinic encounter | Appointments | `Appointment.id` | `patientId` → **PatientProfile.id**, `doctorId`, `clinicId`, `branchId` | Source of truth | `scheduled` → `confirmed` → … See [§5](#5-appointment--visit-relationship). |
| **Visit** | In-clinic clinical encounter | Clinical / Visits | `Visit.id` | `patientId` → PatientProfile.id, `doctorId`, `clinicId`, `appointmentId?` | Source of truth | `in_progress` → `completed` |
| **Prescription** | Electronic prescription | Clinical / Prescriptions | `Prescription.id` | `patientId`, `doctorId`, `clinicId`, `visitId?` | Source of truth | Proposed: `DRAFT` → `FINALIZED` → `ISSUED` |
| **PrescriptionItem** | Line snapshot on a prescription | Clinical / Prescriptions | item id | `prescriptionId`, optional `medicationId` | Source of truth (immutable after issue) | Follows parent prescription |
| **LabRequest** | Lab/imaging order; optional result fields | Clinical / Lab Orders | `LabRequest.id` | `visitId`, `patientId`, `doctorId`, `clinicId` | Source of truth | `pending` → `completed` \| `cancelled`. Who writes the result is **OPEN**. |
| **HomeCareService** | Offered home-care service | Home Care | service id | `clinicId` | Source of truth | `active` flag. Pricing units **OPEN**. |
| **HomeCareRequest** | Patient request for a home service | Home Care | request id | `patientId` → PatientProfile.id, `serviceId`, `addressId`, `clinicId` | Source of truth | See [§9](#9-home-care-contract). **Not** an Appointment. |
| **NursingAssignment** | Nurse assigned to a request | Home Care | assignment id | `requestId`, `nurseId` (future actor) | Source of truth | Assignment status **OPEN** |
| **NursingVisit** | In-home encounter | Home Care | nursing visit id | `requestId`, `nurseId` | Source of truth | Distinct from clinic `Visit`. `clinicalData` schema **OPEN**. |
| **HomeCareAddress** | Patient service address | Home Care | address id | `patientId` | Source of truth | Storage/geo model **OPEN** |
| **Notification** | In-app notice to a user | Notifications | notification id | `userId` → **User.id** | Source of truth for the notice | Unread / read. Generation rules **OPEN**. |
| **MedicalHistoryEntry** | Timeline card | Patients (read API) | entry id | `patientId`, `resourceId?` | **Derived / read model** | Not client-written |

No extra fields are introduced here beyond those already in readiness / domain-design.

---

## 3. Identity contract

`User.id` and `PatientProfile.id` are **separate identities**. Do not merge them.

| Identity | Meaning | Example (current mock; do not change the app) |
| --- | --- | --- |
| `User.id` | Authentication / account | `user-patient-001` |
| `PatientProfile.id` | Clinical patient | `patient-001` |
| `PatientProfile.userId` | Link chart → account | `user-patient-001` |

Session, notifications, and “who is logged in” use `User.id`.

Clinical and scheduling foreign keys listed in [§4](#4-appointment--patient-id-decision) use `PatientProfile.id`.

Doctor identity: mock uses the same string for `User.id` and `DoctorProfile.id` (`user-doctor-001`). Whether the backend keeps that coincidence is **OPEN** (item 18).

---

## 4. Appointment / patient ID decision

**Backend contract (frozen):**

| Field | Value |
| --- | --- |
| `Appointment.patientId` | `PatientProfile.id` |
| `Visit.patientId` | `PatientProfile.id` |
| `Prescription.patientId` | `PatientProfile.id` |
| `LabRequest.patientId` | `PatientProfile.id` |
| `HomeCareRequest.patientId` | `PatientProfile.id` |

Current application / mock **does not** fully match this. Do **not** change mock or frontend in this phase.

Documented mismatch (readiness §1):

- Appointment **seed** uses `user-patient-001`
- Secretary **create** uses `patient.id` (`patient-001`)
- Patient appointment **list filters** send `user?.id`

Frontend consumers that will need a later migration are listed in readiness §1. Backend “my appointments” must resolve the logged-in user → `PatientProfile` server-side rather than trusting a client `patientId` of the wrong type.

---

## 5. Appointment / Visit relationship

```
Appointment  ──optional──►  Visit
```

- A Visit **may** reference an Appointment (`Visit.appointmentId` **optional**).
- A Visit **may** be a walk-in with no Appointment (`PatientProfileScreen` already starts `{ patientId }` only).
- Starting a visit does **not** create an appointment.

### Appointment / Visit Lifecycle Decision

**Current application (factual):**

| Action | Appointment row | Visit row |
| --- | --- | --- |
| Book / confirm / cancel / reschedule | Written by appointment service | Unchanged |
| Start visit | **Not updated** (mock) | Created `in_progress` |
| Complete visit | **Not updated** (mock); React Query **invalidates** appointment lists | Set `completed` |

`AppointmentStatus.IN_PROGRESS` exists in frontend types and doctor filters. The mock **never writes** it.

Seed: `visit-002.appointmentId = appt-006` while `appt-006` is `CANCELLED`.

**The mock behavior is not automatically the final backend behavior.**

**Contract decision required before implementation** (do not guess):

1. Does `start visit` with `appointmentId` set the appointment to `in_progress`?
2. Does `complete visit` set that appointment to `completed`?
3. Can a visit exist on a cancelled appointment?
4. Can more than one visit exist per appointment?
5. Does walk-in start ever create an appointment? (**Proposed default from current UI: no.**)

Until those answers are written here as accepted decisions, implementers must not silently add or omit appointment side effects.

---

## 6. Visit contract

**PROPOSED — NOT IMPLEMENTED** as a new HTTP surface beyond the existing frontend methods.

Existing public start shape (Option C; keep):

```
POST /visits
{
  appointmentId?: string,
  patientId: string,
  chiefComplaint?: string
}
```

- `patientId` is `PatientProfile.id`.
- `doctorId` and `clinicId` are **not** trusted from the client. Derive `doctorId` from the authenticated doctor. Derive `clinicId` from the appointment (if present) or the session/membership tenant.
- Walk-in visits **must** be supported (`appointmentId` omitted).
- Update: `PATCH /visits/:id` with optional notes/vitals/diagnosis (existing `UpdateVisitPayload`).
- Complete: `POST /visits/:id/complete` (no body).

Mock hardcodes `doctorId` / `clinicId`. That is mock-only.

---

## 7. Prescription contract

From [backend-domain-design.md](./backend-domain-design.md).

**Belongs to:** PatientProfile, DoctorProfile, Clinic, optional Visit.

**Lifecycle (now in application types):**

```
DRAFT → FINALIZED → ISSUED
```

UI uses one doctor action **Issue prescription** that applies `DRAFT → FINALIZED → ISSUED` atomically. `FINALIZED` remains a real status; it is not a separate doctor screen.

`PrescriptionItem` / `Medication` stores a **medication snapshot** (name, dosage, frequency, duration, instructions). Patient and secretary read the **same** `Prescription` row.

**Product rule:** `ISSUED` is **not** immutable. The doctor updates or soft-deletes that same record; patient and secretary see the updated (or hidden) row.

**PROPOSED — NOT IMPLEMENTED**

| Method | Path | Intent |
| --- | --- | --- |
| `POST` | `/prescriptions` | Create draft |
| `PATCH` | `/prescriptions/:id` | Edit draft only |
| `POST` | `/prescriptions/:id/finalize` | Draft → finalized |
| `POST` | `/prescriptions/:id/issue` | Finalized → issued |
| `GET` | `/patients/:patientId/prescriptions` | Authorized list |
| `GET` | `/prescriptions/:id` | Detail |

Do not implement pharmacy integration.

Existing app endpoints (`POST /prescriptions`, `GET /visits/:visitId/prescriptions`, `/patients/me/prescriptions`, `/clinical/prescriptions/:id`) stay until a dedicated frontend migration.

**OPEN (do not guess):** pharmacy model; QR/token; legal revocation vs soft delete; catalog structure; controlled medications.

---

## 8. Lab contract

Published API for the current app: **one `LabRequest` entity** with optional `completedAt`, `resultSummary`, `doctorName`.

Do **not** introduce a separate `LabResult` resource unless a later documented decision requires it. Internal storage may split tables; the API shape stays `LabRequest`.

Statuses already in the app: `pending` | `completed` | `cancelled`.

Create (existing): `visitId`, `type`, `testName`, `priority`, `notes?`. Mock create is `pending` with no result fields.

**OPEN:** Who is authorized to create/update the laboratory result (doctor vs lab staff vs system)? The current app has **no** result-write method.

---

## 9. Home Care contract

From [backend-domain-design.md](./backend-domain-design.md).

Domain: `home-care`. Independent of Appointments. **Do not** model a request as an Appointment. Do **not** add a clinical `Visit` FK now.

| Entity | Notes |
| --- | --- |
| HomeCareService | Tenant catalog |
| HomeCareRequest | `patientId` = PatientProfile.id |
| NursingAssignment | `nurseId` = future nurse actor |
| NursingVisit | In-home encounter ≠ clinic Visit |
| HomeCareAddress | Patient address |

**Proposed request lifecycle (not in frontend code):**

```
REQUESTED → CONFIRMED → ASSIGNED → IN_PROGRESS → COMPLETED
```

Alternative terminals: `CANCELLED`, `REJECTED`.

Whether `CONFIRMED` is required is **OPEN**.

**Do not** create a nurse role, routes, or UI. `nurseId` may exist on the backend model only.

**PROPOSED — NOT IMPLEMENTED:** `GET /home-care/services`, `POST /home-care/requests`, `GET /home-care/requests/:id`, `GET /patients/:patientId/home-care/requests`, `POST .../assign|start|complete|cancel`.

---

## 10. Clinic / tenancy

Every clinic-owned business entity carries tenant context and is isolated per clinic.

At minimum:

- Appointments
- Visits
- Prescriptions
- LabRequests
- HomeCareRequests
- HomeCareServices

Clinic context is **derived from authenticated membership / session** and **validated by the backend**.

Do not trust an arbitrary `clinicId` (or `branchId` that implies another tenant) supplied by the client.

Notifications are keyed by `User.id` and may be tenant-scoped when generated; generation rules are **OPEN**.

---

## 11. Authorization

Conceptual only. **Do not implement RBAC in this phase.**

Legend: Y = allowed for own/authorized tenant scope · — = no · **OPEN** = not defined in existing docs.

| Domain / action | Patient | Doctor | Secretary | Admin | Future nurse | Future pharmacy |
| --- | --- | --- | --- | --- | --- | --- |
| Auth profile read/update (self) | Y | Y | Y | Y | Y (if role exists) | — |
| Clinic membership switch (if multi) | Y | Y | Y | Y | **OPEN** | — |
| Doctor catalog read | Y | Y | Y | Y | **OPEN** | — |
| Doctor catalog write | — | **OPEN** (self bio?) | **OPEN** | Y (current admin APIs) | — | — |
| Availability read | Y | Y | Y | Y | — | — |
| Availability update | — | Y (self) | **OPEN** | **OPEN** | — | — |
| Patient profile create | register/self | — | Y | Y | — | — |
| Patient profile read | self | authorized | authorized | authorized | assigned only **OPEN** | — |
| Patient profile update/deactivate | self (limited) | **OPEN** | **OPEN** | Y | — | — |
| Appointment create | self | **OPEN** | Y (for patient) | **OPEN** | — | — |
| Appointment read | own | own schedule | tenant | tenant | — | — |
| Appointment confirm/cancel/reschedule | cancel own **if rules allow** | confirm/cancel/reschedule **if rules allow** | tenant rules | tenant rules | — | — |
| Visit start | — | Y | — | — | — | — |
| Visit update/complete | — | Y (own/authorized) | — | **OPEN** | — | — |
| Visit read | own | authorized | **OPEN** | staff read exists | — | — |
| Prescription create / finalize / issue | — | Y per backend auth | — | **OPEN** | — | — |
| Prescription read | **issued**, own | authorized | **OPEN** | staff read exists | — | after issue **OPEN** |
| LabRequest create | — | Y (on visit) | — | **OPEN** | — | — |
| LabRequest result update | — | **OPEN** | — | **OPEN** | — | — |
| LabRequest read | own | authorized | **OPEN** | staff read exists | — | — |
| HomeCareRequest create/read (own) | Y | **OPEN** | **OPEN** | **OPEN** | assigned **OPEN** | — |
| HomeCare assign / start / complete | — | **OPEN** | **OPEN** | **OPEN** | assigned **OPEN** | — |
| HomeCare cancel | own **OPEN** | **OPEN** | **OPEN** | **OPEN** | **OPEN** | — |
| Notifications read/mark | own | own | own | own | own | — |
| Admin stats/reports | — | — | **OPEN** | Y | — | — |

Secretary vs admin home-care permissions are a **future permission model** (domain-design §3).

---

## 12. API conventions

No new framework. Conventions for a future REST API that matches current `endpoints.ts` style.

| Topic | Convention |
| --- | --- |
| Resource naming | Plural nouns, kebab-case where already used (`lab-requests`, `home-care`) |
| IDs | Opaque server-generated strings; clients do not mint production IDs |
| Lifecycle writes | Dedicated verbs: `POST …/confirm`, `…/cancel`, `…/complete`, `…/finalize`, `…/issue`, `…/assign`, `…/start` — not ad-hoc status patches unless already existing (`PATCH` visit notes) |
| Tenant | From session/membership; reject cross-tenant IDs |
| `/me` | Session-scoped patient/doctor “my” collections (existing pattern) |
| Timestamps | ISO 8601 strings; server sets `createdAt` / `updatedAt` / `issuedAt` / `completedAt` |
| Pagination | Existing `{ data, meta: { page, limit, total, totalPages } }` |
| Filtering / sorting | Query params already used (`status`, `scope`, `doctorId`, `patientId`, `clinicId`, search). Default sort remains domain-specific (appointments by `scheduledAt`; history newest first) |
| Validation errors | `400` + `{ code, message, details? }` |
| Auth errors | `401` unauthorized; `403` forbidden |
| Not found | `404` + code `NOT_FOUND` (current mock shape) |
| Conflict | `409` for illegal status transitions / duplicate in-progress visit (mock already returns existing in-progress visit — **OPEN** whether 200-return or 409) |
| Envelope | Existing `{ success, data, message? }` |

Do not invent GraphQL, RPC, or event-sourcing APIs for this freeze.

---

## 13. Query / read model

History is a **read model / projection**, not a source of truth. Clients never POST history rows.

| Timeline type | Derived from |
| --- | --- |
| Visit cards | Visit |
| Prescription cards | Prescription |
| Lab cards | LabRequest |
| Home Care cards (future) | HomeCareRequest / NursingVisit |

Do **not** implement event sourcing. Server-side lifecycle facts may later feed the same `{ type, resourceId, title, description, date }` shape used by `MedicalHistoryEntry`.

`PatientVisitDetail.linkedPrescriptionIds` / `linkedLabResultIds` are also derived reads, not stored visit columns.

Admin stats/reports are aggregates (current mock reports are static fixtures).

---

## 14. Frontend adapter boundary

Intended architecture (not implemented as a new layer in this phase):

```
UI
  ↓
Hooks
  ↓
Domain Services          ← public method names stay
  ↓
Backend Adapter          ← mock today; HTTP later
  ↓
HTTP API
```

Current `if (env.useMockApi)` inside domain services already hides mock vs HTTP from screens. The future real backend replaces the adapter. Screens must not learn HTTP details.

Do not modify current services in this phase.

---

## 15. OPEN — MUST BE DECIDED BEFORE BACKEND IMPLEMENTATION

Do not resolve these by guessing.

1. Appointment ↔ Visit status transition rules ([§5](#appointment--visit-lifecycle-decision))
2. Lab result author / update permissions
3. Prescription create → Draft vs Issue mapping (current UI create sets `issuedAt` immediately)
4. Pharmacy integration model
5. Prescription QR / token
6. Prescription revocation after issue
7. Medication catalog structure
8. Controlled medication / legal requirements
9. Home Care pricing
10. Home Care scheduling / slots
11. Home Care branch / service availability
12. Home Care address model
13. Home Care cancellation / refund rules
14. Home Care payment model
15. Nurse profile ownership
16. Future nurse authorization
17. Whether Home Care may reference a clinical Visit (not added now)
18. `DoctorProfile.id` vs `User.id` relationship

Related leftovers (not blockers for the first auth/tenant slice, still unresolved): notification generation; conflict behavior for a second in-progress visit; availability clinic-vs-branch scope. Patient booking is **not** auto-`CONFIRMED` — see Phase 9.

---

## 16. Implementation order

| # | Stage | Depends on |
| --- | --- | --- |
| 1 | Auth | — |
| 2 | Clinic / Membership / Tenancy | Auth |
| 3 | Patient profiles | Auth + tenancy |
| 4 | Doctor catalog / profile | Tenancy |
| 5 | Medication catalog | Tenancy (can be empty catalog at first) |
| 6 | Per-doctor availability | Doctor catalog |
| 7 | Appointments | Patient + doctor + availability + **frozen `patientId`** |
| 8 | Visits | Patient + doctor + optional appointment + **lifecycle decision §5** |
| 9 | Prescriptions | Visit (current UI) + patient + doctor + optional catalog + **draft vs issue decision** |
| 10 | Lab Orders | Visit + **result-author decision** if results are stored |
| 11 | Home Care | Patient + tenancy; **not** appointments. Pricing/schedule/nurse decisions before production money/ops |
| 12 | Notifications | Users; typically after appointments exist |
| 13 | History / read models | Visits + prescriptions + labs (+ later home care) |
| 14 | Admin aggregates / reporting | The write domains being aggregated |

Do not start Home Care or pharmacy until their OPEN items that affect storage are decided. Do not start Appointments until `Appointment.patientId = PatientProfile.id` is accepted by frontend migration planning.

---

## 17. Contract Freeze Rule

After this document is **approved**, backend implementation must not change entity relationships or lifecycle semantics casually.

Any contract change must be:

1. Written into this file (and readiness / domain-design if current-app vs future-app differs)
2. Then implemented deliberately

Mock and frontend remain unchanged until an explicit implementation or migration phase says otherwise.

---

# Phase 8 — Contract Decisions

Documentation only. No application or backend code changed.

Each item below is either **DECIDED** from existing architecture / already-frozen contracts, or left **OPEN** because it needs a real business, product, legal, or operational choice. Decisions were not forced merely to shorten the OPEN list.

Existing Phase 7 sections above remain in force. Phase 8 does not silently overwrite them.

---

### Decision 1 — Patient identity

| | |
| --- | --- |
| **Status** | **DECIDED** |
| **Contract** | `User.id` = authentication / account identity. `PatientProfile.id` = clinical patient identity. They are not merged. `Appointment.patientId`, `Visit.patientId`, `Prescription.patientId`, `LabRequest.patientId`, `HomeCareRequest.patientId` = `PatientProfile.id`. Session / notifications use `User.id`. |
| **Reason** | Frozen in Phase 5 readiness and Phase 7 §3–§4. Current mock mismatch (appointment seed uses `user-patient-001`) is a frontend/mock migration issue, not a reopening of the contract. |
| **Implementation impact** | Backend stores clinical FKs as patient profile ids. “My appointments” resolves `User` → `PatientProfile` server-side. Do not change the app in this phase. |

---

### Decision 2 — Appointment ↔ Visit

| | |
| --- | --- |
| **Status** | **DECIDED** — Model A. Locked 2026-10-14. |
| **Contract** | An Appointment may have a Visit. A Visit may reference an Appointment. Walk-in Visit is supported. `Visit.appointmentId` is optional. Starting a visit does not create an Appointment. When `appointmentId` is set, start visit sets that appointment to `in_progress` (from `scheduled`, `confirmed`, or already `in_progress`). Completing that visit sets the appointment to `completed`. A visit with no `appointmentId` does not create or change an appointment. Check-in is not start-visit and does not set `in_progress`. |
| **Reason** | Product lock. The appointment screen already treats `in_progress` as a state from which the doctor can start the visit. The mock still does not write the appointment on start/complete; that lag is a migration, not the contract. |
| **Implementation impact** | The backend owns the status side effect inside start visit and complete visit. Do not change the mock in this documentation step. |

---

### Decision 3 — Start Visit

| | |
| --- | --- |
| **Status** | **DECIDED** |
| **Contract** | `POST /visits` body `{ appointmentId?: string, patientId: string, chiefComplaint?: string }`. `patientId` is `PatientProfile.id`. `doctorId` and `clinicId` come from authenticated doctor + tenant/appointment context. Not on the client payload. Walk-in = omitted `appointmentId`. |
| **Reason** | Matches current `StartVisitPayload` (Phase 5 Option C, Phase 7 §6). PatientProfileScreen already starts without an appointment. |
| **Implementation impact** | Backend rejects client-supplied doctor/clinic impersonation. Mock hardcoding of those fields is mock-only. |

---

### Decision 4 — Doctor identity

| | |
| --- | --- |
| **Status** | **DECIDED** (identity model) |
| **Contract** | `User.id` = authentication identity. `DoctorProfile.id` = professional / clinical profile identity. They are **not** the same concept and must not be merged. Link account → profile the same way as patients (`DoctorProfile.userId` → `User.id`). Appointment / Visit / Prescription / Lab `doctorId` refers to `DoctorProfile.id`. |
| **Reason** | Same split already frozen for patients. Catalog/doctors is a domain; Auth is a domain. Mock using one string (`user-doctor-001`) for both is a convenience, not a contract that they are one entity (Phase 7 item 18 is thereby resolved **architecturally**). |
| **Implementation impact** | Backend may use distinct ids. Frontend/mock coincidence can remain until a migration. Do not change code now. |

---

### Decision 5 — Prescription creation mapping

| | |
| --- | --- |
| **Status** | **DECIDED** — Option A |
| **Contract** | `POST /prescriptions` creates `DRAFT`. `issuedAt` is unset until issue. Doctor edits drafts. One UI action **Issue prescription** runs `DRAFT → FINALIZED → ISSUED` atomically (`POST /prescriptions/:id/issue`). Patient and secretary see only `ISSUED` (not deleted) rows. |
| **Reason** | Explicit product decision: create starts as draft; finalize is not a separate doctor button. |
| **Implementation impact** | Current app and mock follow this contract. |

---

### Decision 6 — Prescription immutability

| | |
| --- | --- |
| **Status** | **DECIDED** (product override of earlier append-only idea). Legal revocation / QR = Decisions 7–8 (**OPEN**). |
| **Contract** | After `ISSUED`, the doctor may **update the same prescription** (`PATCH /prescriptions/:id`) or **soft-delete** it (`deletedAt`). Patient and secretary do not keep a private copy; they reread this row. Updates stay `ISSUED` on the same `id`. Soft delete hides the row from their lists. Medication fields remain stored on the prescription so it can be shown without a live catalog. |
| **Reason** | Product requires edits and deletes to appear immediately for patient and secretary. |
| **Implementation impact** | Do not treat `ISSUED` as immutable. Do not add `revokedAt` unless Decision 8 is closed. |

---

### Decision 7 — Prescription QR / token

| | |
| --- | --- |
| **Status** | **OPEN — PRODUCT / PHARMACY INTEGRATION DECISION** |
| **Contract (if adopted later)** | Token / QR is **backend-generated** and verifiable. Not minted by the client. |
| **Reason** | No pharmacy channel is specified. Do not assume QR exists. |
| **Implementation impact** | None now. Do not implement QR. |

---

### Decision 8 — Prescription revocation

| | |
| --- | --- |
| **Status** | **OPEN** |
| **Contract (concepts only, not types)** | A future workflow *might* use `revokedAt`, `revokedBy`, `revocationReason`. Not added to application types. |
| **Reason** | Legal/product choice. Phase 6 left revoke-after-issue unresolved. |
| **Implementation impact** | None now. Issued immutability (Decision 6) still holds until a workflow exists. |

---

### Decision 9 — Medication catalog

| | |
| --- | --- |
| **Status** | **DECIDED** — domain separation. Catalog **fields / regulatory shape** = **OPEN**. |
| **Contract** | `catalog/medications` is separate from Prescription. `PrescriptionItem` stores the snapshot used after issue. Catalog edits must not rewrite issued items. |
| **Reason** | Phase 6 ownership and snapshot rules. Exact codes, forms, strengths, units are unspecified. |
| **Implementation impact** | Can persist prescriptions with free-text snapshots before a rich catalog exists. Do not create the catalog folder in the app now. |

---

### Decision 10 — Controlled medications

| | |
| --- | --- |
| **Status** | **OPEN — LEGAL / REGULATORY DECISION** |
| **Contract** | Implementation must follow the applicable jurisdiction and pharmacy / regulatory requirements. No special behavior is specified here. |
| **Reason** | Documents explicitly forbid inventing legal rules. |
| **Implementation impact** | Do not implement controlled-substance logic until legal input exists. |

---

### Decision 11 — Lab result ownership

| | |
| --- | --- |
| **Status** | **OPEN — BUSINESS / OPERATIONAL DECISION** |
| **Contract (entity)** | Published API remains one `LabRequest` with optional result fields. No `LabResult` resource unless later documented. |
| **Open question** | Who may create/update the result? |
| **Candidates (not selected)** | Laboratory staff; doctor; other authorized clinic staff; external laboratory integration. |
| **Reason** | Current app never writes a result. No actor is proven. |
| **Implementation impact** | Orders can be stored as `pending`. Result write API waits on this decision. Do not implement RBAC now. |

---

### Decision 12 — Home Care vs Appointment

| | |
| --- | --- |
| **Status** | **DECIDED** |
| **Contract** | `HomeCareRequest` is **not** an Appointment. Home Care is an independent domain. It does not reuse appointment status or booking slots as its primary model. |
| **Reason** | Phase 6 and Phase 7 §9. |
| **Implementation impact** | Separate resources and tables. No `Appointment.type = home_care`. |

---

### Decision 13 — Home Care scheduling

| | |
| --- | --- |
| **Status** | **OPEN — OPERATIONS DECISION** |
| **Contract** | Not selected. Candidates: (A) fixed service slots, (B) staff/nurse availability, (C) clinic/branch availability, (D) dynamically generated capacity. Must not silently reuse clinic Appointment slots. |
| **Reason** | No operations model in existing docs. |
| **Implementation impact** | `scheduledAt` can exist as a requested time; slot generation waits. |

---

### Decision 14 — Home Care pricing

| | |
| --- | --- |
| **Status** | **OPEN — BUSINESS DECISION** |
| **Contract** | Not selected. Candidates: fixed per service; branch-specific; distance-based; nurse-specific; dynamically calculated; insurance-based. `NursingService.price` remains a nominal placeholder. |
| **Reason** | Phase 6 open pricing. |
| **Implementation impact** | Do not treat mock/example prices as production rules. |

---

### Decision 15 — Home Care payment

| | |
| --- | --- |
| **Status** | **OPEN — BUSINESS / PAYMENT DECISION** |
| **Contract** | Not selected. Possible collection: at request; at confirmation; before visit; after completion; cash; online; mixed. |
| **Reason** | No payment domain exists in the app or prior docs. |
| **Implementation impact** | No payment API in the first Home Care slice unless this is decided. |

---

### Decision 16 — Home Care address

| | |
| --- | --- |
| **Status** | **DECIDED** (ownership). Storage / snapshot strategy = **OPEN**. |
| **Contract** | `HomeCareAddress` belongs to the patient. `HomeCareRequest` references the selected address (`addressId`). |
| **Open** | Snapshot the address onto the request; keep a mutable reference; or both. Do not assume either. |
| **Reason** | Ownership is in Phase 6. Snapshot vs reference was left open. |
| **Implementation impact** | Address CRUD can exist; request persistence of historical address waits on the strategy. |

---

### Decision 17 — Nurse profile

| | |
| --- | --- |
| **Status** | **OPEN — PRODUCT / HR / AUTHORIZATION DECISION** |
| **Contract (not implemented)** | A future nurse **may** be `User` + `NurseProfile`. `NursingAssignment.nurseId` / `NursingVisit.nurseId` are future actor refs. |
| **Reason** | No nurse role, routes, or HR model. Do not create `UserRole.NURSE`. |
| **Implementation impact** | Backend may store an opaque `nurseId` later. No app role now. |

---

### Decision 18 — Home Care ↔ clinical Visit

| | |
| --- | --- |
| **Status** | **OPEN** |
| **Contract** | Home Care is independent **by default**. Do **not** add `HomeCareRequest.visitId` unless a demonstrated business requirement is documented later. |
| **Reason** | Phase 6: optional clinical visit link “must not be added now.” No requirement has appeared. |
| **Implementation impact** | No FK in the initial Home Care schema. |

---

### Decision 19 — Clinic / branch / doctor availability

| | |
| --- | --- |
| **Status** | **DECIDED** — must not be one global slot collection. Exact owner combination = **OPEN**. |
| **Contract** | Backend persists availability **per doctor** at minimum (`GET/PUT /doctors/:id/availability`). The current type includes `branchId` / `branchName`, not `clinicId`. |
| **Open** | Whether the authoritative scope is doctor only, doctor+clinic, doctor+branch, or a combination. |
| **Reason** | Mock global slots are documented as mock-only. Current contract is per `doctorId`. Clinic-vs-branch was never specified. |
| **Implementation impact** | Do not ship a single clinic-wide slot table. Per-doctor rows are enough to replace the mock. |

---

### Decision 20 — History

| | |
| --- | --- |
| **Status** | **DECIDED** |
| **Contract** | History is a read model / projection, not a source of truth. Clients do not write it. Sources: Visits, Prescriptions, LabRequests, and later HomeCareRequest / NursingVisit. |
| **Reason** | Phase 5 §7, Phase 6 §5, Phase 7 §13. |
| **Implementation impact** | Build history after write domains exist. Do not implement history now. Do not change `history.mock.ts`. |

---

### Decision 21 — Notifications

| | |
| --- | --- |
| **Status** | **OPEN** (triggers / generation) |
| **Contract** | Existing notification **read / mark-read** resources stay. `Notification.userId` = `User.id`. This phase does not redesign notifications. |
| **Examples only (not a trigger list)** | Appointment created or changed; prescription issued; home-care request confirmed; nurse assigned; home-care visit completed. |
| **Reason** | Current mock does not write notifications on book/cancel/confirm. No trigger table is specified. |
| **Implementation impact** | Can ship notification storage/list without generators. Do not implement triggers now. |

---

### Decision 22 — Tenancy

| | |
| --- | --- |
| **Status** | **DECIDED** — architectural principle. Exact multi-branch behavior = **OPEN**. |
| **Contract** | Clinic-owned business data is tenant-aware. Backend derives and validates clinic context from authenticated membership. Do not trust an arbitrary client `clinicId`. Applies at least to Appointments, Visits, Prescriptions, LabRequests, HomeCareRequests, HomeCareServices. |
| **Open** | Branch-level isolation vs clinic-level isolation for availability, home-care services, and reporting. |
| **Reason** | Phase 7 §10. Branch catalog exists; rules for branch-as-tenant are not written. |
| **Implementation impact** | First slice: membership + clinicId checks. Branch rules later. |

---

### Decision 23 — Authorization

| | |
| --- | --- |
| **Status** | **DECIDED** — principle. Exact permission matrix = **OPEN** where business rules are undefined. |
| **Contract** | Authentication identifies the user. Authorization determines what the user can access or do. Roles consume domains. Conceptual matrix in Phase 7 §11 is a starting sketch, not a complete RBAC spec. |
| **Reason** | Many cells are already marked OPEN (secretary vs admin home care, lab result write, nurse, pharmacy). |
| **Implementation impact** | Do not implement RBAC in this phase. Enforce session + tenant + “own patient / own doctor” as minimum when APIs appear. |

---

## Phase 8 Summary

### Counts

**23 decisions reviewed.** Mixed items have a DECIDED principle and a separate OPEN remainder; they are not forced closed.

| Bucket | Count | Decisions |
| --- | --- | --- |
| **Fully DECIDED** | **6** | 1, 3, 4, 5, 12, 20 |
| **DECIDED principle + OPEN remainder** | **6** | 6, 9, 16, 19, 22, 23 |
| **Fully OPEN** | **11** | 2, 7, 8, 10, 11, 13, 14, 15, 17, 18, 21 |
| **DECIDED items** (full + principles) | **13** | 1, 2, 3, 4, 5, 6, 9, 12, 16, 19, 20, 22, 23 |
| **OPEN questions remaining** | **15** | listed below |

### OPEN list (implementation must not guess)

1. Prescription QR / token (Decision 7)
2. Prescription legal revocation workflow (Decision 8; soft delete is already decided)
3. Medication catalog field/regulatory schema (Decision 9 remainder)
4. Controlled medications (Decision 10)
5. Lab result author (Decision 11)
6. Home Care scheduling model (Decision 13)
7. Home Care pricing (Decision 14)
8. Home Care payment (Decision 15)
9. Home Care address snapshot vs reference (Decision 16 remainder)
10. Nurse profile / HR / future role (Decision 17)
11. Home Care optional clinical Visit FK (Decision 18)
12. Availability doctor vs clinic vs branch combination (Decision 19 remainder)
13. Notification triggers (Decision 21)
14. Multi-branch tenancy rules (Decision 22 remainder)
15. Full authorization matrix (Decision 23 remainder)

### Classification

| Kind | Decisions |
| --- | --- |
| **Architecture** | 1, 3, 4, 5, 6 (shared mutable issued row + soft delete), 9 (separation), 12, 16 (ownership), 19 (not global), 20, 22 (tenant derivation), 23 (authn ≠ authz) |
| **Business / product / workflow** | 2 (decided), 7, 8, 14, 15, 16 (snapshot), 18, 21, 23 (matrix) |
| **Legal / regulatory** | 10, 8 (if revoke is regulated), 9 remainder (controlled catalog fields) |
| **Operational** | 11, 13, 17, 19 remainder, 22 remainder |

### Prerequisites before backend implementation

**Already decided — required to start the first slices**

- Patient and doctor identity splits (1, 4)
- Start Visit payload and server-derived doctor/clinic (3)
- Prescription create = DRAFT; one Issue action; in-place update + soft delete (5, 6)
- Tenancy derivation (22)
- History as projection (20)
- Home Care ≠ Appointment (12)

**Must be decided before the named stage (still OPEN)**

| Before implementing | Need |
| --- | --- |
| Visits that touch appointments | **Decided** — Decision 2 / Phase 9 |
| Three-state prescriptions | **Decided** — create DRAFT; one Issue action |
| Lab results (not just pending orders) | Decision 11 |
| Issued-prescription pharmacy/QR | Decisions 7, 8, 10 |
| Production Home Care money/ops | Decisions 13–17 |
| Per-branch availability rules | Decision 19 remainder |

Auth, clinic membership, patient profiles, and doctor catalog can proceed on DECIDED items alone. Mock and frontend stay unchanged until an explicit migration phase.

---

# Phase 9 — v1 clinic lock (2026-10-14)

Product lock before the first backend table. This section overrides older sentences that say patient booking is stored as `CONFIRMED` immediately.

The running mock is **not** migrated in this step. Where the mock still disagrees, the disagreement is debt, not the contract.

### 1. Patient id on an appointment

`Appointment.patientId` is `PatientProfile.id`. It is not `User.id`.

“My appointments” resolves the logged-in user to their patient profile on the server. Seed rows and list filters that still use `user-patient-001` are mock debt.

### 2. How an appointment is created

| Who books | Stored status | Next step |
| --- | --- | --- |
| Patient, online | `scheduled` | Waits for the secretary. `awaiting` is the secretary. |
| Secretary, at the desk | `confirmed` | Confirmed immediately. A WhatsApp confirmation is queued. |

Secretary confirm moves `scheduled` → `confirmed`. There is no path that auto-confirms an online booking.

### 3. Visit writes the appointment

Locked as Decision 2, Model A.

- Start visit with `appointmentId` → that appointment becomes `in_progress`.
- Complete that visit → that appointment becomes `completed`.
- Start visit without `appointmentId` does not create an appointment and does not change one.
- Check-in (same calendar day, invoice, queue) is not start-visit and does not set `in_progress`.

### 4. Clinic images are files

`logoUrl` is the logo. `photoUrls[0]` is the cover. `photoUrls` after the first item are the clinic gallery.

The backend stores those as files and returns URLs. A data URL in the mock is not the storage model. Replacing the cover replaces index 0 only and does not change `logoUrl`. Replacing the logo does not change `photoUrls`.

### 5. WhatsApp

The app records the outbound confirmation and reminder the product already defines (including “ميعادك النهاردة” / “ميعادك بكرة” / “ميعادك”). v1 persists that log. A live Meta WhatsApp connection is out of v1. There is no bot.

### 6. Money

SaaS plan prices and subscription collection stay outside the app. The in-clinic invoice accepts `cash`, `instapay`, and `wallet` only. Doctor share on the invoice is visible to the doctor and the admin, not to the patient or the secretary.
