const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { paginate } = require('../../utils/paginator')
const { hashPassword } = require('../../utils/password')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')

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

  if (actor.role === 'admin') {
    qb.whereNot('role', 'superadmin')
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
  if (actor.role === 'admin' && user.role === 'superadmin') {
    throw new AppError('Forbidden', 403)
  }
  return toPublicUser(user)
}

async function createUser ({ payload, actor, ipAddress }) {
  if (!canCreateRole(actor.role, payload.role)) {
    throw new AppError('Insufficient role permission', 403)
  }

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
    created_by: actor.id
  }).returning('*')

  await writeAuditLog({
    actorId: actor.id,
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

  if (actor.role === 'admin') {
    if (user.role === 'superadmin' || (payload.role && payload.role !== 'employee')) {
      throw new AppError('Forbidden', 403)
    }
  }

  const updateData = {}
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.phone !== undefined) updateData.phone = payload.phone
  if (payload.role !== undefined) updateData.role = payload.role
  if (payload.isActive !== undefined) updateData.is_active = payload.isActive
  updateData.updated_at = new Date()

  const [updated] = await db('users').where({ id }).update(updateData).returning('*')
  await writeAuditLog({
    actorId: actor.id,
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
