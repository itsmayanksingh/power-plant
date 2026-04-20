const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const env = require('../config/env')

function signAccessToken (payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn })
}

function signRefreshToken (payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn })
}

function verifyRefreshToken (token) {
  return jwt.verify(token, env.jwt.refreshSecret)
}

function hashToken (token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken }
