# Cloud Vertice

Plataforma de reventa de VPS con integración a Contabo API.

## Stack Tecnológico

- **Frontend:** Next.js 14 + Tailwind CSS + Shadcn/UI
- **Backend:** Express.js + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Auth:** JWT + Passport.js
- **Payments:** Stripe
- **Container:** Docker + Docker Compose

## Estructura del Proyecto

```
cloudvertice/
├── apps/
│   ├── frontend/          # Next.js App (cliente + admin)
│   └── backend/           # Express API
├── packages/
│   └── shared/            # Tipos y utilidades compartidas
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
└── docs/                  # Documentación técnica
```

## Comenzar

### Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- npm 10+

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servicios (PostgreSQL, Redis)
docker-compose up -d

# Ejecutar migraciones de base de datos
npm run db:migrate

# Iniciar desarrollo
npm run dev
```

### Scripts Disponibles

```bash
npm run dev          # Iniciar todos los servicios en modo desarrollo
npm run build        # Construir todos los proyectos
npm run test         # Ejecutar tests
npm run lint         # Ejecutar linters
npm run db:generate  # Generar cliente Prisma
npm run db:migrate   # Ejecutar migraciones
npm run db:push      # Push del schema a la DB
npm run db:studio    # Abrir Prisma Studio
```

## Documentación

Ver [CLAUDE.md](./CLAUDE.md) para guías de desarrollo y arquitectura.

Ver [PDA_Plataforma_Reventa_VPS_Contabo.md](./PDA_Plataforma_Reventa_VPS_Contabo.md) para especificaciones completas del proyecto.

## Estado del Proyecto

- [x] Planificación (PDA)
- [x] Mockups de UI
- [ ] Fase 1: Fundamentos
- [ ] Fase 2: Catálogo y Órdenes
- [ ] Fase 3: Panel de Cliente
- [ ] Fase 4: Panel Administrativo
- [ ] Fase 5: Facturación y Soporte
- [ ] Fase 6: Testing y Deployment
