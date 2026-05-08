const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./attendance.service')

const checkIn = asyncHandler(async (req, res) => {
  const data = await service.checkIn({ userId: req.user.id, siteId: req.body.siteId, latitude: req.body.latitude, longitude: req.body.longitude, ipAddress: req.ip })
  return success(res, data, 'Check-in successful', 201)
})

const checkOut = asyncHandler(async (req, res) => {
  const data = await service.checkOut({ userId: req.user.id, siteId: req.body.siteId, ipAddress: req.ip })
  return success(res, data, 'Check-out successful')
})

const list = asyncHandler(async (req, res) => {
  const data = await service.list({ query: req.query, actor: req.user })
  return success(res, data)
})

const my = asyncHandler(async (req, res) => {
  const data = await service.myHistory({ userId: req.user.id, query: req.query })
  return success(res, data)
})

const summary = asyncHandler(async (req, res) => {
  const data = await service.summary({ query: req.query, actor: req.user })
  return success(res, data)
})

module.exports = { checkIn, checkOut, list, my, summary }
