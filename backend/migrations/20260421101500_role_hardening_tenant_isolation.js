/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  await knex.schema.alterTable('users', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  await knex.schema.alterTable('sites', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  await knex.schema.alterTable('employee_site_assignments', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  await knex.schema.alterTable('data_submissions', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  await knex.schema.alterTable('attendance', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  await knex.schema.alterTable('notifications', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  await knex.schema.alterTable('audit_logs', table => {
    table.uuid('owner_admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')
  })

  const activeSuperadmins = await knex('users')
    .where({ role: 'superadmin', is_active: true })
    .orderBy('created_at', 'asc')
    .select('id')

  if (activeSuperadmins.length > 1) {
    const keeperId = activeSuperadmins[0].id
    const demoteIds = activeSuperadmins.slice(1).map(row => row.id)

    await knex('users')
      .whereIn('id', demoteIds)
      .update({ role: 'admin', updated_at: knex.fn.now() })

    await knex('audit_logs').insert({
      actor_id: keeperId,
      owner_admin_id: null,
      action: 'users.superadmin_deduplicate',
      module: 'users',
      entity_id: keeperId,
      old_values: { duplicateSuperadminCount: activeSuperadmins.length },
      new_values: { keeperId, demotedToAdminIds: demoteIds },
      ip_address: 'migration',
      created_at: knex.fn.now()
    })
  }

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_single_active_superadmin_idx
    ON users (role)
    WHERE role = 'superadmin' AND is_active = true
  `)

  await knex.raw(`
    UPDATE users e
    SET owner_admin_id = c.id
    FROM users c
    WHERE e.created_by = c.id
      AND c.role = 'admin'
      AND e.role = 'employee'
      AND e.owner_admin_id IS NULL
  `)

  await knex.raw(`
    UPDATE sites s
    SET owner_admin_id = c.id
    FROM users c
    WHERE s.created_by = c.id
      AND c.role = 'admin'
      AND s.owner_admin_id IS NULL
  `)

  await knex.raw(`
    UPDATE employee_site_assignments a
    SET owner_admin_id = s.owner_admin_id
    FROM sites s
    WHERE a.site_id = s.id
      AND a.owner_admin_id IS NULL
  `)

  await knex.raw(`
    UPDATE data_submissions ds
    SET owner_admin_id = s.owner_admin_id
    FROM sites s
    WHERE ds.site_id = s.id
      AND ds.owner_admin_id IS NULL
  `)

  await knex.raw(`
    UPDATE attendance a
    SET owner_admin_id = s.owner_admin_id
    FROM sites s
    WHERE a.site_id = s.id
      AND a.owner_admin_id IS NULL
  `)

  await knex.raw(`
    UPDATE notifications n
    SET owner_admin_id = u.owner_admin_id
    FROM users u
    WHERE n.user_id = u.id
      AND n.owner_admin_id IS NULL
  `)

  await knex.raw(`
    UPDATE audit_logs l
    SET owner_admin_id = u.id
    FROM users u
    WHERE l.actor_id = u.id
      AND u.role = 'admin'
      AND l.owner_admin_id IS NULL
  `)

  await knex.schema.alterTable('users', table => {
    table.index(['owner_admin_id'])
  })
  await knex.schema.alterTable('sites', table => {
    table.index(['owner_admin_id', 'is_active'])
  })
  await knex.schema.alterTable('employee_site_assignments', table => {
    table.index(['owner_admin_id', 'is_active'])
  })
  await knex.schema.alterTable('data_submissions', table => {
    table.index(['owner_admin_id', 'submission_date'])
  })
  await knex.schema.alterTable('attendance', table => {
    table.index(['owner_admin_id', 'attendance_date'])
  })
  await knex.schema.alterTable('notifications', table => {
    table.index(['owner_admin_id', 'created_at'])
  })
  await knex.schema.alterTable('audit_logs', table => {
    table.index(['owner_admin_id', 'created_at'])
  })
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS users_single_active_superadmin_idx')

  await knex.schema.alterTable('audit_logs', table => {
    table.dropColumn('owner_admin_id')
  })
  await knex.schema.alterTable('notifications', table => {
    table.dropColumn('owner_admin_id')
  })
  await knex.schema.alterTable('attendance', table => {
    table.dropColumn('owner_admin_id')
  })
  await knex.schema.alterTable('data_submissions', table => {
    table.dropColumn('owner_admin_id')
  })
  await knex.schema.alterTable('employee_site_assignments', table => {
    table.dropColumn('owner_admin_id')
  })
  await knex.schema.alterTable('sites', table => {
    table.dropColumn('owner_admin_id')
  })
  await knex.schema.alterTable('users', table => {
    table.dropColumn('owner_admin_id')
  })
}
