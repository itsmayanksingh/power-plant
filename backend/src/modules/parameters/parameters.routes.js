const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./parameters.controller')
const validators = require('./parameters.validators')

const router = express.Router()

router.use(authRequired)

router.get('/sites/:siteId/parameters', allowRoles('superadmin', 'admin', 'employee'), validate(validators.siteIdSchema), controller.listBySite)
router.post('/sites/:siteId/parameters', allowRoles('superadmin', 'admin'), validate(validators.createParameterSchema), controller.create)
router.put('/parameters/:id', allowRoles('superadmin', 'admin'), validate(validators.updateParameterSchema), controller.update)
router.delete('/parameters/:id', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.remove)
router.patch('/parameters/:id/toggle', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.toggle)
router.put('/sites/:siteId/parameters/reorder', allowRoles('superadmin', 'admin'), validate(validators.reorderSchema), controller.reorder)

module.exports = router
