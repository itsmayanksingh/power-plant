const { z } = require('zod')

const parameterType = z.enum(['number', 'text', 'dropdown', 'boolean', 'date'])

const siteIdSchema = z.object({ params: z.object({ siteId: z.string().uuid() }) })
const idSchema = z.object({ params: z.object({ id: z.string().uuid() }) })

const createParameterSchema = z.object({
  params: z.object({ siteId: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100),
    type: parameterType,
    isRequired: z.boolean().optional(),
    options: z.array(z.string().min(1)).optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    unit: z.string().max(30).optional(),
    displayOrder: z.number().int().optional()
  })
})

const updateParameterSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: parameterType.optional(),
    isRequired: z.boolean().optional(),
    options: z.array(z.string().min(1)).optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    unit: z.string().max(30).nullable().optional(),
    displayOrder: z.number().int().optional(),
    isActive: z.boolean().optional()
  }).refine(v => Object.keys(v).length > 0, 'At least one field is required')
})

const reorderSchema = z.object({
  params: z.object({ siteId: z.string().uuid() }),
  body: z.object({
    orders: z.array(z.object({ id: z.string().uuid(), displayOrder: z.number().int() })).min(1)
  })
})

module.exports = { siteIdSchema, idSchema, createParameterSchema, updateParameterSchema, reorderSchema }
