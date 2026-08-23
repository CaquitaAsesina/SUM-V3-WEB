require('dotenv').config();
const mysql = require('mysql2/promise');

const requeridas = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const faltantes = requeridas.filter(k => !process.env[k]);
if (faltantes.length) {
  throw new Error(
    `Faltan variables de entorno: ${faltantes.join(', ')}. ` +
    'Copia .env.example como .env y completa tus credenciales.'
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  namedPlaceholders: false
});

module.exports = pool;
