const { z } = require('zod')

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
    page: z.string().optional(),
    limit: z.string().optional()
  })
})

module.exports = { checkInSchema, checkOutSchema, listSchema }
