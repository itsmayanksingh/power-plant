const { z } = require('zod')
const pageOrLimitSchema = z.union([z.string(), z.number()]).optional()

const checkInSchema = z.object({
  body: z.object({
    siteId: z.string().uuid(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  })
})

const checkOutSchema = z.object({
  body: z.object({
    siteId: z.string().uuid()
  })
})

const listSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    siteId: z.string().uuid().optional(),
    date: z.string().optional(),
    page: pageOrLimitSchema,
    limit: pageOrLimitSchema
  })
})

module.exports = { checkInSchema, checkOutSchema, listSchema }
