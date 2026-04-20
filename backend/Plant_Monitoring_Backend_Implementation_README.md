# Plant-Based Monitoring System
## Backend Implementation Guide & Module Design Manual

> Prepared from the uploaded technical architecture document and expanded into a practical backend build guide.

## 1. Purpose

This guide translates the uploaded technical architecture document into a practical backend execution plan. It focuses on how to implement the Node.js REST API from zero, how to organize the codebase, and how to design each module step by step so a developer or an AI coding tool can build it cleanly.

The original technical document defines a B2B multi-site monitoring platform with a Next.js admin panel, a Flutter employee app, a Node.js API layer, and PostgreSQL as the primary database. The core business flow is: create sites -> define dynamic parameters -> assign employees -> mark attendance -> submit plant readings -> monitor submissions -> export reports.

## 2. Backend-Centric Workflow

### Platform setup

- Super Admin creates Admin users.
- Admin creates sites and basic site metadata.
- Admin configures site parameters such as Temperature, Pressure, Status, Safety Check, or custom text/date fields.
- Admin assigns employees to sites through an assignment mapping table.

### Employee daily cycle

- Employee logs in from the mobile app and receives access + refresh tokens.
- App fetches the assigned site and active site parameters.
- Employee marks attendance with GPS check-in.
- App renders a dynamic form from the parameter definitions returned by the API.
- Employee submits plant readings. If offline, the mobile app saves the payload locally and syncs later.

### Admin monitoring cycle

- Dashboard shows active users, sites, today's attendance, recent submissions, and missing submissions.
- Admin filters submissions by site, date, employee, or status.
- Admin reviews, approves, or rejects submitted data if a review workflow is enabled.
- Admin exports attendance and submission reports to CSV or Excel.

### System operations

- Background jobs detect missing submissions, send reminders, and refresh derived dashboard caches.
- Logs, audit trails, metrics, and backups protect the system in production.

## 3. Recommended Backend Stack

| Area | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Database | PostgreSQL |
| Query layer | Knex.js or node-postgres |
| Authentication | JWT access token + refresh token rotation |
| Validation | Joi or Zod |
| Security | helmet, cors, express-rate-limit, bcrypt |
| File upload | multer |
| Logging | Winston + Morgan |
| Scheduling | node-cron |
| Testing | Jest + Supertest |
| Process manager | PM2 |

## 4. Recommended Project Structure

```text
plant-monitoring-api/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── app.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   ├── upload.middleware.js
│   │   └── errorHandler.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── sites/
│   │   ├── parameters/
│   │   ├── assignments/
│   │   ├── attendance/
│   │   ├── submissions/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   ├── notifications/        # recommended
│   │   ├── audit-logs/           # recommended
│   │   └── settings/             # recommended
│   ├── jobs/
│   │   ├── attendanceReminder.job.js
│   │   ├── missingSubmissionReminder.job.js
│   │   └── cacheWarmup.job.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── paginator.js
│   │   ├── dateHelper.js
│   │   ├── permissions.js
│   │   └── csvExporter.js
│   ├── routes/
│   │   └── index.js
│   └── server.js
├── migrations/
├── seeds/
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
├── .env.example
├── package.json
└── Dockerfile
```

## 5. How to Start the Backend From Zero

- Initialize the project with Express and environment configuration first. Do not start with features before the base app, DB, logger, validation, and error-handling skeleton are ready.
- Create database migrations before controllers. The database schema defines the contract for every module.
- Build common middleware next: JWT auth, RBAC, validation, rate limiting, upload handling, and a global error handler.
- After the shared foundation, implement modules in this order: auth -> users -> sites -> parameters -> assignments -> attendance -> submissions -> dashboard -> reports. Add notifications, audit logs, and settings as the second wave.

### Local Setup Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run migrate` | Run all DB migrations |
| `npm run seed` | Insert seed data for dev/test |
| `npm run dev` | Start local development server with watcher |
| `npm run test` | Run unit and integration tests |
| `npm run lint` | Lint the backend codebase |

### Example `.env`

