const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./assignments.service')

const assign = asyncHandler(async (req, res) => {
  const data = await service.assignEmployee({ siteId: req.params.id, employeeId: req.body.employeeId, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Employee assigned')
})

const remove = asyncHandler(async (req, res) => {
  const data = await service.removeAssignment({ siteId: req.params.id, userId: req.params.userId, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Assignment removed')
})

const bySite = asyncHandler(async (req, res) => {
  const data = await service.listBySite({ siteId: req.params.id })
  return success(res, data)
})

const byUser = asyncHandler(async (req, res) => {
  const data = await service.listByUser({ userId: req.params.id })
  return success(res, data)
})

module.exports = { assign, remove, bySite, byUser }
