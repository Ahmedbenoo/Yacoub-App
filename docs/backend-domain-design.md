# Backend Domain Design

**Phase 6 — design / contract documentation only.**

This document proposes **future** domain models for:

1. Electronic Prescription
2. Home Nursing / Home Care

It does **not** change the running application.

- No frontend types, services, hooks, screens, routes, query keys, or mock behavior were modified for this phase.
- No backend, database, pharmacy, nurse role, or home-care UI is implemented.
- Existing contracts in [backend-contract-readiness.md](./backend-contract-readiness.md) remain the source of truth for **current** app behavior.

Current vs proposed:

| Topic | Current app (frozen) | This document |
| --- | --- | --- |
| Prescription status | none; `issuedAt` set on create | proposed `DRAFT` → `FINALIZED` → `ISSUED` |
| Prescription items | `Medication[]` inline on `Prescription` | proposed `PrescriptionItem` snapshots + future medication catalog |
| `clinicId` on prescription | not on current `Prescription` type | proposed tenant field |
| Home care | does not exist | proposed independent domain |
| Nurse role | not in `UserRole` | proposed future actor only |

---

## 1. Electronic Prescription

The existing domain is `clinical/prescriptions`. The current public methods remain `create` and `byVisit`, plus patient/staff reads. Those stay as they are until a later implementation phase.

This section describes how that domain can evolve toward a real electronic prescription lifecycle **without** changing frontend behavior yet.

### 1.1 Ownership (proposed)

| Owner | Owns |
| --- | --- |
| `clinical/prescriptions` | Prescription domain behavior (create, edit draft, finalize, issue, read) |
| `catalog/medications` | Medication catalog / reference data (**do not create this folder yet**) |
| `patients` | Patient identity / profile |
| `catalog/doctors` | Doctor profile |
| `clinic` | Clinic / tenant context |
| `clinical/visits` | Visit relationship |

Do not move existing files for this ownership map.

### 1.2 Proposed entity: Prescription

Relationships:

- `patientId` — patient chart identity (`PatientProfile.id` in the canonical identity proposal)
- `doctorId` — authoring doctor
- `clinicId` — tenant / clinic
- `visitId` — optional clinical visit (current app always sets it on create; walk-in-without-visit is not a current frontend path)

Proposed core fields:

| Field | Meaning |
| --- | --- |
| `id` | Prescription id |
| `patientId` | Patient the prescription belongs to |
| `doctorId` | Authoring doctor |
| `clinicId` | Tenant / clinic |
| `visitId` | Linked visit when present |
| `issuedAt` | Set when the prescription is **issued** in the future lifecycle. Current mock sets this on create; do not change that now. |
| `status` | Proposed only: `DRAFT` \| `FINALIZED` \| `ISSUED` |
| `items` | Line items (`PrescriptionItem[]`) |

`status` is now on the application `Prescription` model (`DRAFT` | `FINALIZED` | `ISSUED`).

### 1.3 Proposed entity: PrescriptionItem

Conceptual fields:

| Field | Meaning |
| --- | --- |
| `id` | Line id |
| `medicationId` | Optional catalog reference (nullable if free-text / catalog miss) |
| `medicationName` | **Snapshot** of the name at issue time |
| `dosage` | Snapshot |
| `frequency` | Snapshot |
| `duration` | Snapshot |
| `quantity` | Proposed; not on the current `Medication` type |
| `instructions` | Per-item instructions (already optional on current `Medication`) |

Once **issued**, item snapshots are immutable. Reconstructing an issued prescription must not require a live catalog row.

### 1.4 Proposed catalog: Medication

Future structure (not created):

```
catalog/
  medications/
```

Medication is reference data (name, form, strength, identifiers). Catalog updates must not rewrite issued `PrescriptionItem` snapshots.

Exact catalog schema (codes, controlled-substance flags, units) is an **open decision**.

### 1.5 Proposed lifecycle

```
Doctor
  ↓
Create Prescription
  ↓
DRAFT
  ↓
FINALIZED
  ↓
ISSUED
  ↓
Patient / Pharmacy
```

| Status | Intent |
| --- | --- |
| `DRAFT` | Editable by the authorized doctor; not visible to patient/secretary |
| `FINALIZED` | Real lifecycle state after the doctor confirms content; not a separate UI step |
| `ISSUED` | Released to patient and secretary. Same row stays editable/soft-deletable by the doctor |

Exact transition permissions (who may finalize/issue, whether skip-draft is allowed, whether issue is automatic on finalize) are **backend authorization responsibilities**. Do not encode them in the current app.

Pharmacy consumption happens **after ISSUED**. Pharmacy workflow is not decided in this phase.

### 1.6 Design rules

