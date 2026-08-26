# 💊 Suministros — Farmacias Peruanas

Sistema escalable de gestión de suministros farmacéuticos. Control de productos, movimientos (entregas/devoluciones), trazabilidad por placa y número de guía, dashboard analítico en tiempo real y gestión de usuarios con autenticación por roles.

---

## 📋 Tabla de contenidos

- [Descripción general](#descripción-general)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Características principales](#características-principales)
- [Instalación y configuración](#instalación-y-configuración)
- [Variables de entorno](#variables-de-entorno)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [API REST](#api-rest)
- [Despliegue en Render](#despliegue-en-render)
- [Notas de desarrollo](#notas-de-desarrollo)

---

## Descripción general

**Suministros** es una aplicación web fullstack diseñada para gestionar el inventario de suministros de farmacias peruanas. Permite registrar movimientos de proveedores (entregas y devoluciones), controlar el stock en tiempo real, generar reportes en Excel y visualizar métricas clave a través de un dashboard analítico.

### Módulos principales

| Módulo | Función |
|--------|---------|
| **Productos** | Catálogo de suministros con código, nombre, proveedor, unidad y estado |
| **Registros** | Historial de movimientos (entrega/devolución) con trazabilidad por placa y guía |
| **Dashboard** | KPIs, gráficos de tendencia, donut, radar, barras y timeline de actividad |
| **Usuarios** | Gestión de usuarios con roles (ADMIN / CONSULTA) y aprobación pendiente |

---

## Stack tecnológico

### Frontend
- **HTML5** + **CSS3** (custom, sin framework CSS pesado)
- **Bootstrap 5.3** (componentes modales, offcanvas, switches)
- **Bootstrap Icons 1.11** (iconografía)
- **JavaScript vanilla** (sin framework, SPA ligera)
- **Chart.js** (gráficos del dashboard: tendencia, donut, barras, radar)
- **ExcelJS** (generación de reportes Excel en el navegador)

### Backend
- **Node.js** (>=18)
- **Express 5** (framework HTTP)
- **MySQL2** (driver con pooling y promesas)
- **bcrypt** (hash de contraseñas)
- **dotenv** (variables de entorno)
- **CORS** (cross-origin)

### Base de datos
- **MySQL 8+** (compatible con Aiven, PlanetScale, Render PostgreSQL con adaptación)
- 3 tablas: `productos`, `registros`, `usuarios`
- Migración automática al iniciar el servidor

### Infraestructura
- **Render** (deploy gratuito, config en `render.yaml`)

---

## Estructura del proyecto

```
suministros-farmacias-peruanas/
├── .env.example          # Plantilla de variables de entorno
├── .gitignore            # Archivos ignorados por git
├── package.json          # Dependencias y scripts
├── render.yaml           # Configuración de deploy en Render
│
├── backend/
│   ├── server.js         # Entry point: Express + migración + rutas
│   ├── config/
│   │   ├── db.js         # Pool de conexiones MySQL (con SSL)
│   │   └── migrate.js    # Auto-migración: columna proveedor
│   ├── controllers/
│   │   ├── auth.controller.js       # Login, registro, usuarios
│   │   ├── productos.controller.js  # CRUD productos + proveedores
│   │   ├── registros.controller.js  # CRUD registros + validación
│   │   └── dashboard.controller.js  # KPIs y gráficos
│   └── routes/
│       ├── auth.routes.js           # /api/auth/*
│       ├── productos.routes.js      # /api/productos/*
│       ├── registros.routes.js      # /api/registros/*
│       └── dashboard.routes.js      # /api/dashboard
│
├── frontend/
│   ├── index.html        # SPA completa (login + 4 módulos)
│   ├── css/
│   │   └── styles.css    # Estilos custom (sin framework)
│   └── js/
│       ├── api.js        # Wrapper fetch() para API REST
│       └── app.js        # Toda la lógica frontend (~1860 líneas)
│
└── database/
    └── script.sql        # Script de creación completo de BD
```

---

## Características principales

### 🔐 Sistema de autenticación
- Login con usuario y contraseña (bcrypt)
- Registro público con aprobación de administrador
- Roles: **ADMIN** (acceso total) y **CONSULTA** (solo lectura)
- Cambio de contraseña desde el perfil
- Sesión persistente en `sessionStorage`
- Animaciones de bienvenida y cierre de sesión

### 📦 Gestión de productos
- CRUD completo con validación server-side
- Código automático (`PRD-0001`, `PRD-0002`, ...)
- Campo **proveedor** obligatorio con autocomplete (datalist)
- Control de duplicados: mismo nombre + mismo proveedor = rechazado
- Estados: activo / inactivo
- Unidades: Unidad, Caja, Etiqueta, Cinta

### 📋 Registro de movimientos
- Tipos: **Entrega** (suma stock) y **Devolución** (resta stock)
- Código único auto-generado con hash FNV-36
- Validación de placa (formato `ABC-123`)
- Número de guía obligatorio (6-30 dígitos)
- Fecha y hora automáticas
- Validación de stock para devoluciones
- Edición de registros existentes
- Vista móvil con tarjetas responsive

### 📊 Dashboard analítico
- **KPIs**: productos activos, movimientos hoy, entregadas, devueltas, stock total, tasa de devolución
- **Tendencia 14 días**: gráfico de área con entregas y devoluciones
- **Donut**: proporción entregas vs devoluciones
- **Top 5 productos**: barras horizontales de los más movidos
- **Radar**: comparativa volumen por producto
- **Stock por producto**: barras animadas con indicadores
- **Últimos movimientos**: timeline de actividad reciente
- Efecto tilt 3D en tarjetas KPI

### 📱 Diseño responsive
- Sidebar fijo en desktop, offcanvas en móvil
- Bottom navigation en móvil
- Tarjetas mobile para registros, productos y usuarios
- Splash screen + loading states (skeleton)
- Accesibilidad: `aria-*`, roles, prefers-reduced-motion

### 📥 Exportación a Excel
- Genera `.xlsx` con formato profesional (colores, bordes, headers)
- Incluye: código, tipo, producto, cantidad, unidad, placa, guía, fecha
- Congelación de header, fuentes alternadas
- Botón con estado de carga y confirmación visual

---

## Instalación y configuración

### Prerrequisitos
- Node.js >= 18
- MySQL 8+ (local o en la nube)
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/suministros-farmacias-peruanas.git
cd suministros-farmacias-peruanas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# 4. Crear la base de datos
# Ejecutar database/script.sql en MySQL Workbench

# 5. Iniciar el servidor
npm start

# O en modo desarrollo (con auto-reload):
npm run dev
```

El servidor arranca en `http://localhost:3000`.

### Auto-migración

Al iniciar el servidor, se ejecuta automáticamente una verificación de la columna `proveedor` en la tabla `productos`. Si no existe (por actualizaciones de esquema anteriores), se crea sin intervención manual.

---

## Variables de entorno

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `PORT` | No | Puerto del servidor (default: 3000) | `3000` |
| `NODE_ENV` | No | Entorno (`development` / `production`) | `development` |
| `DB_HOST` | **Sí** | Host de MySQL | `localhost` |
| `DB_PORT` | No | Puerto de MySQL (default: 3306) | `3306` |
| `DB_USER` | **Sí** | Usuario de MySQL | `root` |
| `DB_PASSWORD` | No | Contraseña de MySQL | `secret` |
| `DB_NAME` | **Sí** | Nombre de la base de datos | `suministros_farmacia` |
| `DB_SSL` | No | Habilitar SSL (`true` / `false`) | `true` |
| `DB_CA_CERT` | No | Contenido del certificado CA (para servicios en la nube) | `-----BEGIN...` |
| `DB_CA_PATH` | No | Ruta al archivo del certificado CA | `backend/certs/ca.pem` |

> ⚠️ Nunca subir el archivo `.env` a repositorios públicos. Está excluido en `.gitignore`.

---

## Esquema de base de datos

### Tabla: `productos`

```sql
CREATE TABLE productos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(20)  NULL UNIQUE,       -- PRD-0001
  nombre         VARCHAR(120) NOT NULL,
  proveedor      VARCHAR(120) NULL,               -- Autocomplete
  unidad         VARCHAR(30)  NOT NULL DEFAULT 'Unidad',
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: `registros`

```sql
CREATE TABLE registros (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(32) NULL UNIQUE,            -- Hash FNV-36
  tipo        ENUM('ENTREGA','DEVOLUCION') NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad    INT UNSIGNED NOT NULL,
  placa       VARCHAR(8)   NOT NULL,              -- ABC-123
  numero_guia VARCHAR(30)  NOT NULL DEFAULT '',
  fecha_hora  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);
```

### Tabla: `usuarios`

```sql
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario        VARCHAR(50)  NOT NULL UNIQUE,
  contrasena     VARCHAR(255) NOT NULL,            -- bcrypt hash
  nombre_completo VARCHAR(120) NOT NULL,
  rol            ENUM('ADMIN','CONSULTA') NOT NULL DEFAULT 'CONSULTA',
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso  DATETIME     NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## API REST

Base URL: `/api`

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Iniciar sesión | No |
| `POST` | `/auth/register` | Crear cuenta (pendiente de activación) | No |
| `GET` | `/auth/usuarios` | Listar todos los usuarios | Admin |
| `POST` | `/auth/usuarios` | Crear usuario | Admin |
| `PUT` | `/auth/usuarios/:id/contrasena` | Cambiar contraseña | Sí |
| `PUT` | `/auth/usuarios/:id/activar` | Activar usuario + asignar rol | Admin |
| `PUT` | `/auth/usuarios/:id/estado` | Activar/desactivar usuario | Admin |
| `DELETE` | `/auth/usuarios/:id` | Eliminar usuario | Admin |

### Productos (`/api/productos`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/productos` | Listar productos (con stock calculado) |
| `GET` | `/productos/proveedores` | Obtener lista única de proveedores (autocomplete) |
| `POST` | `/productos` | Crear producto (valida duplicados) |
| `PUT` | `/productos/:id` | Actualizar producto |
| `DELETE` | `/productos/:id` | Eliminar producto (cascada con registros) |

**Body POST/PUT productos:**
```json
{
  "nombre": "Pallets de Corcho",
  "proveedor": "PACSE",
  "unidad": "Unidad",
  "activo": true
}
```

### Registros (`/api/registros`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/registros` | Listar registros (últimos 500) |
| `POST` | `/registros` | Crear registro (entrega/devolución) |
| `PUT` | `/registros/:id` | Actualizar registro |
| `DELETE` | `/registros/:id` | Eliminar registro |

**Body POST/PUT registros:**
```json
{
  "tipo": "ENTREGA",
  "producto_id": 1,
  "cantidad": 50,
  "placa": "ABC-123",
  "numero_guia": "119922884456"
}
```

### Dashboard (`/api/dashboard`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/dashboard` | Resumen completo (KPIs, stock, tendencia, top, radar, actividad) |

### Health Check

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Verificar estado del servicio |

---

## Despliegue en Render

El proyecto incluye un `render.yaml` preconfigurado para deploy gratuito en Render:

1. Conectar el repositorio a Render
2. Configurar las variables de entorno en el dashboard de Render
3. Render ejecuta automáticamente `npm install` y `npm start`
4. Health check en `/api/health`

### Variables de entorno para Render (con Aiven MySQL)

```
DB_HOST=tu-host.aivencloud.com
DB_PORT=17137
DB_USER=default
DB_PASSWORD=tu_password
DB_NAME=suministros_farmacia
DB_SSL=true
DB_CA_CERT=-----BEGIN CERTIFICATE-----\nMIIE...\n-----END CERTIFICATE-----
```

> 💡 En Render, el certificado CA se pega como texto en `DB_CA_CERT` (no como archivo).

---

## Notas de desarrollo

### Funciones clave del frontend

- **`fnvBase36(str)`**: Genera hash FNV-36 para códigos únicos de registros (replicado en backend)
- **`validarPlaca(v)`**: Valida formato `ABC-123` de placas vehiculares
- **`countUp(el, target)`**: Animación de conteo ascendente para KPIs
- **`esc(str)`**: Escapado de HTML para prevenir XSS
- **`fmtFecha(dt)`**: Formato de fecha legible en español

### Seguridad implementada

- Contraseñas hasheadas con bcrypt (10 rounds)
- Validación server-side en todos los endpoints
- Control de duplicados (productos y usuarios)
- Protección contra eliminación del último administrador
- Validación de stock para devoluciones
- Input sanitization en frontend y backend
- CORS configurado
- Variables sensibles en `.env` (excluido de git)

### Arquitectura

- **Backend**: Arquitectura MVC ligera (controllers + routes, sin model layer — queries inline)
- **Frontend**: SPA vanilla sin framework, estado centralizado en objeto `state`
- **BD**: MySQL con foreign keys, índices y constraints
- **Migraciones**: Auto-detección al iniciar el servidor (sin herramienta externa)
