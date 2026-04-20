const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./auditLogs.controller')
const validators = require('./auditLogs.validators')

const router = express.Router()
router.use(authRequired)
router.use(allowRoles('superadmin', 'admin'))

router.get('/', validate(validators.listSchema), controller.list)

module.exports = router
