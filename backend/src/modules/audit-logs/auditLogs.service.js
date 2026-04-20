const db = require('../../config/database')
const { paginate } = require('../../utils/paginator')

async function list ({ query }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('audit_logs').orderBy('created_at', 'desc')
  if (query.module) qb.where('module', query.module)
  if (query.actorId) qb.where('actor_id', query.actorId)

  const rows = await qb.clone().limit(limit).offset(offset)
  const [{ count }] = await qb.clone().clearSelect().clearOrder().count('* as count')
  return { items: rows, pagination: { page, limit, total: Number(count) } }
}

module.exports = { list }
