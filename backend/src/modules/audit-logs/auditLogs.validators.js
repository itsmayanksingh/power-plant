const { z } = require('zod')
const pageOrLimitSchema = z.union([z.string(), z.number()]).optional()

const listSchema = z.object({
  query: z.object({
    page: pageOrLimitSchema,
    limit: pageOrLimitSchema,
    module: z.string().optional(),
    actorId: z.string().uuid().optional()
  })
})

module.exports = { listSchema }
