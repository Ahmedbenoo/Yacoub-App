# Clinify Architecture

## Overview

Clinify is a multi-tenant SaaS mobile application for clinic management with three user roles: Doctor, Patient, and Clinic Admin.

## Layered Architecture

```
Presentation (app/, features/*/screens)
    ↓
Application State (Zustand: auth, theme, locale)
    ↓
Server State (TanStack Query)
    ↓
Domain (types, schemas, mappers)
    ↓
Infrastructure (API client, SecureStore, i18n)
```

## Navigation

| Route Group | Guard | Navigator |
|-------------|-------|-----------|
| `(auth)` | Guest only | Stack |
| `(doctor)` | `role === doctor` | Tabs + Stack |
| `(patient)` | `role === patient` | Tabs + Stack |
| `(admin)` | `role === admin` | Tabs + Stack |

Entry flow: `index.tsx` → hydrate auth → redirect based on session/role.

## Authentication

- **Access token**: SecureStore (native) / AsyncStorage (web) + in-memory (via Zustand)
- **Refresh token**: SecureStore (native) / AsyncStorage (web)
- **Active role**: Persisted per user for multi-role accounts
- **Session validation**: `GET /auth/me` on bootstrap
- **Token refresh**: Automatic on 401 via axios interceptor
- **Reset password flow**: Email → OTP → reset token → new password
- **Mock API**: Toggle via `EXPO_PUBLIC_USE_MOCK_API=true`
- **Multi-role users**: Routed to role selection; choice persisted

## State Management

| Concern | Tool |
|---------|------|
| Server data | TanStack Query |
| Auth session | Zustand + SecureStore |
| Theme / Locale | Zustand + AsyncStorage |
| Forms | React Hook Form + Zod |

## Localization

- **i18next** with namespaces: `common`, `auth`, `clinic`, `doctor`, `patient`, `admin`, `validation`
- **RTL**: `I18nManager.forceRTL` for Arabic
- **Fonts**: Inter (EN), Cairo (AR)

## Design System

Components in `src/shared/components/`:

- **ui/**: Button, Text, Input, Card
- **layout/**: Screen, Header, SettingsPanel
- **feedback/**: Spinner, Skeleton, EmptyState, ErrorState, ComingSoon
- **form/**: FormInput (RHF + Zod integration)

## API Layer

```
src/shared/api/
├── client.ts          # Axios + interceptors
├── endpoints.ts       # URL constants
├── query-keys.ts      # TanStack Query key factory
└── mock/              # Mock services (Phase 1)
```

## Development Phases

1. **Foundation** — scaffold, design system, auth shell, navigation
2. **Authentication** — session validation, token refresh, reset flow, persisted role
3. **Appointments Core** — shared appointment module (complete)
4. **Doctor Module** — patients, visits, prescriptions, lab requests, availability (complete)
5. **Patient Module** — doctor search, booking, medical records (complete)
6. **Admin Module** — clinic management, reports (complete)
7. **Production** — monitoring, push notifications, offline banner, E2E tests (complete)
8. **Multi-tenancy** — clinic switching, persisted tenant context, offline query cache (complete)
9. **Clinic-scoped data** — tenant-filtered mocks, patient clinic discovery, clinic profiles (complete)
10. **Clinical records** — prescription/lab detail screens, ConfirmDialog, auth cycle fix (complete)
11. **Admin actions & profile** — report detail, admin appointment confirm/cancel, edit profile (complete)
12. **Visit detail & account security** — patient visit detail, change password, doctor confirm/cancel, avatar (complete)
13. **Admin operations & clinical navigation** — tappable history, edit doctor/patient, reports list, status filters (complete)
14. **i18n polish & admin create staff** — toast i18n, create doctor/patient, ProfileHeroCard, filter parity (complete)
15. **Admin deactivate & notification prefs** — staff deactivate, category toggles, formatter i18n, doctor E2E (complete)
16. **Reactivate staff & notification integration** — inactive visibility, prefs in badge/preview/push, create polish, E2E gaps (complete)
17. **Patient E2E & settings polish** — book/cancel Maestro, staff lifecycle Maestro, testIDs, settings i18n (complete)
