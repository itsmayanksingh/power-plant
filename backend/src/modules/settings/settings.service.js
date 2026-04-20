const db = require('../../config/database')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')

async function getSettings () {
  const rows = await db('settings').select('*').orderBy('key', 'asc')
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})
}

async function updateSettings ({ entries, actor, ipAddress }) {
  await db.transaction(async trx => {
    for (const [key, value] of Object.entries(entries)) {
      await trx('settings').insert({ key, value, updated_at: new Date() }).onConflict('key').merge({ value, updated_at: new Date() })
    }
    await writeAuditLog({ actorId: actor.id, action: 'settings.update', module: 'settings', entityId: 'settings', newValues: entries, ipAddress, trx })
  })
  return getSettings()
}

module.exports = { getSettings, updateSettings }
