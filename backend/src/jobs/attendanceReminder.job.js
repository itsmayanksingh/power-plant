const cron = require('node-cron')

function registerAttendanceReminderJob () {
  return cron.schedule('0 18 * * *', () => {
    // Placeholder for attendance reminder implementation.
  })
}

module.exports = { registerAttendanceReminderJob }
