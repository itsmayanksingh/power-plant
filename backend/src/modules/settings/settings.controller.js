const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./settings.service')

const get = asyncHandler(async (req, res) => success(res, await service.getSettings()))
const update = asyncHandler(async (req, res) => success(res, await service.updateSettings({ entries: req.body, actor: req.user, ipAddress: req.ip }), 'Settings updated'))

module.exports = { get, update }
