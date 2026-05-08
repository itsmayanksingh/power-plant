const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { paginate } = require('../../utils/paginator')
const { getUtcDateString } = require('../../utils/dateHelper')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')
const { isAdmin, ownerAdminIdForActor, ensureAdminOwns } = require('../../utils/tenant')

function validateValueForParameter (param, rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    if (param.is_required) throw new AppError(`Missing required value for parameter ${param.name}`, 400)
    return { value_text: null, value_number: null }
  }

  switch (param.type) {
    case 'number': {
      const number = Number(rawValue)
      if (Number.isNaN(number)) throw new AppError(`Invalid number for ${param.name}`, 400)
      if (param.min_value !== null && number < Number(param.min_value)) throw new AppError(`Value below min for ${param.name}`, 400)
      if (param.max_value !== null && number > Number(param.max_value)) throw new AppError(`Value above max for ${param.name}`, 400)
      return { value_text: null, value_number: number }
    }
    case 'dropdown': {
      if (!Array.isArray(param.options) || !param.options.includes(String(rawValue))) {
        throw new AppError(`Invalid dropdown option for ${param.name}`, 400)
      }
      return { value_text: String(rawValue), value_number: null }
    }
    case 'boolean': {
      if (typeof rawValue !== 'boolean' && rawValue !== 'true' && rawValue !== 'false') {
        throw new AppError(`Invalid boolean for ${param.name}`, 400)
      }
      return { value_text: String(rawValue === true || rawValue === 'true'), value_number: null }
    }
    case 'date': {
      const parsed = new Date(rawValue)
      if (Number.isNaN(parsed.getTime())) throw new AppError(`Invalid date for ${param.name}`, 400)
      return { value_text: parsed.toISOString().slice(0, 10), value_number: null }
    }
    case 'text':
    default:
      return { value_text: String(rawValue), value_number: null }
  }
}

async function createSubmission ({ userId, payload, ipAddress }) {
  const submissionDate = payload.submissionDate || getUtcDateString()

  const assignment = await db('employee_site_assignments').where({ employee_id: userId, site_id: payload.siteId, is_active: true }).first()
  if (!assignment) throw new AppError('User is not assigned to this site', 403)

  const params = await db('site_parameters').where({ site_id: payload.siteId, is_active: true })
  const paramMap = new Map(params.map(p => [p.id, p]))

  const requiredIds = params.filter(p => p.is_required).map(p => p.id)
  const providedMap = new Map(payload.values.map(v => [v.parameterId, v.value]))

  for (const requiredId of requiredIds) {
    if (!providedMap.has(requiredId)) throw new AppError('Missing required parameters', 400)
  }

  const validated = []
  for (const row of payload.values) {
    const param = paramMap.get(row.parameterId)
    if (!param) throw new AppError('Parameter is not active for site', 400)
    validated.push({
      parameter_id: row.parameterId,
      ...validateValueForParameter(param, row.value)
    })
  }

  return db.transaction(async trx => {
    const existing = await trx('data_submissions').where({
      site_id: payload.siteId,
      submitted_by: userId,
      submission_date: submissionDate
    }).first()
    if (existing) throw new AppError('Submission already exists for this date', 409)

    const [submission] = await trx('data_submissions').insert({
      site_id: payload.siteId,
      submitted_by: userId,
      owner_admin_id: assignment.owner_admin_id,
      submission_date: submissionDate,
      notes: payload.notes
    }).returning('*')

    const insertRows = validated.map(v => ({ ...v, submission_id: submission.id }))
    await trx('submission_values').insert(insertRows)

    await writeAuditLog({
      actorId: userId,
      ownerAdminId: assignment.owner_admin_id,
      action: 'submissions.create',
      module: 'submissions',
      entityId: submission.id,
      newValues: { siteId: payload.siteId, submissionDate, values: insertRows.length },
      ipAddress,
      trx
    })

    return submission
  })
}

