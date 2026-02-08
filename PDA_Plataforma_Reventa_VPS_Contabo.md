# Plan de Desarrollo de Aplicación (PDA)
## Plataforma de Reventa de VPS - Integración con Contabo API
##CLoud Vertice

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** Equipo de Desarrollo

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Análisis del Modelo de Negocio](#2-análisis-del-modelo-de-negocio)
3. [Requisitos del Sistema](#3-requisitos-del-sistema)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Módulos del Sistema](#6-módulos-del-sistema)
7. [Integración con Contabo API](#7-integración-con-contabo-api)
8. [Stack Tecnológico](#8-stack-tecnológico)
9. [Fases de Desarrollo](#9-fases-de-desarrollo)
10. [Cronograma Estimado](#10-cronograma-estimado)
11. [Seguridad](#11-seguridad)
12. [Consideraciones Adicionales](#12-consideraciones-adicionales)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Proyecto

Desarrollo de una plataforma web completa para la reventa de servicios VPS de Contabo, que permita a los clientes finales tener máquinas virtuales a precios personalizados mientras el administrador gestiona la provisión manual de maquinas y el  cliente final gestiona la maquina asignada través de la API de Contabo.

### 1.2 Objetivos Principales

- **Para el Cliente Final:**
  - Catálogo de productos VPS con precios personalizados
  - Proceso de compra simplificado
  - Panel de control para administrar sus VPS (start, stop, restart, snapshots)
  - Gestión de credenciales y accesos

- **Para el Administrador/Revendedor:**
  - Panel administrativo para gestionar órdenes
  - Provisión manual de VPS en Contabo
  - Asignación de instancias a clientes
  - Control de márgenes y precios
  - Reportes de ventas y estado de servicios

### 1.3 Flujo de Negocio

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE OPERACIÓN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENTE                    ADMINISTRADOR                 CONTABO           │
│     │                            │                           │              │
│     │ 1. Selecciona VPS          │                           │              │
│     │    y realiza pago          │                           │              │
│     │─────────────────────────▶  │                           │              │
│     │                            │ 2. Recibe notificación    │              │
│     │                            │    de nueva orden         │              │
│     │                            │─────────────────────────▶ │              │
│     │                            │ 3. Compra VPS en Contabo  │              │
│     │                            │    via Panel/API          │              │
│     │                            │◀───────────────────────── │              │
│     │                            │ 4. Obtiene credenciales   │              │
│     │                            │    e instanceId y asigna a cliente│      │
│     │ 5. Recibe acceso           │                           │              │
│     │    a su VPS                │                           │              │
│     │◀───────────────────────────│                           │              │
│     │                            │                           │              │
│     │ 6. Administra VPS          │                           │              │
│     │    desde panel cliente     │─────────────────────────▶ │              │
│     │    (via API Contabo)       │    API calls proxied      │              │
│     │                            │◀───────────────────────── │              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Análisis del Modelo de Negocio

### 2.1 Actores del Sistema

| Actor | Descripción | Permisos |
|-------|-------------|----------|
| **Visitante** | Usuario no registrado | Ver catálogo, registrarse |
| **Cliente** | Usuario registrado con compras | Comprar VPS, administrar sus instancias |
| **Administrador** | Operador de la plataforma | Gestión total, provisión de VPS |
| **Sistema** | Procesos automatizados | Notificaciones, facturación |

### 2.2 Modelo de Precios

```
┌────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DE PRECIOS                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Precio Contabo (costo)    +    Margen Revendedor          │
│          │                            │                    │
│          ▼                            ▼                    │
│    ┌──────────┐                ┌──────────────┐            │
│    │  $5.99   │       +        │  30% - 50%   │  = Precio  │
│    │  /mes    │                │   margen     │    Final   │
│    └──────────┘                └──────────────┘            │
│                                                            │
│  Configuración flexible por producto y por período         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 2.3 Productos a Ofrecer (Basado en API Contabo)

| ProductId | Producto | RAM | CPU | Disco | Precio Sugerido Reventa |
|-----------|----------|-----|-----|-------|------------------------|
| V91 | VPS 10 NVMe | 4 GB | 2 | 75 GB NVMe | Configurable |
| V92 | VPS 10 SSD | 4 GB | 2 | 150 GB SSD | Configurable |
| V94 | VPS 20 NVMe | 8 GB | 4 | 100 GB NVMe | Configurable |
| V95 | VPS 20 SSD | 8 GB | 4 | 200 GB SSD | Configurable |
| V97 | VPS 30 NVMe | 16 GB | 6 | 200 GB NVMe | Configurable |
| V98 | VPS 30 SSD | 16 GB | 6 | 400 GB SSD | Configurable |
| V8 | VDS S | 24 GB | 4 | 180 GB NVMe | Configurable |
| V9 | VDS M | 48 GB | 8 | 240 GB NVMe | Configurable |

---

## 3. Requisitos del Sistema

### 3.1 Requisitos Funcionales

#### RF-001: Gestión de Usuarios
- RF-001.1: Registro de clientes con verificación de email
- RF-001.2: Login/Logout con autenticación segura
- RF-001.3: Recuperación de contraseña
- RF-001.4: Perfil de usuario editable
- RF-001.5: Historial de compras y facturas

#### RF-002: Catálogo de Productos
- RF-002.1: Listado de planes VPS disponibles
- RF-002.2: Filtros por características (RAM, CPU, Disco, Región)
- RF-002.3: Comparador de planes
- RF-002.4: Detalles de cada producto con especificaciones

#### RF-003: Proceso de Compra
- RF-003.1: Carrito de compras
- RF-003.2: Selección de período de contrato (1, 6, 12 meses)
- RF-003.3: Selección de sistema operativo
- RF-003.4: Configuración de SSH keys (opcional)
- RF-003.5: Integración con pasarela de pagos
- RF-003.6: Generación de orden de compra
- RF-003.7: Notificación al administrador

#### RF-004: Panel de Cliente
- RF-004.1: Dashboard con resumen de servicios
- RF-004.2: Lista de VPS contratados
- RF-004.3: Acciones sobre VPS:
  - Start/Stop/Restart/Shutdown
  - Ver consola VNC
  - Reset de contraseña
  - Modo rescate
- RF-004.4: Gestión de Snapshots
- RF-004.5: Información de red (IP, Gateway)
- RF-004.6: Estadísticas de uso
- RF-004.7: Tickets de soporte

#### RF-005: Panel de Administrador
- RF-005.1: Dashboard con métricas generales
- RF-005.2: Gestión de órdenes pendientes
- RF-005.3: Asignación de instancias Contabo a clientes
- RF-005.4: Gestión de productos y precios
- RF-005.5: Gestión de clientes
- RF-005.6: Reportes de ventas
- RF-005.7: Configuración del sistema
- RF-005.8: Gestión de imágenes/OS disponibles

#### RF-006: Facturación
- RF-006.1: Generación automática de facturas
- RF-006.2: Recordatorios de renovación
- RF-006.3: Historial de transacciones
- RF-006.4: Exportación de facturas (PDF)

### 3.2 Requisitos No Funcionales

| ID | Categoría | Requisito |
|----|-----------|-----------|
| RNF-001 | Rendimiento | Tiempo de respuesta < 2 segundos |
| RNF-002 | Disponibilidad | Uptime del 99.5% |
| RNF-003 | Seguridad | Encriptación SSL/TLS en todas las comunicaciones |
| RNF-004 | Seguridad | Almacenamiento seguro de credenciales (hashing) |
| RNF-005 | Escalabilidad | Soporte para 1000+ clientes concurrentes |
| RNF-006 | Usabilidad | Interfaz responsive (móvil/tablet/desktop) |
| RNF-007 | Compatibilidad | Soporte para navegadores modernos |
| RNF-008 | Mantenibilidad | Código documentado y modular |

---

## 4. Arquitectura del Sistema

### 4.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARQUITECTURA DEL SISTEMA                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌──────────────┐                               │
│                              │   CLIENTES   │                               │
│                              │  (Browser)   │                               │
│                              └──────┬───────┘                               │
│                                     │                                       │
│                                     ▼                                       │
│                         ┌───────────────────────┐                           │
│                         │    CDN / WAF          │                           │
│                         │   (Cloudflare)        │                           │
│                         └───────────┬───────────┘                           │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         LOAD BALANCER (Nginx)                        │   │
│  └────────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                         │
│            ┌──────────────────────┼──────────────────────┐                  │
│            │                      │                      │                  │
│            ▼                      ▼                      ▼                  │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│   │   FRONTEND      │   │   FRONTEND      │   │   FRONTEND      │          │
│   │   (React/Vue)   │   │   (React/Vue)   │   │   (React/Vue)   │          │
│   │   Instancia 1   │   │   Instancia 2   │   │   Instancia N   │          │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘          │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        API GATEWAY                                  │   │
│   │                    (Rate Limiting, Auth)                            │   │
│   └───────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                         │
│            ┌──────────────────────┼──────────────────────┐                  │
│            │                      │                      │                  │
│            ▼                      ▼                      ▼                  │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│   │   BACKEND       │   │   BACKEND       │   │   BACKEND       │          │
│   │   (Node/Django) │   │   (Node/Django) │   │   (Node/Django) │          │
│   │   Instancia 1   │   │   Instancia 2   │   │   Instancia N   │          │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘          │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                         │
│       ┌───────────────────────────┼───────────────────────────┐             │
│       │                           │                           │             │
│       ▼                           ▼                           ▼             │
│ ┌───────────┐            ┌─────────────────┐          ┌─────────────┐       │
│ │ PostgreSQL│            │     Redis       │          │   Contabo   │       │
│ │ (Primary) │            │  (Cache/Queue)  │          │     API     │       │
│ └─────┬─────┘            └─────────────────┘          └─────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│ ┌───────────┐                                                               │
│ │ PostgreSQL│                                                               │
│ │ (Replica) │                                                               │
│ └───────────┘                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE PRESENTACIÓN                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Aplicación Web (SPA - React/Vue.js)                                      │
│  • Panel de Cliente                                                         │
│  • Panel de Administrador                                                   │
│  • Landing Page / Catálogo                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE API                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • REST API (Express.js / FastAPI)                                          │
│  • Autenticación JWT                                                        │
│  • Validación de datos                                                      │
│  • Rate Limiting                                                            │
│  • Documentación Swagger/OpenAPI                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE NEGOCIO                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Servicios de Usuario                                                     │
│  • Servicios de Productos                                                   │
│  • Servicios de Órdenes                                                     │
│  • Servicios de VPS (Proxy a Contabo)                                       │
│  • Servicios de Facturación                                                 │
│  • Servicios de Notificaciones                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CAPA DE INTEGRACIÓN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Contabo API Client                                                       │
│  • Pasarela de Pagos (Stripe/mercadopago)                                        │
│  • Servicio de Email (SendGrid/SES)                                         │
│  • Cola de Mensajes (Redis/RabbitMQ)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE DATOS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Datos principales)                                           │
│  • Redis (Caché y sesiones)                                                 │
│  • Almacenamiento de archivos (S3/Object Storage)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Modelo de Datos

### 5.1 Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DIAGRAMA ENTIDAD-RELACIÓN                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      USERS       │         │     ORDERS       │         │    PRODUCTS      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │◄────────┤ user_id (FK)     │    ┌───►│ id (PK)          │
│ email            │         │ id (PK)          │    │    │ contabo_product_id│
│ password_hash    │         │ product_id (FK)  │────┘    │ name             │
│ first_name       │         │ status           │         │ description      │
│ last_name        │         │ total_amount     │         │ base_price       │
│ phone            │         │ period_months    │         │ selling_price    │
│ role             │         │ payment_method   │         │ ram_mb           │
│ email_verified   │         │ payment_status   │         │ cpu_cores        │
│ created_at       │         │ region           │         │ disk_gb          │
│ updated_at       │         │ image_id         │         │ disk_type        │
│ last_login       │         │ created_at       │         │ regions          │
└────────┬─────────┘         │ updated_at       │         │ is_active        │
         │                   └────────┬─────────┘         │ created_at       │
         │                            │                   └──────────────────┘
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │   VPS_INSTANCES  │         ┌──────────────────┐
         │                   ├──────────────────┤         │    IMAGES        │
         │                   │ id (PK)          │         ├──────────────────┤
         └──────────────────►│ user_id (FK)     │         │ id (PK)          │
                             │ order_id (FK)    │◄────────┤ contabo_image_id │
                             │ contabo_instance_id│        │ name             │
                             │ product_id (FK)  │         │ os_type          │
                             │ name             │         │ description      │
                             │ display_name     │         │ is_active        │
                             │ status           │         └──────────────────┘
                             │ ip_address       │
                             │ ip_v6_address    │
                             │ region           │
                             │ image_id (FK)    │───────────────────┘
                             │ root_password_enc│
                             │ ssh_key_ids      │
                             │ assigned_at      │
                             │ expires_at       │
                             │ created_at       │
                             │ updated_at       │
                             └────────┬─────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
         ┌──────────────────┐               ┌──────────────────┐
         │    SNAPSHOTS     │               │   VPS_ACTIONS    │
         ├──────────────────┤               ├──────────────────┤
         │ id (PK)          │               │ id (PK)          │
         │ vps_instance_id  │               │ vps_instance_id  │
         │ contabo_snap_id  │               │ action_type      │
         │ name             │               │ status           │
         │ description      │               │ requested_at     │
         │ size_mb          │               │ completed_at     │
         │ created_at       │               │ error_message    │
         └──────────────────┘               └──────────────────┘


┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   TRANSACTIONS   │         │    INVOICES      │         │  SUPPORT_TICKETS │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │         │ id (PK)          │
│ order_id (FK)    │─────────│ order_id (FK)    │         │ user_id (FK)     │
│ user_id (FK)     │         │ user_id (FK)     │         │ vps_instance_id  │
│ amount           │         │ invoice_number   │         │ subject          │
│ currency         │         │ amount           │         │ status           │
│ payment_provider │         │ tax_amount       │         │ priority         │
│ provider_tx_id   │         │ total            │         │ created_at       │
│ status           │         │ status           │         │ updated_at       │
│ created_at       │         │ due_date         │         │ closed_at        │
└──────────────────┘         │ paid_at          │         └────────┬─────────┘
                             │ pdf_url          │                  │
                             │ created_at       │                  ▼
                             └──────────────────┘         ┌──────────────────┐
                                                          │ TICKET_MESSAGES  │
                                                          ├──────────────────┤
┌──────────────────┐         ┌──────────────────┐         │ id (PK)          │
│   SSH_KEYS       │         │   PRICE_RULES    │         │ ticket_id (FK)   │
├──────────────────┤         ├──────────────────┤         │ user_id (FK)     │
│ id (PK)          │         │ id (PK)          │         │ message          │
│ user_id (FK)     │         │ product_id (FK)  │         │ is_admin         │
│ name             │         │ period_months    │         │ created_at       │
│ public_key       │         │ discount_percent │         └──────────────────┘
│ fingerprint      │         │ final_price      │
│ created_at       │         │ is_active        │
└──────────────────┘         └──────────────────┘
```

### 5.2 Definición de Tablas Principales

#### Tabla: users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer', -- 'customer', 'admin'
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

#### Tabla: products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contabo_product_id VARCHAR(20) NOT NULL, -- V91, V92, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL, -- Precio Contabo
    selling_price DECIMAL(10,2) NOT NULL, -- Precio de venta
    ram_mb INTEGER NOT NULL,
    cpu_cores INTEGER NOT NULL,
    disk_gb INTEGER NOT NULL,
    disk_type VARCHAR(20), -- 'NVMe', 'SSD', 'HDD'
    regions JSONB, -- ['EU', 'US-central', ...]
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: vps_instances
```sql
CREATE TABLE vps_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    contabo_instance_id BIGINT, -- ID de instancia en Contabo
    product_id UUID REFERENCES products(id),
    name VARCHAR(100), -- vmd12345
    display_name VARCHAR(255),
    status VARCHAR(50), -- 'pending', 'provisioning', 'running', 'stopped', etc.
    ip_address VARCHAR(45),
    ip_v6_address VARCHAR(45),
    gateway VARCHAR(45),
    netmask_cidr INTEGER,
    mac_address VARCHAR(17),
    region VARCHAR(20),
    image_id UUID REFERENCES images(id),
    os_type VARCHAR(50),
    root_password_encrypted TEXT, -- Encriptado con AES
    ssh_key_ids JSONB,
    default_user VARCHAR(50),
    assigned_at TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: orders
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    order_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', 
    -- 'pending', 'paid', 'processing', 'provisioning', 'completed', 'cancelled'
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period_months INTEGER DEFAULT 1,
    region VARCHAR(20) NOT NULL,
    image_id UUID REFERENCES images(id),
    ssh_keys JSONB,
    user_data TEXT, -- Cloud-init script
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

## 6. Módulos del Sistema

### 6.1 Módulo de Autenticación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MÓDULO DE AUTENTICACIÓN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Funcionalidades:                                                           │
│  ├── Registro de usuarios                                                   │
│  │   ├── Validación de email único                                          │
│  │   ├── Hash de contraseña (bcrypt)                                        │
│  │   └── Envío de email de verificación                                     │
│  │                                                                          │
│  ├── Login                                                                  │
│  │   ├── Validación de credenciales                                         │
│  │   ├── Generación de JWT (access + refresh tokens)                        │
│  │   └── Registro de último login                                           │
│  │                                                                          │
│  ├── Logout                                                                 │
│  │   └── Invalidación de refresh token                                      │
│  │                                                                          │
│  ├── Recuperación de contraseña                                             │
│  │   ├── Generación de token temporal                                       │
│  │   ├── Envío de email con link                                            │
│  │   └── Reset de contraseña                                                │
│  │                                                                          │
│  └── Middleware de autorización                                             │
│      ├── Verificación de JWT                                                │
│      ├── Validación de roles                                                │
│      └── Rate limiting por usuario                                          │
│                                                                             │
│  Endpoints:                                                                 │
│  ├── POST /api/auth/register                                                │
│  ├── POST /api/auth/login                                                   │
│  ├── POST /api/auth/logout                                                  │
│  ├── POST /api/auth/refresh-token                                           │
│  ├── POST /api/auth/forgot-password                                         │
│  ├── POST /api/auth/reset-password                                          │
│  ├── GET  /api/auth/verify-email/:token                                     │
│  └── GET  /api/auth/me                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Módulo de Catálogo de Productos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MÓDULO DE CATÁLOGO                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Funcionalidades:                                                           │
│  ├── Listado de productos VPS                                               │
│  │   ├── Filtrado por región                                                │
│  │   ├── Filtrado por tipo de disco                                         │
│  │   ├── Ordenamiento por precio/recursos                                   │
│  │   └── Paginación                                                         │
│  │                                                                          │
│  ├── Detalle de producto                                                    │
│  │   ├── Especificaciones técnicas                                          │
│  │   ├── Precios por período                                                │
│  │   └── Imágenes/OS disponibles                                            │
│  │                                                                          │
│  ├── Comparador de productos                                                │
│  │   └── Comparación lado a lado                                            │
│  │                                                                          │
│  └── Gestión de imágenes/OS                                                 │
│      ├── Listado de imágenes disponibles                                    │
│      └── Sincronización con Contabo                                         │
│                                                                             │
│  Endpoints (Públicos):                                                      │
│  ├── GET  /api/products                                                     │
│  ├── GET  /api/products/:id                                                 │
│  ├── GET  /api/products/compare                                             │
│  ├── GET  /api/images                                                       │
│  └── GET  /api/regions                                                      │
│                                                                             │
│  Endpoints (Admin):                                                         │
│  ├── POST   /api/admin/products                                             │
│  ├── PUT    /api/admin/products/:id                                         │
│  ├── DELETE /api/admin/products/:id                                         │
│  ├── POST   /api/admin/images/sync                                          │
│  └── PUT    /api/admin/images/:id                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Módulo de Órdenes y Pagos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MÓDULO DE ÓRDENES Y PAGOS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Flujo de Orden:                                                            │
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │ PENDING │───►│  PAID   │───►│PROCESSING│───►│PROVISION│───►│COMPLETED│   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
│       │                                                            │        │
│       │                        ┌─────────┐                         │        │
│       └───────────────────────►│CANCELLED│◄────────────────────────┘        │
│                                └─────────┘                                  │
│                                                                             │
│  Funcionalidades:                                                           │
│  ├── Creación de orden                                                      │
│  │   ├── Validación de producto                                             │
│  │   ├── Cálculo de precio final                                            │
│  │   └── Generación de número de orden                                      │
│  │                                                                          │
│  ├── Procesamiento de pago                                                  │
│  │   ├── Integración Stripe                                                 │
│  │   ├── Integración PayPal                                                 │
│  │   ├── Webhooks de confirmación                                           │
│  │   └── Manejo de errores                                                  │
│  │                                                                          │
│  ├── Notificaciones                                                         │
│  │   ├── Email al cliente (confirmación)                                    │
│  │   └── Notificación al admin (nueva orden)                                │
│  │                                                                          │
│  └── Historial de órdenes                                                   │
│      ├── Filtrado por estado                                                │
│      └── Exportación                                                        │
│                                                                             │
│  Endpoints (Cliente):                                                       │
│  ├── POST /api/orders                                                       │
│  ├── GET  /api/orders                                                       │
│  ├── GET  /api/orders/:id                                                   │
│  ├── POST /api/orders/:id/pay                                               │
│  └── POST /api/orders/:id/cancel                                            │
│                                                                             │
│  Endpoints (Admin):                                                         │
│  ├── GET    /api/admin/orders                                               │
│  ├── GET    /api/admin/orders/:id                                           │
│  ├── PUT    /api/admin/orders/:id/status                                    │
│  └── POST   /api/admin/orders/:id/provision                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Módulo de Gestión de VPS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MÓDULO DE GESTIÓN DE VPS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Funcionalidades del Cliente:                                               │
│  ├── Dashboard de VPS                                                       │
│  │   ├── Lista de instancias                                                │
│  │   ├── Estado en tiempo real                                              │
│  │   └── Métricas básicas                                                   │
│  │                                                                          │
│  ├── Acciones sobre VPS (Proxy a Contabo API)                               │
│  │   ├── Start   → POST /v1/compute/instances/{id}/actions/start            │
│  │   ├── Stop    → POST /v1/compute/instances/{id}/actions/stop             │
│  │   ├── Restart → POST /v1/compute/instances/{id}/actions/restart          │
│  │   ├── Shutdown→ POST /v1/compute/instances/{id}/actions/shutdown         │
│  │   ├── Rescue  → POST /v1/compute/instances/{id}/actions/rescue           │
│  │   └── Reset Password → POST /v1/compute/instances/{id}/actions/resetPwd  │
│  │                                                                          │
│  ├── Gestión de Snapshots                                                   │
│  │   ├── Listar snapshots                                                   │
│  │   ├── Crear snapshot                                                     │
│  │   ├── Restaurar snapshot                                                 │
│  │   └── Eliminar snapshot                                                  │
│  │                                                                          │
│  └── Información de red                                                     │
│      ├── IP pública                                                         │
│      ├── IPv6                                                               │
│      └── Gateway                                                            │
│                                                                             │
│  Endpoints (Cliente):                                                       │
│  ├── GET    /api/vps                                                        │
│  ├── GET    /api/vps/:id                                                    │
│  ├── POST   /api/vps/:id/start                                              │
│  ├── POST   /api/vps/:id/stop                                               │
│  ├── POST   /api/vps/:id/restart                                            │
│  ├── POST   /api/vps/:id/shutdown                                           │
│  ├── POST   /api/vps/:id/rescue                                             │
│  ├── POST   /api/vps/:id/reset-password                                     │
│  ├── GET    /api/vps/:id/snapshots                                          │
│  ├── POST   /api/vps/:id/snapshots                                          │
│  ├── POST   /api/vps/:id/snapshots/:snapId/restore                          │
│  └── DELETE /api/vps/:id/snapshots/:snapId                                  │
│                                                                             │
│  Funcionalidades del Admin:                                                 │
│  ├── Asignación de instancias                                               │
│  │   ├── Vincular contabo_instance_id con orden                             │
│  │   ├── Guardar credenciales encriptadas                                   │
│  │   └── Notificar al cliente                                               │
│  │                                                                          │
│  └── Monitoreo global                                                       │
│      ├── Estado de todas las instancias                                     │
│      └── Alertas de problemas                                               │
│                                                                             │
│  Endpoints (Admin):                                                         │
│  ├── GET  /api/admin/vps                                                    │
│  ├── POST /api/admin/vps/assign                                             │
│  └── PUT  /api/admin/vps/:id                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Módulo de Panel Administrativo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MÓDULO ADMINISTRATIVO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Dashboard:                                                                 │
│  ├── Métricas en tiempo real                                                │
│  │   ├── Órdenes pendientes                                                 │
│  │   ├── Ingresos del mes                                                   │
│  │   ├── Clientes activos                                                   │
│  │   └── VPS activas                                                        │
│  │                                                                          │
│  ├── Gráficos                                                               │
│  │   ├── Ventas mensuales                                                   │
│  │   ├── Productos más vendidos                                             │
│  │   └── Distribución por región                                            │
│  │                                                                          │
│  └── Notificaciones/Alertas                                                 │
│      ├── Órdenes nuevas                                                     │
│      ├── VPS expiradas                                                      │
│      └── Tickets abiertos                                                   │
│                                                                             │
│  Gestión de Productos:                                                      │
│  ├── CRUD de productos                                                      │
│  ├── Configuración de precios                                               │
│  ├── Reglas de descuento por período                                        │
│  └── Activación/Desactivación                                               │
│                                                                             │
│  Gestión de Clientes:                                                       │
│  ├── Lista de clientes                                                      │
│  ├── Detalle de cliente                                                     │
│  ├── Servicios del cliente                                                  │
│  └── Historial de pagos                                                     │
│                                                                             │
│  Gestión de Órdenes:                                                        │
│  ├── Cola de órdenes pendientes                                             │
│  ├── Proceso de provisión                                                   │
│  │   ├── Marcar como procesando                                             │
│  │   ├── Ingresar datos de Contabo                                          │
│  │   └── Completar asignación                                               │
│  └── Historial de órdenes                                                   │
│                                                                             │
│  Configuración:                                                             │
│  ├── Datos de empresa                                                       │
│  ├── Credenciales Contabo API                                               │
│  ├── Pasarelas de pago                                                      │
│  ├── Templates de email                                                     │
│  └── Configuración de impuestos                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Integración con Contabo API

### 7.1 Autenticación con Contabo

```javascript
// Flujo de autenticación OAuth2
const getContaboAccessToken = async () => {
    const response = await fetch(
        'https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.CONTABO_CLIENT_ID,
                client_secret: process.env.CONTABO_CLIENT_SECRET,
                username: process.env.CONTABO_API_USER,
                password: process.env.CONTABO_API_PASSWORD,
                grant_type: 'password'
            })
        }
    );
    
    const data = await response.json();
    return data.access_token;
};
```

### 7.2 Endpoints de Contabo Utilizados

| Funcionalidad | Endpoint Contabo | Método | Uso en Plataforma |
|---------------|------------------|--------|-------------------|
| Listar instancias | `/v1/compute/instances` | GET | Sincronización |
| Obtener instancia | `/v1/compute/instances/{id}` | GET | Detalle de VPS |
| Iniciar instancia | `/v1/compute/instances/{id}/actions/start` | POST | Acción cliente |
| Detener instancia | `/v1/compute/instances/{id}/actions/stop` | POST | Acción cliente |
| Reiniciar | `/v1/compute/instances/{id}/actions/restart` | POST | Acción cliente |
| Apagar (ACPI) | `/v1/compute/instances/{id}/actions/shutdown` | POST | Acción cliente |
| Modo rescate | `/v1/compute/instances/{id}/actions/rescue` | POST | Acción cliente |
| Reset password | `/v1/compute/instances/{id}/actions/resetPassword` | POST | Acción cliente |
| Listar snapshots | `/v1/compute/instances/{id}/snapshots` | GET | Panel cliente |
| Crear snapshot | `/v1/compute/instances/{id}/snapshots` | POST | Panel cliente |
| Restaurar snapshot | `/v1/compute/instances/{id}/snapshots/{snapId}` | POST | Panel cliente |
| Eliminar snapshot | `/v1/compute/instances/{id}/snapshots/{snapId}` | DELETE | Panel cliente |
| Listar imágenes | `/v1/compute/images` | GET | Catálogo |

### 7.3 Servicio de Proxy Contabo

```javascript
// services/contaboService.js
class ContaboService {
    constructor() {
        this.baseUrl = 'https://api.contabo.com';
        this.tokenCache = null;
        this.tokenExpiry = null;
    }

    async getToken() {
        if (this.tokenCache && this.tokenExpiry > Date.now()) {
            return this.tokenCache;
        }
        // Obtener nuevo token...
        return this.tokenCache;
    }

    async request(method, endpoint, data = null) {
        const token = await this.getToken();
        const requestId = uuidv4();
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-request-id': requestId
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            throw new ContaboApiError(response.status, await response.json());
        }
        
        return response.json();
    }

    // Métodos específicos
    async getInstance(instanceId) {
        return this.request('GET', `/v1/compute/instances/${instanceId}`);
    }

    async startInstance(instanceId) {
        return this.request('POST', `/v1/compute/instances/${instanceId}/actions/start`);
    }

    async stopInstance(instanceId) {
        return this.request('POST', `/v1/compute/instances/${instanceId}/actions/stop`);
    }

    async restartInstance(instanceId) {
        return this.request('POST', `/v1/compute/instances/${instanceId}/actions/restart`);
    }

    async getSnapshots(instanceId) {
        return this.request('GET', `/v1/compute/instances/${instanceId}/snapshots`);
    }

    async createSnapshot(instanceId, name, description) {
        return this.request('POST', `/v1/compute/instances/${instanceId}/snapshots`, {
            name,
            description
        });
    }

    // ... más métodos
}
```

### 7.4 Validación de Permisos en Proxy

```javascript
// middleware/vpsAccess.js
const validateVpsAccess = async (req, res, next) => {
    const { vpsId } = req.params;
    const userId = req.user.id;
    
    // Verificar que el VPS pertenece al usuario
    const vps = await VpsInstance.findOne({
        where: {
            id: vpsId,
            user_id: userId
        }
    });
    
    if (!vps) {
        return res.status(403).json({
            error: 'No tienes permiso para acceder a este VPS'
        });
    }
    
    // Verificar que el servicio está activo
    if (vps.status === 'expired' || vps.status === 'cancelled') {
        return res.status(403).json({
            error: 'El servicio no está activo'
        });
    }
    
    req.vps = vps;
    next();
};
```

---

## 8. Stack Tecnológico

### 8.1 Opción A: Stack Node.js (Recomendado)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STACK TECNOLÓGICO (Node.js)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND                                                                   │
│  ├── Framework: Next.js 14 (React)                                          │
│  ├── State Management: Zustand / React Query                                │
│  ├── Styling: Tailwind CSS + Shadcn/UI                                      │
│  ├── Forms: React Hook Form + Zod                                           │
│  ├── Charts: Recharts                                                       │
│  └── HTTP Client: Axios / Fetch                                             │
│                                                                             │
│  BACKEND                                                                    │
│  ├── Runtime: Node.js 20 LTS                                                │
│  ├── Framework: Express.js / Fastify                                        │
│  ├── ORM: Prisma                                                            │
│  ├── Validation: Zod / Joi                                                  │
│  ├── Auth: Passport.js + JWT                                                │
│  └── API Docs: Swagger/OpenAPI                                              │
│                                                                             │
│  BASE DE DATOS                                                              │
│  ├── Principal: PostgreSQL 16                                               │
│  ├── Cache: Redis 7                                                         │
│  └── Queue: BullMQ (sobre Redis)                                            │
│                                                                             │
│  INFRAESTRUCTURA                                                            │
│  ├── Contenedores: Docker + Docker Compose                                  │
│  ├── Reverse Proxy: Nginx                                                   │
│  ├── CI/CD: GitHub Actions                                                  │
│  └── Monitoreo: PM2 / Prometheus + Grafana                                  │
│                                                                             │
│  SERVICIOS EXTERNOS                                                         │
│  ├── Pagos: Stripe                                                          │
│  ├── Email: SendGrid / AWS SES                                              │
│  └── Storage: AWS S3 / Contabo Object Storage                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Opción B: Stack Python

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STACK TECNOLÓGICO (Python)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND                                                                   │
│  ├── Framework: Vue.js 3 / Nuxt.js 3                                        │
│  ├── State: Pinia                                                           │
│  ├── Styling: Tailwind CSS + Vuetify                                        │
│  └── HTTP: Axios                                                            │
│                                                                             │
│  BACKEND                                                                    │
│  ├── Framework: FastAPI                                                     │
│  ├── ORM: SQLAlchemy 2.0                                                    │
│  ├── Migrations: Alembic                                                    │
│  ├── Validation: Pydantic v2                                                │
│  ├── Auth: python-jose + passlib                                            │
│  ├── Tasks: Celery + Redis                                                  │
│  └── API Docs: Auto-generada por FastAPI                                    │
│                                                                             │
│  BASE DE DATOS                                                              │
│  ├── Principal: PostgreSQL 16                                               │
│  └── Cache/Queue: Redis 7                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Estructura de Proyecto (Node.js)

```
vps-reseller-platform/
├── apps/
│   ├── frontend/                    # Next.js App
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── vps/
│   │   │   │   ├── orders/
│   │   │   │   ├── billing/
│   │   │   │   └── support/
│   │   │   ├── (admin)/
│   │   │   │   ├── admin/
│   │   │   │   ├── admin/orders/
│   │   │   │   ├── admin/products/
│   │   │   │   ├── admin/customers/
│   │   │   │   └── admin/settings/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx         # Landing
│   │   │   │   ├── pricing/
│   │   │   │   └── contact/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── styles/
│   │
│   └── backend/                     # Express/Fastify API
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.js
│       │   │   ├── redis.js
│       │   │   └── contabo.js
│       │   ├── controllers/
│       │   │   ├── authController.js
│       │   │   ├── productController.js
│       │   │   ├── orderController.js
│       │   │   ├── vpsController.js
│       │   │   └── adminController.js
│       │   ├── services/
│       │   │   ├── authService.js
│       │   │   ├── contaboService.js
│       │   │   ├── paymentService.js
│       │   │   ├── emailService.js
│       │   │   └── vpsService.js
│       │   ├── models/
│       │   │   ├── User.js
│       │   │   ├── Product.js
│       │   │   ├── Order.js
│       │   │   ├── VpsInstance.js
│       │   │   └── index.js
│       │   ├── routes/
│       │   │   ├── auth.js
│       │   │   ├── products.js
│       │   │   ├── orders.js
│       │   │   ├── vps.js
│       │   │   └── admin.js
│       │   ├── middleware/
│       │   │   ├── auth.js
│       │   │   ├── admin.js
│       │   │   ├── rateLimiter.js
│       │   │   └── errorHandler.js
│       │   ├── utils/
│       │   │   ├── encryption.js
│       │   │   ├── validators.js
│       │   │   └── helpers.js
│       │   ├── jobs/
│       │   │   ├── syncVpsStatus.js
│       │   │   ├── sendReminders.js
│       │   │   └── cleanupExpired.js
│       │   └── app.js
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── tests/
│
├── packages/
│   └── shared/                      # Código compartido
│       ├── types/
│       ├── constants/
│       └── utils/
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── docs/
│   ├── api/
│   └── deployment/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── package.json
├── turbo.json                       # Turborepo config
└── README.md
```

---

## 9. Fases de Desarrollo

### Fase 1: Fundamentos (Semanas 1-3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FASE 1: FUNDAMENTOS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana 1: Setup del Proyecto                                               │
│  ├── Configuración del repositorio                                          │
│  ├── Setup de Docker y Docker Compose                                       │
│  ├── Configuración de base de datos PostgreSQL                              │
│  ├── Setup de Redis                                                         │
│  ├── Estructura base del backend                                            │
│  └── Estructura base del frontend                                           │
│                                                                             │
│  Semana 2: Autenticación y Usuarios                                         │
│  ├── Modelo de usuarios                                                     │
│  ├── Registro de usuarios                                                   │
│  ├── Login/Logout con JWT                                                   │
│  ├── Verificación de email                                                  │
│  ├── Recuperación de contraseña                                             │
│  └── Middleware de autenticación                                            │
│                                                                             │
│  Semana 3: Integración Contabo API                                          │
│  ├── Cliente OAuth2 para Contabo                                            │
│  ├── Servicio de proxy a Contabo                                            │
│  ├── Manejo de errores de API                                               │
│  ├── Cache de tokens                                                        │
│  └── Tests de integración                                                   │
│                                                                             │
│  Entregables:                                                               │
│  ✓ Sistema de autenticación funcional                                       │
│  ✓ Conexión verificada con Contabo API                                      │
│  ✓ Ambiente de desarrollo dockerizado                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase 2: Catálogo y Órdenes (Semanas 4-6)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FASE 2: CATÁLOGO Y ÓRDENES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana 4: Catálogo de Productos                                            │
│  ├── Modelo de productos                                                    │
│  ├── CRUD de productos (admin)                                              │
│  ├── API de listado público                                                 │
│  ├── Sincronización de imágenes/OS                                          │
│  ├── Frontend: página de precios                                            │
│  └── Frontend: detalle de producto                                          │
│                                                                             │
│  Semana 5: Sistema de Órdenes                                               │
│  ├── Modelo de órdenes                                                      │
│  ├── Flujo de creación de orden                                             │
│  ├── Selección de configuración (OS, región, SSH)                           │
│  ├── Cálculo de precios                                                     │
│  └── Frontend: proceso de checkout                                          │
│                                                                             │
│  Semana 6: Integración de Pagos                                             │
│  ├── Configuración de Stripe                                                │
│  ├── Checkout session                                                       │
│  ├── Webhooks de confirmación                                               │
│  ├── Manejo de estados de pago                                              │
│  ├── Notificaciones por email                                               │
│  └── Frontend: confirmación de pago                                         │
│                                                                             │
│  Entregables:                                                               │
│  ✓ Catálogo funcional                                                       │
│  ✓ Proceso de compra completo                                               │
│  ✓ Pagos con Stripe integrados                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase 3: Panel de Cliente (Semanas 7-9)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FASE 3: PANEL DE CLIENTE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana 7: Dashboard y Lista de VPS                                         │
│  ├── Dashboard del cliente                                                  │
│  ├── Lista de VPS contratados                                               │
│  ├── Detalle de VPS                                                         │
│  ├── Información de red                                                     │
│  └── Estado en tiempo real                                                  │
│                                                                             │
│  Semana 8: Acciones sobre VPS                                               │
│  ├── Implementar Start/Stop/Restart                                         │
│  ├── Implementar Shutdown                                                   │
│  ├── Implementar modo Rescue                                                │
│  ├── Reset de contraseña                                                    │
│  ├── UI para acciones con confirmación                                      │
│  └── Feedback visual de estado                                              │
│                                                                             │
│  Semana 9: Snapshots y Extras                                               │
│  ├── Listado de snapshots                                                   │
│  ├── Crear snapshot                                                         │
│  ├── Restaurar snapshot                                                     │
│  ├── Eliminar snapshot                                                      │
│  ├── Historial de órdenes                                                   │
│  └── Gestión de perfil                                                      │
│                                                                             │
│  Entregables:                                                               │
│  ✓ Panel de cliente completo                                                │
│  ✓ Todas las acciones de VPS funcionales                                    │
│  ✓ Gestión de snapshots                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase 4: Panel Administrativo (Semanas 10-12)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FASE 4: PANEL ADMINISTRATIVO                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana 10: Dashboard Admin                                                 │
│  ├── Dashboard con métricas                                                 │
│  ├── Gráficos de ventas                                                     │
│  ├── Órdenes pendientes                                                     │
│  ├── Alertas y notificaciones                                               │
│  └── Resumen de clientes                                                    │
│                                                                             │
│  Semana 11: Gestión de Órdenes                                              │
│  ├── Cola de órdenes pendientes                                             │
│  ├── Proceso de provisión manual                                            │
│  │   ├── Formulario para ingresar instanceId                                │
│  │   ├── Asignación a cliente                                               │
│  │   └── Registro de credenciales                                           │
│  ├── Cambio de estados                                                      │
│  └── Notificación al cliente                                                │
│                                                                             │
│  Semana 12: Gestión de Productos y Clientes                                 │
│  ├── CRUD completo de productos                                             │
│  ├── Configuración de precios por período                                   │
│  ├── Lista de clientes                                                      │
│  ├── Detalle de cliente con sus servicios                                   │
│  ├── Configuración del sistema                                              │
│  └── Reportes básicos                                                       │
│                                                                             │
│  Entregables:                                                               │
│  ✓ Panel administrativo completo                                            │
│  ✓ Flujo de provisión funcional                                             │
│  ✓ Gestión de productos y clientes                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase 5: Facturación y Soporte (Semanas 13-14)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FASE 5: FACTURACIÓN Y SOPORTE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana 13: Sistema de Facturación                                          │
│  ├── Generación de facturas                                                 │
│  ├── Numeración automática                                                  │
│  ├── Exportación a PDF                                                      │
│  ├── Historial de facturas                                                  │
│  ├── Recordatorios de renovación                                            │
│  └── Reportes de ingresos                                                   │
│                                                                             │
│  Semana 14: Sistema de Tickets                                              │
│  ├── Creación de tickets                                                    │
│  ├── Asignación a VPS                                                       │
│  ├── Mensajes en hilo                                                       │
│  ├── Estados de tickets                                                     │
│  ├── Panel admin de tickets                                                 │
│  └── Notificaciones de respuesta                                            │
│                                                                             │
│  Entregables:                                                               │
│  ✓ Sistema de facturación                                                   │
│  ✓ Sistema de soporte básico                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase 6: Testing y Deployment (Semanas 15-16)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FASE 6: TESTING Y DEPLOYMENT                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Semana 15: Testing y QA                                                    │
│  ├── Tests unitarios backend                                                │
│  ├── Tests de integración API                                               │
│  ├── Tests E2E frontend                                                     │
│  ├── Pruebas de seguridad                                                   │
│  ├── Pruebas de carga                                                       │
│  └── Corrección de bugs                                                     │
│                                                                             │
│  Semana 16: Deployment                                                      │
│  ├── Configuración de servidor producción                                   │
│  ├── Setup de CI/CD                                                         │
│  ├── Configuración de SSL                                                   │
│  ├── Configuración de backups                                               │
│  ├── Monitoreo y alertas                                                    │
│  ├── Documentación                                                          │
│  └── Go-live                                                                │
│                                                                             │
│  Entregables:                                                               │
│  ✓ Suite de tests completa                                                  │
│  ✓ Pipeline de CI/CD                                                        │
│  ✓ Plataforma en producción                                                 │
│  ✓ Documentación técnica                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Cronograma Estimado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CRONOGRAMA - 16 SEMANAS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MES 1                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Sem 1    │ Sem 2    │ Sem 3    │ Sem 4                                │ │
│  │ Setup    │ Auth     │ Contabo  │ Catálogo                             │ │
│  │ ████████ │ ████████ │ ████████ │ ████████                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  FASE 1: FUNDAMENTOS ─────────────────┘  │ FASE 2 ──────                    │
│                                                                             │
│  MES 2                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Sem 5    │ Sem 6    │ Sem 7    │ Sem 8                                │ │
│  │ Órdenes  │ Pagos    │ Panel    │ Acciones                             │ │
│  │ ████████ │ ████████ │ ████████ │ ████████                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  FASE 2 ────────────────────┘  │ FASE 3: PANEL CLIENTE ──────              │
│                                                                             │
│  MES 3                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Sem 9    │ Sem 10   │ Sem 11   │ Sem 12                               │ │
│  │ Snapshots│ Dashboard│ Gestión  │ Productos                            │ │
│  │ ████████ │ ████████ │ ████████ │ ████████                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  FASE 3 ───┘  │ FASE 4: PANEL ADMIN ────────────────────────               │
│                                                                             │
│  MES 4                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Sem 13   │ Sem 14   │ Sem 15   │ Sem 16                               │ │
│  │ Facturas │ Tickets  │ Testing  │ Deploy                               │ │
│  │ ████████ │ ████████ │ ████████ │ ████████                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  FASE 5: FACTURACIÓN ────────┘  │ FASE 6: TESTING/DEPLOY ───              │
│                                                                             │
│  HITOS:                                                                     │
│  ● Sem 3:  MVP Autenticación + Conexión Contabo                             │
│  ● Sem 6:  Proceso de compra funcional                                      │
│  ● Sem 9:  Panel cliente completo                                           │
│  ● Sem 12: Panel admin completo                                             │
│  ● Sem 14: Todas las funcionalidades                                        │
│  ● Sem 16: GO-LIVE                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Seguridad

### 11.1 Medidas de Seguridad

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MEDIDAS DE SEGURIDAD                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AUTENTICACIÓN Y AUTORIZACIÓN                                               │
│  ├── Contraseñas hasheadas con bcrypt (cost factor 12)                      │
│  ├── JWT con expiración corta (15 min) + refresh tokens                     │
│  ├── Rate limiting en endpoints de login (5 intentos/min)                   │
│  ├── 2FA opcional para cuentas admin                                        │
│  └── Sesiones invalidadas en logout                                         │
│                                                                             │
│  PROTECCIÓN DE DATOS                                                        │
│  ├── Credenciales Contabo encriptadas con AES-256                           │
│  ├── Variables de entorno para secrets                                      │
│  ├── Logs sin información sensible                                          │
│  └── Backups encriptados                                                    │
│                                                                             │
│  COMUNICACIÓN                                                               │
│  ├── HTTPS obligatorio (TLS 1.3)                                            │
│  ├── HSTS habilitado                                                        │
│  ├── Certificados SSL auto-renovados (Let's Encrypt)                        │
│  └── Headers de seguridad (CSP, X-Frame-Options, etc.)                      │
│                                                                             │
│  PROTECCIÓN DE API                                                          │
│  ├── Rate limiting global (100 req/min por IP)                              │
│  ├── Rate limiting por usuario (1000 req/hora)                              │
│  ├── Validación de entrada (Zod/Joi)                                        │
│  ├── Sanitización de datos                                                  │
│  ├── CORS configurado correctamente                                         │
│  └── Protección CSRF                                                        │
│                                                                             │
│  INFRAESTRUCTURA                                                            │
│  ├── Firewall configurado (solo puertos necesarios)                         │
│  ├── WAF (Cloudflare o similar)                                             │
│  ├── Actualizaciones automáticas de seguridad                               │
│  ├── Monitoreo de intrusiones                                               │
│  └── Respaldos diarios                                                      │
│                                                                             │
│  ACCESO A CONTABO API                                                       │
│  ├── Credenciales en variables de entorno                                   │
│  ├── Token cacheado con TTL                                                 │
│  ├── Validación de permisos antes de proxy                                  │
│  └── Logging de todas las llamadas                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Encriptación de Credenciales

```javascript
// utils/encryption.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex')
    };
}

function decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        KEY,
        Buffer.from(encrypted.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

module.exports = { encrypt, decrypt };
```

---

## 12. Consideraciones Adicionales

### 12.1 Escalabilidad

- Arquitectura stateless para permitir múltiples instancias
- Cache distribuido con Redis
- Database connection pooling
- CDN para assets estáticos
- Horizontal scaling con load balancer

### 12.2 Monitoreo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STACK DE MONITOREO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Logs:                                                                      │
│  ├── Winston/Pino para logging estructurado                                 │
│  ├── Log rotation diario                                                    │
│  └── Agregación con ELK Stack o Loki                                        │
│                                                                             │
│  Métricas:                                                                  │
│  ├── Prometheus para recolección                                            │
│  ├── Grafana para visualización                                             │
│  └── Alertas en Slack/Email                                                 │
│                                                                             │
│  APM:                                                                       │
│  ├── New Relic / DataDog (opcional)                                         │
│  └── Tracing distribuido                                                    │
│                                                                             │
│  Uptime:                                                                    │
│  └── UptimeRobot / Better Uptime                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.3 Estimación de Recursos

| Concepto | Estimación Mensual |
|----------|-------------------|
| Servidor API (VPS) | $20 - $50 |
| Base de datos PostgreSQL | $15 - $30 |
| Redis Cache | $10 - $20 |
| Dominio + SSL | $15/año |
| Email Service (SendGrid) | $0 - $20 |
| CDN (Cloudflare) | $0 - $20 |
| Backups | $5 - $10 |
| **Total Estimado** | **$50 - $150/mes** |

### 12.4 Próximos Pasos Recomendados

1. **Inmediato:** Crear cuenta de desarrollador en Contabo y obtener credenciales API
2. **Semana 1:** Configurar repositorio y ambiente de desarrollo
3. **Validación:** Probar conexión con API de Contabo
4. **Iteración:** Desarrollar por fases con demos semanales

---

## Anexos

### Anexo A: Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/vps_reseller
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Contabo API
CONTABO_CLIENT_ID=your-client-id
CONTABO_CLIENT_SECRET=your-client-secret
CONTABO_API_USER=your-api-user
CONTABO_API_PASSWORD=your-api-password

# Encriptación
ENCRYPTION_KEY=your-32-byte-hex-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@yourdomain.com

# App
APP_URL=https://yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### Anexo B: Comandos Docker

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/vps_reseller
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=vps_reseller

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

**Documento preparado para el desarrollo de la Plataforma de Reventa de VPS con integración a Contabo API.**

*Este PDA es un documento vivo que debe actualizarse conforme avance el proyecto.*
