-- ============================================================
--  SUMINISTROS FARMACIAS PERUANAS
--  Script de creacion de base de datos (MySQL 8+ / Workbench)
--  Ejecutar completo en MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS suministros_farmacia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE suministros_farmacia;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS registros;
DROP TABLE IF EXISTS productos;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- TABLA: productos
-- Catalogo maestro de productos (submodulo Productos)
-- ------------------------------------------------------------
CREATE TABLE productos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(20)  NULL UNIQUE,
  nombre         VARCHAR(120) NOT NULL,
  descripcion    VARCHAR(255) NULL,
  unidad         VARCHAR(30)  NOT NULL DEFAULT 'Unidad',
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_prod_nombre (nombre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: registros
-- Movimientos de proveedores: ENTREGA suma / DEVOLUCION resta
-- El codigo unico se genera automaticamente (REG-FECHA-XXXXX)
-- La fecha y hora se registran automaticamente
-- ------------------------------------------------------------
CREATE TABLE registros (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(32) NULL UNIQUE,
  tipo        ENUM('ENTREGA','DEVOLUCION') NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad    INT UNSIGNED NOT NULL,
  placa       VARCHAR(8)   NOT NULL,
  numero_guia VARCHAR(30)  NOT NULL DEFAULT '',
  fecha_hora  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registro_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_cantidad CHECK (cantidad > 0),
  INDEX idx_reg_tipo (tipo),
  INDEX idx_reg_producto (producto_id),
  INDEX idx_reg_fecha (fecha_hora)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Datos de ejemplo
-- ------------------------------------------------------------
INSERT INTO productos (codigo, nombre, descripcion, unidad) VALUES
('PRD-0001', 'Paracetamol 500 mg',   'Tabletas analgésicas · caja x 100', 'Caja'),
('PRD-0002', 'Amoxicilina 500 mg',   'Cápsulas antibióticas · caja x 50', 'Caja'),
('PRD-0003', 'Ibuprofeno 400 mg',    'Tabletas antiinflamatorias',        'Frasco'),
('PRD-0004', 'Suero fisiológico 1L', 'Solución salina intravenosa',       'Bolsa'),
('PRD-0005', 'Alcohol etílico 96°',  'Antiséptico de uso externo',        'Galón');

-- ------------------------------------------------------------
-- Consulta util: stock por producto
-- (entregas suman, devoluciones restan)
-- ------------------------------------------------------------
-- SELECT p.codigo, p.nombre,
--        COALESCE(SUM(IF(r.tipo='ENTREGA', r.cantidad, -r.cantidad)), 0) AS stock
-- FROM productos p LEFT JOIN registros r ON r.producto_id = p.id
-- GROUP BY p.id ORDER BY p.nombre;
