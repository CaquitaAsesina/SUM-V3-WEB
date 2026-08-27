const db = require('../config/db');

exports.resumen = async (_req, res) => {
  try {
    /* ── KPIs principales ─────────────────────────────── */
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

    /* ── Stock por producto ───────────────────────────── */
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

    /* ── Movimientos por día (últimos 14 días) ────────── */
    const [movimientosPorDia] = await db.query(`
      SELECT DATE(fecha_hora) AS fecha,
             SUM(IF(tipo='ENTREGA',cantidad,0))    AS entregas,
             SUM(IF(tipo='DEVOLUCION',cantidad,0))  AS devoluciones,
             COUNT(*) AS total
        FROM registros
       WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY DATE(fecha_hora)
       ORDER BY fecha ASC`);

    /* ── Top 5 productos más movidos ──────────────────── */
    const [topProductos] = await db.query(`
      SELECT p.nombre, p.codigo,
             SUM(r.cantidad) AS totalMovido,
             SUM(IF(r.tipo='ENTREGA',r.cantidad,0)) AS entregas,
             SUM(IF(r.tipo='DEVOLUCION',r.cantidad,0)) AS devoluciones
        FROM registros r
        JOIN productos p ON p.id = r.producto_id
       GROUP BY r.producto_id, p.nombre, p.codigo
       ORDER BY totalMovido DESC
       LIMIT 5`);

    /* ── Últimos 8 registros ──────────────────────────── */
    const [ultimosRegistros] = await db.query(`
      SELECT r.codigo, r.tipo, r.cantidad, r.placa, r.proveedor,
             DATE_FORMAT(r.fecha_hora, '%d/%m/%Y · %h:%i %p') AS fecha,
             p.nombre AS producto
        FROM registros r
        JOIN productos p ON p.id = r.producto_id
       ORDER BY r.fecha_hora DESC
       LIMIT 8`);

    /* ── Top proveedores por volumen ─────────────────── */
    const [topProveedores] = await db.query(`
      SELECT proveedor,
             COUNT(*) AS totalMovimientos,
             SUM(IF(tipo='ENTREGA',cantidad,0)) AS entregas,
             SUM(IF(tipo='DEVOLUCION',cantidad,0)) AS devoluciones,
             SUM(cantidad) AS volumenTotal
        FROM registros
       WHERE proveedor IS NOT NULL AND proveedor != ''
       GROUP BY proveedor
       ORDER BY volumenTotal DESC
       LIMIT 6`);

    /* ── Movimientos por día de semana ───────────────── */
    const [movimientosPorDiaSemana] = await db.query(`
      SELECT DAYNAME(fecha_hora) AS dia,
             DAYOFWEEK(fecha_hora) AS diaNum,
             SUM(IF(tipo='ENTREGA',cantidad,0)) AS entregas,
             SUM(IF(tipo='DEVOLUCION',cantidad,0)) AS devoluciones,
             COUNT(*) AS total
        FROM registros
       GROUP BY DAYOFWEEK(fecha_hora), DAYNAME(fecha_hora)
       ORDER BY diaNum ASC`);

    /* ── Productos con stock bajo (alertas) ──────────── */
    const [alertas] = await db.query(`
      SELECT p.nombre, p.codigo, p.unidad,
             COALESCE(SUM(IF(r.tipo='ENTREGA',r.cantidad,IF(r.tipo='DEVOLUCION',-r.cantidad,0))),0) AS stock
        FROM productos p
        LEFT JOIN registros r ON r.producto_id = p.id
       WHERE p.activo = 1
       GROUP BY p.id, p.nombre, p.codigo, p.unidad
       HAVING stock <= 5
       ORDER BY stock ASC
       LIMIT 5`);

    res.json({
      stats,
      productos,
      movimientosPorDia,
      topProductos,
      ultimosRegistros,
      topProveedores,
      movimientosPorDiaSemana,
      alertas
    });
  } catch (err) {
    console.error('dashboard.resumen:', err.message);
    res.status(500).json({ error: 'Error al calcular el dashboard' });
  }
};
