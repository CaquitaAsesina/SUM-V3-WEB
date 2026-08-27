/**
 * Auto-migration: Verifica y agrega columna 'observaciones' si no existe.
 * Migra de 'proveedor' a 'observaciones' si es necesario.
 * Se ejecuta al iniciar el servidor.
 */
const db = require('./db');

async function migrarObservaciones() {
  const conn = await db.getConnection();
  try {
    // Verificar si la columna observaciones existe
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'productos'
        AND COLUMN_NAME = 'observaciones'
    `);

    if (cols.length === 0) {
      console.log('[migración] Agregando columna observaciones a productos...');
      
      // Verificar si existe la columna proveedor
      const [provCols] = await conn.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'productos'
          AND COLUMN_NAME = 'proveedor'
      `);

      if (provCols.length > 0) {
        // Migrar de proveedor a observaciones
        await conn.query(`ALTER TABLE productos ADD COLUMN observaciones VARCHAR(250) NULL AFTER nombre`);
        await conn.query(`UPDATE productos SET observaciones = proveedor WHERE proveedor IS NOT NULL`);
        await conn.query(`ALTER TABLE productos DROP COLUMN proveedor`);
        console.log('[migración] Columna proveedor migrada a observaciones correctamente');
      } else {
        // Solo agregar la columna observaciones
        await conn.query(`ALTER TABLE productos ADD COLUMN observaciones VARCHAR(250) NULL AFTER nombre`);
        console.log('[migración] Columna observaciones agregada correctamente');
      }
    } else {
      console.log('[migración] Columna observaciones ya existe');
    }

    // Verificar si la columna proveedor existe en registros
    const [regCols] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'registros'
        AND COLUMN_NAME = 'proveedor'
    `);

    if (regCols.length === 0) {
      console.log('[migración] Agregando columna proveedor a registros...');
      await conn.query(`ALTER TABLE registros ADD COLUMN proveedor VARCHAR(120) NULL AFTER numero_guia`);
      console.log('[migración] Columna proveedor agregada a registros correctamente');
    } else {
      console.log('[migración] Columna proveedor ya existe en registros');
    }
  } catch (err) {
    console.error('[migración] Error:', err.message);
  } finally {
    conn.release();
  }
}

module.exports = migrarObservaciones;
