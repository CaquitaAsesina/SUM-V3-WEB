const db = require('../config/db');

exports.resumen = async (_req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM productos WHERE activo = 1) AS totalProductos,
        (SELECT COUNT(*) FROM registros)                  AS totalRegistros,
        (SELECT COUNT(*) FROM registros
          WHERE tipo = 'ENTREGA' AND DATE(fecha_hora) = CURDATE())   AS entregasHoy,
        (SELECT COUNT(*) FROM registros
          WHERE tipo = 'DEVOLUCION' AND DATE(fecha_hora) = CURDATE()) AS devolucionesHoy,
        (SELECT COALESCE(SUM(cantidad), 0) FROM registros WHERE tipo = 'ENTREGA')     AS unidadesEntregadas,
        (SELECT COALESCE(SUM(cantidad), 0) FROM registros WHERE tipo = 'DEVOLUCION')  AS unidadesDevueltas`);

    const [productos] = await db.query(`
      SELECT p.id, p.codigo, p.nombre, p.unidad,
             COALESCE(SUM(IF(r.tipo = 'ENTREGA',    r.cantidad, 0)), 0) AS entregas,
             COALESCE(SUM(IF(r.tipo = 'DEVOLUCION', r.cantidad, 0)), 0) AS devoluciones,
             COALESCE(SUM(IF(r.tipo = 'ENTREGA',
                              r.cantidad,
                              IF(r.tipo = 'DEVOLUCION', -r.cantidad, 0))), 0) AS stock,
             COUNT(r.id) AS movimientos
        FROM productos p
        LEFT JOIN registros r ON r.producto_id = p.id
       WHERE p.activo = 1
       GROUP BY p.id, p.codigo, p.nombre, p.unidad
       ORDER BY stock DESC, p.nombre ASC`);

    res.json({ stats, productos });
  } catch (err) {
    console.error('dashboard.resumen:', err.message);
    res.status(500).json({ error: 'Error al calcular el dashboard' });
  }
};
