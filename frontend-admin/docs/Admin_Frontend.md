# Plant-Based Monitoring System
## Admin Panel Frontend Implementation Guide

Version: 1.0  
Prepared for: Admin Dashboard Implementation  
Recommended stack: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod + Axios + Sonner

---

## 1. Purpose of this guide

This guide explains how to implement the **Admin Panel frontend** for the Plant-Based Monitoring System from zero to production-ready structure.

This implementation is based on the technical document, which defines the Admin Panel as a **Next.js 14 App Router application** for **Super Admin** and **Admin** users, with modules for dashboard, users, sites, parameters, submissions, attendance, and reports.

This guide expands that baseline and adds the frontend implementation details that are usually missing in a high-level architecture document:

- exact folder structure
- responsive layout approach
- route protection flow
- which UI part consumes which API part
- CRUD flow with pop messages
- try/catch-based error handling pattern
- reusable service layer pattern
- page, module, component, and state design
- white background and black text design system
- deep module-by-module implementation sequence

---

## 2. Admin panel goals

The Admin Panel should allow Super Admin and Admin users to:

1. sign in securely
2. view dashboard KPIs and alerts
3. manage users
4. manage sites
5. configure site parameters
6. assign employees to sites
7. monitor submissions
8. review attendance
9. export reports
10. view operational status with a responsive and professional UI

The frontend must be:

- responsive
- easy to maintain
- modular
- safe for CRUD operations
- clear in success/error feedback
- consistent in API consumption
- suitable for future scaling

---

## 3. UI design rules requested for this implementation

Use these UI rules throughout the frontend:

- background: white
- text color: black
- card background: white
- border color: light gray
- hover states: soft gray
- headings: black, bold
- body text: dark gray to near-black
- no heavy color dependency for readability
- keep a clean enterprise look

Recommended visual approach:

- page background: `bg-white`
- text: `text-black`
- muted text: `text-neutral-600`
- borders: `border-neutral-200`
- input borders: `border-neutral-300`
- success toast: green accent
- error toast: red accent
- warning badge: amber accent
- info badge: blue accent

This keeps the base UI black-on-white while still allowing system status colors for alerts and notifications.

---

## 4. Recommended frontend stack

The technical document already recommends these frontend technologies:

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- React Hook Form + Zod
- Recharts
- axios

For implementation quality, add these libraries:

- **sonner** for toast / pop messages after CRUD actions
- **lucide-react** for consistent icons
- **clsx** or **cn utility** for conditional class names
- **react-hook-form** for form state
- **zod** for schema validation
- **date-fns** for formatting dates
- **react-virtual** for large tables if needed

### Install command

```bash
npm install axios @tanstack/react-query zustand react-hook-form zod @hookform/resolvers sonner lucide-react date-fns clsx
```

If using shadcn/ui:

```bash
npx shadcn@latest init
```

Add commonly needed components:

```bash
npx shadcn@latest add button input card dialog dropdown-menu form table tabs badge skeleton textarea select sheet alert pagination sonner
```

---

## 5. Recommended architecture pattern

Use a **layered frontend architecture**.

### Layer 1: Routes and pages
Responsible for:

- page shell
- page-level layout
- route params
- search params
- calling hooks
- rendering components

### Layer 2: Feature modules
Responsible for:

- business-specific hooks
- forms
- tables
- modal logic
- page-specific UI composition

### Layer 3: Services / API layer
Responsible for:

- axios calls
- request configuration
- token handling
- try/catch standardization
- response parsing

### Layer 4: Shared UI and utilities
Responsible for:

- reusable components
- helpers
- constants
- toast wrapper
- error formatter
- query keys

This makes the code scalable and easier for Codex or any AI to understand.

---

## 6. High-level frontend flow

```text
User opens Admin Panel
-> Auth check happens
-> If not logged in, redirect to /login
-> If logged in, dashboard layout loads
-> Page requests data through feature hook
-> Feature hook calls service layer
-> Service layer calls backend API
-> Response returns to hook
-> UI updates table/cards/forms
-> On CRUD action: form validate -> mutate -> toast -> refresh list
```

---

## 7. Which frontend part consumes which backend part

This is one of the most important sections.

### 7.1 Auth module
Frontend parts:

