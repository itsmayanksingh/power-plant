const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { paginate } = require('../../utils/paginator')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')

async function listSites ({ query }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('sites as s')
    .select('s.*')

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
      parameterCount: Number(parameter_count),
      assignmentCount: Number(assignment_count)
    }
  }))

  return { items, pagination: { page, limit, total: Number(count) } }
}

async function getSiteById ({ id }) {
  const site = await db('sites').where({ id }).first()
  if (!site) throw new AppError('Site not found', 404)

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
    created_by: actor.id
  }).returning('*')

  await writeAuditLog({
    actorId: actor.id,
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

  const updates = {}
  if (payload.name !== undefined) updates.name = payload.name
  if (payload.location !== undefined) updates.location = payload.location
  if (payload.description !== undefined) updates.description = payload.description
  if (payload.isActive !== undefined) updates.is_active = payload.isActive
  updates.updated_at = new Date()

  const [updated] = await db('sites').where({ id }).update(updates).returning('*')

  await writeAuditLog({
    actorId: actor.id,
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
  const [{ submissionCount }] = await db('data_submissions').where({ site_id: id }).count('* as submissionCount')
  const hasHistorical = Number(submissionCount) > 0

  if (hasHistorical) {
    return updateSite({ id, payload: { isActive: false }, actor, ipAddress })
  }

  await db('sites').where({ id }).del()
  await writeAuditLog({
    actorId: actor.id,
    action: 'sites.delete',
    module: 'sites',
    entityId: id,
    ipAddress
  })
  return { id, deleted: true }
}

async function getMySite ({ userId }) {
  const assignment = await db('employee_site_assignments')
    .where({ employee_id: userId, is_active: true })
    .orderBy('assigned_at', 'desc')
    .first()

  if (!assignment) {
    throw new AppError('No active site assignment found', 404)
  }

  const site = await db('sites').where({ id: assignment.site_id, is_active: true }).first()
  if (!site) throw new AppError('Assigned site is inactive', 404)

  const parameters = await db('site_parameters')
    .where({ site_id: site.id, is_active: true })
    .orderBy('display_order', 'asc')

  return { site, parameters }
}

module.exports = {
  listSites,
  getSiteById,
  createSite,
  updateSite,
  deactivateSite,
  getMySite
}
