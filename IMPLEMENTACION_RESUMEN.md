# Resumen de Implementación: Parametrización de Precios

## Cambios Implementados

### Backend

#### 1. Base de Datos (Prisma Schema)
**Archivo:** `apps/backend/prisma/schema.prisma`

- **Nuevo modelo Region:** Gestión centralizada de regiones con precio de ajuste
- **Nuevo modelo OperatingSystem:** Sistemas operativos con precios
- **Modificado Product:** Agregado `productType` (STANDARD/CUSTOM) y `contactEmail`
- **Modificado Order:** Agregado `basePrice`, `regionPriceAdj`, `osPriceAdj` para desglose de precios

#### 2. Nuevos Servicios
- **`regionService.ts`:** CRUD completo de regiones
- **`operatingSystemService.ts`:** CRUD de SO + sincronización desde Contabo

#### 3. Modificaciones a Servicios Existentes
- **`productService.ts`:**
  - `calculatePrice()` ahora acepta `regionId` y `osId`
  - Retorna desglose: `{ basePrice, regionPriceAdj, osPriceAdj, totalPrice }`
  - Nuevo método `getCustomProducts()`

- **`orderService.ts`:**
  - `createOrder()` ahora guarda desglose de precios
  - Valida productos CUSTOM y redirige a formulario de contacto

#### 4. Nuevos Controladores y Rutas
- **`regionController.ts` + `routes/regions.ts`:** Gestión de regiones
- **`operatingSystemController.ts` + `routes/operating-systems.ts`:** Gestión de SO

### Frontend

#### 1. API Client
**Archivo:** `apps/frontend/src/lib/api/client.ts`

- Agregado `adminApi.regions.*` - CRUD de regiones
- Agregado `adminApi.operatingSystems.*` - CRUD de SO + sync

#### 2. Hooks
**Archivo:** `apps/frontend/src/lib/hooks/use-admin.ts`

- `useAdminRegions()` - Hook para gestión de regiones
- `useAdminOperatingSystems()` - Hook para gestión de SO

#### 3. Tipos
**Archivos:** `apps/frontend/src/types/product.ts`, `order.ts`

- Agregado `ProductType = 'STANDARD' | 'CUSTOM'`
- Agregado campos `productType`, `contactEmail` a Product
- Agregado campos `basePrice`, `regionPriceAdj`, `osPriceAdj` a Order

#### 4. Páginas de Administración
- **`/admin/regions/page.tsx`:** Lista de regiones
- **`/admin/regions/new/page.tsx`:** Crear región
- **`/admin/operating-systems/page.tsx`:** Lista de SO
- **`/admin/operating-systems/new/page.tsx`:** Crear SO

#### 5. Modificaciones a Productos
- **`/admin/products/new/page.tsx`:** Agregado `productType` y `contactEmail`
- **`/admin/products/[id]/edit/page.tsx`:** Agregado `productType` y `contactEmail`

#### 6. Checkout
**Archivo:** `apps/frontend/src/app/(public)/checkout/page.tsx`

- Selectores de región y SO con precios de ajuste
- Desglose de precios en resumen
- Formulario de contacto para productos CUSTOM

#### 7. Catálogo
**Archivo:** `apps/frontend/src/app/(public)/catalog/page.tsx`

- Badge "Contactar" para productos CUSTOM
- Botón "Solicitar Presupuesto" para productos CUSTOM
- Sin precio mostrado para productos CUSTOM

## Instrucciones para Aplicar

### 1. Configurar Base de Datos

Asegúrate de que PostgreSQL esté corriendo y la base de datos creada:

```bash
# Crear base de datos si no existe
createdb cloudvertice
```

### 2. Aplicar Migraciones

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

Si hay errores con migraciones previas, puedes resetear:

```bash
# ADVERTENCIA: Esto elimina todos los datos
npx prisma migrate reset
```

### 3. Verificar Tablas

```sql
-- Verificar que las tablas nuevas existen
SELECT * FROM regions;
SELECT * FROM operating_systems;

-- Verificar nuevos campos en Product
SELECT id, name, product_type, contact_email FROM products;

-- Verificar nuevos campos en Order
SELECT id, order_number, base_price, region_price_adj, os_price_adj FROM orders;
```

