const express = require('express');
const ctrl = require('../controllers/dashboard.controller');

const router = express.Router();
router.get('/', ctrl.resumen);

module.exports = router;
