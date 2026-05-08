const { z } = require('zod')

const userRole = z.enum(['superadmin', 'admin', 'employee'])
const pageOrLimitSchema = z.union([z.string(), z.number()]).optional()

const listUsersSchema = z.object({
  query: z.object({
    page: pageOrLimitSchema,
    limit: pageOrLimitSchema,
    role: userRole.optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().optional()
  })
})

const idSchema = z.object({
  params: z.object({ id: z.string().uuid() })
})

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: userRole,
    phone: z.string().max(20).optional()
  })
})

const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().max(20).optional(),
    role: userRole.optional(),
    isActive: z.boolean().optional()
  }).refine(v => Object.keys(v).length > 0, 'At least one field is required')
})

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().max(20).optional(),
    profileImage: z.string().url().optional()
  }).refine(v => Object.keys(v).length > 0, 'At least one field is required')
})

module.exports = {
  listUsersSchema,
  idSchema,
  createUserSchema,
  updateUserSchema,
  updateProfileSchema
}
