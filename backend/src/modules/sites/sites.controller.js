const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./sites.service')

const list = asyncHandler(async (req, res) => {
  const data = await service.listSites({ query: req.query, actor: req.user })
  return success(res, data)
})

const getById = asyncHandler(async (req, res) => {
  const data = await service.getSiteById({ id: req.params.id, actor: req.user })
  return success(res, data)
})

const create = asyncHandler(async (req, res) => {
  const data = await service.createSite({ payload: req.body, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Site created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await service.updateSite({ id: req.params.id, payload: req.body, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Site updated')
})

const remove = asyncHandler(async (req, res) => {
  const data = await service.deactivateSite({ id: req.params.id, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'Site removed or deactivated')
})

const mySite = asyncHandler(async (req, res) => {
  const data = await service.getMySite({ userId: req.user.id })
  return success(res, data)
})

module.exports = { list, getById, create, update, remove, mySite }