```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=plant_monitoring
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MIN=5
DB_POOL_MAX=20

JWT_SECRET=replace_with_very_long_secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=replace_with_second_secret
REFRESH_TOKEN_EXPIRES_IN=30d

FRONTEND_URL=http://localhost:3000
MOBILE_APP_URL=plantmonitor://
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://admin.yourapp.com

LOG_LEVEL=debug
```

## 6. Database Foundation

- Core tables from the source document: users, sites, site_parameters, employee_site_assignments, data_submissions, submission_values, attendance, refresh_tokens.
- Recommended additional production tables: audit_logs, notifications, export_jobs, settings, notification_templates, user_login_attempts.
- Use UUID primary keys everywhere. Store all timestamps in UTC. Add indexes before data volume grows.
- Keep migrations reversible. Never create schema changes manually in production.

 Database Design (PostgreSQL) 
The database is designed using normalized relational schema with UUID primary keys for security and 
horizontal scaling. All timestamps are stored in UTC. 
4.1 Database Schema — Complete Table Definitions 
Table: users 
Column Type Constraints Description 
id UUID PRIMARY KEY, DEFAULT 
uuid_generate_v4() Unique user identifier 
name VARCHAR(100) NOT NULL Full name of the user 
email VARCHAR(150) UNIQUE, NOT NULL Login email address 
password_hash VARCHAR(255) NOT NULL bcrypt hashed password 
role ENUM NOT NULL — 
superadmin|admin|employee User role 
phone VARCHAR(20) NULLABLE Contact number 
profile_image TEXT NULLABLE URL to profile picture 
is_active BOOLEAN DEFAULT TRUE Account status flag 
created_by UUID FK → users(id), NULLABLE Who created this user 
last_login TIMESTAMP NULLABLE Last successful login time 
created_at TIMESTAMP DEFAULT NOW() Record creation time 
updated_at TIMESTAMP DEFAULT NOW() Last update time 
Table: sites 
Column Type Constraints Description 
id UUID PRIMARY KEY Unique site identifier 
name VARCHAR(150) NOT NULL Site display name (e.g., Delhi 
Plant) 
location VARCHAR(200) NOT NULL Geographic location 
description TEXT NULLABLE Site description 
created_by UUID FK → users(id) Admin who created the site 
is_active BOOLEAN DEFAULT TRUE Whether site is operational 
created_at TIMESTAMP DEFAULT NOW() Creation timestamp 
updated_at TIMESTAMP DEFAULT NOW() Update timestamp 
Table: site_parameters 
🌿 Plant-Based Monitoring System — Technical Documentation 
Confidential — v1.0    Page 7 of 31 
Column Type Constraints Description 
id UUID PRIMARY KEY Parameter unique ID 
site_id UUID FK → sites(id), NOT NULL Associated site 
name VARCHAR(100) NOT NULL Parameter label (e.g., 
Temperature) 
type ENUM NOT NULL — 
number|text|dropdown|boolean|date Input field type 
is_required BOOLEAN DEFAULT TRUE Whether field is 
mandatory 
options JSONB NULLABLE For dropdown: 
["Low","Medium","High"] 
min_value DECIMAL NULLABLE Min value for number 
type 
max_value DECIMAL NULLABLE Max value for number 
type 
unit VARCHAR(30) NULLABLE Unit label (°C, %, psi, 
etc.) 
display_order INTEGER DEFAULT 0 Display sequence in 
form 
is_active BOOLEAN DEFAULT TRUE Whether parameter is 
active 
created_at TIMESTAMP DEFAULT NOW() Creation timestamp 
Table: employee_site_assignments 
Column Type Constraints Description 
id UUID PRIMARY KEY Assignment ID 
employee_id UUID FK → users(id) Assigned employee 
site_id UUID FK → sites(id) Assigned site 
assigned_by UUID FK → users(id) Admin who made assignment 
assigned_at TIMESTAMP DEFAULT NOW() Assignment date 
is_active BOOLEAN DEFAULT TRUE Active assignment flag 
Table: data_submissions 
Column Type Constraints Description 
id UUID PRIMARY KEY Submission record ID 
site_id UUID FK → sites(id), NOT NULL Which site was data submitted 
for 
submitted_by UUID FK → users(id), NOT NULL Employee who submitted 
submission_date DATE NOT NULL Date of the submission 
🌿 Plant-Based Monitoring System — Technical Documentation 
Confidential — v1.0    Page 8 of 31 
Column Type Constraints Description 
submission_time TIMESTAMP DEFAULT NOW() Exact datetime of submission 
status ENUM DEFAULT pending — 
pending|approved|rejected Review status 
notes TEXT NULLABLE Optional notes from employee 
created_at TIMESTAMP DEFAULT NOW() Record creation 
Table: submission_values 
Column Type Constraints Description 
id UUID PRIMARY KEY Value record ID 
submission_id UUID FK → 
data_submissions(id) Parent submission 
parameter_id UUID FK → site_parameters(id) Which parameter 
value_text TEXT NULLABLE String/dropdown/boolean value 
value_number DECIMAL NULLABLE Numeric value if type=number 
created_at TIMESTAMP DEFAULT NOW() Record creation 
Table: attendance 
Column Type Constraints Description 
id UUID PRIMARY KEY Attendance record ID 
user_id UUID FK → users(id), NOT 
NULL Employee user 
site_id UUID FK → sites(id), NOT NULL Site where attendance marked 
check_in TIMESTAMP NOT NULL Check-in time 
check_out TIMESTAMP NULLABLE Check-out time (nullable until 
logout) 
check_in_lat DECIMAL(10,7) NULLABLE GPS latitude at check-in 
check_in_lng DECIMAL(10,7) NULLABLE GPS longitude at check-in 
attendance_date DATE NOT NULL Date of attendance 
status ENUM present|absent|late Computed status 
created_at TIMESTAMP DEFAULT NOW() Record creation 
Table: refresh_tokens 
Column Type Constraints Description 
id UUID PRIMARY KEY Token record ID 
user_id UUID FK → users(id) Token owner 
token_hash VARCHAR(255) UNIQUE, NOT NULL SHA-256 hash of token 
🌿 Plant-Based Monitoring System — Technical Documentation 
Confidential — v1.0    Page 9 of 31 
Column Type Constraints Description 
expires_at TIMESTAMP NOT NULL Expiry (30 days) 
is_revoked BOOLEAN DEFAULT FALSE Revocation flag 
created_at TIMESTAMP DEFAULT NOW() Issue time 
4.2 Entity Relationship Diagram (Text Description) 
The following describes the relationships between all entities: 
users (1) ────────────────── (M) users           [created_by self-ref] 
users (1) ────────────────── (M) sites            [created_by] 
sites (1) ────────────────── (M) site_parameters  [site_id] 
users (M) ────────────────── (M) sites            [via employee_site_assignments] 
users (1) ────────────────── (M) data_submissions [submitted_by] 
sites (1) ────────────────── (M) data_submissions [site_id] 
data_submissions (1) ──────── (M) submission_values [submission_id] 
site_parameters (1) ──────── (M) submission_values [parameter_id] 
users (1) ────────────────── (M) attendance        [user_id] 
sites (1) ────────────────── (M) attendance        [site_id] 
users (1) ────────────────── (M) refresh_tokens    [user_id] 
4.3 Database Indexes (Performance) 
Table Index Column(s) Index Type Purpose 
users email UNIQUE B
TREE Fast login lookup 
users role, is_active B-TREE 
composite Filter users by role 
data_submissions site_id, 
submission_date 
B-TREE 
composite Site-date filter 
data_submissions submitted_by, 
submission_date 
B-TREE 
composite Employee history 
submission_values submission_id B-TREE Join performance 
submission_values parameter_id B-TREE Parameter aggregation 
attendance user_id, 
attendance_date 
B-TREE 
composite Daily attendance check 
attendance site_id, 
attendance_date 
B-TREE 
composite Site attendance report 
site_parameters site_id, is_active B-TREE 
composite Active params per si

