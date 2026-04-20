const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./users.service')

const list = asyncHandler(async (req, res) => {
  const data = await service.listUsers({ query: req.query, actor: req.user })
  return success(res, data)
})

const getById = asyncHandler(async (req, res) => {
  const data = await service.getUserById({ id: req.params.id, actor: req.user })
  return success(res, data)
})

const create = asyncHandler(async (req, res) => {
  const data = await service.createUser({ payload: req.body, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'User created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await service.updateUser({ id: req.params.id, payload: req.body, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'User updated')
})

const activate = asyncHandler(async (req, res) => {
  const data = await service.setUserActive({ id: req.params.id, isActive: true, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'User activated')
})

const deactivate = asyncHandler(async (req, res) => {
  const data = await service.setUserActive({ id: req.params.id, isActive: false, actor: req.user, ipAddress: req.ip })
  return success(res, data, 'User deactivated')
})

const me = asyncHandler(async (req, res) => {
  const data = await service.getMe({ userId: req.user.id })
  return success(res, data)
})

const updateMe = asyncHandler(async (req, res) => {
  const data = await service.updateMe({ userId: req.user.id, payload: req.body, ipAddress: req.ip })
  return success(res, data, 'Profile updated')
})

module.exports = {
  list,
  getById,
  create,
  update,
  activate,
  deactivate,
  me,
  updateMe
}
