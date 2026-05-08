/* eslint-disable no-console */
const request = require('supertest')
const app = require('../src/config/app')
const db = require('../src/config/database')
const { hashPassword } = require('../src/utils/password')
const { getUtcDateString } = require('../src/utils/dateHelper')

const PASSWORDS = {
  superadmin: 'SuperAdmin@123',
  admin: 'Admin@123',
  employee: 'Employee@123'
}

function assertTrue (condition, message) {
  if (!condition) throw new Error(message)
}

async function upsertUser ({ name, email, role, password, ownerAdminId = null, createdBy = null }) {
  const passwordHash = await hashPassword(password)
  const existing = await db('users').where({ email }).first()
  if (existing) {
    const [updated] = await db('users')
      .where({ id: existing.id })
      .update({
        name,
        role,
        password_hash: passwordHash,
        owner_admin_id: ownerAdminId,
        created_by: createdBy,
        is_active: true,
        updated_at: new Date()
      })
      .returning('*')
    return updated
  }

  const [created] = await db('users')
    .insert({
      name,
      email,
      role,
      password_hash: passwordHash,
      owner_admin_id: ownerAdminId,
      created_by: createdBy,
      is_active: true
    })
    .returning('*')
  return created
}

async function upsertSite ({ name, location, description, ownerAdminId, createdBy }) {
  const existing = await db('sites').where({ name, owner_admin_id: ownerAdminId }).first()
  if (existing) {
    const [updated] = await db('sites')
      .where({ id: existing.id })
      .update({
        location,
        description,
        created_by: createdBy,
        is_active: true,
        updated_at: new Date()
      })
      .returning('*')
    return updated
  }

  const [created] = await db('sites')
    .insert({
      name,
      location,
      description,
      owner_admin_id: ownerAdminId,
      created_by: createdBy,
      is_active: true
    })
    .returning('*')
  return created
}

async function ensureParameter ({ siteId, name, type, isRequired, options, minValue, maxValue, unit, displayOrder }) {
  const existing = await db('site_parameters').where({ site_id: siteId, name }).first()
  const base = {
    site_id: siteId,
    name,
    type,
    is_required: isRequired,
    options: options ? JSON.stringify(options) : null,
    min_value: minValue ?? null,
    max_value: maxValue ?? null,
    unit: unit ?? null,
    display_order: displayOrder,
    is_active: true,
    updated_at: new Date()
  }
  if (existing) {
    const [updated] = await db('site_parameters').where({ id: existing.id }).update(base).returning('*')
    return updated
  }
  const [created] = await db('site_parameters').insert(base).returning('*')
  return created
}

async function ensureAssignment ({ employeeId, siteId, ownerAdminId, assignedBy }) {
  const existing = await db('employee_site_assignments').where({ employee_id: employeeId, site_id: siteId }).first()
  if (existing) {
    const [updated] = await db('employee_site_assignments')
      .where({ id: existing.id })
      .update({
        owner_admin_id: ownerAdminId,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        is_active: true
      })
      .returning('*')
    return updated
  }

  const [created] = await db('employee_site_assignments')
    .insert({
      employee_id: employeeId,
      site_id: siteId,
      owner_admin_id: ownerAdminId,
      assigned_by: assignedBy,
      is_active: true
    })
    .returning('*')
  return created
}

async function loginAndToken (email, password) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })

  assertTrue(response.status === 200, `Login failed for ${email}: ${response.status}`)
  assertTrue(response.body?.success === true, `Login response invalid for ${email}`)
  return response.body.data.accessToken
}