### 4. Datos Iniciales (Opcional)

```sql
-- Crear algunas regiones
INSERT INTO regions (code, name, description, price_adjustment, sort_order) VALUES
('US-EAST-1', 'US Este', 'Virginia', 5.00, 1),
('EU-CENTRAL-1', 'Europa Central', 'Frankfurt', 0.00, 0),
('ASIA-SOUTH-1', 'Asia Sur', 'Singapur', 3.00, 2);

-- Sincronizar SOs desde Contabo (vía API)
POST /api/operating-systems/sync
```

## Verificación

### Pruebas Manuales

1. **Crear región con ajuste de precio:**
   - Admin → Regiones → Nueva Región
   - Precio ajuste: $5
   - Verificar que aparece en el checkout

2. **Crear sistema operativo con ajuste:**
   - Admin → Sistemas Operativos → Sincronizar
   - Editar un SO y agregar precio de ajuste: $2

3. **Crear producto personalizado:**
   - Admin → Productos → Nuevo Producto
   - Tipo: CUSTOM
   - Email: ventas@empresa.com

4. **Verificar checkout:**
   - Seleccionar producto estándar
   - Cambiar región/SO y verificar desglose de precios
   - Total = base + región + SO

5. **Verificar catálogo:**
   - Productos CUSTOM muestran badge "Contactar"
   - Botón "Solicitar Presupuesto" redirige a checkout
   - En checkout, muestra formulario de contacto

## Queries SQL para Verificación

```sql
-- Verificar regiones creadas
SELECT * FROM regions ORDER BY sort_order;

-- Verificar sistemas operativos con precios
SELECT * FROM operating_systems ORDER BY sort_order;

-- Verificar productos personalizados
SELECT id, name, product_type, contact_email FROM products WHERE product_type = 'CUSTOM';

-- Verificar órdenes con desglose de precios
SELECT id, order_number, base_price, region_price_adj, os_price_adj, total_amount
FROM orders ORDER BY created_at DESC LIMIT 5;
```

## Archivos Creados/Modificados

### Backend (12 archivos)
- `apps/backend/prisma/schema.prisma` - MODIFICADO
- `apps/backend/src/services/regionService.ts` - NUEVO
- `apps/backend/src/services/operatingSystemService.ts` - NUEVO
- `apps/backend/src/services/productService.ts` - MODIFICADO
- `apps/backend/src/services/orderService.ts` - MODIFICADO
- `apps/backend/src/controllers/regionController.ts` - NUEVO
- `apps/backend/src/controllers/operatingSystemController.ts` - NUEVO
- `apps/backend/src/routes/regions.ts` - NUEVO
- `apps/backend/src/routes/operating-systems.ts` - NUEVO
- `apps/backend/src/index.ts` - MODIFICADO

### Frontend (14 archivos)
- `apps/frontend/src/lib/api/client.ts` - MODIFICADO
- `apps/frontend/src/lib/api/endpoints.ts` - MODIFICADO
- `apps/frontend/src/lib/hooks/use-admin.ts` - MODIFICADO
- `apps/frontend/src/types/product.ts` - MODIFICADO
- `apps/frontend/src/types/order.ts` - MODIFICADO
- `apps/frontend/src/app/admin/regions/page.tsx` - NUEVO
- `apps/frontend/src/app/admin/regions/new/page.tsx` - NUEVO
- `apps/frontend/src/app/admin/operating-systems/page.tsx` - NUEVO
- `apps/frontend/src/app/admin/operating-systems/new/page.tsx` - NUEVO
- `apps/frontend/src/app/admin/products/new/page.tsx` - MODIFICADO
- `apps/frontend/src/app/admin/products/[id]/edit/page.tsx` - MODIFICADO
- `apps/frontend/src/app/(public)/checkout/page.tsx` - MODIFICADO
- `apps/frontend/src/app/(public)/catalog/page.tsx` - MODIFICADO
