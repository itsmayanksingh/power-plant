const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./users.controller')
const validators = require('./users.validators')

const router = express.Router()

router.use(authRequired)

router.get('/me', controller.me)
router.put('/me', validate(validators.updateProfileSchema), controller.updateMe)

router.get('/', allowRoles('superadmin', 'admin'), validate(validators.listUsersSchema), controller.list)
router.get('/:id', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.getById)
router.post('/', allowRoles('superadmin', 'admin'), validate(validators.createUserSchema), controller.create)
router.put('/:id', allowRoles('superadmin', 'admin'), validate(validators.updateUserSchema), controller.update)
router.patch('/:id/activate', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.activate)
router.patch('/:id/deactivate', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.deactivate)

module.exports = router
