const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { isAdmin, ownerAdminIdForActor } = require('../../utils/tenant')

async function list ({ userId, role }) {
  const qb = db('notifications').orderBy('created_at', 'desc')
  if (role === 'employee') qb.where({ user_id: userId })
  if (role === 'admin') qb.where({ owner_admin_id: userId })
  return qb
}

async function create ({ actor, userId, title, message }) {
  const target = await db('users').where({ id: userId }).first()
  if (!target) throw new AppError('Target user not found', 404)
  if (isAdmin(actor) && target.owner_admin_id !== actor.id) {
    throw new AppError('Forbidden', 403)
  }

  const [row] = await db('notifications')
    .insert({
      user_id: userId,
      owner_admin_id: target.owner_admin_id || ownerAdminIdForActor(actor),
      title,
      message
    })
    .returning('*')
  return row
}

module.exports = { list, create }
