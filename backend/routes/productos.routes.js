const express = require('express');
const ctrl = require('../controllers/productos.controller');

const router = express.Router();
router.get('/', ctrl.listar);
router.get('/proveedores', ctrl.proveedores);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
