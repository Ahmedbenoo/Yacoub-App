# Clinify — دليل المشروع الشامل

> **Clinify** تطبيق موبايل لإدارة العيادات (Multi-tenant SaaS)  
> **المنصة:** React Native + Expo SDK 57  
> **الحالة:** 17 Phase مكتملة ✅  
> **آخر تحديث:** أغسطس 2026

---

## 1. نظرة عامة

Clinify يربط ثلاثة أدوار في نظام واحد:

| الدور | الوصف |
|-------|--------|
| **طبيب (Doctor)** | إدارة المرضى، الزيارات، الوصفات، طلبات التحاليل، جدول التوفر، تأكيد/إلغاء المواعيد |
| **مريض (Patient)** | البحث عن أطباء وعيادات، حجز مواعيد، السجل الطبي، إلغاء/إعادة جدولة |
| **مدير عيادة (Admin)** | لوحة تحكم، KPIs، إدارة الأطباء والمرضى، التقارير، تأكيد المواعيد، إنشاء/تعديل/إلغاء تفعيل الموظفين |

---

## 2. Tech Stack

### الأساس

| التقنية | الاستخدام |
|---------|-----------|
| **React Native 0.86** + **React 19** | واجهة المستخدم |
| **Expo SDK 57** | البناء، الإشعارات، الخطوط، SecureStore |
| **Expo Router 57** | التنقل القائم على الملفات (file-based routing) |
| **TypeScript 6 (strict)** | Type safety |
| **NativeWind v4** + **Tailwind CSS 3** | التنسيق (utility-first) |

### الحالة والبيانات

| التقنية | الاستخدام |
|---------|-----------|
| **Zustand 5** | Auth، Theme، Locale، Clinic، Notification preferences |
| **TanStack Query 5** | Server state + cache + offline persistence |
| **React Hook Form 7** + **Zod 3** | النماذج والتحقق |
| **Axios** | HTTP client + interceptors (401 refresh) |
| **AsyncStorage** | Web storage + query persistence |
| **expo-secure-store** | Tokens على Native |

### UX وإنتاجية

| التقنية | الاستخدام |
|---------|-----------|
| **i18next** + **react-i18next** | ترجمة EN / AR + RTL |
| **@expo-google-fonts/inter** | خط إنجليزي |
| **@expo-google-fonts/cairo** | خط عربي |
| **react-native-toast-message** | Toast notifications |
| **expo-notifications** | Push notifications |
| **@react-native-community/netinfo** | Offline banner |
| **react-native-reanimated** | Animations |

### الاختبار والبناء

| التقنية | الاستخدام |
|---------|-----------|
| **Maestro** | E2E flows (21 ملف في `.maestro/`) |
| **EAS Build** | بناء APK (`com.clinify.app`) |
| **expo-build-properties** | arm64-only، minify، shrink resources |

---

## 3. البنية المعمارية

```
Presentation (app/, features/*/screens)
    ↓
Application State (Zustand: auth, theme, locale, clinic)
    ↓
Server State (TanStack Query)
    ↓
Domain (types, schemas, mappers)
    ↓
Infrastructure (API client, SecureStore, i18n, mock)
```

### هيكل المجلدات

```
doctors-app/
├── app/                    # Expo Router — routes رفيعة (re-exports)
│   ├── (auth)/             # onboarding, login, register, forgot, OTP, reset
│   ├── (doctor)/           # tabs + stack (patients, visits, availability)
│   ├── (patient)/          # tabs + stack (search, booking, records)
│   └── (admin)/            # tabs + stack (doctors, patients, reports)
├── src/
│   ├── features/           # auth, doctor, patient, admin, appointments, clinic, clinical
│   ├── shared/             # UI, API, i18n, stores, navigation, hooks
│   └── config/             # env.ts
├── docs/                   # ARCHITECTURE.md + هذا الملف
├── .maestro/               # E2E tests
└── assets/                 # icons, splash, logo
```

### Path Alias

`@/*` → `src/*` — مثال: `@/shared/components/ui/Button`

---

## 4. التنقل والحماية (Guards)

