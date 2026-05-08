# Front End Flwo And Bakend Flow (Hinglish - Deep Detailed)

Last Updated: 2026-04-22  
Project Root: `D:\power-plant\code`

---

## 0) Purpose of this Document
Ye document aapko **zero se end-to-end** samjhata hai:
1. Backend architecture ka real flow
2. Database schema ka practical meaning
3. Admin frontend flow aur security behavior
4. Flutter mobile app integration behavior
5. Future me new column/input/module add karne ka safe तरीका
6. Troubleshooting guide (common errors + fix)

Ye doc intentionally deep hai taaki aap future me bina confusion ke changes kar sako.

---

## 1) System Overview (High Level)
Project ke 3 execution layers hain:

1. **Backend API**
- Path: `D:\power-plant\code\backend`
- Stack: Node.js + Express + Knex + PostgreSQL
- Role: auth, business rules, tenant isolation, reports, audit

2. **Admin Web Panel**
- Path: `D:\power-plant\code\frontend-admin`
- Stack: Next.js + React + TanStack Query + Zustand
- Role: superadmin/admin operations dashboard

3. **Employee Mobile App**
- Path: `D:\power-plant\code\apk`
- Stack: Flutter
- Role: employee attendance + submissions + profile

Core business relationship:
- Superadmin > multi-admin tenancy control
- Admin > own tenant data (employees/sites/submissions etc.)
- Employee > assigned site pe attendance + submission

---

## 2) Backend Deep Flow

### 2.1 Request Lifecycle
Standard backend request flow:
1. Route match (`src/routes/index.js` + module routes)
2. Auth middleware (`authRequired`) token verify karta hai
3. RBAC middleware role check karta hai (`allowRoles`)
4. Zod validator payload/query validate karta hai
5. Controller service ko call karta hai
6. Service DB logic run karti hai
7. Response envelope return:
   - Success: `{ success: true, message, data }`
   - Error: `{ success: false, message }`

### 2.2 Important Backend Folders
- `src/modules/*` -> module-wise services/controllers/routes/validators
- `src/middleware/*` -> auth/rbac/validate/error
- `src/utils/*` -> helpers, jwt, tenant helpers
- `migrations/*` -> DB schema + evolution

