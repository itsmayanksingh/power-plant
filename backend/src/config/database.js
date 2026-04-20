const knex = require('knex')
const env = require('./env')

const db = knex({
  client: 'pg',
  connection: {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name
  },
  pool: {
    min: env.db.poolMin,
    max: env.db.poolMax
  }
})

module.exports = db
