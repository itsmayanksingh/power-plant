const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./assignments.controller')
const validators = require('./assignments.validators')

const router = express.Router()

router.use(authRequired)
router.post('/sites/:id/assign', allowRoles('superadmin', 'admin'), validate(validators.assignSchema), controller.assign)
router.delete('/sites/:id/assign/:userId', allowRoles('superadmin', 'admin'), validate(validators.siteUserSchema), controller.remove)
router.get('/sites/:id/assignments', allowRoles('superadmin', 'admin'), validate(validators.siteIdSchema), controller.bySite)
router.get('/users/:id/assignments', allowRoles('superadmin', 'admin', 'employee'), validate(validators.userIdSchema), controller.byUser)

module.exports = router