## 7. Shared Backend Design Patterns

- **API response contract:** Use one response envelope for success and errors so the admin web and mobile app can consume responses consistently.
- **Service layer first:** Controllers should stay thin. Business rules belong in services.
- **Validation at the boundary:** Validate all request bodies, params, and query filters before they reach the service layer.
- **RBAC:** Super Admin, Admin, and Employee must have centrally managed permissions instead of route-by-route custom checks.
- **Transactions:** Use DB transactions for flows that write to multiple tables, especially submissions and assignments.
- **Pagination & filters:** All list endpoints should support page, limit, sort, search, and filters.
- **Soft delete policy:** For users/sites/parameters, prefer deactivate over hard delete unless data retention policy says otherwise.
- **Audit trail:** Important create/update/delete actions should be written to audit_logs.
- **Caching:** Cache site parameters and dashboard widgets; invalidate cache on writes.
- **Testing:** Write unit tests for service rules and integration tests for critical flows: login, check-in, submit data, export report.

## 8. Module-by-Module Design

### 8.1 Auth

**Goal:** Authenticate users securely and issue access/refresh tokens.

**Primary tables:** users, refresh_tokens, user_login_attempts (recommended)

**Main files:** `auth.routes.js`, `auth.controller.js`, `auth.service.js`, `auth.validators.js`

