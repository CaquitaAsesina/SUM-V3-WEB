const express = require('express');
const ctrl = require('../controllers/auditoria.controller');

const router = express.Router();

/** Solo el administrador puede editar y eliminar registros de auditoría */
function soloAdmin(req, res, next) {
  if (String(req.get('x-user-rol') || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo el administrador puede realizar esta acción' });
  }
  next();
}

// Áreas
router.get('/areas', ctrl.listarAreas);
router.post('/areas', ctrl.crearArea);
router.put('/areas/:id', ctrl.actualizarArea);
router.delete('/areas/:id', ctrl.eliminarArea);

// Productos (solo código y nombre)
router.get('/productos', ctrl.listarProductos);
router.post('/productos', ctrl.crearProducto);
router.put('/productos/:id', ctrl.actualizarProducto);
router.delete('/productos/:id', ctrl.eliminarProducto);

// Registros
router.get('/registros', ctrl.listarRegistros);
router.post('/registros', ctrl.crearRegistro);
router.put('/registros/:id', soloAdmin, ctrl.actualizarRegistro);
router.delete('/registros/:id', soloAdmin, ctrl.eliminarRegistro);

module.exports = router;