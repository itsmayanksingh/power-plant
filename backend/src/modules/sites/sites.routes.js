const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./sites.controller')
const validators = require('./sites.validators')

const router = express.Router()

router.use(authRequired)

router.get('/my-site', allowRoles('employee'), controller.mySite)
router.get('/', allowRoles('superadmin', 'admin'), validate(validators.listSitesSchema), controller.list)
router.get('/:id', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.getById)
router.post('/', allowRoles('superadmin', 'admin'), validate(validators.createSiteSchema), controller.create)
router.put('/:id', allowRoles('superadmin', 'admin'), validate(validators.updateSiteSchema), controller.update)
router.delete('/:id', allowRoles('superadmin', 'admin'), validate(validators.idSchema), controller.remove)

module.exports = router
