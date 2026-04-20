const db = require('../../config/database')
const AppError = require('../../utils/AppError')
const { verifyPassword, hashPassword } = require('../../utils/password')
const { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } = require('../../utils/jwt')
const { writeAuditLog } = require('../audit-logs/auditLogs.helper')

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15

function normalizeEmail (email) {
  return email.trim().toLowerCase()
}

function refreshTokenExpiry () {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
}

async function getLoginAttempt (email) {
  return db('user_login_attempts').where({ email }).first()
}

async function upsertFailedAttempt (email, currentCount) {
  const failedCount = currentCount + 1
  const update = {
    failed_count: failedCount,
    locked_until: failedCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
    updated_at: new Date()
  }

  await db('user_login_attempts').insert({
    email,
    ...update
  }).onConflict('email').merge(update)
}

async function clearAttempts (email) {
  await db('user_login_attempts').where({ email }).del()
}

async function login ({ email, password, ipAddress }) {
  const normalizedEmail = normalizeEmail(email)
  const attempt = await getLoginAttempt(normalizedEmail)

  if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
    throw new AppError('Account temporarily locked. Try again later.', 423)
  }

  const user = await db('users').where({ email: normalizedEmail }).first()
  const invalidCredsError = new AppError('Invalid credentials', 401)

  if (!user) {
    await upsertFailedAttempt(normalizedEmail, attempt?.failed_count || 0)
    throw invalidCredsError
  }

  if (!user.is_active) {
    throw new AppError('Account is deactivated', 403)
  }

  const validPassword = await verifyPassword(password, user.password_hash)
  if (!validPassword) {
    await upsertFailedAttempt(normalizedEmail, attempt?.failed_count || 0)
    throw invalidCredsError
  }

  await clearAttempts(normalizedEmail)

  const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email })
  const refreshToken = signRefreshToken({ id: user.id, role: user.role, email: user.email })

  await db('refresh_tokens').insert({
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    expires_at: refreshTokenExpiry()
  })

  await db('users').where({ id: user.id }).update({ last_login: new Date(), updated_at: new Date() })
  await writeAuditLog({ actorId: user.id, action: 'auth.login', module: 'auth', entityId: user.id, ipAddress })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }
}

async function refresh ({ refreshToken }) {
  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch (err) {
    throw new AppError('Invalid refresh token', 401)
  }

  const existing = await db('refresh_tokens')
    .where({ token_hash: hashToken(refreshToken), is_revoked: false })
    .first()

  if (!existing || new Date(existing.expires_at) < new Date()) {
    throw new AppError('Refresh token expired or revoked', 401)
  }

  await db('refresh_tokens').where({ id: existing.id }).update({ is_revoked: true })

  const accessToken = signAccessToken({ id: decoded.id, role: decoded.role, email: decoded.email })
  const newRefreshToken = signRefreshToken({ id: decoded.id, role: decoded.role, email: decoded.email })

  await db('refresh_tokens').insert({
    user_id: decoded.id,
    token_hash: hashToken(newRefreshToken),
    expires_at: refreshTokenExpiry()
  })

  return { accessToken, refreshToken: newRefreshToken }
}

async function logout ({ refreshToken, userId }) {
  const tokenHash = hashToken(refreshToken)
  await db('refresh_tokens').where({ token_hash: tokenHash, user_id: userId }).update({ is_revoked: true })
  await writeAuditLog({ actorId: userId, action: 'auth.logout', module: 'auth', entityId: userId })
}

async function changePassword ({ userId, currentPassword, newPassword }) {
  const user = await db('users').where({ id: userId }).first()
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const valid = await verifyPassword(currentPassword, user.password_hash)
  if (!valid) {
    throw new AppError('Current password is incorrect', 400)
  }

  const newHash = await hashPassword(newPassword)
  await db('users').where({ id: userId }).update({ password_hash: newHash, updated_at: new Date() })
  await db('refresh_tokens').where({ user_id: userId, is_revoked: false }).update({ is_revoked: true })
  await writeAuditLog({ actorId: userId, action: 'auth.change_password', module: 'auth', entityId: userId })
}

async function forgotPassword ({ email }) {
  const normalizedEmail = normalizeEmail(email)
  const user = await db('users').where({ email: normalizedEmail }).first()
  if (!user) return
  await writeAuditLog({ actorId: user.id, action: 'auth.forgot_password', module: 'auth', entityId: user.id })
}

async function resetPassword ({ email, newPassword }) {
  const normalizedEmail = normalizeEmail(email)
  const user = await db('users').where({ email: normalizedEmail }).first()
  if (!user) {
    throw new AppError('Invalid reset request', 400)
  }
  const newHash = await hashPassword(newPassword)
  await db('users').where({ id: user.id }).update({ password_hash: newHash, updated_at: new Date() })
  await db('refresh_tokens').where({ user_id: user.id }).update({ is_revoked: true })
  await writeAuditLog({ actorId: user.id, action: 'auth.reset_password', module: 'auth', entityId: user.id })
}

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
}
