require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const requeridas = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const faltantes = requeridas.filter(k => !process.env[k]);
if (faltantes.length) {
  throw new Error(
    `Faltan variables de entorno: ${faltantes.join(', ')}. ` +
    'Copia .env.example como .env y completa tus credenciales.'
  );
}

let ssl;
if (String(process.env.DB_SSL).toLowerCase() === 'true') {
  const caContenido = process.env.DB_CA_CERT;
  const caArchivo = process.env.DB_CA_PATH || path.join(__dirname, 'certs', 'ca.pem');
  if (caContenido) {
    ssl = { ca: caContenido.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  } else if (fs.existsSync(caArchivo)) {
    ssl = { ca: fs.readFileSync(caArchivo), rejectUnauthorized: true };
  } else {
    ssl = { rejectUnauthorized: false };
    console.warn('[db] SSL activo sin certificado CA. Configura DB_CA_CERT (contenido del ca.pem) o coloca backend/certs/ca.pem para verificación completa.');
  }
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
  namedPlaceholders: false,
  ssl,
  connectTimeout: 15000
});

module.exports = pool;
