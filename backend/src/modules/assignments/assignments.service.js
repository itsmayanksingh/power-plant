const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')
const { isAdmin, ownerAdminIdForActor, ensureAdminOwns } = require('../../utils/tenant')

async function ensureEmployee (employeeId) {
  const user = await db('users').where({ id: employeeId }).first()
  if (!user || user.role !== 'employee' || !user.is_active) {
    throw new AppError('Target user must be an active employee', 400)
  }
  return user
}

async function assignEmployee ({ siteId, employeeId, actor, ipAddress }) {
  const site = await db('sites').where({ id: siteId, is_active: true }).first()
  if (!site) throw new AppError('Site not found or inactive', 404)
  ensureAdminOwns(site.owner_admin_id, actor)

  const employee = await ensureEmployee(employeeId)
  if (isAdmin(actor) && employee.owner_admin_id !== actor.id) {
    throw new AppError('Employee does not belong to your admin scope', 403)
  }

  const existing = await db('employee_site_assignments').where({ site_id: siteId, employee_id: employeeId }).first()
  if (existing) {
    const [row] = await db('employee_site_assignments').where({ id: existing.id }).update({
      is_active: true,
      owner_admin_id: site.owner_admin_id,
      assigned_by: actor.id,
      assigned_at: new Date()
    }).returning('*')
    return row
  }

  const [row] = await db('employee_site_assignments').insert({
    site_id: siteId,
    employee_id: employeeId,
    owner_admin_id: site.owner_admin_id,
    assigned_by: actor.id,
    is_active: true
  }).returning('*')

  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'assignments.assign',
    module: 'assignments',
    entityId: row.id,
    newValues: row,
    ipAddress
  })
  return row
}

async function removeAssignment ({ siteId, userId, actor, ipAddress }) {
  const assignment = await db('employee_site_assignments').where({ site_id: siteId, employee_id: userId, is_active: true }).first()
  if (!assignment) throw new AppError('Active assignment not found', 404)
  ensureAdminOwns(assignment.owner_admin_id, actor)

  const [row] = await db('employee_site_assignments').where({ id: assignment.id }).update({ is_active: false }).returning('*')
  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'assignments.remove',
    module: 'assignments',
    entityId: assignment.id,
    oldValues: assignment,
    newValues: row,
    ipAddress
  })
  return row
}

async function listBySite ({ siteId, actor }) {
  const qb = db('employee_site_assignments as a')
    .join('users as u', 'u.id', 'a.employee_id')
    .where('a.site_id', siteId)
    .andWhere('a.is_active', true)
    .select('a.id', 'a.assigned_at', 'u.id as employee_id', 'u.name', 'u.email')
    .orderBy('a.assigned_at', 'desc')
  if (isAdmin(actor)) qb.andWhere('a.owner_admin_id', actor.id)
  return qb
}

async function listByUser ({ userId, actor }) {
  if (actor.role === 'employee' && actor.id !== userId) {
    throw new AppError('Forbidden', 403)
  }

  const qb = db('employee_site_assignments as a')
    .join('sites as s', 's.id', 'a.site_id')
    .where('a.employee_id', userId)
    .andWhere('a.is_active', true)
    .select('a.id', 'a.assigned_at', 's.id as site_id', 's.name', 's.location')
    .orderBy('a.assigned_at', 'desc')
  if (isAdmin(actor)) qb.andWhere('a.owner_admin_id', actor.id)
  return qb
}

module.exports = {
  assignEmployee,
  removeAssignment,
  listBySite,
  listByUser
}