- login page
- auth store
- route guard
- axios interceptor

Consumes backend:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/users/me`

### 7.2 Dashboard module
Frontend parts:

- KPI cards
- recent submissions widget
- attendance today widget
- missing submissions widget
- site-wise stats cards
- submission trend chart

Consumes backend:

- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/recent-submissions`
- `GET /api/v1/dashboard/attendance-today`
- `GET /api/v1/dashboard/missing-today`
- `GET /api/v1/dashboard/site-wise-stats`

### 7.3 Users module
Frontend parts:

- users table
- create user modal/page
- edit user form
- activate/deactivate action
- profile page
- bulk import modal

Consumes backend:

- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`
- `PATCH /api/v1/users/:id/activate`
- `PATCH /api/v1/users/:id/deactivate`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`

### 7.4 Sites module
Frontend parts:

- site listing page
- create site form
- site detail page
- assignment panel
- site status toggle

Consumes backend:

- `GET /api/v1/sites`
- `GET /api/v1/sites/:id`
- `POST /api/v1/sites`
- `PUT /api/v1/sites/:id`
- `DELETE /api/v1/sites/:id`
- `POST /api/v1/sites/:id/assign`
- `DELETE /api/v1/sites/:id/assign/:userId`

### 7.5 Parameters module
Frontend parts:

- parameter builder
- add parameter modal
- edit parameter modal
- reorder UI
- enable/disable toggle

Consumes backend:

- `GET /api/v1/sites/:siteId/parameters`
- `POST /api/v1/sites/:siteId/parameters`
- `PUT /api/v1/parameters/:id`
- `DELETE /api/v1/parameters/:id`
- `PATCH /api/v1/parameters/:id/toggle`
- `PUT /api/v1/sites/:siteId/parameters/reorder`

### 7.6 Submissions module
Frontend parts:

- submissions table
- filter bar
- submission detail drawer
- approve/reject dialog
- export button
- missing submission alert panel

Consumes backend:

- `GET /api/v1/submissions`
- `GET /api/v1/submissions/:id`
- `PATCH /api/v1/submissions/:id/status`
- `GET /api/v1/submissions/missing`
- `GET /api/v1/submissions/export`

### 7.7 Attendance module
Frontend parts:

- attendance table
- summary cards
- date range filters
- calendar view
- CSV export action

Consumes backend:

- `GET /api/v1/attendance`
- `GET /api/v1/attendance/summary`

### 7.8 Reports module
Frontend parts:

- report filters
- export actions
- charts
- site-wise and parameter-wise reporting widgets

Consumes backend:

- report endpoints and export endpoints based on backend implementation
- for current scope, these may reuse:
  - `GET /api/v1/submissions/export`
  - `GET /api/v1/attendance/summary`
  - dashboard/statistical endpoints

---

## 8. Recommended folder structure

Use this folder structure so that routes, features, services, and shared components stay separated.

```text
plant-monitoring-web/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── sites/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── submissions/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   └── page-shell.tsx
│   │   ├── feedback/
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-state.tsx
│   │   │   ├── loading-state.tsx
│   │   │   └── confirm-dialog.tsx
│   │   ├── tables/
│   │   ├── forms/
│   │   ├── charts/
│   │   ├── filters/
│   │   └── common/
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── services/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── sites/
│   │   ├── parameters/
│   │   ├── assignments/
│   │   ├── submissions/
│   │   ├── attendance/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── axios.ts
│   │   │   ├── api-error.ts
│   │   │   ├── endpoints.ts
│   │   │   └── query-client.ts
│   │   ├── auth/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── constants/
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── sites.service.ts
│   │   ├── parameters.service.ts
│   │   ├── submissions.service.ts
│   │   ├── attendance.service.ts
│   │   └── dashboard.service.ts
│   │
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts
│   │   └── filters.store.ts
│   │
│   ├── types/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── site.ts
│   │   ├── parameter.ts
│   │   ├── submission.ts
│   │   └── attendance.ts
│   │
│   └── middleware.ts
├── package.json
└── tsconfig.json
```

---

## 9. Theme and responsiveness implementation

### 9.1 Global style baseline

Use `globals.css` to keep the base theme clean.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  background: white;
  color: black;
}

