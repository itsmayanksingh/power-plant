const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./auditLogs.service')

const list = asyncHandler(async (req, res) => {
  const data = await service.list({ query: req.query })
  return success(res, data)
})

module.exports = { list }
