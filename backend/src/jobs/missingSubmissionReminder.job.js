const cron = require('node-cron')

function registerMissingSubmissionReminderJob () {
  return cron.schedule('30 18 * * *', () => {
    // Placeholder for missing submission reminder implementation.
  })
}

module.exports = { registerMissingSubmissionReminderJob }
