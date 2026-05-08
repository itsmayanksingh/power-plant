const { z } = require('zod')
const pageOrLimitSchema = z.union([z.string(), z.number()]).optional()

const createSubmissionSchema = z.object({
  body: z.object({
    siteId: z.string().uuid(),
    submissionDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
    values: z.array(z.object({
      parameterId: z.string().uuid(),
      value: z.union([z.string(), z.number(), z.boolean()])
    })).min(1)
  })
})

const listSchema = z.object({
  query: z.object({
    page: pageOrLimitSchema,
    limit: pageOrLimitSchema,
    siteId: z.string().uuid().optional(),
    submittedBy: z.string().uuid().optional(),
    date: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional()
  })
})

const idSchema = z.object({ params: z.object({ id: z.string().uuid() }) })

const statusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['pending', 'approved', 'rejected']) })
})

module.exports = { createSubmissionSchema, listSchema, idSchema, statusSchema }
