const jwt = require('jsonwebtoken')
const env = require('../config/env')

function authRequired (req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    req.user = decoded
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

module.exports = { authRequired }
