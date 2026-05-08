-- Role hardening + tenant isolation verification script
-- Run after migrations/seeds:
-- psql "<connection>" -f scripts/verify-role-hardening.sql

-- 1) Exactly one active superadmin
SELECT role, is_active, COUNT(*) AS count
FROM users
WHERE role = 'superadmin' AND is_active = true
GROUP BY role, is_active;

-- 2) owner_admin_id propagation sanity
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'employee' AND owner_admin_id IS NULL) AS employees_without_owner,
  (SELECT COUNT(*) FROM sites WHERE owner_admin_id IS NULL) AS sites_without_owner,
  (SELECT COUNT(*) FROM employee_site_assignments WHERE owner_admin_id IS NULL) AS assignments_without_owner,
  (SELECT COUNT(*) FROM data_submissions WHERE owner_admin_id IS NULL) AS submissions_without_owner,
  (SELECT COUNT(*) FROM attendance WHERE owner_admin_id IS NULL) AS attendance_without_owner;

-- 3) Tenant leakage quick check by owner
SELECT owner_admin_id, COUNT(*) AS site_count
FROM sites
GROUP BY owner_admin_id
ORDER BY site_count DESC;

SELECT owner_admin_id, COUNT(*) AS submission_count
FROM data_submissions
GROUP BY owner_admin_id
ORDER BY submission_count DESC;

SELECT owner_admin_id, COUNT(*) AS attendance_count
FROM attendance
GROUP BY owner_admin_id
ORDER BY attendance_count DESC;

