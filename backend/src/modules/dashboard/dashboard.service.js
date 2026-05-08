const db = require('../../config/database')
const { getUtcDateString } = require('../../utils/dateHelper')
const { isAdmin } = require('../../utils/tenant')

async function stats ({ actor }) {
  const usersQb = db('users')
  if (isAdmin(actor)) usersQb.where({ role: 'employee', owner_admin_id: actor.id })
  const [users] = await usersQb.count('* as count')

  const sitesQb = db('sites').where({ is_active: true })
  if (isAdmin(actor)) sitesQb.andWhere({ owner_admin_id: actor.id })
  const [sites] = await sitesQb.count('* as count')

  const attendanceQb = db('attendance').where({ attendance_date: getUtcDateString() })
  if (isAdmin(actor)) attendanceQb.andWhere({ owner_admin_id: actor.id })
  const [attendanceToday] = await attendanceQb.count('* as count')

  const submissionsQb = db('data_submissions').where({ submission_date: getUtcDateString() })
  if (isAdmin(actor)) submissionsQb.andWhere({ owner_admin_id: actor.id })
  const [submissionsToday] = await submissionsQb.count('* as count')

  return {
    users: Number(users.count),
    activeSites: Number(sites.count),
    attendanceToday: Number(attendanceToday.count),
    submissionsToday: Number(submissionsToday.count)
  }
}

async function recentSubmissions ({ actor }) {
  const qb = db('data_submissions as s')
    .join('users as u', 'u.id', 's.submitted_by')
    .join('sites as si', 'si.id', 's.site_id')
    .select('s.id', 's.submission_date', 's.status', 'u.name as employee_name', 'si.name as site_name')
    .orderBy('s.submission_time', 'desc')
    .limit(10)
  if (isAdmin(actor)) qb.where('s.owner_admin_id', actor.id)
  return qb
}

async function attendanceToday ({ actor }) {
  const date = getUtcDateString()
  const qb = db('attendance as a')
    .join('users as u', 'u.id', 'a.user_id')
    .join('sites as s', 's.id', 'a.site_id')
    .where('a.attendance_date', date)
    .select('a.*', 'u.name as user_name', 's.name as site_name')
  if (isAdmin(actor)) qb.andWhere('a.owner_admin_id', actor.id)
  return qb
}

async function missingToday ({ actor }) {
  const date = getUtcDateString()
  const assignmentsQb = db('employee_site_assignments').where({ is_active: true }).select('employee_id', 'site_id')
  if (isAdmin(actor)) assignmentsQb.andWhere({ owner_admin_id: actor.id })
  const assignments = await assignmentsQb

  const subsQb = db('data_submissions').where({ submission_date: date }).select('submitted_by', 'site_id')
  if (isAdmin(actor)) subsQb.andWhere({ owner_admin_id: actor.id })
  const subs = await subsQb
  const set = new Set(subs.map(s => `${s.submitted_by}:${s.site_id}`))
  return assignments.filter(a => !set.has(`${a.employee_id}:${a.site_id}`))
}

async function siteWiseStats ({ actor }) {
  const qb = db('sites as s')
    .leftJoin('data_submissions as ds', 'ds.site_id', 's.id')
    .select('s.id', 's.name')
    .count('ds.id as submissions')
    .groupBy('s.id', 's.name')
    .orderBy('s.name', 'asc')
  if (isAdmin(actor)) qb.where('s.owner_admin_id', actor.id)
  return qb
}

module.exports = { stats, recentSubmissions, attendanceToday, missingToday, siteWiseStats }