body {
  font-family: Arial, Helvetica, sans-serif;
}
```

### 9.2 Responsive layout rules

Desktop:

- left sidebar visible
- header fixed or sticky
- tables visible with full filters

Tablet:

- sidebar collapsible
- cards stack into 2 columns
- filters may wrap into 2 lines

Mobile:

- sidebar becomes drawer/sheet
- KPI cards stacked one by one
- tables use horizontal scroll or simplified card layout
- actions move into dropdown menu
- forms use single-column layout

### 9.3 Responsive page shell

Use these design rules:

- page container max width should not look stretched
- padding should adapt by breakpoint
- tables should be wrapped in overflow container
- dialog widths should adapt for mobile
- button groups should wrap when space is tight

Example layout classes:

```tsx
<div className="min-h-screen bg-white text-black">
  <div className="flex">
    <Sidebar className="hidden lg:block" />
    <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
      {children}
    </main>
  </div>
</div>
```

---

## 10. Routing and route protection

### 10.1 Auth routes

Public routes:

- `/login`

Protected routes:

- `/dashboard`
- `/users`
- `/sites`
- `/submissions`
- `/attendance`
- `/reports`
- `/settings`

### 10.2 Route guard logic

Use `middleware.ts` to protect dashboard routes.

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isProtected = !isAuthPage;

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

If your auth is not cookie-based, adapt the logic through server-side session checks or a custom backend-for-frontend approach.

---

## 11. Axios client and API consumption design

All API calls should go through one central axios client.

### 11.1 Why this matters

Without one central API client, every page handles headers and errors differently. That creates confusion and bugs.

### 11.2 Base axios client

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);
```

### 11.3 Standard error formatter

```ts
export function getApiErrorMessage(error: any): string {
  if (error?.response?.data?.message) return error.response.data.message;
  if (Array.isArray(error?.response?.data?.errors)) {
    return error.response.data.errors.join(", ");
  }
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
}
```

---

## 12. CRUD success and error pop messages

Use **Sonner** for pop messages.

### 12.1 Add toaster in root layout

```tsx
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

### 12.2 Success and error usage

```ts
import { toast } from "sonner";

toast.success("User created successfully");
toast.error("Failed to create user");
```

### 12.3 When to show toast messages

Show toast on:

- create success
- update success
- delete success
- activate/deactivate success
- export started/completed
- API failure
- validation failure from server
- network failure

### 12.4 Toast message rules

Keep messages short:

- "User created successfully"
- "Site updated successfully"
- "Parameter deleted successfully"
- "Failed to load submissions"
- "Network error. Please try again"

---

## 13. Try/catch pattern in every CRUD operation

The user requested try/catch handling in every part. Use this rule everywhere:

- in service functions
- in custom mutation hooks
- in submit handlers
- in special page loaders where needed

### 13.1 Service layer example

```ts
import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";

