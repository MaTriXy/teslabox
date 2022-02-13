const controllers = require('../controllers')

const express = require('express')
const router = express.Router()

router.all('/archive', controllers.archive)
router.all('/stream', controllers.stream)
router.all('/log', controllers.log)
router.all('/', controllers.home)

module.exports = router
