const express = require('express')
const { authRequired } = require('../../middleware/auth.middleware')
const { allowRoles } = require('../../middleware/rbac.middleware')
const controller = require('./dashboard.controller')

const router = express.Router()

router.use(authRequired)
router.use(allowRoles('superadmin', 'admin'))

router.get('/stats', controller.stats)
router.get('/recent-submissions', controller.recentSubmissions)
router.get('/attendance-today', controller.attendanceToday)
router.get('/missing-today', controller.missingToday)
router.get('/site-wise-stats', controller.siteWiseStats)

module.exports = router
