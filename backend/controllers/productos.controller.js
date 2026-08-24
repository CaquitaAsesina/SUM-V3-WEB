const db = require('../config/db');

exports.listar = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*,
             COALESCE(SUM(IF(r.tipo='ENTREGA', r.cantidad, 0)), 0) AS entregas,
             COALESCE(SUM(IF(r.tipo='DEVOLUCION', r.cantidad, 0)), 0) AS devoluciones,
             COALESCE(SUM(IF(r.tipo='ENTREGA', r.cantidad, IF(r.tipo='DEVOLUCION', -r.cantidad, 0))), 0) AS stock,
             COUNT(r.id) AS total_registros
        FROM productos p
        LEFT JOIN registros r ON r.producto_id = p.id
       GROUP BY p.id
       ORDER BY p.nombre ASC`);
    res.json(rows);
  } catch (err) {
    console.error('productos.listar:', err.message);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

exports.crear = async (req, res) => {
  const nombre = String(req.body?.nombre ?? '').trim();
  const descripcion = String(req.body?.descripcion ?? '').trim() || null;
  const unidad = String(req.body?.unidad ?? '').trim() || 'Unidad';
  const activo = req.body?.activo === false ? 0 : 1;

  if (!nombre) return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
  if (nombre.length > 120) return res.status(400).json({ error: 'El nombre no puede superar 120 caracteres' });
  if (descripcion && descripcion.length > 255) return res.status(400).json({ error: 'La descripción es demasiado larga' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.execute(
      'INSERT INTO productos (codigo, nombre, descripcion, unidad, activo) VALUES (NULL, ?, ?, ?, ?)',
      [nombre, descripcion, unidad, activo]
    );
    const codigo = `PRD-${String(ins.insertId).padStart(4, '0')}`;
    await conn.execute('UPDATE productos SET codigo = ? WHERE id = ?', [codigo, ins.insertId]);
    await conn.commit();

    const [rows] = await conn.execute('SELECT * FROM productos WHERE id = ?', [ins.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('productos.crear:', err.message);
    res.status(500).json({ error: 'No se pudo crear el producto' });
  } finally {
    conn.release();
  }
};

exports.actualizar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  const nombre = String(req.body?.nombre ?? '').trim();
  const descripcion = String(req.body?.descripcion ?? '').trim() || null;
  const unidad = String(req.body?.unidad ?? '').trim() || 'Unidad';
  const activo = req.body?.activo === false ? 0 : 1;

  if (!nombre) return res.status(400).json({ error: 'El nombre del producto es obligatorio' });

  const conn = await db.getConnection();
  try {
    const [[existe]] = await conn.execute('SELECT id FROM productos WHERE id = ? LIMIT 1', [id]);
    if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

    await conn.beginTransaction();
    await conn.execute(
      'UPDATE productos SET nombre = ?, descripcion = ?, unidad = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, unidad, activo, id]
    );
    await conn.commit();

    const [rows] = await conn.execute('SELECT * FROM productos WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('productos.actualizar:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el producto' });
  } finally {
    conn.release();
  }
};

exports.eliminar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  try {
    const [[reg]] = await db.execute('SELECT COUNT(*) AS n FROM registros WHERE producto_id = ?', [id]);
    const [del] = await db.execute('DELETE FROM productos WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({
      mensaje: 'Producto eliminado correctamente',
      registros_eliminados: reg.n
    });
  } catch (err) {
    console.error('productos.eliminar:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el producto' });
  }
};
