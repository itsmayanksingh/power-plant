const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./submissions.controller')
const validators = require('./submissions.validators')

const router = express.Router()

router.use(authRequired)
router.post('/', allowRoles('employee'), validate(validators.createSubmissionSchema), controller.create)
router.get('/', allowRoles('superadmin', 'admin', 'employee'), validate(validators.listSchema), controller.list)
router.get('/missing', allowRoles('superadmin', 'admin'), controller.missing)
router.get('/export', allowRoles('superadmin', 'admin'), controller.exportCsv)
router.get('/:id', allowRoles('superadmin', 'admin', 'employee'), validate(validators.idSchema), controller.getById)
router.patch('/:id/status', allowRoles('superadmin', 'admin'), validate(validators.statusSchema), controller.updateStatus)

module.exports = router
