const { hasPermission } = require('../utils/permissions')

function allowRoles (...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    return next()
  }
}

function requirePermission (permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    return next()
  }
}

module.exports = { allowRoles, requirePermission }
