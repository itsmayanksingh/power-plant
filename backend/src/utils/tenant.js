const AppError = require('./AppError')

function isAdmin (actor) {
  return actor?.role === 'admin'
}

function isSuperadmin (actor) {
  return actor?.role === 'superadmin'
}

function ownerAdminIdForActor (actor) {
  return isAdmin(actor) ? actor.id : null
}

function ensureAdminOwns (ownerAdminId, actor) {
  if (isAdmin(actor) && ownerAdminId !== actor.id) {
    throw new AppError('Forbidden', 403)
  }
}

module.exports = {
  isAdmin,
  isSuperadmin,
  ownerAdminIdForActor,
  ensureAdminOwns
}

