const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const validate = require('../../middleware/validate.middleware')
const controller = require('./attendance.controller')
const validators = require('./attendance.validators')

const router = express.Router()

router.use(authRequired)

router.post('/check-in', allowRoles('employee'), validate(validators.checkInSchema), controller.checkIn)
router.post('/check-out', allowRoles('employee'), validate(validators.checkOutSchema), controller.checkOut)
router.get('/my', allowRoles('employee'), validate(validators.listSchema), controller.my)
router.get('/summary', allowRoles('superadmin', 'admin'), validate(validators.listSchema), controller.summary)
router.get('/', allowRoles('superadmin', 'admin'), validate(validators.listSchema), controller.list)

module.exports = router