**Key routes:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

**Design flow:**
- Controller validates payload and calls AuthService.
- AuthService checks user by email, verifies password, checks active status and login lock state.
- Service signs access token and refresh token, hashes refresh token, and stores it in refresh_tokens.
- Refresh flow rotates the refresh token and revokes the old one.
- Logout revokes the active refresh token.

**Implementation order:**
- Create password hashing helper and JWT helper first.
- Implement login + refresh first; forgot/reset can come next.
- Add account lock after repeated failed attempts.
- Add token rotation tests before moving to the next module.

**Important rules:**
- Never store raw refresh tokens.
- Do not reveal whether email or password was incorrect.
- Access token should be short-lived; refresh token should be revocable.

**AI prompt:**

```text
Build the Auth module for an Express + PostgreSQL backend. Add login, refresh, logout, change password, forgot password, reset password, hashed refresh tokens, failed-login lockout, validators, controllers, services, and tests.
```

### 8.2 Users

**Goal:** Manage admins and employees with clear lifecycle controls.

**Primary tables:** users

**Main files:** `users.routes.js`, `users.controller.js`, `users.service.js`, `users.validators.js`

**Key routes:**
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `PATCH /api/v1/users/:id/activate`
- `PATCH /api/v1/users/:id/deactivate`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`

**Design flow:**
- UsersService owns user CRUD, role checks, duplicate email protection, and activation/deactivation.
- Super Admin can create Admin and Employee users. Admin can create Employees only if business rules allow it.
- Profile update is split from admin edit so self-service rules stay clean.

**Implementation order:**
- Implement create/list/detail/update/deactivate flow first.
- Add role-based filters and pagination.
- Add CSV bulk import only after the basic CRUD path is stable.

**Important rules:**
- Email must be unique and case-normalized.
- Deactivated users cannot login.
- Keep hard delete limited to safe contexts only.

**AI prompt:**

```text
Build the Users module for a role-based plant monitoring backend. Add CRUD, pagination, filters, self profile endpoints, activation/deactivation, and role-aware validation.
```

### 8.3 Sites

**Goal:** Create and manage plant sites that employees submit data against.

**Primary tables:** sites

**Main files:** `sites.routes.js`, `sites.controller.js`, `sites.service.js`, `sites.validators.js`

**Key routes:**
- `GET /api/v1/sites`
- `GET /api/v1/sites/:id`
- `POST /api/v1/sites`
- `PUT /api/v1/sites/:id`
- `DELETE /api/v1/sites/:id`
- `GET /api/v1/sites/my-site`

**Design flow:**
- SiteService handles create/update/detail/list and includes parameter + assignment counts where needed.
- Employee-facing endpoint /sites/my-site should return the assigned site plus active parameter definitions.
- Delete should be restricted; in most cases use is_active false instead of hard delete.

**Implementation order:**
- Create site CRUD first.
- Then enrich detail API with parameter and assignment summaries.
- Finally add employee-facing my-site endpoint.

**Important rules:**
- A site should not be hard deleted if it already has historical submissions.
- Site detail should support admin ownership rules where relevant.

**AI prompt:**

```text
Build the Sites module with CRUD, admin ownership checks, employee my-site endpoint, and data-safe deactivation rules.
```

### 8.4 Parameters

**Goal:** Support dynamic form definitions per site.

**Primary tables:** site_parameters

**Main files:** `parameters.routes.js`, `parameters.controller.js`, `parameters.service.js`, `parameters.validators.js`

**Key routes:**
- `GET /api/v1/sites/:siteId/parameters`
- `POST /api/v1/sites/:siteId/parameters`
- `PUT /api/v1/parameters/:id`
- `DELETE /api/v1/parameters/:id`
- `PATCH /api/v1/parameters/:id/toggle`
- `PUT /api/v1/sites/:siteId/parameters/reorder`

**Design flow:**
- ParameterService validates parameter type, dropdown options, min/max ranges, required flag, and display order.
- Response for the mobile app must be deterministic and ordered by display_order.
- Changes to parameters must invalidate cached site-parameter payloads.

**Implementation order:**
- Implement create/update/delete first.
- Then add reorder and toggle endpoints.
- Add type-specific validators for number, dropdown, boolean, text, and date.

**Important rules:**
- Dropdown parameters require a non-empty options array.
- Min/max is valid only for number type.
- Inactive parameters should not show in the employee form but should remain in historical records.

**AI prompt:**

```text
Build the Parameters module for dynamic site forms. Support parameter CRUD, toggle, reorder, type-safe validation, and ordered responses for mobile form generation.
```

### 8.5 Assignments

**Goal:** Map employees to one or more sites cleanly.

**Primary tables:** employee_site_assignments

**Main files:** `assignments.routes.js`, `assignments.controller.js`, `assignments.service.js`, `assignments.validators.js`

**Key routes:**
- `POST /api/v1/sites/:id/assign`
- `DELETE /api/v1/sites/:id/assign/:userId`
- `GET /api/v1/sites/:id/assignments`
- `GET /api/v1/users/:id/assignments`

**Design flow:**
- AssignmentService creates or disables mapping rows instead of duplicating them.
- List APIs should support both site-centric and user-centric views.
- Assignments are the source of truth for attendance and submissions eligibility.

**Implementation order:**
- Implement assign and remove first.
- Add list endpoints next.
- Finally add bulk assignment support if needed.

**Important rules:**
- Use a unique composite key to avoid duplicate active assignments.
- Reject assignment if the target user is not an employee or is inactive.

**AI prompt:**

```text
Build the Assignments module to map employees to sites with duplicate-prevention, site-based and user-based listing, and safe removal logic.
```

### 8.6 Attendance

**Goal:** Record GPS-based daily attendance for employees.

**Primary tables:** attendance

**Main files:** `attendance.routes.js`, `attendance.controller.js`, `attendance.service.js`, `attendance.validators.js`

**Key routes:**
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `GET /api/v1/attendance`
- `GET /api/v1/attendance/my`
- `GET /api/v1/attendance/summary`

**Design flow:**
- AttendanceService verifies site assignment, checks whether a record already exists for the day, and writes check-in GPS and timestamp.
- Check-out updates the open record instead of creating a new one.
- Summary endpoints aggregate attendance by date/site/status.

**Implementation order:**
- Build check-in and check-out first.
- Then add employee history endpoint.
- Then add admin list and summary endpoints.

**Important rules:**
- Prevent duplicate check-in for the same user, site, and attendance_date.
- GPS should be optional only if product policy allows fallback mode.
- Attendance status calculation (present/late) should be centralized and not duplicated in controllers.

**AI prompt:**

```text
Build the Attendance module with GPS check-in/check-out, duplicate prevention, employee history, admin summary APIs, and centralized attendance-status calculation.
```

### 8.7 Submissions

**Goal:** Accept dynamic data submissions and store values safely.

**Primary tables:** data_submissions, submission_values, site_parameters

**Main files:** `submissions.routes.js`, `submissions.controller.js`, `submissions.service.js`, `submissions.validators.js`

**Key routes:**
- `POST /api/v1/submissions`
- `GET /api/v1/submissions`
- `GET /api/v1/submissions/:id`
- `GET /api/v1/submissions/missing`
- `PATCH /api/v1/submissions/:id/status`
- `GET /api/v1/submissions/export`

**Design flow:**
- SubmissionService loads active parameter definitions for the site, validates every incoming value against the parameter type, then writes a row in data_submissions and child rows in submission_values inside one transaction.
- The service should detect missing required values and reject invalid dropdown/number/date content before any DB write.
- A missing-submissions report compares active assignments against daily submission records.

**Implementation order:**
- Build create submission endpoint first with full transactional write path.
- Then add list/detail APIs with filters.
- Then add missing-report and approval/rejection endpoints.
- Finally add export to CSV/Excel.

**Important rules:**
- Validate input against parameter metadata, not only the request schema.
- Prevent duplicate submission for the same user/site/date if policy requires one submission per day.
- Historical submissions should preserve parameter meaning even if parameters later change or deactivate.

**AI prompt:**

```text
Build the Submissions module for a dynamic-form system. Validate submitted values against active site parameters, write master/detail rows in a transaction, support list/detail/missing-report/export/status-update APIs, and add tests.
```

### 8.8 Dashboard

**Goal:** Expose summary widgets for the admin panel.

**Primary tables:** users, sites, attendance, data_submissions

**Main files:** `dashboard.routes.js`, `dashboard.controller.js`, `dashboard.service.js`

**Key routes:**
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/recent-submissions`
- `GET /api/v1/dashboard/attendance-today`
- `GET /api/v1/dashboard/missing-today`
- `GET /api/v1/dashboard/site-wise-stats`

