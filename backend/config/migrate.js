/**
 * Auto-migration: Verifica y agrega columna 'proveedor' si no existe.
 * Se ejecuta al iniciar el servidor.
 */
const db = require('./db');

async function migrarProveedor() {
  const conn = await db.getConnection();
  try {
    // Verificar si la columna proveedor existe
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'productos' 
        AND COLUMN_NAME = 'proveedor'
    `);

    if (cols.length === 0) {
      console.log('[migración] Agregando columna proveedor a productos...');
      
      // Verificar si existe la columna descripcion
      const [descCols] = await conn.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'productos' 
          AND COLUMN_NAME = 'descripcion'
      `);

      if (descCols.length > 0) {
        // Migrar de descripcion a proveedor
        await conn.query(`ALTER TABLE productos ADD COLUMN proveedor VARCHAR(120) NULL AFTER nombre`);
        await conn.query(`UPDATE productos SET proveedor = descripcion WHERE descripcion IS NOT NULL`);
        await conn.query(`ALTER TABLE productos DROP COLUMN descripcion`);
        console.log('[migración] Columna descripcion migrada a proveedor correctamente');
      } else {
        // Solo agregar la columna proveedor
        await conn.query(`ALTER TABLE productos ADD COLUMN proveedor VARCHAR(120) NULL AFTER nombre`);
        console.log('[migración] Columna proveedor agregada correctamente');
      }
    } else {
      console.log('[migración] Columna proveedor ya existe');
    }
  } catch (err) {
    console.error('[migración] Error:', err.message);
  } finally {
    conn.release();
  }
}

module.exports = migrarProveedor;
