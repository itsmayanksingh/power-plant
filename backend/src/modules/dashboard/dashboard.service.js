const db = require('../../config/database')
const { getUtcDateString } = require('../../utils/dateHelper')

async function stats () {
  const [users] = await db('users').count('* as count')
  const [sites] = await db('sites').where({ is_active: true }).count('* as count')
  const [attendanceToday] = await db('attendance').where({ attendance_date: getUtcDateString() }).count('* as count')
  const [submissionsToday] = await db('data_submissions').where({ submission_date: getUtcDateString() }).count('* as count')

  return {
    users: Number(users.count),
    activeSites: Number(sites.count),
    attendanceToday: Number(attendanceToday.count),
    submissionsToday: Number(submissionsToday.count)
  }
}

async function recentSubmissions () {
  return db('data_submissions as s')
    .join('users as u', 'u.id', 's.submitted_by')
    .join('sites as si', 'si.id', 's.site_id')
    .select('s.id', 's.submission_date', 's.status', 'u.name as employee_name', 'si.name as site_name')
    .orderBy('s.submission_time', 'desc')
    .limit(10)
}

async function attendanceToday () {
  const date = getUtcDateString()
  return db('attendance as a')
    .join('users as u', 'u.id', 'a.user_id')
    .join('sites as s', 's.id', 'a.site_id')
    .where('a.attendance_date', date)
    .select('a.*', 'u.name as user_name', 's.name as site_name')
}

async function missingToday () {
  const date = getUtcDateString()
  const assignments = await db('employee_site_assignments').where({ is_active: true }).select('employee_id', 'site_id')
  const subs = await db('data_submissions').where({ submission_date: date }).select('submitted_by', 'site_id')
  const set = new Set(subs.map(s => `${s.submitted_by}:${s.site_id}`))
  return assignments.filter(a => !set.has(`${a.employee_id}:${a.site_id}`))
}

async function siteWiseStats () {
  return db('sites as s')
    .leftJoin('data_submissions as ds', 'ds.site_id', 's.id')
    .select('s.id', 's.name')
    .count('ds.id as submissions')
    .groupBy('s.id', 's.name')
    .orderBy('s.name', 'asc')
}

module.exports = { stats, recentSubmissions, attendanceToday, missingToday, siteWiseStats }