| Route Group | Guard | Navigator |
|-------------|-------|-----------|
| `(auth)` | Guest only | Stack |
| `(doctor)` | `role === doctor` | Tabs + Stack |
| `(patient)` | `role === patient` | Tabs + Stack |
| `(admin)` | `role === admin` | Tabs + Stack |

**مسار الدخول:** `index.tsx` → hydrate auth → redirect حسب الدور/العيادة

**Multi-role:** `multi@clinic.com` → شاشة اختيار الدور (Doctor / Admin)

**Multi-clinic:** Admin / Multi → شاشة اختيار العيادة + `ClinicSwitcher` في الإعدادات

---

## 5. المصادقة والجلسة

- **Access token:** SecureStore (native) / AsyncStorage (web) + Zustand in-memory
- **Refresh token:** SecureStore / AsyncStorage
- **Session validation:** `GET /auth/me` عند bootstrap
- **Token refresh:** تلقائي عبر axios interceptor على 401
- **Forgot password:** Email → OTP (`123456`) → reset token → كلمة مرور جديدة
- **Active role:** محفوظ لكل مستخدم (multi-role)
- **Active clinic:** محفوظ + header `X-Clinic-Id`

### بيانات الدخول (Mock)

| Email | Password | الدور |
|-------|----------|-------|
| `doctor@clinic.com` | `password123` | Doctor |
| `patient@clinic.com` | `password123` | Patient |
| `admin@clinic.com` | `password123` | Admin |
| `multi@clinic.com` | `password123` | Doctor + Admin |

---

