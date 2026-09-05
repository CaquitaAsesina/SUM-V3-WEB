const express = require('express');
const ctrl = require('../controllers/productos.controller');

const router = express.Router();

/** Solo el administrador puede crear, editar y eliminar productos */
function soloAdmin(req, res, next) {
  if (String(req.get('x-user-rol') || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo el administrador puede realizar esta acción' });
  }
  next();
}

router.get('/', ctrl.listar);
router.post('/', soloAdmin, ctrl.crear);
router.put('/:id', soloAdmin, ctrl.actualizar);
router.delete('/:id', soloAdmin, ctrl.eliminar);

module.exports = router;
