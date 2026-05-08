const db = require('../../config/database')
const { paginate } = require('../../utils/paginator')
const { isAdmin } = require('../../utils/tenant')

async function list ({ query, actor }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('audit_logs').orderBy('created_at', 'desc')
  if (isAdmin(actor)) qb.where('owner_admin_id', actor.id)
  if (query.module) qb.where('module', query.module)
  if (query.actorId) qb.where('actor_id', query.actorId)

  const rows = await qb.clone().limit(limit).offset(offset)
  const [{ count }] = await qb.clone().clearSelect().clearOrder().count('* as count')
  return { items: rows, pagination: { page, limit, total: Number(count) } }
}

module.exports = { list }
