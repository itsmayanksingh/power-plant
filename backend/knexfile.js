const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })

const baseConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'plant_monitoring'
  },
  pool: {
    min: Number(process.env.DB_POOL_MIN || 2),
    max: Number(process.env.DB_POOL_MAX || 20)
  },
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
}

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      database: process.env.DB_NAME_TEST || 'plant_monitoring_test'
    }
  },
  production: baseConfig
}
