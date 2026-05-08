const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')
const { ownerAdminIdForActor, ensureAdminOwns } = require('../../utils/tenant')

function normalizeOptions (rawOptions) {
  if (rawOptions === undefined || rawOptions === null) return undefined
  if (Array.isArray(rawOptions)) return rawOptions.map(option => String(option).trim()).filter(Boolean)
  if (typeof rawOptions !== 'string') return rawOptions

  const trimmed = rawOptions.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed.map(option => String(option).trim()).filter(Boolean)
    }
  } catch (error) {
    // Fallback to CSV parsing below when plain string is provided.
  }

  return trimmed.split(',').map(option => option.trim()).filter(Boolean)
}

function validateByType (payload) {
  const type = payload.type
  const options = payload.options

  if (type === 'dropdown' && (!Array.isArray(options) || options.length === 0)) {
    throw new AppError('Dropdown parameters require non-empty options', 400)
  }

  if (type !== 'dropdown' && options !== undefined && options !== null) {
    throw new AppError('Options are allowed only for dropdown type', 400)
  }

  if (type === 'number') {
    if (payload.minValue !== undefined && payload.maxValue !== undefined && Number(payload.minValue) > Number(payload.maxValue)) {
      throw new AppError('minValue cannot be greater than maxValue', 400)
    }
  } else if (payload.minValue !== undefined || payload.maxValue !== undefined) {
    throw new AppError('minValue and maxValue are only valid for number type', 400)
  }
}

async function getSiteWithOwnershipCheck ({ siteId, actor }) {
  const site = await db('sites').where({ id: siteId }).first()
  if (!site) throw new AppError('Site not found', 404)
  ensureAdminOwns(site.owner_admin_id, actor)
  return site
}

async function listBySite ({ siteId, actor }) {
  const site = await db('sites').where({ id: siteId }).first()
  if (!site) throw new AppError('Site not found', 404)
  if (actor) ensureAdminOwns(site.owner_admin_id, actor)

  return db('site_parameters')
    .where({ site_id: siteId })
    .orderBy('display_order', 'asc')
}

async function create ({ siteId, payload, actor, ipAddress }) {
  const normalizedOptions = normalizeOptions(payload.options)
  const normalizedPayload = { ...payload, options: normalizedOptions }

  validateByType(normalizedPayload)

  await getSiteWithOwnershipCheck({ siteId, actor })

  const [row] = await db('site_parameters').insert({
    site_id: siteId,
    name: payload.name,
    type: payload.type,
    is_required: payload.isRequired ?? true,
    options: normalizedOptions ?? null,
    min_value: payload.minValue,
    max_value: payload.maxValue,
    unit: payload.unit,
    display_order: payload.displayOrder ?? 0
  }).returning('*')

  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'parameters.create',
    module: 'parameters',
    entityId: row.id,
    newValues: row,
    ipAddress
  })
  return row
}

async function update ({ id, payload, actor, ipAddress }) {
  const existing = await db('site_parameters').where({ id }).first()
  if (!existing) throw new AppError('Parameter not found', 404)
  await getSiteWithOwnershipCheck({ siteId: existing.site_id, actor })

  const normalizedOptions = normalizeOptions(payload.options)

  const merged = {
    type: payload.type ?? existing.type,
    options: normalizedOptions ?? existing.options,
    minValue: payload.minValue ?? existing.min_value,
    maxValue: payload.maxValue ?? existing.max_value
  }
  validateByType(merged)

  const updates = { updated_at: new Date() }
  if (payload.name !== undefined) updates.name = payload.name
  if (payload.type !== undefined) updates.type = payload.type
  if (payload.isRequired !== undefined) updates.is_required = payload.isRequired
  if (payload.options !== undefined) updates.options = normalizedOptions
  if (payload.minValue !== undefined) updates.min_value = payload.minValue
  if (payload.maxValue !== undefined) updates.max_value = payload.maxValue
  if (payload.unit !== undefined) updates.unit = payload.unit
  if (payload.displayOrder !== undefined) updates.display_order = payload.displayOrder
  if (payload.isActive !== undefined) updates.is_active = payload.isActive

  const [row] = await db('site_parameters').where({ id }).update(updates).returning('*')
  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'parameters.update',
    module: 'parameters',
    entityId: id,
    oldValues: existing,
    newValues: updates,
    ipAddress
  })
  return row
}

async function remove ({ id, actor, ipAddress }) {
  const parameter = await db('site_parameters').where({ id }).first()
  if (!parameter) throw new AppError('Parameter not found', 404)
  await getSiteWithOwnershipCheck({ siteId: parameter.site_id, actor })

  const [{ count }] = await db('submission_values').where({ parameter_id: id }).count('* as count')
  if (Number(count) > 0) {
    await db('site_parameters').where({ id }).update({ is_active: false })
  } else {
    await db('site_parameters').where({ id }).del()
  }

  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'parameters.delete',
    module: 'parameters',
    entityId: id,
    ipAddress
  })
}

async function toggle ({ id, actor, ipAddress }) {
  const parameter = await db('site_parameters').where({ id }).first()
  if (!parameter) throw new AppError('Parameter not found', 404)
  await getSiteWithOwnershipCheck({ siteId: parameter.site_id, actor })

  const [row] = await db('site_parameters').where({ id }).update({ is_active: !parameter.is_active }).returning('*')
  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'parameters.toggle',
    module: 'parameters',
    entityId: id,
    oldValues: { is_active: parameter.is_active },
    newValues: { is_active: row.is_active },
    ipAddress
  })
  return row
}

async function reorder ({ siteId, orders, actor, ipAddress }) {
  await getSiteWithOwnershipCheck({ siteId, actor })
  const ids = orders.map(o => o.id)
  const available = await db('site_parameters').whereIn('id', ids).andWhere({ site_id: siteId })
  if (available.length !== ids.length) {
    throw new AppError('Some parameters are invalid for this site', 400)
  }

  await db.transaction(async trx => {
    for (const order of orders) {
      await trx('site_parameters').where({ id: order.id }).update({ display_order: order.displayOrder })
    }
    await writeAuditLog({
      actorId: actor.id,
      ownerAdminId: ownerAdminIdForActor(actor),
      action: 'parameters.reorder',
      module: 'parameters',
      entityId: siteId,
      newValues: { orders },
      ipAddress,
      trx
    })
  })

  return listBySite({ siteId, actor })
}

module.exports = { listBySite, create, update, remove, toggle, reorder }
