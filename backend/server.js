require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'suministros-api' }));

app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/registros', require('./routes/registros.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