**Design flow:**
- DashboardService aggregates counts and trends from multiple tables.
- These APIs are read-heavy and should be cache-friendly.
- Keep widget queries separate so slow charts do not block basic KPI cards.

**Implementation order:**
- Implement KPI stats first.
- Then recent submissions and today's summaries.
- Then add site-wise trend endpoints.

**Important rules:**
- Use indexes and selective fields. Dashboard endpoints should stay fast under load.
- Introduce short TTL cache for dashboard widgets.

**AI prompt:**

```text
Build the Dashboard module with cached summary endpoints for KPI cards, recent submissions, attendance today, missing submissions today, and site-wise stats.
```

### 8.9 Reports & Export

**Goal:** Generate operational reports and downloadable files.

**Primary tables:** attendance, data_submissions, submission_values, sites, users

**Main files:** `reports.routes.js`, `reports.controller.js`, `reports.service.js`

**Key routes:**
- `GET /api/v1/reports/submissions`
- `GET /api/v1/reports/attendance`
- `GET /api/v1/reports/parameter-analysis`
- `POST /api/v1/export-jobs (recommended for heavy exports)`

**Design flow:**
- ReportsService handles filtered reporting queries and formatting for CSV/Excel output.
- For small exports, stream the file directly. For large exports, create a background export job and notify the admin when it is ready.