1. Prescription belongs to a patient.
2. Prescription is authored by a doctor.
3. Prescription may be linked to a clinical visit.
4. Prescription belongs to a clinic/tenant.
5. Prescription stores medication fields on the same row so patient/secretary can reread it after issue or later doctor edits.
6. Medication catalog data should not be required to reconstruct an already issued prescription.
7. Therefore `medicationName` and relevant instructions should be stored/snapshotted on `PrescriptionItem`.
8. Prescription history should be server-readable (read model / projection; not a client-written ledger).
9. Patient should only see prescriptions authorized for that patient.
10. Doctor should only create/finalize/issue prescriptions according to backend authorization.
11. Pharmacy integration can be added later without redesigning the core Prescription entity.

### 1.7 Proposed prescription APIs

**Proposed — not implemented.**  
Do not change existing endpoints (`POST /prescriptions`, `GET /visits/:visitId/prescriptions`, patient `/patients/me/prescriptions`, staff `/clinical/prescriptions/:id`).

| Method | Path | Intent |
| --- | --- | --- |
| `POST` | `/prescriptions` | Create a **draft** prescription |
| `PATCH` | `/prescriptions/:id` | Modify the **same** prescription (`DRAFT` or `ISSUED`) |
| `POST` | `/prescriptions/:id/issue` | Doctor issue action: `DRAFT` → `FINALIZED` → `ISSUED` (atomic) |
| `DELETE` | `/prescriptions/:id` | Soft delete (`deletedAt`) |
| `GET` | `/patients/:patientId/prescriptions` | List prescriptions for a patient (staff/authorized) |
| `GET` | `/prescriptions/:id` | Prescription details |

Existing patient “my prescriptions” paths remain valid as session-scoped equivalents of the list/detail reads. Mapping old `create` (immediate issue in mock) onto this lifecycle is a **later migration**, not a current API change.

---

## 2. Home Care / Home Nursing

Create a conceptual domain:

```
home-care/
  services/
  requests/
  assignments/
  visits/
```

**Do not create these folders or files yet.**

Home Care **must remain independent from appointments**. It is not a special `Appointment` type and must not reuse appointment status or booking slots as its primary model.

### 2.1 Proposed entities

#### NursingService

Catalog of bookable home-care services (tenant-scoped).

| Field | Meaning |
| --- | --- |
| `id` | Service id |
| `name` | Display name |
| `description` | Description |
| `duration` | Nominal duration (unit unspecified — open) |
| `price` | Nominal price (currency/tax unspecified — open) |
| `active` | Whether the service can be requested |

Illustrative names only (do **not** hardcode into the application): Injection, Wound Dressing, IV Therapy, Vital Signs Check, Sample Collection, Post-operative Care.

#### HomeCareRequest

The patient’s request for a service at a location/time.

| Field | Meaning |
| --- | --- |
| `id` | Request id |
| `patientId` | Patient chart identity |
| `serviceId` | `NursingService.id` |
| `addressId` | `HomeCareAddress.id` |
| `requestedAt` | When the request was created |
| `scheduledAt` | Requested/agreed time (scheduling model is open) |
| `status` | Proposed lifecycle status |
| `notes` | Free-text notes |

Also expected at persistence time (not all listed in the prompt’s field list): `clinicId` for tenancy.

#### NursingAssignment

Links a request to a nurse actor.

| Field | Meaning |
| --- | --- |
| `id` | Assignment id |
| `requestId` | `HomeCareRequest.id` |
| `nurseId` | Future nurse actor reference — **not** a current app role |
| `assignedAt` | When assigned |
| `status` | Assignment-level status (exact values open) |

#### NursingVisit

The in-home encounter. Distinct from `clinical/visits` (clinic visit).

| Field | Meaning |
| --- | --- |
| `id` | Nursing visit id |
| `requestId` | `HomeCareRequest.id` |
| `nurseId` | Performing nurse |
| `startedAt` | Start |
| `completedAt` | End (optional until complete) |
| `notes` | Narrative |
| `clinicalData` | Structured observations — schema open |

#### HomeCareAddress

| Field | Meaning |
| --- | --- |
| `id` | Address id |
| `patientId` | Owner patient |
| `label` | e.g. home / work (values open) |
| `addressLine` | Street line |
| `city` | City |
| `latitude` | Optional; location product is not implemented |
| `longitude` | Optional; location product is not implemented |
| `instructions` | Access notes |

Exact address, geocoding, and payment requirements are **future contract decisions**. Do not implement location functionality now.

### 2.2 Proposed request lifecycle

**Proposed backend lifecycle — not in current frontend code.**

```
REQUESTED
  ↓
CONFIRMED
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

Possible terminal / alternative states:

- `CANCELLED`
- `REJECTED`

Who confirms, who assigns, and whether `CONFIRMED` can be skipped to `ASSIGNED` are backend permission/workflow decisions (open).

### 2.3 Relationships

```
Patient
  ↓
HomeCareRequest
  ↓
NursingService

HomeCareRequest
  ↓
NursingAssignment
  ↓
Nurse (future actor)

