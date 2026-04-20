const { z } = require('zod')

const listSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    module: z.string().optional(),
    actorId: z.string().uuid().optional()
  })
})

module.exports = { listSchema }
