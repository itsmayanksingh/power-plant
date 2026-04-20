const { hashPassword } = require('../src/utils/password')

/** @param {import('knex').Knex} knex */
exports.seed = async function (knex) {
  await knex('submission_values').del()
  await knex('data_submissions').del()
  await knex('attendance').del()
  await knex('employee_site_assignments').del()
  await knex('site_parameters').del()
  await knex('sites').del()
  await knex('refresh_tokens').del()
  await knex('user_login_attempts').del()
  await knex('notifications').del()
  await knex('audit_logs').del()

  const superadminPassword = await hashPassword('SuperAdmin@123')
  await knex('users').insert({
    name: 'Super Admin',
    email: 'superadmin@plant.local',
    password_hash: superadminPassword,
    role: 'superadmin',
    is_active: true
  }).onConflict('email').merge({
    name: 'Super Admin',
    password_hash: superadminPassword,
    role: 'superadmin',
    is_active: true,
    updated_at: new Date()
  })

  const superadmin = await knex('users')
    .where({ email: 'superadmin@plant.local' })
    .first('id')

  await knex('settings').insert([
    { key: 'attendance.cutoff_hour', value: { hour: 9 } },
    { key: 'submissions.daily_cutoff', value: { hour: 18 } }
  ]).onConflict('key').merge()

  if (superadmin && superadmin.id) {
    await knex('audit_logs').insert({
      actor_id: superadmin.id,
      action: 'seed.create',
      module: 'system',
      entity_id: superadmin.id,
      new_values: JSON.stringify({ email: 'superadmin@plant.local' })
    })
  }
}