HomeCareRequest
  ↓
NursingVisit

HomeCareAddress
  ↓
Patient
```

**HomeCareRequest does not depend on Appointment.**

A home-care request **must not** be modeled as an appointment. An optional reference to an existing **clinical visit** may be considered later if there is a real clinical reason. **Do not add that relationship now.**

### 2.4 Nurse domain

A future application role **may** be introduced later:

```
role: nurse
```

**Do not add now:**

- nurse role / `UserRole`
- nurse route, layout, tabs, screens
- nurse auth
- nurse UI

Current application roles stay: doctor, patient, admin, secretary.

The backend model may still store `nurseId` as a future actor reference.

Nurse profile ownership (user vs staff vs contractor) is an **open decision**.

### 2.5 Proposed home-care APIs

**Proposed — not implemented.**  
Do not create API clients or endpoint constants for these.

| Method | Path | Intent |
| --- | --- | --- |
| `GET` | `/home-care/services` | List active services for the tenant |
| `POST` | `/home-care/requests` | Create a request |
| `GET` | `/home-care/requests/:id` | Request detail |
| `GET` | `/patients/:patientId/home-care/requests` | List a patient’s requests (authorized) |
| `POST` | `/home-care/requests/:id/assign` | Assign a nurse |
| `POST` | `/home-care/requests/:id/start` | Start nursing visit / mark in progress |
| `POST` | `/home-care/requests/:id/complete` | Complete |
| `POST` | `/home-care/requests/:id/cancel` | Cancel |

Session-scoped patient variants (e.g. `/patients/me/home-care/requests`) would follow the same pattern as other `/me` reads. Not specified as required yet.

Confirm / reject endpoints are not listed above; they remain an open workflow decision.

---

## 3. Authorization (conceptual)

**Do not add RBAC code.**

| Actor | Conceptual access |
| --- | --- |
| **Patient** | Create own home-care requests; view own requests; view own addresses; view own **issued** prescriptions |
| **Doctor** | Access prescriptions for authorized patients/visits; create/finalize/issue prescriptions per backend authorization |
| **Secretary / Admin** | Manage home-care requests per a **future** permission model (not defined) |
| **Nurse** | Future role; access **assigned** nursing requests/visits only |
| **Pharmacy** | Future external/integrated actor; not implemented; do not design the channel in this phase |

Current app roles are unchanged. Nurse and pharmacy are documentation-only actors.

---

## 4. Tenancy / clinic

Prescription and Home Care data should be tenant-aware.

| Domain | Tenant context |
| --- | --- |
| Prescription | `clinicId` / clinic organization |
| Home Care | `clinicId` / clinic or organization that offers the service |

Do not assume a single global clinic. Do not implement multi-tenant backend logic in this phase.

Branch-level home-care availability is an **open decision**.

---

## 5. Audit / history

The existing product decision stands: **medical history is a read model / projection, not a source of truth.** Do not modify `history.mock.ts` or make history client-written.

Future backend should preserve lifecycle events (implementation of an event store is **not** required now):

**Prescription**

- created
- finalized
- issued

**Home Care**

- requested
- confirmed
- assigned
- started
- completed
- cancelled / rejected where applicable

These events can feed the existing history projection (`type` + `resourceId`) later. They are not current mock writes.

---

## 6. Phase 6 Open Decisions

Unresolved on purpose. No assumptions made for product/legal/ops details.

### Prescription

- Exact pharmacy integration model (portal, claim API, print/QR only, etc.)
- Whether issuing generates a public prescription identifier / QR / token
- Whether a prescription can be revoked after issue
- Exact medication catalog structure (codes, forms, strengths, units)
- Controlled medication / legal / regulatory requirements
- Whether `visitId` is required or optional after issue
- Whether the current mock “create = immediately issued” maps to `ISSUED` in one step or must pass `DRAFT`/`FINALIZED`
- Whether `quantity` is required
- Whether `clinicId` is the visit’s clinic, the doctor’s home clinic, or the active tenant

### Home Care

- Exact service pricing model (flat, per duration, packages, insurance)
- Service availability by clinic / branch / geography
- Nurse entity / profile ownership
- Address storage model (structured vs geocoded vs third-party)
- Scheduling / slot model (not appointment slots)
- Cancellation / refund rules
- Payment model
- Whether home-care requests can reference clinical visits (not added now)
- Future nurse role and permissions
- Whether `CONFIRMED` is a required state
- `clinicalData` schema on `NursingVisit`
- Duration units and currency on `NursingService`

---

## 7. Explicit scope statement

These are **design contracts only**.

They are not implemented in:

- `app/`
- Expo Router / navigation
- UI / screens / hooks / services
- mock arrays / seed data
- `endpoints.ts` / Axios
- `UserRole`
- query keys

Implementation of Electronic Prescription lifecycle and Home Care requires a later, explicit implementation phase after the open decisions that affect storage and authorization are resolved.
