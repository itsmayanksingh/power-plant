const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./reports.service')

const submissions = asyncHandler(async (req, res) => {
  const rows = await service.submissionsReport({ query: req.query })
  if (req.query.format === 'csv') {
    const csv = service.toCsv(rows)
    res.setHeader('Content-Type', 'text/csv')
    return res.status(200).send(csv)
  }
  return success(res, rows)
})

const attendance = asyncHandler(async (req, res) => {
  const rows = await service.attendanceReport({ query: req.query })
  if (req.query.format === 'csv') {
    const csv = service.toCsv(rows)
    res.setHeader('Content-Type', 'text/csv')
    return res.status(200).send(csv)
  }
  return success(res, rows)
})

const parameterAnalysis = asyncHandler(async (req, res) => {
  const rows = await service.parameterAnalysis({ query: req.query })
  return success(res, rows)
})

module.exports = { submissions, attendance, parameterAnalysis }
