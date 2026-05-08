const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./notifications.service')

const list = asyncHandler(async (req, res) => {
  const data = await service.list({ userId: req.user.id, role: req.user.role })
  return success(res, data)
})

const send = asyncHandler(async (req, res) => {
  const data = await service.create({ actor: req.user, ...req.body })
  return success(res, data, 'Notification sent', 201)
})

module.exports = { list, send }