export async function createUser(payload: CreateUserPayload) {
  try {
    const response = await api.post("/api/v1/users", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
```

### 13.2 Mutation hook example

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createUser } from "@/services/users.service";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });
}
```

### 13.3 Form submit example

```ts
const onSubmit = async (values: CreateUserPayload) => {
  try {
    await mutateAsync(values);
    form.reset();
    onClose();
  } catch (error) {
    console.error("Create user failed", error);
  }
};
```

Important note: even when `onError` already shows the toast, keep `try/catch` in the submit function so the form does not break and debugging stays easy.

---

## 14. Query keys and cache strategy

Every module should have stable query keys.

Examples:

```ts
export const queryKeys = {
  me: ["me"],
  dashboardStats: ["dashboard-stats"],
  recentSubmissions: ["recent-submissions"],
  users: (params?: Record<string, unknown>) => ["users", params],
  user: (id: string) => ["user", id],
  sites: (params?: Record<string, unknown>) => ["sites", params],
  site: (id: string) => ["site", id],
  parameters: (siteId: string) => ["parameters", siteId],
  submissions: (params?: Record<string, unknown>) => ["submissions", params],
  attendance: (params?: Record<string, unknown>) => ["attendance", params],
};
```

After CRUD actions, invalidate only the relevant queries.

Examples:

- after creating user -> invalidate `users`
- after editing site -> invalidate `site(id)` and `sites`
- after adding parameter -> invalidate `parameters(siteId)` and `site(siteId)`
- after reviewing submission -> invalidate `submissions` and dashboard widgets

---

## 15. Module-by-module implementation guide

This is the deepest section of the guide.

## 15.1 Auth module

### Purpose

Handle login, session loading, logout, and route access.

### UI parts

- login page
- auth provider
- auth store
- logout action
- protected layout

### API consumed

- login
- refresh
- logout
- current user profile

### Components

- `LoginForm`
- `ProtectedLayoutGate`
- `LogoutButton`

### State

- current user
- token/session state
- loading state

### Form fields

- email
- password

### Validation

- email required and valid
- password required

### Success flow

1. validate form
2. call login API
3. store session/token
4. fetch profile
5. redirect to dashboard
6. show success toast if desired

### Error flow

1. login fails
2. show error toast
3. keep form values
4. show inline error state if needed

### Responsive behavior

- login card centered
- mobile width full with padding
- desktop width fixed card

### Important note

Keep login page visually simple. Do not overload it.

---

## 15.2 Dashboard module

### Purpose

Provide high-level operational visibility.

### UI parts

- KPI cards
- recent submissions table
- attendance summary widget
- missing submissions alert widget
- site-wise cards
- charts

### API consumed

- dashboard stats
- recent submissions
- attendance today
- missing today
- site-wise stats

### Components

- `DashboardKpiCards`
- `RecentSubmissionsTable`
- `MissingSubmissionsCard`
- `AttendanceTodayCard`
- `SiteWiseStatsGrid`
- `SubmissionTrendChart`

### Page structure

Top:
- page title
- quick filters if needed

Middle:
- KPI cards
- alerts row

Bottom:
- chart and recent submissions

### Responsive behavior

- desktop: 4 KPI cards in row
- tablet: 2 per row
- mobile: 1 per row

### Error handling

Each widget should handle its own loading and error state instead of breaking the whole page.

---

## 15.3 Users module

### Purpose

Manage Admin and Employee accounts.

### UI parts

- list page
- filters
- create user modal
- edit page
- detail page
- status toggle
- bulk import modal

### API consumed

- list users
- get user by id
- create user
- update user
- delete user
- activate/deactivate user

### Components

- `UsersTable`
- `UsersFilterBar`
- `CreateUserDialog`
- `EditUserForm`
- `UserStatusToggle`
- `BulkImportUsersDialog`

### Fields for create/edit

- name
- email
- role
- phone
- assign site if employee
- password for create

### CRUD design

#### List
- fetch with pagination and search
- table columns: name, email, role, status, site count, created date, actions

#### Create
- open dialog
- validate
- submit
- show success toast
- refresh table
- close dialog

#### Edit
- fetch details
- prefill form
- update
- success toast
- refresh detail and list

#### Delete
- open confirmation dialog
- delete only if role permits
- success toast
- refresh list

#### Activate/deactivate
- inline action
- confirmation dialog optional
- mutation with toast

### Responsive behavior

- on mobile, table rows can collapse into cards
- action buttons move into dropdown

---

## 15.4 Sites module

### Purpose

Manage plant sites and site details.

### UI parts

- site list page
- create site page
- edit site page
- site detail page
- employee assignment section
- parameter section

### API consumed

- list sites
- get site details
- create site
- update site
- delete site
- assign employee
- remove employee assignment

### Components

- `SitesTable` or `SitesGrid`
- `CreateSiteForm`
- `EditSiteForm`
- `SiteDetailsCard`
- `AssignedEmployeesPanel`
- `AssignEmployeeDialog`

### Fields

- site name
- location
- description
- status

### Important behavior

Site detail page should act as the main hub for:

- basic site info
- employee assignments
- parameter management
- submission metrics

---

## 15.5 Parameters module

### Purpose

Allow Admin/Super Admin to define dynamic form fields per site.

### UI parts

- parameter list
- add parameter dialog
- edit parameter dialog
- reorder control
- enable/disable toggle

### API consumed

- list parameters by site
- create parameter
- update parameter
- delete parameter
- toggle parameter
- reorder parameters

### Components

- `ParameterBuilder`
- `ParameterTable`
- `ParameterFormDialog`
- `ParameterTypeFields`
- `ReorderParameterList`

### Supported parameter types

- number
- text
- dropdown
- boolean
- date

### Type-specific form behavior

#### number
- unit
- min value
- max value
- required flag

#### text
- max length
- required flag

#### dropdown
- options array
- required flag

#### boolean
- required flag

#### date
- required flag

### Special notes

This module is critical because mobile dynamic form generation depends on it. Any mistake here affects employee submission screens.

### Responsive behavior

For reordering on mobile, use move up/down buttons instead of drag-and-drop only.

---

## 15.6 Employee assignment module

### Purpose

Map employees to one or more sites.

### UI parts

- assignment table inside site detail
- assign employee dialog
- remove assignment action

### API consumed

- assign employee to site
- remove employee from site

### Components

- `AssignEmployeeDialog`
- `AssignedEmployeeTable`
- `RemoveAssignmentButton`

### UX flow

1. admin opens site detail
2. clicks assign employee
3. selects employee
4. submits
5. success toast
6. list refreshes

---

## 15.7 Submissions monitoring module

### Purpose

Allow admin users to monitor, review, and export submissions.

### UI parts

- submissions page
- filter bar
- detail drawer
- status update dialog
- export action
- missing submissions panel

### API consumed

- list submissions
- get one submission
- missing submissions report
- export submissions
- approve/reject submission

### Components

- `SubmissionsTable`
- `SubmissionFilterBar`
- `SubmissionDetailDrawer`
- `ReviewSubmissionDialog`
- `MissingSubmissionsWidget`
- `ExportSubmissionsButton`

### Filters

- site
- date range
- employee
- status

### Table columns

- submission date
- site
- employee
- status
- created time
- actions

### Detail drawer contents

- submission meta
- notes
- parameter values list
- approval/rejection history if present

### Review flow

1. open detail
2. click approve or reject
3. add review note if required
4. submit mutation
5. show toast
6. refresh list and dashboard stats

---

## 15.8 Attendance module

### Purpose

Show employee attendance records and summaries.

### UI parts

- attendance table
- site/date/employee filters
- summary cards
- export action
- calendar style view if required

### API consumed

- attendance list
- attendance summary

### Components

- `AttendanceTable`
- `AttendanceFilterBar`
- `AttendanceSummaryCards`
- `AttendanceCalendarView`
- `ExportAttendanceButton`

### Table columns

- employee name
- site
- attendance date
- check-in time
- check-out time
- status
- location if needed

### Responsive behavior

On small screens, show attendance rows as stacked cards.

---

## 15.9 Reports module

### Purpose

Provide exportable analytics and operational reports.

### UI parts

- reports page
- report filter bar
- charts
- export buttons
- report cards

### Components

- `ReportFilters`
- `CompletenessReportCard`
- `ParameterAnalysisChart`
- `SitePerformanceCards`
- `ExportReportButton`

### Data sources

Use submissions, attendance, and dashboard endpoints depending on the report type.

### Important note

Large exports should ideally trigger background export jobs in future versions. For current scope, direct download endpoints are acceptable.

---

## 15.10 Settings module (recommended addition)

### Purpose

Store system-wide configuration.

### Suggested UI parts

- profile settings
- password change form
- submission rules
- attendance timing rules
- notification settings
- role permissions in future

This module was not deeply defined in the original tech document, but it should exist in a real admin frontend.

---

## 16. Reusable components you should build first

Build these shared components early so every page remains consistent.

### Layout components

- Sidebar
- Header
- Breadcrumb
- PageShell
- SectionHeader

### Feedback components

- LoadingState
- ErrorState
- EmptyState
- ConfirmDialog
- StatusBadge

### Table helpers

- DataTableWrapper
- TableToolbar
- TablePagination
- ActionDropdown

### Form helpers

- FormSection
- FormActions
- ControlledInput
- ControlledSelect
- ControlledTextarea
- ControlledDatePicker
- ControlledSwitch

### Filter helpers

- SearchInput
- DateRangeFilter
- SiteFilter
- EmployeeFilter
- StatusFilter

---

## 17. Standard CRUD workflow you should use everywhere

This standard should be followed in all modules.

### Create workflow

1. open form dialog/page
2. validate client-side with Zod
3. submit mutation
4. service layer uses try/catch
5. on success show toast
6. invalidate query
7. refresh list or detail
8. reset form
9. close dialog if needed

### Update workflow

1. fetch existing data
2. prefill form
3. user edits values
4. submit mutation
5. success toast
6. invalidate detail + listing query
7. keep user on same page or navigate back

### Delete workflow

1. click delete
2. open confirm dialog
3. call delete mutation
4. success toast
5. invalidate list

### Failure workflow

1. API throws error
2. parse error message
3. show error toast
4. keep dialog/form open
5. do not lose user input

---

## 18. Suggested service file pattern

### users.service.ts

```ts
import { api } from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/api/api-error";

export async function getUsers(params?: Record<string, unknown>) {
  try {
    const response = await api.get("/api/v1/users", { params });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getUserById(id: string) {
  try {
    const response = await api.get(`/api/v1/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function createUser(payload: Record<string, unknown>) {
  try {
    const response = await api.post("/api/v1/users", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  try {
    const response = await api.put(`/api/v1/users/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function deleteUser(id: string) {
  try {
    const response = await api.delete(`/api/v1/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
```

Apply this same pattern to:

- sites.service.ts
- parameters.service.ts
- submissions.service.ts
- attendance.service.ts
- dashboard.service.ts

---

## 19. Suggested mutation hook pattern

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateSite } from "@/services/sites.service";

export function useUpdateSite(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateSite(siteId, payload),
    onSuccess: () => {
      toast.success("Site updated successfully");
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update site");
    },
  });
}
```

---

## 20. Recommended form validation approach

Use `react-hook-form` + `zod` for all forms.

### Example user schema

```ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["superadmin", "admin", "employee"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Example form submit

```ts
const form = useForm<CreateUserFormValues>({
  resolver: zodResolver(createUserSchema),
  defaultValues: {
    name: "",
    email: "",
    role: "employee",
    password: "",
  },
});
```

---

## 21. Table design rules

Admin panels usually fail when tables are not planned carefully.

Use these rules:

- keep important columns visible first
- move secondary actions into dropdown
- allow horizontal scroll on smaller screens
- use badges for status
- keep filters above the table
- support empty/loading/error states
- use pagination for large datasets

Example wrapper:

```tsx
<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
  <Table>
    {/* rows */}
  </Table>
</div>
```

---

## 22. Suggested page structure per module

Use the same page pattern everywhere.

### Standard page skeleton

1. page title and breadcrumb
2. small action row
3. filters section
4. summary cards if relevant
5. main data area
6. dialogs mounted at page level

### Example

```tsx
<PageShell>
  <SectionHeader
    title="Users"
    description="Manage admins and employees"
    action={<CreateUserButton />}
  />

  <UsersFilterBar />
  <UsersTable />
  <CreateUserDialog />
</PageShell>
```

---

## 23. Suggested implementation order for frontend

Build the frontend in this order:

### Phase 1: Foundation

- project setup
- Tailwind
- shadcn/ui
- root layout
- sidebar/header
- auth store
- axios client
- toast provider
- route middleware
- error formatter
- query client provider

### Phase 2: Authentication and shell

- login page
- logout flow
- profile load
- protected dashboard layout
- sidebar navigation

### Phase 3: Dashboard

- KPI cards
- recent submissions
- attendance widget
- missing submissions widget
- charts

### Phase 4: Users module

- listing
- create
- edit
- activate/deactivate
- delete

### Phase 5: Sites and parameters

- site list
- create/edit site
- site detail
- parameter builder
- assignments

### Phase 6: Submissions and attendance

- submission list
- submission detail
- status review
- attendance list
- attendance summary

### Phase 7: Reports and exports

- reports page
- filters
- export buttons
- charts

### Phase 8: Hardening

- empty/loading/error states
- mobile responsive improvements
- permission-based rendering
- polish of dialogs and tables

---

## 24. Deep explanation of component responsibility

This section explains which part does what.

### Page component responsibility

A page should:

- read route params
- render page sections
- assemble page layout
- call feature components

A page should **not** directly contain heavy axios logic.

### Feature component responsibility

A feature component should:

- manage one business area
- call hooks
- render UI for one module

### Service responsibility

A service should:

- call one backend endpoint
- catch and normalize errors
- return parsed data

### Hook responsibility

A hook should:

- call service layer
- manage query/mutation state
- show toasts
- invalidate queries

### Shared component responsibility

A shared component should:

- stay reusable
- not know too much about backend
- be controlled by props

This separation is very important if you want Codex or any AI to build consistently.

---

## 25. Example: full create user flow from UI to backend

```text
User clicks "Create User"
-> CreateUserDialog opens
-> User fills form
-> react-hook-form + zod validate input
-> onSubmit calls useCreateUser().mutateAsync(values)
-> useCreateUser hook calls createUser service
-> createUser service calls POST /api/v1/users
-> backend responds
-> onSuccess shows toast.success
-> users query invalidates
-> users table refetches
-> dialog closes
```

If API fails:

```text
POST /api/v1/users fails
-> service catches error
-> service throws normalized Error(message)
-> mutation onError shows toast.error
-> dialog stays open
-> form data remains
```

---

## 26. Example: full parameter builder flow

```text
Admin opens Site Detail page
-> parameters query loads current parameters
-> ParameterTable renders values
-> Admin clicks Add Parameter
-> ParameterFormDialog opens
-> type-specific fields appear based on selected type
-> submit calls POST /sites/:siteId/parameters
-> success toast shown
-> parameters query invalidated
-> mobile app will later consume this same parameter definition
```

This is why parameter builder is one of the most sensitive modules.

---

## 27. Error handling checklist

Use this checklist everywhere:

- every service function wrapped in try/catch
- every mutation shows success or error toast
- every query has loading state
- every query has empty state
- every major page has error state fallback
- every destructive action has confirmation dialog
- every form keeps values after API failure
- every table handles no data gracefully

---

## 28. Responsive checklist

Use this checklist before final delivery:

- sidebar collapses on small screens
- all forms are single-column on mobile
- all dialogs fit within mobile viewport
- tables can scroll horizontally
- button rows wrap without overflow
- charts remain readable on tablet
- page header does not overlap with actions
- filter controls wrap properly

---

## 29. Suggested file naming and coding rules

Use these rules for consistency:

- pages: `page.tsx`
- layouts: `layout.tsx`
- services: `*.service.ts`
- hooks: `use-*.ts`
- schemas: `*.schema.ts`
- components: `PascalCase.tsx`
- query keys centralized
- no direct axios in page files
- no repeated toast strings everywhere without pattern

---

## 30. Suggested prompt for Codex or any AI

```text
Build the admin panel frontend for a Plant-Based Monitoring System using Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Axios, and Sonner.

UI requirements:
- background white
- text black
- responsive on desktop, tablet, and mobile
- enterprise admin dashboard look

Architecture requirements:
- use App Router
- route groups for auth and dashboard
- shared layout with sidebar and header
- centralized axios client
- services layer for all API requests
- React Query for all server data
- toast messages after every CRUD action
- try/catch in every service and submit handler
- loading, empty, and error states in each module

Modules to build:
- auth
- dashboard
- users
- sites
- parameters
- assignments
- submissions
- attendance
- reports
- settings

Important implementation rules:
- no direct API calls inside page files
- use zod validation for all forms
- use confirm dialogs before delete actions
- invalidate correct query keys after CRUD
- use responsive tables and mobile-friendly dialogs
- show clear toast success and error messages for create, update, delete, approve, reject, activate, deactivate, and export actions

Also provide:
- folder structure
- reusable components
- service files
- hooks
- page-level implementation
- sample code for one full CRUD module
```

---

## 31. Final recommendation

If you want the frontend to be clean and scalable, do not start by building pages randomly.

Start in this exact order:

1. global layout and providers
2. auth and route protection
3. API client and error handling
4. shared components
5. dashboard
6. users CRUD
7. sites and parameters
8. submissions and attendance
9. reports
10. final responsive polish

The most important engineering rules for this project are:

- one central API client
- one standard CRUD pattern
- one toast system
- one query key strategy
- one responsive page shell
- try/catch everywhere necessary
- no business logic scattered inside UI pages

If these rules are followed, the admin panel will be easier to scale, debug, and maintain.
