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

/** ADMIN y AUDITOR pueden registrar auditorías (crear registros) */
function puedeRegistrar(req, res, next) {
  const rol = String(req.get('x-user-rol') || '').toUpperCase();
  if (rol !== 'ADMIN' && rol !== 'AUDITOR') {
    return res.status(403).json({ error: 'No tienes permiso para registrar auditorías' });
  }
  next();
}

// Áreas (mantenimiento exclusivo del administrador)
router.get('/areas', ctrl.listarAreas);
router.post('/areas', soloAdmin, ctrl.crearArea);
router.put('/areas/:id', soloAdmin, ctrl.actualizarArea);
router.delete('/areas/:id', soloAdmin, ctrl.eliminarArea);

// Productos (solo código y nombre; mantenimiento del administrador)
router.get('/productos', ctrl.listarProductos);
router.post('/productos', soloAdmin, ctrl.crearProducto);
router.put('/productos/:id', soloAdmin, ctrl.actualizarProducto);
router.delete('/productos/:id', soloAdmin, ctrl.eliminarProducto);

// Registros
router.get('/registros', ctrl.listarRegistros);
router.post('/registros', puedeRegistrar, ctrl.crearRegistro);
router.put('/registros/:id', soloAdmin, ctrl.actualizarRegistro);
router.delete('/registros/:id', soloAdmin, ctrl.eliminarRegistro);

module.exports = router;