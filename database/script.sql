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
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS registros_auditoria;
DROP TABLE IF EXISTS productos_auditoria;
DROP TABLE IF EXISTS areas_auditoria;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- TABLA: productos
-- Catalogo maestro de productos (submodulo Productos)
-- ------------------------------------------------------------
CREATE TABLE productos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(20)  NULL UNIQUE,
  nombre         VARCHAR(120) NOT NULL,
  observaciones  VARCHAR(250) NULL,
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
  proveedor   VARCHAR(120) NULL,
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
-- TABLA: areas_auditoria
-- Submodulo Areas del modulo Auditoria (solo nombre)
-- ------------------------------------------------------------
CREATE TABLE areas_auditoria (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_aud_area_nombre (nombre),
  INDEX idx_aud_area_nombre (nombre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: productos_auditoria
-- Submodulo Productos del modulo Auditoria (codigo y nombre)
-- ------------------------------------------------------------
CREATE TABLE productos_auditoria (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(20)  NOT NULL UNIQUE,
  nombre         VARCHAR(120) NOT NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_aud_prod_nombre (nombre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: registros_auditoria
-- Registros del modulo Auditoria.
-- El codigo se genera automaticamente: AU-<3 letras del area>-<fecha y hora>
-- fecha_modifica se llena automaticamente al editar (solo admin).
-- ------------------------------------------------------------
CREATE TABLE registros_auditoria (
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
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: usuarios
-- Usuarios del sistema con roles de acceso
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario        VARCHAR(50)  NOT NULL UNIQUE,
  contrasena     VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(120) NOT NULL,
  rol            ENUM('ADMIN','CONSULTA') NOT NULL DEFAULT 'CONSULTA',
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso  DATETIME     NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usu_usuario (usuario),
  INDEX idx_usu_rol (rol)
) ENGINE=InnoDB;


