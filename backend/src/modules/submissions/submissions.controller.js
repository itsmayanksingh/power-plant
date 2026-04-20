const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./submissions.service')

const create = asyncHandler(async (req, res) => {
  const data = await service.createSubmission({ userId: req.user.id, payload: req.body, ipAddress: req.ip })
  return success(res, data, 'Submission created', 201)
})

const list = asyncHandler(async (req, res) => {
  const data = await service.listSubmissions({ query: req.query, actor: req.user })
  return success(res, data)
})

const getById = asyncHandler(async (req, res) => {
  const data = await service.getSubmissionById({ id: req.params.id, actor: req.user })
  return success(res, data)
})

const missing = asyncHandler(async (req, res) => {
  const data = await service.missingSubmissions({ date: req.query.date })
  return success(res, data)
})

const updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateStatus({ id: req.params.id, status: req.body.status, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Submission status updated')
})

const exportCsv = asyncHandler(async (req, res) => {
  const csv = await service.exportSubmissions({ query: req.query, actor: req.user })
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"')
  res.status(200).send(csv)
})

module.exports = { create, list, getById, missing, updateStatus, exportCsv }
