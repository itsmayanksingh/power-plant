const db = require('../../config/database')

async function list ({ userId, role }) {
  const qb = db('notifications').orderBy('created_at', 'desc')
  if (role === 'employee') qb.where({ user_id: userId })
  return qb
}

async function create ({ userId, title, message }) {
  const [row] = await db('notifications').insert({ user_id: userId, title, message }).returning('*')
  return row
}

module.exports = { list, create }
