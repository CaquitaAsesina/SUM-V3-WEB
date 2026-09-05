const express = require('express');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

/** Solo el administrador puede gestionar usuarios */
function soloAdmin(req, res, next) {
  if (String(req.get('x-user-rol') || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo el administrador puede realizar esta acción' });
  }
  next();
}

// Login
router.post('/login', ctrl.login);

// Registro público
router.post('/register', ctrl.registrar);

// Cambiar contraseña (cualquier usuario autenticado)
router.put('/usuarios/:id/contrasena', ctrl.cambiarContrasena);

// Gestión de usuarios (solo admin)
router.get('/usuarios', soloAdmin, ctrl.listarUsuarios);
router.post('/usuarios', soloAdmin, ctrl.crearUsuario);
router.delete('/usuarios/:id', soloAdmin, ctrl.eliminarUsuario);
router.put('/usuarios/:id/activar', soloAdmin, ctrl.activarUsuario);
router.put('/usuarios/:id/estado', soloAdmin, ctrl.cambiarEstado);

module.exports = router;
