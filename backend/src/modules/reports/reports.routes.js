const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const controller = require('./reports.controller')

const router = express.Router()

router.use(authRequired)
router.use(allowRoles('superadmin', 'admin'))

router.get('/submissions', controller.submissions)
router.get('/attendance', controller.attendance)
router.get('/parameter-analysis', controller.parameterAnalysis)

module.exports = router