async function run () {
  const today = getUtcDateString()
  const report = []
  const add = (name, ok, details = '') => {
    report.push({ name, ok, details })
    console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${details ? ` | ${details}` : ''}`)
  }

  try {
    const superadmin = await upsertUser({
      name: 'Super Admin',
      email: 'superadmin@plant.local',
      role: 'superadmin',
      password: PASSWORDS.superadmin
    })
    const adminA = await upsertUser({
      name: 'Admin One',
      email: 'admin1@plant.local',
      role: 'admin',
      password: PASSWORDS.admin,
      createdBy: superadmin.id
    })
    const adminB = await upsertUser({
      name: 'Admin Two',
      email: 'admin2@plant.local',
      role: 'admin',
      password: PASSWORDS.admin,
      createdBy: superadmin.id
    })
    const employeeA = await upsertUser({
      name: 'Employee One',
      email: 'employee1@plant.local',
      role: 'employee',
      password: PASSWORDS.employee,
      ownerAdminId: adminA.id,
      createdBy: adminA.id
    })
    const employeeB = await upsertUser({
      name: 'Employee Two',
      email: 'employee2@plant.local',
      role: 'employee',
      password: PASSWORDS.employee,
      ownerAdminId: adminB.id,
      createdBy: adminB.id
    })
    add('Dummy users ready', true, 'superadmin + admin1/admin2 + employee1/employee2')

    const siteA = await upsertSite({
      name: 'E2E Site A',
      location: 'Plant Zone A',
      description: 'Deterministic site for admin1',
      ownerAdminId: adminA.id,
      createdBy: adminA.id
    })
    const siteB = await upsertSite({
      name: 'E2E Site B',
      location: 'Plant Zone B',
      description: 'Deterministic site for admin2',
      ownerAdminId: adminB.id,
      createdBy: adminB.id
    })
    add('Dummy sites ready', true, `siteA=${siteA.id}, siteB=${siteB.id}`)

    await ensureParameter({
      siteId: siteA.id,
      name: 'Temperature',
      type: 'number',
      isRequired: true,
      minValue: 0,
      maxValue: 100,
      unit: 'C',
      displayOrder: 1
    })
    await ensureParameter({
      siteId: siteA.id,
      name: 'Color',
      type: 'dropdown',
      isRequired: true,
      options: ['Red', 'Green', 'Blue'],
      displayOrder: 2
    })
    await ensureParameter({
      siteId: siteA.id,
      name: 'Remarks',
      type: 'text',
      isRequired: false,
      displayOrder: 3
    })
    add('Dummy parameters ready', true, 'siteA has number+dropdown+text')

    await ensureAssignment({
      employeeId: employeeA.id,
      siteId: siteA.id,
      ownerAdminId: adminA.id,
      assignedBy: adminA.id
    })
    await ensureAssignment({
      employeeId: employeeB.id,
      siteId: siteB.id,
      ownerAdminId: adminB.id,
      assignedBy: adminB.id
    })
    add('Dummy assignments ready', true)

    const existingSubmissions = await db('data_submissions')
      .where({ site_id: siteA.id, submitted_by: employeeA.id, submission_date: today })
      .select('id')
    if (existingSubmissions.length > 0) {
      const ids = existingSubmissions.map(r => r.id)
      await db('submission_values').whereIn('submission_id', ids).del()
      await db('data_submissions').whereIn('id', ids).del()
    }
    await db('attendance').where({ site_id: siteA.id, user_id: employeeA.id, attendance_date: today }).del()
    add('Today cleanup done', true, 'employee1/siteA attendance+submission reset')

    const superToken = await loginAndToken('superadmin@plant.local', PASSWORDS.superadmin)
    const adminAToken = await loginAndToken('admin1@plant.local', PASSWORDS.admin)
    const adminBToken = await loginAndToken('admin2@plant.local', PASSWORDS.admin)
    const employeeAToken = await loginAndToken('employee1@plant.local', PASSWORDS.employee)
    add('Auth login tokens', true, 'superadmin/admin1/admin2/employee1')

    const mySite = await request(app).get('/api/v1/sites/my-site').set('Authorization', `Bearer ${employeeAToken}`)
    assertTrue(mySite.status === 200, `employee my-site failed: ${mySite.status}`)
    assertTrue(mySite.body?.data?.site?.id === siteA.id, 'employee my-site site mismatch')
    add('Employee my-site (/sites/my-site)', true, mySite.body.data.site.name)

    const mySiteAlias = await request(app).get('/api/v1/site/my-site').set('Authorization', `Bearer ${employeeAToken}`)
    assertTrue(mySiteAlias.status === 200, `employee my-site alias failed: ${mySiteAlias.status}`)
    add('Employee my-site alias (/site/my-site)', true)

    const checkIn = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${employeeAToken}`)
      .send({ siteId: siteA.id, latitude: 28.6139, longitude: 77.2090 })
    assertTrue(checkIn.status === 201, `attendance check-in failed: ${checkIn.status}`)
    add('Employee attendance check-in', true)

    const attendanceMy = await request(app).get('/api/v1/attendance/my').set('Authorization', `Bearer ${employeeAToken}`)
    assertTrue(attendanceMy.status === 200, `attendance/my failed: ${attendanceMy.status}`)
    assertTrue((attendanceMy.body?.data?.items || []).length > 0, 'attendance/my returned empty list')
    add('Employee attendance history', true)

    const params = await db('site_parameters').where({ site_id: siteA.id, is_active: true }).orderBy('display_order', 'asc')
    const values = params.map(param => {
      if (param.type === 'number') return { parameterId: param.id, value: 52 }
      if (param.type === 'dropdown') return { parameterId: param.id, value: (param.options || [])[0] || 'Red' }
      if (param.type === 'boolean') return { parameterId: param.id, value: true }
      if (param.type === 'date') return { parameterId: param.id, value: today }
      return { parameterId: param.id, value: 'E2E OK' }
    })

    const createSubmission = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${employeeAToken}`)
      .send({ siteId: siteA.id, submissionDate: today, notes: 'E2E dummy submit', values })
    assertTrue(createSubmission.status === 201, `submission create failed: ${createSubmission.status}`)
    const submissionId = createSubmission.body?.data?.id
    add('Employee submission create', true, `submissionId=${submissionId}`)

    const admin1Submissions = await request(app)
      .get('/api/v1/submissions?page=1&limit=20')
      .set('Authorization', `Bearer ${adminAToken}`)
    assertTrue(admin1Submissions.status === 200, `admin1 submissions failed: ${admin1Submissions.status}`)
    assertTrue((admin1Submissions.body?.data?.items || []).some(row => row.id === submissionId), 'admin1 cannot see own submission')
    add('Admin1 sees own submission', true)

    const admin2Submissions = await request(app)
      .get('/api/v1/submissions?page=1&limit=20')
      .set('Authorization', `Bearer ${adminBToken}`)
    assertTrue(admin2Submissions.status === 200, `admin2 submissions failed: ${admin2Submissions.status}`)
    assertTrue(!(admin2Submissions.body?.data?.items || []).some(row => row.id === submissionId), 'admin2 should not see admin1 submission')
    add('Admin2 isolation on submissions', true)

    const superSubmissions = await request(app)
      .get('/api/v1/submissions?page=1&limit=50')
      .set('Authorization', `Bearer ${superToken}`)
    assertTrue(superSubmissions.status === 200, `superadmin submissions failed: ${superSubmissions.status}`)
    assertTrue((superSubmissions.body?.data?.items || []).some(row => row.id === submissionId), 'superadmin should see all submissions')
    add('Superadmin global submission visibility', true)

    const admin1Sites = await request(app).get('/api/v1/sites?page=1&limit=50').set('Authorization', `Bearer ${adminAToken}`)
    const admin2Sites = await request(app).get('/api/v1/sites?page=1&limit=50').set('Authorization', `Bearer ${adminBToken}`)
    assertTrue(admin1Sites.status === 200 && admin2Sites.status === 200, 'sites list failed for admin')
    assertTrue((admin1Sites.body?.data?.items || []).some(s => s.id === siteA.id), 'admin1 site missing')
    assertTrue(!(admin1Sites.body?.data?.items || []).some(s => s.id === siteB.id), 'admin1 should not see admin2 site')
    assertTrue((admin2Sites.body?.data?.items || []).some(s => s.id === siteB.id), 'admin2 site missing')
    add('Admin-wise site isolation', true)

    const adminRoutes = [
      '/api/v1/users/me',
      '/api/v1/users?page=1&limit=20',
      '/api/v1/sites?page=1&limit=20',
      '/api/v1/submissions?page=1&limit=20',
      '/api/v1/attendance?page=1&limit=20',
      '/api/v1/dashboard/stats',
      '/api/v1/dashboard/recent-submissions',
      '/api/v1/dashboard/attendance-today',
      '/api/v1/dashboard/missing-today',
      '/api/v1/dashboard/site-wise-stats',
      '/api/v1/reports/submissions',
      '/api/v1/reports/attendance',
      '/api/v1/reports/parameter-analysis',
      '/api/v1/settings'
    ]
    for (const route of adminRoutes) {
      const res = await request(app).get(route).set('Authorization', `Bearer ${adminAToken}`)
      assertTrue(res.status >= 200 && res.status < 300, `${route} failed with ${res.status}`)
    }
    add('Frontend-admin consumed GET APIs', true, `${adminRoutes.length} routes OK`)

    const flutterRoutes = [
      { method: 'get', path: '/api/v1/users/me' },
      { method: 'get', path: '/api/v1/sites/my-site' },
      { method: 'get', path: '/api/v1/submissions' },
      { method: 'get', path: '/api/v1/attendance/my' },
      { method: 'post', path: '/api/v1/attendance/check-out', body: { siteId: siteA.id } }
    ]
    for (const route of flutterRoutes) {
      const req = request(app)[route.method](route.path).set('Authorization', `Bearer ${employeeAToken}`)
      if (route.body) req.send(route.body)
      const res = await req
      assertTrue(res.status >= 200 && res.status < 300, `Flutter route ${route.path} failed with ${res.status}`)
    }
    add('Flutter consumed APIs', true, `${flutterRoutes.length} routes OK`)

    const summary = {
      total: report.length,
      passed: report.filter(r => r.ok).length,
      failed: report.filter(r => !r.ok).length
    }
    console.log('\nE2E SUMMARY', summary)
    if (summary.failed > 0) process.exitCode = 1
  } catch (error) {
    console.error('\nE2E FAILED:', error.message)
    process.exitCode = 1
  } finally {
    await db.destroy()
  }
}

run()
