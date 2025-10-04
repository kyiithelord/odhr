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

## Mobile API (for iOS/Android)

The addon exposes simple JSON endpoints for mobile apps. Auth is required.

### Authentication
- Use an Odoo user's login as username and an API Key as password (HTTP Basic over HTTPS recommended).
- Create API Key in Odoo: click your avatar → My Profile → Account Security → New API Key.
- Alternatively, authenticate via session cookies after logging in, but for mobile, API keys are preferred.

### Endpoints
Base URL: `http://<your_host>:8069`

1) List employees
```
POST /odhr/api/employees
Content-Type: application/json
Authorization: Basic <base64(login:api_key)>

Body (optional):
{
  "limit": 50,
  "offset": 0,
  "search": "john"
}

Response:
{
  "count": 2,
  "limit": 50,
  "offset": 0,
  "items": [ { ...employee fields... } ]
}
```

2) Employee detail
```
POST /odhr/api/employees/<employee_id>
Content-Type: application/json
Authorization: Basic <base64(login:api_key)>

Response:
{ ...employee fields... }
```

Returned fields include: `name`, `work_email`, `work_phone`, `mobile_phone`, `job_title`, `department_id`, `work_location_id`, `emergency_contact_name`, `emergency_contact_phone`, `probation_end_date`, `image_1920`.

Note: `department_id` and `work_location_id` are objects `{ id, name }`.

### cURL examples
```
curl -X POST \
  -H "Content-Type: application/json" \
  -u "user@example.com:API_KEY" \
  http://localhost:8069/odhr/api/employees \
  -d '{"limit": 20, "search": "john"}'

curl -X POST \
  -H "Content-Type: application/json" \
  -u "user@example.com:API_KEY" \
  http://localhost:8069/odhr/api/employees/1
```

## Mobile App plan

- Choose stack: Flutter (single codebase, great performance) or React Native (JS/TS ecosystem).
- Minimal features (phase 1):
  - Login with email + API key
  - List employees (pagination + search)
  - Employee detail page with picture and contact info
- Phase 2:
  - Offline caching, pull-to-refresh
  - Profile photo display from `image_1920`
  - Push notifications (optional)
  - Create/update endpoints (if needed) and role-based access

If you confirm the stack, we can scaffold the mobile app next and wire it to the above API.
