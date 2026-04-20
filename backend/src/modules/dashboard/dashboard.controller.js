const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const service = require('./dashboard.service')

const stats = asyncHandler(async (req, res) => success(res, await service.stats()))
const recentSubmissions = asyncHandler(async (req, res) => success(res, await service.recentSubmissions()))
const attendanceToday = asyncHandler(async (req, res) => success(res, await service.attendanceToday()))
const missingToday = asyncHandler(async (req, res) => success(res, await service.missingToday()))
const siteWiseStats = asyncHandler(async (req, res) => success(res, await service.siteWiseStats()))

module.exports = { stats, recentSubmissions, attendanceToday, missingToday, siteWiseStats }