## 6. المتغيرات البيئية (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_USE_MOCK_API=true          # Mock API (التطوير)
EXPO_PUBLIC_ENABLE_MONITORING=false
# EXPO_PUBLIC_SENTRY_DSN=              # اختياري للإنتاج
```

---

## 7. الميزات حسب الدور

### 🔐 Auth (مشترك)

- Onboarding، Login، Register
- Forgot password + OTP + Reset
- Role selection (multi-role)
- Clinic selection (multi-clinic)
- Edit profile + Avatar picker
- Change password
- Logout + session expired redirect

### 📅 Appointments (مشترك)

- قوائم مواعيد (قادمة / سابقة)
- فلاتر الحالة (All, Scheduled, Confirmed, …) — حسب الدور
- تفاصيل الموعد
- **Doctor/Admin:** تأكيد، إلغاء
- **Doctor:** بدء زيارة → Visit screen
- **Patient:** إلغاء، إعادة جدولة
- Dashboard stats + Today overview
- Notifications (قائمة، mark read، mark all read)
- Notification category preferences (Appointments, Prescriptions, Lab, System)
- Push notifications + deep link للموعد

### 👨‍⚕️ Doctor

- Dashboard + notifications preview
- قائمة المرضى (بحث)
- ملف المريض + السجل الطبي (tappable → prescription/lab/visit)
- Visit screen: notes, vitals, prescriptions, lab requests, complete visit
- Availability: جدول أسبوعي (AvailabilityDayCard)
- Confirm / Cancel appointments

### 🧑‍🤝‍🧑 Patient

- Home dashboard + stats + notifications preview
- Search hub: **Clinics | Doctors**
- Clinic profile + أطباء العيادة
- Doctor profile + Book appointment (slots + reason)
- Appointments tab
- Records tab: All | Prescriptions | Lab | Visits + detail screens
- Visit detail (read-only)
- Profile tab + Settings

### 🏥 Admin

- Dashboard: KPIs، مواعيد قادمة، reports preview
- Doctors: بحث، إنشاء، تعديل، deactivate/reactivate، show inactive
- Patients: بحث، إنشاء، تعديل، deactivate/reactivate، show inactive
- Appointments: كل مواعيد العيادة + filters + confirm/cancel
- Reports: قائمة + detail (metrics, highlights)
- Clinical records read-only (prescription, lab, visit)
- Staff management: create doctor/patient with FormSelect (branch, specialty)

---

## 8. Design System (مكونات مشتركة)

| المجلد | أمثلة |
|--------|-------|
| `ui/` | Button, Text, Input, Card, Badge, Avatar, Icon, SegmentedControl |
| `layout/` | Screen, Header, TabTopBar, RoleTabsShell, SettingsPanel, Row |
| `form/` | FormInput, FormSelect, Select |
| `feedback/` | Spinner, Skeleton, EmptyState, ErrorState, ConfirmDialog |
| `profile/` | ProfileHeroCard, ProfileInfoRow |
| `brand/` | Logo, NavBrand |

**Theme:** Light / Dark / System  
**Locale:** Arabic (افتراضي) / English + RTL/LTR

---

## 9. i18n Namespaces

`common`, `auth`, `clinic`, `doctor`, `patient`, `admin`, `appointments`, `validation`

---

## 10. API Layer

```
src/shared/api/
├── client.ts          # Axios + interceptors
├── endpoints.ts       # URL constants
├── query-keys.ts      # TanStack Query keys (tenant-aware)
└── mock/              # Mock services (doctors, patients, appointments, admin, …)
```

**Mock toggle:** `EXPO_PUBLIC_USE_MOCK_API=true` — كل الـ services تتحول للـ mock تلقائياً.

---

## 11. Phases التطوير (1–17) — ملخص

| Phase | المحتوى |
|-------|---------|
| **1** | Foundation: scaffold, design system, i18n/RTL, theme, Zustand, mock auth, navigation |
| **2** | Authentication: session, refresh, forgot/OTP/reset, persisted role |
| **3** | Appointments core: models, mock API, dashboards, tabs, detail, cancel/reschedule |
| **4** | Doctor module: patients, visits, Rx, lab, availability |
| **5** | Patient module: search, booking, records, profile |
| **6** | Admin module: KPIs, lists, reports, appointments |
| **7** | Production: error boundary, offline, push, Maestro smoke |
| **8** | Multi-tenancy: clinic switcher, X-Clinic-Id, query persistence |
| **9** | Clinic-scoped data + patient clinic discovery |
| **10** | Clinical records detail + ConfirmDialog + auth cycle fix |
| **11** | Admin report detail, confirm/cancel, edit profile |
| **12** | Visit detail, change password, doctor actions, avatar |
| **13** | Admin edit staff, reports list, history navigation, filters |
| **14** | Toast i18n, create staff, ProfileHeroCard, filter parity |
| **15** | Deactivate staff, notification prefs, ProfileInfoRow, Maestro |
| **16** | Reactivate staff, notification prefs integration, specialty select, E2E gaps |
| **17** | Patient book/cancel Maestro, staff lifecycle Maestro, testIDs, settings i18n |

---

## 12. اختبارات E2E (Maestro)

**Package name:** `com.clinify.app`

| الملف | السيناريو |
|-------|-----------|
| `smoke-launch.yaml` | فتح التطبيق |
| `patient-login.yaml` | تسجيل دخول مريض |
| `patient-records.yaml` | السجل الطبي |
| `patient-appointment-filters.yaml` | فلاتر المواعيد |
| `patient-book-appointment.yaml` | حجز موعد |
| `patient-cancel-appointment.yaml` | إلغاء موعد |
| `notification-prefs.yaml` | إخفاء إشعارات Appointments |
| `doctor-appointment-filters.yaml` | فلاتر الطبيب |
| `doctor-confirm-appointment.yaml` | تأكيد موعد |
| `doctor-start-visit.yaml` | بدء زيارة |
| `admin-*` | create/edit/deactivate/reactivate staff, reports, filters, history |

```bash
maestro test .maestro/smoke-launch.yaml
maestro test .maestro/patient-login.yaml
```

---

## 13. التشغيل والبناء

### التطوير

```bash
npm install
cp .env.example .env
npm start                    # أو npx expo start --port 8082 --clear
npm run web                  # Web
npm run android              # Android emulator
npm run typecheck            # tsc --noEmit
```

### بناء APK

```bash
npm run build:apk            # EAS cloud
npm run build:apk:local      # Local build
```

**Package:** `com.clinify.app`  
**حجم APK المتوقع:** ~35–45 MB (arm64-only)

---

## 14. المشاكل التي واجهناها والحلول

### 14.1 المنفذ 8081 مشغول

**المشكلة:** `expo start` يسأل عن استخدام منفذ بديل لأن 8081 مشغول.  
**الحل:** تشغيل Metro على **8082**:

```bash
npx expo start --port 8082 --clear
```

---

### 14.2 توقف Metro (exit code 134 / 4294967295)

**المشكلة:** بعد تشغيل طويل، خادم Expo يتوقف فجأة (crash ذاكرة Metro) و`localhost` لا يستجيب.  
**الحل:**
1. إيقاف العملية على المنفذ 8082
2. إعادة التشغيل بـ `--clear`

```bash
npx expo start --port 8082 --clear
```

> **ملاحظة:** ليس خطأ في كود التطبيق — مشكلة شائعة في Metro بعد جلسات طويلة.

---

### 14.3 اللغة الافتراضية إنجليزية بدل العربية

**المشكلة:** التطبيق يفتح بالإنجليزية رغم رغبة المستخدم في العربية كافتراضي؛ اختلاف بين Web وAPK.  
**الأسباب:**
- `app/+html.tsx` كان `lang="en"` بدون `dir="rtl"`
- `localStorage` / AsyncStorage يحفظ `en` من جلسة سابقة
- `initI18n` كان يبدأ قبل تحميل locale store
- لغة المتصفح كانت تتجاوز الإعدادات

**الحل:**
- `+html.tsx` → `lang="ar" dir="rtl"`
- تهيئة i18n فوراً بـ `Locale.AR`
- انتظار hydrate الـ stores قبل تطبيق اللغة
- **Migration v2/v3** في locale store لمسح `en` القديمة
- ضبط `document.documentElement.dir/lang` على Web
- `I18nextProvider` في AppProviders
- العربية افتراضية؛ الإنجليزية فقط عند اختيارها من الإعدادات

---

### 14.4 TabTopBar ناقص عند المريض والأدمن

**المشكلة:** الطبيب له شريط علوي (Logo، إشعارات، ثيم، avatar)؛ المريض والأدmin لا.  
**الحل:** إضافة `TabTopBar` في `(patient)/(tabs)/_layout` و`(admin)/(tabs)/_layout`، ثم توحيد عبر `RoleTabsShell`.

---

### 14.5 اختلاف مقاسات الـ Navigation بين الأدوار

**المشكلة:** ارتفاع وpadding الشريط العلوي مختلف بين doctor/patient/admin.  
**الحل:** ثوابت مشتركة `TAB_TOP_BAR_METRICS` + مكوّن `RoleTabsShell`.

---

### 14.6 Screen scroll لا يطبّق className

**المشكلة:** صفحات مثل Availability لا تأخذ padding/تنسيق من `className` على `Screen scroll`.  
**الحل:** تمرير `className` إلى `contentContainerClassName` في `ScrollView`.

---

### 14.7 شاشة Availability — تصميم ضعيف

**المشكلة:** عرض جدول التوفر غير واضح.  
**الحل:** مكوّن `AvailabilityDayCard` — badges للحالة + pills للفترات الزمنية.

---

### 14.8 زر «إضافة طبيب» يظهر مفتاح i18n خام (`doctors.add`)

**المشكلة:** في الواجهة العربية يظهر `doctors.add` بدل النص المترجم.  
**الحل:** استخدام `t('doctors.createTitle')` → «إضافة طبيب».

---

### 14.9 حقل الفرع نص حر في create doctor

**المشكلة:** إدخال اسم الفرع يدوياً يسبب أخطاء وعدم اتساق.  
**الحل:**
- `CLINIC_BRANCHES` في `admin/lib/branches.ts`
- `FormSelect` + `useBranchOptions`
- Schema بـ `branchId` + `resolveBranchName()` عند الإرسال

---

### 14.10 محاذاة Select في RTL

**المشكلة:** نص الـ Select غير محاذى صح في العربية.  
**الحل:** `rowStyle` مع `direction: rtl/ltr` على `Pressable` في `Select.tsx`.

---

### 14.11 Auth require-cycle

**المشكلة:** Circular dependency بين session barrel و auth store.  
**الحل:** فصل `auth-store.ts` و `active-role.ts` عن barrel exports (Phase 10).

---

### 14.12 Alert.alert في cancel appointment

**المشكلة:** Native Alert غير متسق مع UX التطبيق ولا يدعم i18n/RTL جيداً.  
**الحل:** مكوّن مشترك `ConfirmDialog` + testIDs للـ E2E.

---

### 14.13 Notification prefs لا تؤثر إلا على القائمة

**المشكلة:** تفضيلات الإشعارات تُطبَّق فقط في `NotificationList`.  
**الحل (Phase 16):**
- `filterNotificationsByPreferences()` helper
- تطبيق على `NotificationsPreview`, `TabTopBar` badge, push handler

---

### 14.14 Staff معطّل بدون طريقة استرجاع

**المشكلة:** deactivate يخفي الموظف من القوائم بدون reactivate.  
**الحل (Phase 16):**
- `reactivateDoctor` / `reactivatePatient` endpoints + mocks
- زر «Show inactive» + زر Reactivate في detail

---

### 14.15 Maestro appId خاطئ

**المشكلة:** `admin-report-detail.yaml` يستخدم appId قديم.  
**الحل:** توحيد على `com.clinify.app`.

---

### 14.16 Toast messages بالإنجليزية hardcoded

**المشكلة:** رسائل mutation في hooks بدون i18n.  
**الحل:** Phase 14 — sweep لـ auth/admin/doctor hooks + مفاتيح `toast.*` في admin.json.

---

### 14.17 Gender / Day names / Doctor title بالإنجليزية

**المشكلة:** formatters تعرض نصوص ثابتة؛ BookAppointment يظهر "Dr." بدون ترجمة.  
**الحل:** `formatGender()`, `getDayName()` → `common.gender.*` / `common.days.*` + `common:doctorTitle`.

---

## 15. Mock Data IDs (للاختبار)

| الكيان | ID | ملاحظات |
|--------|-----|---------|
| Doctor (Mona) | `user-doctor-002` | deactivate/reactivate، booking |
| Doctor (Ahmed) | `user-doctor-001` | confirm visit، edit |
| Patient (Sara) | `patient-001` / `user-patient-001` | login patient، records |
| Patient (Nour) | `patient-003` | deactivate patient |
| Appointment confirm | `appt-002` | Youssef Kamal، SCHEDULED |
| Appointment visit | `appt-001` | Sara Mohamed، CONFIRMED |
| Appointment cancel | `appt-003` | Lab results review، CONFIRMED |
| Notification prefs | `notif-003` | APPOINTMENT، patient |

---

## 16. قيود معروفة / عمل مستقبلي (Phase 18+)

| البند | الحالة |
|-------|--------|
| API backend حقيقي | Mock فقط حالياً (`EXPO_PUBLIC_USE_MOCK_API=true`) |
| Maestro: change password / edit profile | غير مغطى |
| Multi-clinic E2E (`multi@clinic.com`) | غير مغطى |
| ترجمة محتوى Mock (bios، notification titles) | بيانات إنجليزية — UI مترجم |
| Notification deep link E2E | جزئي |
| Doctor availability editing E2E | غير مغطى |

---

## 17. أوامر مفيدة سريعة

```bash
# تشغيل
npm start
npx expo start --port 8082 --clear

# فحص Types
npm run typecheck

# Maestro
maestro test .maestro/patient-login.yaml

# APK
npm run build:apk
```

---

## 18. مراجع

- [README.md](../README.md) — دليل إنجليزي + phases تفصيلية
- [ARCHITECTURE.md](./ARCHITECTURE.md) — معمارية مختصرة (EN)
- [Expo SDK 57 Docs](https://docs.expo.dev/versions/v57.0.0/)

---

*تم إعداد هذا الملف ليكون مرجعاً واحداً للفريق — features، tech stack، phases، والمشاكل/الحلول.*
