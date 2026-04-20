const { z } = require('zod')

const idSchema = z.object({ params: z.object({ id: z.string().uuid() }) })

const listSitesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().optional()
  })
})

const createSiteSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    location: z.string().min(2).max(200),
    description: z.string().max(1000).optional()
  })
})

const updateSiteSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    location: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional()
  }).refine(v => Object.keys(v).length > 0, 'At least one field is required')
})

module.exports = { idSchema, listSitesSchema, createSiteSchema, updateSiteSchema }
