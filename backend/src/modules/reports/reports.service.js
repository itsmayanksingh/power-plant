const db = require('../../config/database')
const { isAdmin } = require('../../utils/tenant')

function toCsv (rows) {
  if (rows.length === 0) return '\n'
  const header = Object.keys(rows[0])
  const body = rows.map(row => header.map(key => JSON.stringify(row[key] ?? '')).join(','))
  return `${header.join(',')}\n${body.join('\n')}\n`
}

async function attendanceReport ({ query, actor }) {
  const qb = db('attendance as a')
    .join('users as u', 'u.id', 'a.user_id')
    .join('sites as s', 's.id', 'a.site_id')
    .select('a.attendance_date', 'u.name as employee', 's.name as site', 'a.check_in', 'a.check_out', 'a.status')

  if (query.siteId) qb.where('a.site_id', query.siteId)
  if (isAdmin(actor)) qb.where('a.owner_admin_id', actor.id)
  if (query.userId) qb.where('a.user_id', query.userId)
  if (query.from) qb.where('a.attendance_date', '>=', query.from)
  if (query.to) qb.where('a.attendance_date', '<=', query.to)

  return qb.orderBy('a.attendance_date', 'desc')
}

async function submissionsReport ({ query, actor }) {
  const qb = db('data_submissions as ds')
    .join('users as u', 'u.id', 'ds.submitted_by')
    .join('sites as s', 's.id', 'ds.site_id')
    .select('ds.submission_date', 'u.name as employee', 's.name as site', 'ds.status', 'ds.notes')

  if (query.siteId) qb.where('ds.site_id', query.siteId)
  if (isAdmin(actor)) qb.where('ds.owner_admin_id', actor.id)
  if (query.userId) qb.where('ds.submitted_by', query.userId)
  if (query.from) qb.where('ds.submission_date', '>=', query.from)
  if (query.to) qb.where('ds.submission_date', '<=', query.to)

  return qb.orderBy('ds.submission_date', 'desc')
}

async function parameterAnalysis ({ query, actor }) {
  const qb = db('submission_values as sv')
    .join('site_parameters as p', 'p.id', 'sv.parameter_id')
    .join('data_submissions as ds', 'ds.id', 'sv.submission_id')
    .select('p.id as parameter_id', 'p.name as parameter_name', 'p.type')
    .count('sv.id as total_entries')
    .avg('sv.value_number as avg_numeric')
    .groupBy('p.id', 'p.name', 'p.type')

  if (query.siteId) qb.where('ds.site_id', query.siteId)
  if (isAdmin(actor)) qb.where('ds.owner_admin_id', actor.id)
  if (query.from) qb.where('ds.submission_date', '>=', query.from)
  if (query.to) qb.where('ds.submission_date', '<=', query.to)

  return qb
}

module.exports = { attendanceReport, submissionsReport, parameterAnalysis, toCsv }