**Implementation order:**
- Start with filtered CSV export for submissions and attendance.
- Then add parameter-wise summary analysis.
- Add queued export jobs once data volume grows.

**Important rules:**
- Never load huge datasets fully into memory for export.
- Use streaming where possible.

**AI prompt:**

```text
Build the Reports module with filtered attendance/submission reports, parameter analysis, CSV/Excel export, and optional background export jobs for large datasets.
```

### 8.10 Notifications (recommended extension)

**Goal:** Send reminders for missed attendance or missing submissions.

**Primary tables:** notifications, notification_templates

**Main files:** `notifications.routes.js`, `notifications.controller.js`, `notifications.service.js`

**Key routes:**
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/send`
- `GET /api/v1/notifications/templates`

**Design flow:**
- NotificationService should be channel-agnostic at first: in-app record now, SMS/email/push later.
- Missing-submission cron job should generate notifications from templates.

**Implementation order:**
- Implement DB-backed in-app notification records first.
- Then add manual send action.
- Then connect background jobs.

**Important rules:**
- Keep notification history for auditability.
- Deduplicate reminders for the same day and event.

**AI prompt:**

```text
Build a Notifications module that stores in-app reminders, supports templates, and integrates with background jobs for missing submissions and attendance alerts.
```

### 8.11 Audit Logs (recommended extension)

**Goal:** Track important actions for security and compliance.

**Primary tables:** audit_logs

**Main files:** `auditLogs.routes.js`, `auditLogs.controller.js`, `auditLogs.service.js`

**Key routes:**
- `GET /api/v1/audit-logs`

**Design flow:**
- Audit log entries should capture actor, action, module, entity id, old values, new values, IP, and timestamp.
- Write logs from services or centralized hooks, not from the frontend.

**Implementation order:**
- Define schema first.
- Log user/site/parameter/submission status actions first.
- Expose filtered list API for admins.

**Important rules:**
- Do not store secrets or raw tokens in audit logs.
- Mask sensitive values when necessary.

**AI prompt:**

```text
Build an Audit Logs module that records backend CRUD and status-change events with actor metadata, old/new values, and filterable admin list APIs.
```

### 8.12 Settings (recommended extension)

**Goal:** Centralize system rules that should not be hard-coded.

**Primary tables:** settings

**Main files:** `settings.routes.js`, `settings.controller.js`, `settings.service.js`

**Key routes:**
- `GET /api/v1/settings`
- `PUT /api/v1/settings`

**Design flow:**
- SettingsService should expose typed application settings such as attendance windows, submission cut-off times, default reminders, and security toggles.
- Use cached reads and admin-only writes.

**Implementation order:**
- Start with submission timing and attendance rules.
- Add notification configuration next.
- Add password/security config later if needed.

**Important rules:**
- Validate settings strongly; never allow free-form unsafe config.
- Store an audit trail for settings changes.

**AI prompt:**

```text
Build a Settings module to manage typed system configuration such as attendance windows, submission cut-off time, reminder rules, and secure admin-only update APIs.
```

## 9. Suggested Build Roadmap

| Phase | Work |
|---|---|
| Phase 1 | Project bootstrap, env, DB config, logger, response helper, error handler, auth middleware, RBAC middleware |
| Phase 2 | Migrations and seeds for users, sites, parameters, assignments, attendance, submissions, refresh tokens |
| Phase 3 | Auth module |
| Phase 4 | Users + Sites modules |
| Phase 5 | Parameters + Assignments modules |
| Phase 6 | Attendance module |
| Phase 7 | Submissions module with full dynamic validation |
| Phase 8 | Dashboard + Reports |
| Phase 9 | Notifications + Audit Logs + Settings |
| Phase 10 | Testing, load checks, deployment hardening |

## 10. Master AI Prompt

```text
Create a production-grade backend for a Plant-Based Monitoring System.

