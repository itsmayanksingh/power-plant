const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const env = require('./env')
const routes = require('../routes')
const { apiLimiter } = require('../middleware/rateLimit.middleware')
const errorHandler = require('../middleware/errorHandler')

const app = express()

app.use(helmet())
app.use(cors({
  origin: env.corsAllowedOrigins.length > 0 ? env.corsAllowedOrigins : true,
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('combined'))
app.use(apiLimiter)

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'healthy' })
})

app.use(`/api/${env.apiVersion}`, routes)
app.use(errorHandler)

module.exports = app
