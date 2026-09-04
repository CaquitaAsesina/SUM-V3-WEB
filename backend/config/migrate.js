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

/**
 * Auto-migration: crea las tablas del modulo Auditoria si no existen.
 * Se ejecuta al iniciar el servidor, despues de migrarObservaciones.
 */
async function migrarAuditoria() {
  const conn = await db.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS areas_auditoria (
      id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre         VARCHAR(120) NOT NULL,
      creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_aud_area_nombre (nombre),
      INDEX idx_aud_area_nombre (nombre)
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS productos_auditoria (
      id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      codigo         VARCHAR(20)  NOT NULL UNIQUE,
      nombre         VARCHAR(120) NOT NULL,
      creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_aud_prod_nombre (nombre)
    ) ENGINE=InnoDB`);

    await conn.query(`CREATE TABLE IF NOT EXISTS registros_auditoria (
      id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      codigo         VARCHAR(40)  NULL UNIQUE,
      area_id        INT UNSIGNED NOT NULL,
      producto_id    INT UNSIGNED NOT NULL,
      cantidad       INT UNSIGNED NOT NULL,
      fecha          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_modifica DATETIME     NULL,
      CONSTRAINT fk_aud_reg_area
        FOREIGN KEY (area_id) REFERENCES areas_auditoria(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_aud_reg_producto
        FOREIGN KEY (producto_id) REFERENCES productos_auditoria(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT chk_aud_cantidad CHECK (cantidad > 0),
      INDEX idx_aud_reg_area (area_id),
      INDEX idx_aud_reg_producto (producto_id),
      INDEX idx_aud_reg_fecha (fecha)
    ) ENGINE=InnoDB`);

    console.log('[migración] Tablas del módulo Auditoría verificadas');
  } catch (err) {
    console.error('[migración] Error en tablas Auditoría:', err.message);
  } finally {
    conn.release();
  }
}

module.exports = migrarObservaciones;
module.exports.migrarAuditoria = migrarAuditoria;