Tech stack:
- Node.js + Express
- PostgreSQL
- Knex.js or node-postgres
- JWT auth with refresh token rotation
- Joi or Zod validation
- Winston logging
- Jest + Supertest

Core modules:
- auth
- users
- sites
- parameters
- assignments
- attendance
- submissions
- dashboard
- reports

Recommended extensions:
- notifications
- audit logs
- settings

Business flow:
- Super Admin creates admins.
- Admin creates employees, sites, site parameters, and assignments.
- Employee logs in from mobile app, checks in with GPS, fetches assigned site parameters, and submits dynamic plant data.
- Admin monitors submissions, missing data, attendance, and exports reports.

Implementation requirements:
- modular folder structure
- thin controllers, service-driven business logic
- UUID primary keys
- DB migrations and seeds
- standardized API response format
- pagination and filtering
- RBAC
- secure refresh token handling
- transaction-safe submissions
- dynamic parameter-based validation
- audit-friendly design
- test coverage for critical flows

Deliver:
- folder structure
- migrations
- routes
- controllers
- services
- validators
- sample .env.example
- test skeleton
- implementation notes per module
```

## 11. Definition of Done

- All core migrations run successfully from a fresh database.
- Login, refresh, and logout flows pass integration tests.
- Users, sites, parameters, and assignments have CRUD coverage.
- Attendance check-in/check-out prevents duplicates and bad state transitions.
- Submission endpoint validates values against live parameter definitions inside a transaction.
- Dashboard APIs are fast and cache-friendly.
- CSV/Excel exports stream correctly for normal report size.
- Rate limiting, validation, logging, and centralized errors are active in all modules.
- PM2, SSL reverse proxy, backups, and production env handling are documented.

## 12. Final Advice

Build the backend in layers, not by jumping between unrelated screens or APIs. First lock the schema, then shared middleware, then auth, then management modules, then employee operations, then dashboards/reports. The submission module is the most critical part because it combines dynamic parameter rules, transactional writes, and reporting consequences. Treat it as the core of the platform and test it heavily.
