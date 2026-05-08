const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { paginate } = require('../../utils/paginator')
const { hashPassword } = require('../../utils/password')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')
const { isAdmin, ownerAdminIdForActor } = require('../../utils/tenant')

function normalizeEmail (email) {
  return email.trim().toLowerCase()
}

function canCreateRole (actorRole, targetRole) {
  if (actorRole === 'superadmin') return true
  if (actorRole === 'admin') return targetRole === 'employee'
  return false
}

function toPublicUser (user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profileImage: user.profile_image,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }
}

async function listUsers ({ query, actor }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('users').select('id', 'name', 'email', 'role', 'phone', 'profile_image', 'is_active', 'created_at', 'updated_at')

  if (isAdmin(actor)) {
    qb.where('role', 'employee').andWhere('owner_admin_id', actor.id)
  }

  if (query.role) qb.where('role', query.role)
  if (query.isActive !== undefined) qb.where('is_active', query.isActive === 'true')
  if (query.search) {
    qb.andWhere(builder => {
      builder.whereILike('name', `%${query.search}%`).orWhereILike('email', `%${query.search}%`)
    })
  }

  const rows = await qb.orderBy('created_at', 'desc').limit(limit).offset(offset)
  const [{ count }] = await qb.clone().clearSelect().clearOrder().count('* as count')
  return { items: rows.map(toPublicUser), pagination: { page, limit, total: Number(count) } }
}

async function getUserById ({ id, actor }) {
  const user = await db('users').where({ id }).first()
  if (!user) throw new AppError('User not found', 404)
  if (isAdmin(actor) && (user.role !== 'employee' || user.owner_admin_id !== actor.id)) {
    throw new AppError('Forbidden', 403)
  }
  return toPublicUser(user)
}

async function ensureSingleSuperadminOnCreate (payload) {
  if (payload.role !== 'superadmin') return
  const existing = await db('users').where({ role: 'superadmin', is_active: true }).first()
  if (existing) {
    throw new AppError('Only one active superadmin is allowed', 409)
  }
}

async function createUser ({ payload, actor, ipAddress }) {
  if (!canCreateRole(actor.role, payload.role)) {
    throw new AppError('Insufficient role permission', 403)
  }
  await ensureSingleSuperadminOnCreate(payload)

  const email = normalizeEmail(payload.email)
  const existing = await db('users').where({ email }).first()
  if (existing) throw new AppError('Email already exists', 409)

  const passwordHash = await hashPassword(payload.password)
  const [user] = await db('users').insert({
    name: payload.name,
    email,
    password_hash: passwordHash,
    role: payload.role,
    phone: payload.phone,
    owner_admin_id: payload.role === 'employee' ? ownerAdminIdForActor(actor) : null,
    created_by: actor.id
  }).returning('*')

  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'users.create',
    module: 'users',
    entityId: user.id,
    newValues: { email: user.email, role: user.role },
    ipAddress
  })

  return toPublicUser(user)
}

async function updateUser ({ id, payload, actor, ipAddress }) {
  const user = await db('users').where({ id }).first()
  if (!user) throw new AppError('User not found', 404)

  if (user.role === 'superadmin') {
    if (payload.role && payload.role !== 'superadmin') {
      throw new AppError('Superadmin role cannot be changed', 403)
    }
    if (payload.isActive === false) {
      throw new AppError('Superadmin cannot be deactivated', 403)
    }
  }

  if (isAdmin(actor)) {
    if (user.role !== 'employee' || user.owner_admin_id !== actor.id || (payload.role && payload.role !== 'employee')) {
      throw new AppError('Forbidden', 403)
    }
  }

  const updateData = {}
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.phone !== undefined) updateData.phone = payload.phone
  if (payload.role !== undefined) updateData.role = payload.role
  if (payload.isActive !== undefined) updateData.is_active = payload.isActive
  if (payload.role === 'employee' && isAdmin(actor)) updateData.owner_admin_id = actor.id
  updateData.updated_at = new Date()

  const [updated] = await db('users').where({ id }).update(updateData).returning('*')
  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'users.update',
    module: 'users',
    entityId: id,
    oldValues: { name: user.name, role: user.role, is_active: user.is_active },
    newValues: updateData,
    ipAddress
  })
  return toPublicUser(updated)
}

async function setUserActive ({ id, isActive, actor, ipAddress }) {
  return updateUser({ id, payload: { isActive }, actor, ipAddress })
}

async function getMe ({ userId }) {
  const user = await db('users').where({ id: userId }).first()
  if (!user) throw new AppError('User not found', 404)
  return toPublicUser(user)
}

async function updateMe ({ userId, payload, ipAddress }) {
  const updateData = { updated_at: new Date() }
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.phone !== undefined) updateData.phone = payload.phone
  if (payload.profileImage !== undefined) updateData.profile_image = payload.profileImage

  const [user] = await db('users').where({ id: userId }).update(updateData).returning('*')
  await writeAuditLog({
    actorId: userId,
    ownerAdminId: null,
    action: 'users.update_self',
    module: 'users',
    entityId: userId,
    newValues: updateData,
    ipAddress
  })
  return toPublicUser(user)
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  setUserActive,
  getMe,
  updateMe
}
