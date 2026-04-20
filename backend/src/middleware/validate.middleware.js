const { z } = require('zod')

function validate (schema) {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      })
      next()
    } catch (err) {
      const details = err instanceof z.ZodError ? err.issues : null
      res.status(400).json({ success: false, message: 'Validation failed', details })
    }
  }
}

module.exports = validate
