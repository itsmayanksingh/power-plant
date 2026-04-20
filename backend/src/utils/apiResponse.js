function success (res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data })
}

function error (res, message = 'Error', statusCode = 400, details = null) {
  return res.status(statusCode).json({ success: false, message, details })
}

module.exports = { success, error }
