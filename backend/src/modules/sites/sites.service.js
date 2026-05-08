const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { paginate } = require('../../utils/paginator')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')
const { isAdmin, ownerAdminIdForActor, ensureAdminOwns } = require('../../utils/tenant')

async function listSites ({ query, actor }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('sites as s')
    .leftJoin('users as creator', 'creator.id', 's.created_by')
    .select('s.*', 'creator.name as created_by_name', 'creator.role as created_by_role', 'creator.email as created_by_email')

  if (isAdmin(actor)) qb.where('s.owner_admin_id', actor.id)
  if (query.isActive !== undefined) qb.where('s.is_active', query.isActive === 'true')
  if (query.search) {
    qb.andWhere(builder => {
      builder.whereILike('s.name', `%${query.search}%`).orWhereILike('s.location', `%${query.search}%`)
    })
  }

  const rows = await qb.orderBy('s.created_at', 'desc').limit(limit).offset(offset)
  const [{ count }] = await qb.clone().clearSelect().clearOrder().count('* as count')

  const items = await Promise.all(rows.map(async site => {
    const [{ parameter_count }] = await db('site_parameters').where({ site_id: site.id, is_active: true }).count('* as parameter_count')
    const [{ assignment_count }] = await db('employee_site_assignments').where({ site_id: site.id, is_active: true }).count('* as assignment_count')
    return {
      ...site,
      createdByName: site.created_by_name,
      createdByRole: site.created_by_role,
      createdByEmail: site.created_by_email,
      parameterCount: Number(parameter_count),
      assignmentCount: Number(assignment_count)
    }
  }))

  return { items, pagination: { page, limit, total: Number(count) } }
}

async function getSiteById ({ id, actor }) {
  const site = await db('sites').where({ id }).first()
  if (!site) throw new AppError('Site not found', 404)
  ensureAdminOwns(site.owner_admin_id, actor)

  const parameters = await db('site_parameters').where({ site_id: id }).orderBy('display_order', 'asc')
  const assignments = await db('employee_site_assignments as a')
    .join('users as u', 'u.id', 'a.employee_id')
    .where('a.site_id', id)
    .andWhere('a.is_active', true)
    .select('a.id', 'u.id as employee_id', 'u.name', 'u.email', 'a.assigned_at')

  return { ...site, parameters, assignments }
}

async function createSite ({ payload, actor, ipAddress }) {
  const [site] = await db('sites').insert({
    name: payload.name,
    location: payload.location,
    description: payload.description,
    owner_admin_id: ownerAdminIdForActor(actor),
    created_by: actor.id
  }).returning('*')

  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'sites.create',
    module: 'sites',
    entityId: site.id,
    newValues: { name: site.name, location: site.location },
    ipAddress
  })

  return site
}

async function updateSite ({ id, payload, actor, ipAddress }) {
  const site = await db('sites').where({ id }).first()
  if (!site) throw new AppError('Site not found', 404)
  ensureAdminOwns(site.owner_admin_id, actor)

  const updates = {}
  if (payload.name !== undefined) updates.name = payload.name
  if (payload.location !== undefined) updates.location = payload.location
  if (payload.description !== undefined) updates.description = payload.description
  if (payload.isActive !== undefined) updates.is_active = payload.isActive
  updates.updated_at = new Date()

  const [updated] = await db('sites').where({ id }).update(updates).returning('*')

  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'sites.update',
    module: 'sites',
    entityId: id,
    oldValues: { name: site.name, is_active: site.is_active },
    newValues: updates,
    ipAddress
  })

  return updated
}

async function deactivateSite ({ id, actor, ipAddress }) {
  const site = await db('sites').where({ id }).first()
  if (!site) throw new AppError('Site not found', 404)
  ensureAdminOwns(site.owner_admin_id, actor)

  const [{ submissionCount }] = await db('data_submissions').where({ site_id: id }).count('* as submissionCount')
  const hasHistorical = Number(submissionCount) > 0

  if (hasHistorical) {
    return updateSite({ id, payload: { isActive: false }, actor, ipAddress })
  }

  await db('sites').where({ id }).del()
  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'sites.delete',
    module: 'sites',
    entityId: id,
    ipAddress
  })
  return { id, deleted: true }
}

async function getMySite ({ userId }) {
  const assignment = await db('employee_site_assignments as a')
    .leftJoin('users as assigner', 'assigner.id', 'a.assigned_by')
    .where({ 'a.employee_id': userId, 'a.is_active': true })
    .orderBy('a.assigned_at', 'desc')
    .select(
      'a.id',
      'a.site_id',
      'a.owner_admin_id',
      'a.assigned_at',
      'assigner.id as assigned_by',
      'assigner.name as assigned_by_name',
      'assigner.email as assigned_by_email',
      'assigner.role as assigned_by_role'
    )
    .first()

  if (!assignment) {
    throw new AppError('No active site assignment found', 404)
  }

  const site = await db('sites').where({ id: assignment.site_id, is_active: true }).first()
  if (!site) throw new AppError('Assigned site is inactive', 404)

  const parameters = await db('site_parameters')
    .where({ site_id: site.id, is_active: true })
    .orderBy('display_order', 'asc')

  return {
    site,
    parameters,
    assignment: {
      id: assignment.id,
      ownerAdminId: assignment.owner_admin_id,
      assignedAt: assignment.assigned_at,
      assignedBy: assignment.assigned_by
        ? {
            id: assignment.assigned_by,
            name: assignment.assigned_by_name,
            email: assignment.assigned_by_email,
            role: assignment.assigned_by_role
          }
        : null
    }
  }
}

module.exports = {
  listSites,
  getSiteById,
  createSite,
  updateSite,
  deactivateSite,
  getMySite
}
