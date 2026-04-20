const { z } = require('zod')

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
})

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10)
  })
})

const logoutSchema = refreshSchema

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
})

const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() })
})

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    newPassword: z.string().min(8)
  })
})

module.exports = {
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
}
