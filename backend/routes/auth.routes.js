const express = require('express');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

// Login
router.post('/login', ctrl.login);

// Gestión de usuarios (solo admin)
router.get('/usuarios', ctrl.listarUsuarios);
router.post('/usuarios', ctrl.crearUsuario);
router.delete('/usuarios/:id', ctrl.eliminarUsuario);
router.put('/usuarios/:id/estado', ctrl.cambiarEstado);

module.exports = router;
