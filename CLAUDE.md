# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cloud Vertice** is a VPS reselling platform that integrates with Contabo API. The platform allows customers to purchase VPS instances at customized prices while administrators manage the manual provisioning of machines through Contabo.

**Language:** This project primarily uses Spanish for documentation and user-facing content. Technical code comments and variable names should be in English.

**Key Business Flow:**
1. Client selects VPS and completes payment
2. Administrator receives notification and manually provisions VPS in Contabo
3. Administrator assigns the Contabo instance to the client
4. Client manages their VPS through the client panel (actions proxied to Contabo API)

## Mockup Structure

The `mockup/` directory contains HTML/TailwindCSS prototypes for UI components. These are **reference designs**, not the actual application code. When implementing features:

- **Public pages:** Landing page, pricing/catalog (`mockup/public_landing_page/`, `mockup/vps_pricing_&_catalog/`)
- **Client portal:** Dashboard, server management (`mockup/client_dashboard_overview/`, `mockup/server_management_panel/`)
- **Admin panel:** Order management, analytics, product setup (`mockup/admin_order_management/`, `mockup/admin_analytics_dashboard/`, `mockup/admin_product_&_pricing_setup/`)
- **Checkout flow:** `mockup/vps_checkout_flow/`

**Design System:**
- Primary color: `#3c83f6` (blue)
- Dark mode background: `#0F172A` (Slate 900)
- Card background: `#1E293B` (Slate 800)
- Font: Inter
- Icons: Material Symbols Outlined

## Architecture (From PDA Document)

See `PDA_Plataforma_Reventa_VPS_Contabo.md` for complete specification.

### Recommended Stack (Node.js option)
- **Frontend:** Next.js 14 + Tailwind CSS + Shadcn/UI
- **Backend:** Express.js / Fastify
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Auth:** JWT with Passport.js

### Key Integrations
- **Contabo API:** OAuth2 authentication, endpoint proxying for VPS actions
- **Payments:** Stripe (or MercadoLibre for Latin America)
- **Email:** Brevo (SMTP)

### Core Data Models
- `users` - Customer and admin accounts
- `products` - VPS plans mapped to Contabo product IDs (V91, V92, etc.)
- `orders` - Purchase orders with workflow states
- `vps_instances` - Provisioned instances linked to Contabo instance IDs
- `images` - Available OS images synced from Contabo
- `snapshots` - VPS snapshots
- `transactions`, `invoices`, `support_tickets`

## Contabo API Integration

The platform acts as a **proxy** to Contabo API. Client actions on their VPS (start, stop, restart, snapshots) are forwarded to Contabo's API.

**Authentication flow (OAuth2):**
```
POST https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token
```

**Key endpoints proxied:**
- `GET /v1/compute/instances` - List instances
- `POST /v1/compute/instances/{id}/actions/start` - Start VPS
- `POST /v1/compute/instances/{id}/actions/stop` - Stop VPS
- `POST /v1/compute/instances/{id}/actions/restart` - Restart VPS
- `POST /v1/compute/instances/{id}/actions/shutdown` - ACPI shutdown
- `POST /v1/compute/instances/{id}/actions/rescue` - Rescue mode
- `POST /v1/compute/instances/{id}/actions/resetPassword` - Reset root password
- `GET/POST /v1/compute/instances/{id}/snapshots` - Snapshot management

**Critical security:** Before proxying any request, verify that the `vps_instance_id` belongs to the authenticated user and the service is active.

## Security Requirements

- VPS root passwords must be encrypted with AES-256 before storage (see PDA section 11.2 for implementation)
- Contabo API credentials in environment variables only
- Rate limiting on all endpoints
- JWT with short expiry (15min) + refresh tokens

## Order State Machine

```
pending -> paid -> processing -> provisioning -> completed
              |                              |
              v                              v
          cancelled                     cancelled
```

Administrators manually transition orders through states after provisioning in Contabo.

## Contabo Product Mapping

| ProductId | Plan Name | RAM | CPU | Disk |
|-----------|-----------|-----|-----|------|
| V91 | VPS 10 NVMe | 4 GB | 2 | 75 GB NVMe |
| V92 | VPS 10 SSD | 4 GB | 2 | 150 GB SSD |
| V94 | VPS 20 NVMe | 8 GB | 4 | 100 GB NVMe |
| V95 | VPS 20 SSD | 8 GB | 4 | 200 GB SSD |
| V97 | VPS 30 NVMe | 16 GB | 6 | 200 GB NVMe |
| V98 | VPS 30 SSD | 16 GB | 6 | 400 GB SSD |
| V8 | VDS S | 24 GB | 4 | 180 GB NVMe |
| V9 | VDS M | 48 GB | 8 | 240 GB NVMe |

## Development Phases

The project is organized into 6 phases (16 weeks total):
1. **Fundamentos** - Setup, auth, Contabo API integration
2. **Catálogo y Órdenes** - Products, orders, payment integration
3. **Panel de Cliente** - Dashboard, VPS management, snapshots
4. **Panel Administrativo** - Admin dashboard, order provisioning
5. **Facturación y Soporte** - Invoices, tickets
6. **Testing y Deployment** - QA, production deployment

## Environment Variables (Reference)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vps_reseller
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Contabo API
CONTABO_CLIENT_ID=your-client-id
CONTABO_CLIENT_SECRET=your-client-secret
CONTABO_API_USER=your-api-user
CONTABO_API_PASSWORD=your-api-password

# Encryption (for VPS passwords)
ENCRYPTION_KEY=your-32-byte-hex-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SMTP_USER=your-brevo-smtp-login-email
```
