const db = require('../config/db');

/* ================================================================
   Helpers
   ================================================================ */

/** Primeras 3 letras del área: sin tildes, en mayúsculas, solo A-Z0-9 */
function normalizarSiglas(nombre) {
  const limpio = String(nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return limpio.slice(0, 3);
}

function pad(n) { return String(n).padStart(2, '0'); }

/**
 * Código AU-AAA-AAAA-MM-DD-NN donde NN es el correlativo de auditorías
 * (lotes) de esa área en el día (01, 02, ...). Ej: AU-ORD-2026-09-04-01
 * Todas las filas de una misma auditoría comparten el mismo código.
 * La fecha se toma del reloj de la BD (CURDATE) para que coincida
 * siempre con la columna fecha del registro.
 */
async function codigoSiguiente(conn, siglas, areaId) {
  const [[{ hoy, n }]] = await conn.execute(
    `SELECT CURDATE() AS hoy,
            (SELECT COUNT(DISTINCT codigo) FROM registros_auditoria
              WHERE area_id = ? AND codigo IS NOT NULL
                AND fecha >= CURDATE() AND fecha < CURDATE() + INTERVAL 1 DAY) AS n`,
    [areaId]
  );
  return `AU-${siglas}-${hoy}-${pad(n + 1)}`;
}

/* ================================================================
   Áreas
   ================================================================ */

exports.listarAreas = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, COUNT(r.id) AS total_registros
        FROM areas_auditoria a
        LEFT JOIN registros_auditoria r ON r.area_id = a.id
       GROUP BY a.id
       ORDER BY a.nombre ASC`);
    res.json(rows);
  } catch (err) {
    console.error('auditoria.listarAreas:', err.message);
    res.status(500).json({ error: 'Error al obtener las áreas' });
  }
};

exports.crearArea = async (req, res) => {
  const nombre = String(req.body?.nombre ?? '').trim();
  if (!nombre) return res.status(400).json({ error: 'El nombre del área es obligatorio' });
  if (nombre.length > 120) return res.status(400).json({ error: 'El nombre no puede superar 120 caracteres' });

  try {
    const [[dup]] = await db.execute(
      'SELECT id FROM areas_auditoria WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      [nombre]
    );
    if (dup) return res.status(409).json({ error: `Ya existe un área llamada "${nombre}"` });

    const [ins] = await db.execute('INSERT INTO areas_auditoria (nombre) VALUES (?)', [nombre]);
    const [rows] = await db.execute('SELECT * FROM areas_auditoria WHERE id = ?', [ins.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('auditoria.crearArea:', err.message);
    res.status(500).json({ error: 'No se pudo crear el área' });
  }
};

exports.actualizarArea = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  const nombre = String(req.body?.nombre ?? '').trim();
  if (!nombre) return res.status(400).json({ error: 'El nombre del área es obligatorio' });
  if (nombre.length > 120) return res.status(400).json({ error: 'El nombre no puede superar 120 caracteres' });

  try {
    const [[existe]] = await db.execute('SELECT id FROM areas_auditoria WHERE id = ? LIMIT 1', [id]);
    if (!existe) return res.status(404).json({ error: 'Área no encontrada' });

    const [[dup]] = await db.execute(
      'SELECT id FROM areas_auditoria WHERE LOWER(nombre) = LOWER(?) AND id != ? LIMIT 1',
      [nombre, id]
    );
    if (dup) return res.status(409).json({ error: `Ya existe un área llamada "${nombre}"` });

    await db.execute('UPDATE areas_auditoria SET nombre = ? WHERE id = ?', [nombre, id]);
    const [rows] = await db.execute('SELECT * FROM areas_auditoria WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('auditoria.actualizarArea:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el área' });
  }
};

exports.eliminarArea = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  try {
    const [[reg]] = await db.execute('SELECT COUNT(*) AS n FROM registros_auditoria WHERE area_id = ?', [id]);
    const [del] = await db.execute('DELETE FROM areas_auditoria WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'Área no encontrada' });
    res.json({ mensaje: 'Área eliminada correctamente', registros_eliminados: reg.n });
  } catch (err) {
    console.error('auditoria.eliminarArea:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el área' });
  }
};

/* ================================================================
   Productos (solo código y nombre)
   ================================================================ */

exports.listarProductos = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, COUNT(r.id) AS total_registros
        FROM productos_auditoria p
        LEFT JOIN registros_auditoria r ON r.producto_id = p.id
       GROUP BY p.id
       ORDER BY p.nombre ASC`);
    res.json(rows);
  } catch (err) {
    console.error('auditoria.listarProductos:', err.message);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

exports.crearProducto = async (req, res) => {
  const codigo = String(req.body?.codigo ?? '').trim().toUpperCase();
  const nombre = String(req.body?.nombre ?? '').trim();

  if (!codigo) return res.status(400).json({ error: 'El código del producto es obligatorio' });
  if (codigo.length > 20) return res.status(400).json({ error: 'El código no puede superar 20 caracteres' });
  if (!nombre) return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
  if (nombre.length > 120) return res.status(400).json({ error: 'El nombre no puede superar 120 caracteres' });

  try {
    const [[dupCod]] = await db.execute('SELECT id FROM productos_auditoria WHERE codigo = ? LIMIT 1', [codigo]);
    if (dupCod) return res.status(409).json({ error: `Ya existe un producto con el código "${codigo}"` });

    const [[dupNom]] = await db.execute(
      'SELECT id FROM productos_auditoria WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      [nombre]
    );
    if (dupNom) return res.status(409).json({ error: `Ya existe un producto llamado "${nombre}"` });

    const [ins] = await db.execute('INSERT INTO productos_auditoria (codigo, nombre) VALUES (?, ?)', [codigo, nombre]);
    const [rows] = await db.execute('SELECT * FROM productos_auditoria WHERE id = ?', [ins.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('auditoria.crearProducto:', err.message);
    res.status(500).json({ error: 'No se pudo crear el producto' });
  }
};

exports.actualizarProducto = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  const codigo = String(req.body?.codigo ?? '').trim().toUpperCase();
  const nombre = String(req.body?.nombre ?? '').trim();

  if (!codigo) return res.status(400).json({ error: 'El código del producto es obligatorio' });
  if (codigo.length > 20) return res.status(400).json({ error: 'El código no puede superar 20 caracteres' });
  if (!nombre) return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
  if (nombre.length > 120) return res.status(400).json({ error: 'El nombre no puede superar 120 caracteres' });

  try {
    const [[existe]] = await db.execute('SELECT id FROM productos_auditoria WHERE id = ? LIMIT 1', [id]);
    if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

    const [[dupCod]] = await db.execute(
      'SELECT id FROM productos_auditoria WHERE codigo = ? AND id != ? LIMIT 1',
      [codigo, id]
    );
    if (dupCod) return res.status(409).json({ error: `Ya existe otro producto con el código "${codigo}"` });

    const [[dupNom]] = await db.execute(
      'SELECT id FROM productos_auditoria WHERE LOWER(nombre) = LOWER(?) AND id != ? LIMIT 1',
      [nombre, id]
    );
    if (dupNom) return res.status(409).json({ error: `Ya existe otro producto llamado "${nombre}"` });

    await db.execute('UPDATE productos_auditoria SET codigo = ?, nombre = ? WHERE id = ?', [codigo, nombre, id]);
    const [rows] = await db.execute('SELECT * FROM productos_auditoria WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('auditoria.actualizarProducto:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }
};

exports.eliminarProducto = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  try {
    const [[reg]] = await db.execute('SELECT COUNT(*) AS n FROM registros_auditoria WHERE producto_id = ?', [id]);
    const [del] = await db.execute('DELETE FROM productos_auditoria WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado correctamente', registros_eliminados: reg.n });
  } catch (err) {
    console.error('auditoria.eliminarProducto:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el producto' });
  }
};

