const { z } = require('zod')

const siteIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) })
const siteUserSchema = z.object({ params: z.object({ id: z.string().uuid(), userId: z.string().uuid() }) })
const userIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) })

const assignSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ employeeId: z.string().uuid() })
})

module.exports = { siteIdSchema, siteUserSchema, userIdSchema, assignSchema }
