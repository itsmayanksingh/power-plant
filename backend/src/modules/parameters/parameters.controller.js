const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./parameters.service')

const listBySite = asyncHandler(async (req, res) => {
  const data = await service.listBySite({ siteId: req.params.siteId, actor: req.user })
  return success(res, data)
})

const create = asyncHandler(async (req, res) => {
  const data = await service.create({ siteId: req.params.siteId, payload: req.body, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Parameter created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await service.update({ id: req.params.id, payload: req.body, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Parameter updated')
})

const remove = asyncHandler(async (req, res) => {
  await service.remove({ id: req.params.id, actor: req.user, ipAddress: req.ip })
  return success(res, null, 'Parameter deleted or deactivated')
})

const toggle = asyncHandler(async (req, res) => {
  const data = await service.toggle({ id: req.params.id, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Parameter toggled')
})

const reorder = asyncHandler(async (req, res) => {
  const data = await service.reorder({ siteId: req.params.siteId, orders: req.body.orders, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Parameters reordered')
})

module.exports = { listBySite, create, update, remove, toggle, reorder }
