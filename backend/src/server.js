const app = require('./config/app')
const env = require('./config/env')
const logger = require('./config/logger')

app.listen(env.port, () => {
  logger.info(`API listening on port ${env.port}`)
})
