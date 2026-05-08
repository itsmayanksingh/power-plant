 /* eslint-disable no-console */
const db = require('../src/config/database')
const assignmentsService = require('../src/modules/assignments/assignments.service')
const attendanceService = require('../src/modules/attendance/attendance.service')
const submissionsService = require('../src/modules/submissions/submissions.service')

async function run () {
  const admin = await db('users').where({ role: 'admin', is_active: true }).orderBy('created_at', 'asc').first()
  if (!admin) throw new Error('No active admin found')

  const employee = await db('users')
    .where({ role: 'employee', is_active: true, owner_admin_id: admin.id })
    .orderBy('created_at', 'asc')
    .first()
  if (!employee) throw new Error(`No active employee found for admin ${admin.email}`)

  const site = await db('sites')
    .where({ is_active: true, owner_admin_id: admin.id })
    .orderBy('created_at', 'asc')
    .first()
  if (!site) throw new Error(`No active site found for admin ${admin.email}`)

  const actor = { id: admin.id, role: 'admin' }
  const ipAddress = 'seed-mobile-e2e-script'

  const assignment = await assignmentsService.assignEmployee({
    siteId: site.id,
    employeeId: employee.id,
    actor,
    ipAddress
  })

  try {
    await attendanceService.checkIn({
      userId: employee.id,
      siteId: site.id,
      latitude: 28.6139,
      longitude: 77.2090,
      ipAddress
    })
  } catch (error) {
    if (!String(error.message).includes('Already checked in')) throw error
  }

  const parameters = await db('site_parameters')
    .where({ site_id: site.id, is_active: true })
    .orderBy('display_order', 'asc')

  if (parameters.length > 0) {
    const values = parameters.map(param => {
      if (param.type === 'number') return { parameterId: param.id, value: 42 }
      if (param.type === 'dropdown') {
        const options = Array.isArray(param.options) ? param.options : []
        return { parameterId: param.id, value: options[0] || 'default' }
      }
      if (param.type === 'boolean') return { parameterId: param.id, value: true }
      if (param.type === 'date') return { parameterId: param.id, value: new Date().toISOString().slice(0, 10) }
      return { parameterId: param.id, value: 'dummy-value' }
    })

    try {
      await submissionsService.createSubmission({
        userId: employee.id,
        payload: {
          siteId: site.id,
          notes: 'dummy submission from seed-mobile-e2e-dummy.js',
          values
        },
        ipAddress
      })
    } catch (error) {
      if (!String(error.message).includes('Submission already exists for this date')) throw error
    }
  }

  const [assignmentCount, adminSubmissionCount, superSubmissionCount, adminAttendanceCount, superAttendanceCount] = await Promise.all([
    db('employee_site_assignments').where({ employee_id: employee.id, is_active: true }).count('* as count').first(),
    db('data_submissions').where({ owner_admin_id: admin.id }).count('* as count').first(),
    db('data_submissions').count('* as count').first(),
    db('attendance').where({ owner_admin_id: admin.id }).count('* as count').first(),
    db('attendance').count('* as count').first()
  ])

  console.log('E2E seed complete')
  console.log({
    admin: { id: admin.id, email: admin.email },
    employee: { id: employee.id, email: employee.email },
    site: { id: site.id, name: site.name },
    assignmentId: assignment.id,
    assignmentCount: Number(assignmentCount.count),
    submissionsVisibleToAdmin: Number(adminSubmissionCount.count),
    submissionsVisibleToSuperadmin: Number(superSubmissionCount.count),
    attendanceVisibleToAdmin: Number(adminAttendanceCount.count),
    attendanceVisibleToSuperadmin: Number(superAttendanceCount.count)
  })
}

run()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.destroy()
  })
