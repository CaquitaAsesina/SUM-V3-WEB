const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const usuario = String(req.body?.usuario ?? '').trim();

  if (!usuario) {
    return res.status(400).json({ error: 'El usuario es obligatorio' });
  }

  try {
    const [[user]] = await db.execute(
      'SELECT * FROM usuarios WHERE usuario = ? AND activo = 1 LIMIT 1',
      [usuario]
    );

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Update last access
    await db.execute('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);

    // Return user info (without password)
    const { contrasena: _, ...userInfo } = user;

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: userInfo
    });
  } catch (err) {
    console.error('auth.login:', err.message);
    res.status(500).json({ error: 'Error al autenticar' });
  }
};

exports.listarUsuarios = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, usuario, nombre_completo, rol, activo, ultimo_acceso, creado_en
       FROM usuarios ORDER BY creado_en DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('auth.listarUsuarios:', err.message);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

exports.crearUsuario = async (req, res) => {
  const usuario = String(req.body?.usuario ?? '').trim();
  const contrasena = String(req.body?.contrasena ?? '');
  const nombreCompleto = String(req.body?.nombreCompleto ?? '').trim();
  const rol = String(req.body?.rol ?? 'CONSULTA').toUpperCase();

  if (!usuario || !contrasena || !nombreCompleto) {
    return res.status(400).json({ error: 'Usuario, contraseña y nombre son obligatorios' });
  }

  if (!['ADMIN', 'CONSULTA'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido. Use ADMIN o CONSULTA' });
  }

  if (contrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const [[existing]] = await db.execute(
      'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
      [usuario]
    );

    if (existing) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const [result] = await db.execute(
      'INSERT INTO usuarios (usuario, contrasena, nombre_completo, rol) VALUES (?, ?, ?, ?)',
      [usuario, hashedPassword, nombreCompleto, rol]
    );

    const [[nuevo]] = await db.execute(
      'SELECT id, usuario, nombre_completo, rol, activo, creado_en FROM usuarios WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ mensaje: 'Usuario creado correctamente', usuario: nuevo });
  } catch (err) {
    console.error('auth.crearUsuario:', err.message);
    res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
};

exports.eliminarUsuario = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  try {
    const [[user]] = await db.execute('SELECT id, rol FROM usuarios WHERE id = ? LIMIT 1', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.rol === 'ADMIN') {
      const [[adminCount]] = await db.execute('SELECT COUNT(*) AS n FROM usuarios WHERE rol = "ADMIN" AND activo = 1');
      if (adminCount.n <= 1) {
        return res.status(400).json({ error: 'No se puede eliminar el único administrador del sistema' });
      }
    }

    await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('auth.eliminarUsuario:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar el usuario' });
  }
};

exports.cambiarEstado = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });

  const activo = req.body?.activo === true ? 1 : 0;

  try {
    const [[user]] = await db.execute('SELECT id, rol FROM usuarios WHERE id = ? LIMIT 1', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.rol === 'ADMIN' && activo === 0) {
      const [[adminCount]] = await db.execute('SELECT COUNT(*) AS n FROM usuarios WHERE rol = "ADMIN" AND activo = 1');
      if (adminCount.n <= 1) {
        return res.status(400).json({ error: 'No se puede desactivar el único administrador del sistema' });
      }
    }

    await db.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
    res.json({ mensaje: activo ? 'Usuario activado' : 'Usuario desactivado' });
  } catch (err) {
    console.error('auth.cambiarEstado:', err.message);
    res.status(500).json({ error: 'No se pudo cambiar el estado del usuario' });
  }
};
