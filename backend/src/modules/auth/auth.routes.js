const express = require('express')
const validate = require('../../middleware/validate.middleware')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const controller = require('./auth.controller')
const validators = require('./auth.validators')

const router = express.Router()

router.post('/login', validate(validators.loginSchema), controller.login)
router.post('/refresh', validate(validators.refreshSchema), controller.refresh)
router.post('/logout', authRequired, validate(validators.logoutSchema), controller.logout)
router.post('/change-password', authRequired, validate(validators.changePasswordSchema), controller.changePassword)
router.post('/forgot-password', validate(validators.forgotPasswordSchema), controller.forgotPassword)
router.post('/reset-password', validate(validators.resetPasswordSchema), controller.resetPassword)
router.post('/impersonate/:adminId', authRequired, allowRoles('superadmin'), validate(validators.impersonateSchema), controller.impersonate)

module.exports = router
