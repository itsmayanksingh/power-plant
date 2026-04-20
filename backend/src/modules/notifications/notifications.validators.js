const { z } = require('zod')

const sendSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(160),
    message: z.string().min(1).max(2000)
  })
})

module.exports = { sendSchema }
