const express = require('express');
const ctrl = require('../controllers/registros.controller');

const router = express.Router();

/** Solo el administrador puede editar y eliminar registros */
function soloAdmin(req, res, next) {
  if (String(req.get('x-user-rol') || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo el administrador puede realizar esta acción' });
  }
  next();
}

router.get('/', ctrl.listar);
router.get('/proveedores', ctrl.proveedores);
router.post('/', ctrl.crear);
router.put('/:id', soloAdmin, ctrl.actualizar);
router.delete('/:id', soloAdmin, ctrl.eliminar);

module.exports = router;
