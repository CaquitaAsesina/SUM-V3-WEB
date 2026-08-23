require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../backend/config/db');

async function seedAdmin() {
  const usuario = 'FP76270486';
  const contrasena = 'saltamonteXD2003*';
  const nombreCompleto = 'Administrador';

  try {
    // Check if admin already exists
    const [[existing]] = await db.execute(
      'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
      [usuario]
    );

    if (existing) {
      console.log(`El usuario ${usuario} ya existe en la base de datos.`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insert admin user
    const [result] = await db.execute(
      'INSERT INTO usuarios (usuario, contrasena, nombre_completo, rol) VALUES (?, ?, ?, ?)',
      [usuario, hashedPassword, nombreCompleto, 'ADMIN']
    );

    console.log(`✅ Usuario administrador creado exitosamente:`);
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Nombre: ${nombreCompleto}`);
    console.log(`   Rol: ADMIN (único administrador)`);
  } catch (err) {
    console.error('❌ Error al crear usuario administrador:', err.message);
  } finally {
    await db.end();
    process.exit(0);
  }
}

seedAdmin();