/* ================================================================
   Registros
   ================================================================ */

exports.listarRegistros = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.codigo, r.area_id, r.producto_id, r.cantidad, r.fecha, r.fecha_modifica,
             a.nombre AS area_nombre,
             p.codigo AS producto_codigo, p.nombre AS producto_nombre
        FROM registros_auditoria r
        JOIN areas_auditoria a ON a.id = r.area_id
        JOIN productos_auditoria p ON p.id = r.producto_id
       ORDER BY r.fecha DESC, r.id DESC
       LIMIT 1000`);
    res.json(rows);
  } catch (err) {
    console.error('auditoria.listarRegistros:', err.message);
    res.status(500).json({ error: 'Error al obtener los registros de auditoría' });
  }
};

async function validarRegistro(conn, body) {
  const areaId = Number(body?.area_id);
  const productoId = Number(body?.producto_id);
  const cantidad = Number(body?.cantidad);

  if (!Number.isInteger(areaId) || areaId <= 0) {
    return { error: 'Selecciona un área válida de la lista' };
  }
  const [[area]] = await conn.execute('SELECT id, nombre FROM areas_auditoria WHERE id = ? LIMIT 1', [areaId]);
  if (!area) return { error: 'El área seleccionada no existe' };

  if (!Number.isInteger(productoId) || productoId <= 0) {
    return { error: 'Selecciona un producto válido de la lista' };
  }
  const [[prod]] = await conn.execute('SELECT id FROM productos_auditoria WHERE id = ? LIMIT 1', [productoId]);
  if (!prod) return { error: 'El producto seleccionado no existe' };

  if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 1000000) {
    return { error: 'La cantidad debe ser un número entero mayor a 0' };
  }

  return { areaId, productoId, cantidad, siglas: normalizarSiglas(area.nombre) };
}

/** Valida una auditoría completa: un área + una lista de productos con cantidad */
async function validarBatchRegistro(conn, body) {
  const areaId = Number(body?.area_id);
  if (!Number.isInteger(areaId) || areaId <= 0) {
    return { error: 'Selecciona un área válida de la lista' };
  }
  const [[area]] = await conn.execute('SELECT id, nombre FROM areas_auditoria WHERE id = ? LIMIT 1', [areaId]);
  if (!area) return { error: 'El área seleccionada no existe' };

  // Formato nuevo: productos: [{producto_id, cantidad}, ...]
  // Formato legado (una sola fila): producto_id + cantidad
  let items;
  if (Array.isArray(body?.productos)) {
    items = body.productos;
  } else if (body?.producto_id) {
    items = [{ producto_id: body.producto_id, cantidad: body.cantidad }];
  } else {
    return { error: 'Agrega al menos un producto a la auditoría' };
  }

  if (!items.length) return { error: 'Agrega al menos un producto a la auditoría' };
  if (items.length > 50) return { error: 'Máximo 50 productos por auditoría' };

  const validados = [];
  const vistos = new Set();
  for (const it of items) {
    const productoId = Number(it?.producto_id);
    const cantidad = Number(it?.cantidad);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return { error: 'Selecciona un producto válido de la lista' };
    }
    const [[prod]] = await conn.execute('SELECT id FROM productos_auditoria WHERE id = ? LIMIT 1', [productoId]);
    if (!prod) return { error: 'Uno de los productos seleccionados no existe' };

    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 1000000) {
      return { error: 'Las cantidades deben ser números enteros mayores a 0' };
    }

    if (vistos.has(productoId)) {
      return { error: 'No puedes repetir el mismo producto dos veces en la misma auditoría' };
    }
    vistos.add(productoId);
    validados.push({ productoId, cantidad });
  }

  return { areaId, siglas: normalizarSiglas(area.nombre), items: validados };
}

exports.crearRegistro = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const batch = await validarBatchRegistro(conn, req.body);
    if (batch.error) return res.status(400).json({ error: batch.error });

    // Un solo código para toda la auditoría; todas las filas lo comparten.
    // Se bloquea la fila del área (SELECT ... FOR UPDATE) para serializar la
    // generación de correlativos y evitar que dos auditorías simultáneas de la
    // misma área tomen el mismo código.
    await conn.beginTransaction();
    const [[areaLock]] = await conn.execute(
      'SELECT id FROM areas_auditoria WHERE id = ? FOR UPDATE',
      [batch.areaId]
    );
    if (!areaLock) {
      await conn.rollback();
      return res.status(400).json({ error: 'El área seleccionada no existe' });
    }

    const codigo = await codigoSiguiente(conn, batch.siglas, batch.areaId);
    for (const item of batch.items) {
      await conn.execute(
        'INSERT INTO registros_auditoria (codigo, area_id, producto_id, cantidad) VALUES (?, ?, ?, ?)',
        [codigo, batch.areaId, item.productoId, item.cantidad]
      );
    }
    await conn.commit();

    const [rows] = await conn.execute(
      `SELECT r.*, a.nombre AS area_nombre, p.codigo AS producto_codigo, p.nombre AS producto_nombre
         FROM registros_auditoria r
         JOIN areas_auditoria a ON a.id = r.area_id
         JOIN productos_auditoria p ON p.id = r.producto_id
        WHERE r.codigo = ?
        ORDER BY r.id ASC`, [codigo]);
    res.status(201).json({ codigo, cantidad_registros: rows.length, registros: rows });
  } catch (err) {
    await conn.rollback();
    console.error('auditoria.crearRegistro:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el registro de auditoría' });
  } finally {
    conn.release();
  }
};

exports.actualizarRegistro = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  const conn = await db.getConnection();
  try {
    const [[existe]] = await conn.execute('SELECT id FROM registros_auditoria WHERE id = ? LIMIT 1', [id]);
    if (!existe) return res.status(404).json({ error: 'Registro no encontrado' });

    const datos = await validarRegistro(conn, req.body);
    if (datos.error) return res.status(400).json({ error: datos.error });

    await conn.beginTransaction();
    await conn.execute(
      `UPDATE registros_auditoria
          SET area_id = ?, producto_id = ?, cantidad = ?, fecha_modifica = NOW()
        WHERE id = ?`,
      [datos.areaId, datos.productoId, datos.cantidad, id]
    );
    await conn.commit();

    const [rows] = await conn.execute(
      `SELECT r.*, a.nombre AS area_nombre, p.codigo AS producto_codigo, p.nombre AS producto_nombre
         FROM registros_auditoria r
         JOIN areas_auditoria a ON a.id = r.area_id
         JOIN productos_auditoria p ON p.id = r.producto_id
        WHERE r.id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('auditoria.actualizarRegistro:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el registro' });
  } finally {
    conn.release();
  }
};

exports.eliminarRegistro = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  try {
    const [del] = await db.execute('DELETE FROM registros_auditoria WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ mensaje: 'Registro de auditoría eliminado correctamente' });
  } catch (err) {
    console.error('auditoria.eliminarRegistro:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el registro' });
  }
};