### 2.3 Auth Model
Endpoints:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/impersonate/:adminId` (superadmin only)

Token behavior:
- Access token short validity
- Refresh token DB table `refresh_tokens` me hashed store
- Logout refresh token revoke karta hai

### 2.4 Role Hardening Implemented
Roles:
- `superadmin`
- `admin`
- `employee`

Implemented protections:
- Exactly one active superadmin allowed
- Superadmin downgrade block
- Superadmin deactivate block
- Admin can create only employee
- Admin cannot manage another admin tenant records

---

## 3) Database Deep Design

### 3.1 Base Migration
- `migrations/20260419093000_initial_schema.js`

Creates major tables:
- `users`
- `sites`
- `site_parameters`
- `employee_site_assignments`
- `data_submissions`
- `submission_values`
- `attendance`
- `refresh_tokens`
- `audit_logs`
- `notifications`
- `settings`
- `user_login_attempts`

### 3.2 Tenant Isolation Migration
- `migrations/20260421101500_role_hardening_tenant_isolation.js`

Added `owner_admin_id` in:
- users
- sites
- employee_site_assignments
- data_submissions
- attendance
- notifications
- audit_logs

Added index protection:
- partial unique index for single active superadmin

Backfill logic:
- existing rows mapped using created_by/assignment/site relationships

### 3.3 Practical Meaning of `owner_admin_id`
- Superadmin records usually global access
- Admin-scoped rows have `owner_admin_id = admin.id`
- Every query jahan admin data देखता hai, wahan owner scope filter lagta hai

### 3.4 Why this matters
Without `owner_admin_id`, admin1/admin2 data separation weak hoti.
With this field, tenant boundary explicit hoti hai, audit easier hota hai.

---

## 4) Module-wise Isolation (What exactly implemented)

### Users module
- Admin only employees of own tenant list/get/update/activate/deactivate
- Admin cannot create admin/superadmin
- Employee created by admin gets owner_admin_id = admin.id

### Sites module
- Admin list/get/update/delete only own sites
- Site create me owner_admin_id set from actor (admin)
- Site list response includes creator metadata for UI

### Parameters module
- Admin CRUD only for parameters that belong to own site

### Assignments module
- Admin can assign employee only if both employee + site same tenant

### Submissions module
- Admin list/get/status/missing only tenant-scoped rows

### Attendance module
- Admin list/summary tenant scoped

### Dashboard + Reports
- Admin dashboard/reports only own tenant stats
- Superadmin full stats

### Notifications + Audit Logs
- Admin only own tenant logs/notifications scope

---

## 5) Admin Web Frontend Deep Flow

Path: `D:\power-plant\code\frontend-admin`

### 5.1 Auth Session
- Login se tokens local storage + cookie me set
- Refresh interceptor auto token refresh karta hai
- Employee login admin panel me blocked

### 5.2 Role UX
Header shows:
- Welcome name
- Logged in as: Admin / Superadmin

### 5.3 Impersonation UX
- Sites page me Created By hover par superadmin ko action milta hai
- `Open Admin Dashboard` click -> superadmin admin context me switch
- Header top-right `Return to Superadmin Dashboard` button se original session restore

### 5.4 Users page improvements
- KPI cards (total, active, admins, employees)
- Better table UX
- Role badges
- Edit/View/Delete (delete mapped to deactivate)

### 5.5 Sites page improvements
Columns:
- Name
- Location
- Created By
- Created At
- Parameters
- Assignments
- Actions

Extras:
- Created By hover tooltip: full email + role
- Horizontal X-scroll support

### 5.6 Dashboard charts
- Recharts integrated (bar/pie)
- Operational cards + chat blocks

---

## 6) Flutter App Deep Flow

Path: `D:\power-plant\code\apk`

Current focus role: employee

Flow:
1. login
2. attendance check-in/out
3. my site fetch
4. dynamic parameter form submission
5. submission history/details
6. profile + password
7. offline sync queue

Important:
- Admin-web impersonation changes Flutter ko force update nahi karte
- Flutter tab update chahiye jab:
  - employee endpoint payload change ho
  - response structure change ho
  - new required validation field aaye

---

## 7) Future Me New Row / Input / Field Add Karna (Detailed SOP)

### Phase A: DB
1. New migration create:
   - `knex migrate:make add_<field>_to_<table>`
2. `up` me:
   - column add
   - default/index/constraint if needed
3. `down` me rollback logic

### Phase B: Backend Contract
1. Validator update (`*.validators.js`)
2. Service update (`*.service.js`)
   - create/update/select me field map
3. Tenant scope verify (admin leakage na ho)
4. Audit log payload optionally update

### Phase C: Frontend/Flutter
1. Type/model update
2. Form input add
3. table/detail render add
4. validation + error message add

### Phase D: Verification
1. Backend: lint + test
2. Frontend: lint + build
3. Flutter: analyze + test
4. Manual role scenarios:
   - superadmin
   - admin
   - employee

---

## 8) Example Change (How to think)
Suppose you add new site field: `site_code`.

Backend:
- migration in `sites`
- create/update validators me `siteCode`
- service insert/update/select map

Frontend admin:
- `types/site.ts` update
- create/edit site form input add
- table me optional column add

Mobile:
- usually no change unless endpoint used by app

---

## 9) Security Design Notes

1. Never trust frontend role only
- Backend RBAC + tenant scope is primary

2. Impersonation safe handling
- Superadmin-only endpoint
- target must be active admin
- audit log write
- return mechanism with preserved original session

3. Superadmin uniqueness
- DB level + service level both active

---

## 10) Commands Reference

### Backend
```powershell
cd D:\power-plant\code\backend
npm run migrate
npm run migrate:rollback
npm run lint
npm test
npm run dev
```

### Frontend Admin
```powershell
cd D:\power-plant\code\frontend-admin
npm install
npm run lint
npm run build
npm run dev
```

### Flutter
```powershell
cd D:\power-plant\code\apk
flutter pub get
flutter analyze
flutter test
flutter run
```

---

## 11) Troubleshooting Guide

### 11.1 Migration fail: unique superadmin index
Error: unique index cannot create
Reason: multiple active superadmin rows already
Fix: migration me dedupe logic already added, rerun migrate

### 11.2 Hydration mismatch (frontend)
Reason: token-dependent UI server/client render difference
Fix: client-safe render or hydration warning on dynamic-only text

### 11.3 Next SWC warning on Windows
`@next/swc-win32-x64-msvc ... not valid Win32 application`
- environment/toolchain mismatch possible
- lint can pass while build sometimes unstable
- ensure matching Node architecture and clean install

### 11.4 API 400 validation failed
- Check Zod schema in validators
- Confirm frontend payload keys and types
- Confirm UUID/date formats

---

## 12) Operational Checklist (Before Production)

- [ ] All migrations applied in target env
- [ ] Single active superadmin verified
- [ ] Admin tenant boundary verified
- [ ] Employee admin-panel login blocked
- [ ] Impersonation + return flow verified
- [ ] Backend lint/tests pass
- [ ] Frontend lint/build pass
- [ ] Flutter core employee flow smoke tested

---

## 13) File Pointers (Most critical)

Backend critical:
- `backend/migrations/20260419093000_initial_schema.js`
- `backend/migrations/20260421101500_role_hardening_tenant_isolation.js`
- `backend/src/modules/users/users.service.js`
- `backend/src/modules/sites/sites.service.js`
- `backend/src/modules/auth/auth.service.js`
- `backend/src/utils/tenant.js`

Frontend critical:
- `frontend-admin/src/app/(dashboard)/users/page.tsx`
- `frontend-admin/src/app/(dashboard)/sites/page.tsx`
- `frontend-admin/src/components/layout/Header.tsx`
- `frontend-admin/src/lib/auth/tokens.ts`
- `frontend-admin/src/services/auth.service.ts`

Flutter critical:
- `apk/lib/shared/repositories/backend_repository.dart`
- `apk/lib/features/*`

---

## 14) Final Note
Agar future me aap kuch bhi add karte ho (new field, new module, new dashboard widget), to always check 3 cheezein saath me:
1. DB migration correctness
2. backend validation + role scope
3. frontend/mobile payload alignment

Agar ye 3 align hain, system stable rahega.
