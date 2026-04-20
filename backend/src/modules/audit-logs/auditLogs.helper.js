const db = require('../../config/database')

async function writeAuditLog ({ actorId = null, action, module, entityId = null, oldValues = null, newValues = null, ipAddress = null, trx = null }) {
  const client = trx || db
  await client('audit_logs').insert({
    actor_id: actorId,
    action,
    module,
    entity_id: entityId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: ipAddress
  })
}

module.exports = { writeAuditLog }
