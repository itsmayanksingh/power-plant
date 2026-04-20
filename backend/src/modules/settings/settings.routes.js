const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./settings.controller')
const validators = require('./settings.validators')

const router = express.Router()
router.use(authRequired)
router.use(allowRoles('superadmin', 'admin'))

router.get('/', controller.get)
router.put('/', validate(validators.updateSchema), controller.update)

module.exports = router
