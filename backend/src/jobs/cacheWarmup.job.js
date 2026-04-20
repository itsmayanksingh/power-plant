const cron = require('node-cron')

function registerCacheWarmupJob () {
  return cron.schedule('*/30 * * * *', () => {
    // Placeholder for dashboard cache warmup implementation.
  })
}

module.exports = { registerCacheWarmupJob }
