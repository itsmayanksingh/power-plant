const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./notifications.controller')
const validators = require('./notifications.validators')

const router = express.Router()
router.use(authRequired)

router.get('/', controller.list)
router.post('/send', allowRoles('superadmin', 'admin'), validate(validators.sendSchema), controller.send)

module.exports = router