async function listSubmissions ({ query, actor }) {
  const { page, limit, offset } = paginate(query)
  const qb = db('data_submissions as s')
    .join('users as u', 'u.id', 's.submitted_by')
    .join('sites as si', 'si.id', 's.site_id')
    .select('s.*', 'u.name as submitter_name', 'u.email as submitter_email', 'si.name as site_name')

  if (actor.role === 'employee') qb.where('s.submitted_by', actor.id)
  if (isAdmin(actor)) qb.where('s.owner_admin_id', actor.id)
  if (query.siteId) qb.where('s.site_id', query.siteId)
  if (query.submittedBy) qb.where('s.submitted_by', query.submittedBy)
  if (query.date) qb.where('s.submission_date', query.date)
  if (query.status) qb.where('s.status', query.status)

  const rows = await qb.orderBy('s.submission_time', 'desc').limit(limit).offset(offset)
  const [{ count }] = await qb.clone().clearSelect().clearOrder().count('* as count')
  return { items: rows, pagination: { page, limit, total: Number(count) } }
}

async function getSubmissionById ({ id, actor }) {
  const submission = await db('data_submissions').where({ id }).first()
  if (!submission) throw new AppError('Submission not found', 404)
  ensureAdminOwns(submission.owner_admin_id, actor)
  if (actor.role === 'employee' && submission.submitted_by !== actor.id) {
    throw new AppError('Forbidden', 403)
  }

  const values = await db('submission_values as sv')
    .join('site_parameters as p', 'p.id', 'sv.parameter_id')
    .where('sv.submission_id', id)
    .select('sv.*', 'p.name as parameter_name', 'p.type as parameter_type', 'p.unit')

  return { ...submission, values }
}

async function updateStatus ({ id, status, actor, ipAddress }) {
  const submission = await db('data_submissions').where({ id }).first()
  if (!submission) throw new AppError('Submission not found', 404)
  ensureAdminOwns(submission.owner_admin_id, actor)

  const [row] = await db('data_submissions').where({ id }).update({ status }).returning('*')
  await writeAuditLog({
    actorId: actor.id,
    ownerAdminId: ownerAdminIdForActor(actor),
    action: 'submissions.status',
    module: 'submissions',
    entityId: id,
    oldValues: { status: submission.status },
    newValues: { status },
    ipAddress
  })
  return row
}

async function missingSubmissions ({ date, actor }) {
  const targetDate = date || getUtcDateString()
  const assignmentsQb = db('employee_site_assignments as a')
    .join('users as u', 'u.id', 'a.employee_id')
    .join('sites as s', 's.id', 'a.site_id')
    .where('a.is_active', true)
    .select('a.employee_id', 'u.name as employee_name', 'a.site_id', 's.name as site_name')
  if (isAdmin(actor)) assignmentsQb.andWhere('a.owner_admin_id', actor.id)
  const assignments = await assignmentsQb

  const submittedQb = db('data_submissions').where({ submission_date: targetDate }).select('submitted_by', 'site_id')
  if (isAdmin(actor)) submittedQb.andWhere('owner_admin_id', actor.id)
  const submitted = await submittedQb
  const submittedSet = new Set(submitted.map(r => `${r.submitted_by}:${r.site_id}`))

  return assignments.filter(a => !submittedSet.has(`${a.employee_id}:${a.site_id}`)).map(a => ({ ...a, date: targetDate }))
}

function toCsv (rows) {
  if (rows.length === 0) return 'id,site_id,submitted_by,submission_date,status\n'
  const header = Object.keys(rows[0])
  const lines = [header.join(',')]
  for (const row of rows) {
    lines.push(header.map(key => JSON.stringify(row[key] ?? '')).join(','))
  }
  return `${lines.join('\n')}\n`
}

async function exportSubmissions ({ query, actor }) {
  const data = await listSubmissions({ query: { ...query, page: 1, limit: 10000 }, actor })
  return toCsv(data.items)
}

module.exports = {
  createSubmission,
  listSubmissions,
  getSubmissionById,
  updateStatus,
  missingSubmissions,
  exportSubmissions
}
