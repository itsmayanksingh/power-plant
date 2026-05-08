const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./dashboard.service')

const stats = asyncHandler(async (req, res) => success(res, await service.stats({ actor: req.user })))
const recentSubmissions = asyncHandler(async (req, res) => success(res, await service.recentSubmissions({ actor: req.user })))
const attendanceToday = asyncHandler(async (req, res) => success(res, await service.attendanceToday({ actor: req.user })))
const missingToday = asyncHandler(async (req, res) => success(res, await service.missingToday({ actor: req.user })))
const siteWiseStats = asyncHandler(async (req, res) => success(res, await service.siteWiseStats({ actor: req.user })))

module.exports = { stats, recentSubmissions, attendanceToday, missingToday, siteWiseStats }
