const { z } = require('zod')

const updateSchema = z.object({
  body: z.record(z.any())
})

module.exports = { updateSchema }
