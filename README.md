# ODHR - Odoo 18 HR Extensions

This project provides a Docker-based environment for Odoo 18 and a custom addon `odhr_hr` that extends the standard `hr` module.

## Prerequisites
- Docker and Docker Compose installed

## Quick start
1. Start services:
   ```bash
   docker compose up -d
   ```
2. Open Odoo at http://localhost:8069, create a new database.
3. Activate developer mode (Settings → Developer mode).
4. Install the base HR app (`hr`).
5. Update Apps list (Apps → Update Apps List) and search for `ODHR HR Extensions`; install it.

The custom fields will appear on the Employee form under the "ODHR" tab.

## Addons path
The custom addons are mounted to `/mnt/extra-addons` in the Odoo container via `./addons`.

## Development
- Add more fields or features under `addons/odhr_hr/`.
- After code changes, update the module:
  - Apps → `ODHR HR Extensions` → Upgrade

## Services
- Odoo Web: http://localhost:8069
- Postgres runs inside the `db` service with default credentials (user: `odoo`, password: `odoo`).
