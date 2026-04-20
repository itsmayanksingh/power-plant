# Frontend Admin - Plant Monitoring

## Run

1. Install deps: `npm install`
2. Set API base URL in `.env.local`:
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`
3. Start dev server: `npm run dev`

## Build checks

- `npm run lint`
- `npm run build`

## Auth flow

- Login route: `/login`
- Protected routes: `/dashboard`, `/users`, `/sites`, `/submissions`, `/attendance`, `/reports`, `/settings`
- Route protection is implemented in `src/proxy.ts`

## Default backend credentials (seed)

- Email: `superadmin@plant.local`
- Password: `SuperAdmin@123`

## Functional modules

- Auth
- Dashboard
- Users (list/create/edit/activate/deactivate/detail)
- Sites (list/create/edit/remove/detail)
- Parameters (create/update/toggle/delete/reorder)
- Assignments (assign/remove)
- Submissions (list/detail/status update/missing/export)
- Attendance (list/summary)
- Reports (submission/attendance/parameter analysis + csv export)
- Settings (system settings + change password)
