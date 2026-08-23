const db = require('../config/db');

const PLACA_RE = /^[A-Z]{3}[0-9]{3}$/;

function fnvBase36(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
}

function normalizarPlaca(raw) {
  const limpia = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return PLACA_RE.test(limpia) ? `${limpia.slice(0, 3)}-${limpia.slice(3)}` : null;
}

exports.listar = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.codigo, r.tipo, r.producto_id, r.cantidad, r.placa,
             r.numero_guia, r.fecha_hora,
             p.nombre AS producto_nombre, p.codigo AS producto_codigo, p.unidad
        FROM registros r
        JOIN productos p ON p.id = r.producto_id
       ORDER BY r.fecha_hora DESC, r.id DESC
       LIMIT 500`);
    res.json(rows);
  } catch (err) {
    console.error('registros.listar:', err.message);
    res.status(500).json({ error: 'Error al obtener los registros' });
  }
};

async function validarDatos(conn, body) {
  const tipo = body?.tipo;
  if (!['ENTREGA', 'DEVOLUCION'].includes(tipo)) {
    return { error: 'El tipo de movimiento debe ser Entrega o Devolución' };
  }

  const productoId = Number(body?.producto_id);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    return { error: 'Selecciona un producto válido de la lista' };
  }
  const [[prod]] = await conn.execute('SELECT id FROM productos WHERE id = ? LIMIT 1', [productoId]);
  if (!prod) {
    return { error: 'El producto seleccionado no existe' };
  }

  const cantidad = Number(body?.cantidad);
  if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 1000000) {
    return { error: 'La cantidad debe ser un número entero mayor a 0' };
  }

  const placa = normalizarPlaca(body?.placa);
  if (!placa) {
    return { error: 'Formato de placa inválido. Usa el formato ABC-123' };
  }

  const numeroGuia = String(body?.numero_guia ?? '').replace(/[\s.-]/g, '');
  if (!/^\d{6,30}$/.test(numeroGuia)) {
    return { error: 'El número de guía es obligatorio: solo dígitos, entre 6 y 30' };
  }

  return { tipo, productoId, cantidad, placa, numeroGuia };
}

exports.crear = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const datos = await validarDatos(conn, req.body);
    if (datos.error) return res.status(400).json({ error: datos.error });

    await conn.beginTransaction();
    const [ins] = await conn.execute(
      `INSERT INTO registros (tipo, producto_id, cantidad, placa, numero_guia)
       VALUES (?, ?, ?, ?, ?)`,
      [datos.tipo, datos.productoId, datos.cantidad, datos.placa, datos.numeroGuia]
    );

    const placaLimpia = datos.placa.replace('-', '');
    const base = `${placaLimpia}|${datos.productoId}|${datos.cantidad}`;
    let codigo = null;
    for (let intento = 0; intento < 50 && !codigo; intento++) {
      const candidato = `${placaLimpia}-${fnvBase36(`${base}#${intento}`)}`;
      const [[dup]] = await conn.execute('SELECT id FROM registros WHERE codigo = ? LIMIT 1', [candidato]);
      if (!dup) codigo = candidato;
    }
    await conn.execute('UPDATE registros SET codigo = ? WHERE id = ?', [codigo, ins.insertId]);
    await conn.commit();

    const [rows] = await conn.execute(
      `SELECT r.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo, p.unidad
         FROM registros r JOIN productos p ON p.id = r.producto_id
        WHERE r.id = ?`, [ins.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('registros.crear:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el registro' });
  } finally {
    conn.release();
  }
};

exports.actualizar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  const conn = await db.getConnection();
  try {
    const [[existe]] = await conn.execute('SELECT id FROM registros WHERE id = ? LIMIT 1', [id]);
    if (!existe) return res.status(404).json({ error: 'Registro no encontrado' });

    const datos = await validarDatos(conn, req.body);
    if (datos.error) return res.status(400).json({ error: datos.error });

    await conn.beginTransaction();
    await conn.execute(
      `UPDATE registros
          SET tipo = ?, producto_id = ?, cantidad = ?, placa = ?, numero_guia = ?
        WHERE id = ?`,
      [datos.tipo, datos.productoId, datos.cantidad, datos.placa, datos.numeroGuia, id]
    );
    await conn.commit();

    const [rows] = await conn.execute(
      `SELECT r.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo, p.unidad
         FROM registros r JOIN productos p ON p.id = r.producto_id
        WHERE r.id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('registros.actualizar:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el registro' });
  } finally {
    conn.release();
  }
};

exports.eliminar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  try {
    const [del] = await db.execute('DELETE FROM registros WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ mensaje: 'Registro eliminado correctamente' });
  } catch (err) {
    console.error('registros.eliminar:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el registro' });
  }
};
