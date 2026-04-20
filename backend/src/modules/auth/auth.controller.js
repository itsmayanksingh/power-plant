const asyncHandler = require('../../utils/asyncHandler')
const { success } = require('../../utils/apiResponse')
const authService = require('./auth.service')

const login = asyncHandler(async (req, res) => {
  const data = await authService.login({ ...req.body, ipAddress: req.ip })
  return success(res, data, 'Login successful')
})

const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body)
  return success(res, data, 'Token refreshed')
})

const logout = asyncHandler(async (req, res) => {
  await authService.logout({ ...req.body, userId: req.user.id })
  return success(res, null, 'Logout successful')
})

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword({ ...req.body, userId: req.user.id })
  return success(res, null, 'Password changed')
})

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body)
  return success(res, null, 'If the email exists, reset instructions were sent')
})

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body)
  return success(res, null, 'Password reset successful')
})

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
}
