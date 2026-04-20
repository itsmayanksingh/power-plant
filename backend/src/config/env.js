const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  apiVersion: process.env.API_VERSION || 'v1',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'plant_monitoring',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: Number(process.env.DB_POOL_MIN || 2),
    poolMax: Number(process.env.DB_POOL_MAX || 20)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_access_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  },
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean),
  logLevel: process.env.LOG_LEVEL || 'info'
}
