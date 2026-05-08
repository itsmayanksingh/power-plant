const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { paginate } = require('../../utils/paginator')
const { getUtcDateString } = require('../../utils/dateHelper')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')
const { isAdmin } = require('../../utils/tenant')

async function getCutoffHour () {
  const row = await db('settings').where({ key: 'attendance.cutoff_hour' }).first()
  return row?.value?.hour ?? 9
}

async function ensureAssigned (userId, siteId) {
  const assignment = await db('employee_site_assignments').where({ employee_id: userId, site_id: siteId, is_active: true }).first()
  if (!assignment) throw new AppError('User is not assigned to this site', 403)
  return assignment
}

async function checkIn ({ userId, siteId, latitude, longitude, ipAddress }) {
  const assignment = await ensureAssigned(userId, siteId)
  const attendanceDate = getUtcDateString()

  const existing = await db('attendance').where({ user_id: userId, site_id: siteId, attendance_date: attendanceDate }).first()
  if (existing) throw new AppError('Already checked in for this site today', 409)

  const cutoff = await getCutoffHour()
  const now = new Date()
  const status = now.getUTCHours() > cutoff ? 'late' : 'present'

  const [row] = await db('attendance').insert({
    user_id: userId,
    site_id: siteId,
    owner_admin_id: assignment.owner_admin_id,
    check_in: now,
    check_in_lat: latitude,
    check_in_lng: longitude,
    attendance_date: attendanceDate,
    status
  }).returning('*')

  await writeAuditLog({
    actorId: userId,
    ownerAdminId: assignment.owner_admin_id,
    action: 'attendance.check_in',
    module: 'attendance',
    entityId: row.id,
    ipAddress
  })
  return row
}

async function checkOut ({ userId, siteId, ipAddress }) {
  const attendanceDate = getUtcDateString()
  const record = await db('attendance').where({ user_id: userId, site_id: siteId, attendance_date: attendanceDate }).first()
  if (!record) throw new AppError('No check-in found for today', 404)
  if (record.check_out) throw new AppError('Already checked out', 409)

  const [row] = await db('attendance').where({ id: record.id }).update({ check_out: new Date() }).returning('*')
  await writeAuditLog({
    actorId: userId,
    ownerAdminId: row.owner_admin_id,
    action: 'attendance.check_out',
    module: 'attendance',
    entityId: row.id,
    ipAddress
  })
  return row
}

async function list ({ query, actor }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('attendance as a')
    .join('users as u', 'u.id', 'a.user_id')
    .join('sites as s', 's.id', 'a.site_id')
    .select('a.*', 'u.name as user_name', 'u.email as user_email', 's.name as site_name')

  if (query.userId) qb.where('a.user_id', query.userId)
  if (isAdmin(actor)) qb.where('a.owner_admin_id', actor.id)
  if (query.siteId) qb.where('a.site_id', query.siteId)
  if (query.date) qb.where('a.attendance_date', query.date)

  const rows = await qb.orderBy('a.attendance_date', 'desc').limit(limit).offset(offset)
  const [{ count }] = await qb.clone().clearSelect().clearOrder().count('* as count')
  return { items: rows, pagination: { page, limit, total: Number(count) } }
}

async function myHistory ({ userId, query }) {
  return list({ query: { ...query, userId } })
}

async function summary ({ query, actor }) {
  const qb = db('attendance')
  if (isAdmin(actor)) qb.where('owner_admin_id', actor.id)
  if (query.siteId) qb.where('site_id', query.siteId)
  if (query.date) qb.where('attendance_date', query.date)

  const grouped = await qb
    .select('status')
    .count('* as count')
    .groupBy('status')

  const totals = { present: 0, late: 0, absent: 0 }
  for (const row of grouped) {
    totals[row.status] = Number(row.count)
  }
  totals.total = totals.present + totals.late + totals.absent
  return totals
}

module.exports = { checkIn, checkOut, list, myHistory, summary }
