/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

  await knex.raw("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN CREATE TYPE user_role AS ENUM ('superadmin','admin','employee'); END IF; END $$;")
  await knex.raw("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parameter_type') THEN CREATE TYPE parameter_type AS ENUM ('number','text','dropdown','boolean','date'); END IF; END $$;")
  await knex.raw("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN CREATE TYPE submission_status AS ENUM ('pending','approved','rejected'); END IF; END $$;")
  await knex.raw("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN CREATE TYPE attendance_status AS ENUM ('present','absent','late'); END IF; END $$;")

  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('name', 100).notNullable()
    table.string('email', 150).notNullable().unique()
    table.string('password_hash', 255).notNullable()
    table.specificType('role', 'user_role').notNullable()
    table.string('phone', 20)
    table.text('profile_image')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('last_login', { useTz: true })
    table.timestamps(true, true)
  })

  await knex.schema.createTable('sites', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('name', 150).notNullable()
    table.string('location', 200).notNullable()
    table.text('description')
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.timestamps(true, true)
  })

  await knex.schema.createTable('site_parameters', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE')
    table.string('name', 100).notNullable()
    table.specificType('type', 'parameter_type').notNullable()
    table.boolean('is_required').notNullable().defaultTo(true)
    table.jsonb('options')
    table.decimal('min_value')
    table.decimal('max_value')
    table.string('unit', 30)
    table.integer('display_order').notNullable().defaultTo(0)
    table.boolean('is_active').notNullable().defaultTo(true)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('employee_site_assignments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('employee_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE')
    table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('assigned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.boolean('is_active').notNullable().defaultTo(true)
  })

  await knex.schema.createTable('data_submissions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE')
    table.uuid('submitted_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.date('submission_date').notNullable()
    table.timestamp('submission_time', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.specificType('status', 'submission_status').notNullable().defaultTo('pending')
    table.text('notes')
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.unique(['site_id', 'submitted_by', 'submission_date'])
  })

  await knex.schema.createTable('submission_values', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('submission_id').notNullable().references('id').inTable('data_submissions').onDelete('CASCADE')
    table.uuid('parameter_id').notNullable().references('id').inTable('site_parameters').onDelete('RESTRICT')
    table.text('value_text')
    table.decimal('value_number')
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('attendance', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE')
    table.timestamp('check_in', { useTz: true }).notNullable()
    table.timestamp('check_out', { useTz: true })
    table.decimal('check_in_lat', 10, 7)
    table.decimal('check_in_lng', 10, 7)
    table.date('attendance_date').notNullable()
    table.specificType('status', 'attendance_status').notNullable().defaultTo('present')
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.unique(['user_id', 'site_id', 'attendance_date'])
  })

  await knex.schema.createTable('refresh_tokens', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('token_hash', 255).notNullable().unique()
    table.timestamp('expires_at', { useTz: true }).notNullable()
    table.boolean('is_revoked').notNullable().defaultTo(false)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('audit_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('actor_id').references('id').inTable('users').onDelete('SET NULL')
    table.string('action', 120).notNullable()
    table.string('module', 80).notNullable()
    table.string('entity_id', 120)
    table.jsonb('old_values')
    table.jsonb('new_values')
    table.string('ip_address', 100)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('notifications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
    table.string('title', 160).notNullable()
    table.text('message').notNullable()
    table.boolean('is_read').notNullable().defaultTo(false)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('settings', table => {
    table.string('key', 120).primary()
    table.jsonb('value').notNullable()
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('user_login_attempts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('email', 150).notNullable()
    table.integer('failed_count').notNullable().defaultTo(0)
    table.timestamp('locked_until', { useTz: true })
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.unique(['email'])
  })

  await knex.schema.alterTable('users', table => {
    table.index(['role', 'is_active'])
  })
  await knex.schema.alterTable('data_submissions', table => {
    table.index(['site_id', 'submission_date'])
    table.index(['submitted_by', 'submission_date'])
  })
  await knex.schema.alterTable('submission_values', table => {
    table.index(['submission_id'])
    table.index(['parameter_id'])
  })
  await knex.schema.alterTable('attendance', table => {
    table.index(['user_id', 'attendance_date'])
    table.index(['site_id', 'attendance_date'])
  })
  await knex.schema.alterTable('site_parameters', table => {
    table.index(['site_id', 'is_active'])
  })
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_login_attempts')
  await knex.schema.dropTableIfExists('settings')
  await knex.schema.dropTableIfExists('notifications')
  await knex.schema.dropTableIfExists('audit_logs')
  await knex.schema.dropTableIfExists('refresh_tokens')
  await knex.schema.dropTableIfExists('attendance')
  await knex.schema.dropTableIfExists('submission_values')
  await knex.schema.dropTableIfExists('data_submissions')
  await knex.schema.dropTableIfExists('employee_site_assignments')
  await knex.schema.dropTableIfExists('site_parameters')
  await knex.schema.dropTableIfExists('sites')
  await knex.schema.dropTableIfExists('users')

  await knex.raw("DROP TYPE IF EXISTS attendance_status")
  await knex.raw("DROP TYPE IF EXISTS submission_status")
  await knex.raw("DROP TYPE IF EXISTS parameter_type")
  await knex.raw("DROP TYPE IF EXISTS user_role")
}
