# -*- coding: utf-8 -*-
import json
from base64 import b64decode
from odoo import http
from odoo.http import request, Response


class OdhrHrApiController(http.Controller):
    """Simple JSON API to expose HR data for mobile apps.

    Authentication:
    - Uses auth='user'. Mobile apps can authenticate via session (login) or HTTP Basic.
    - For Basic, use an Odoo user's login as username and an API key as password.
    """

    def _authenticate_basic(self):
        """Authenticate using Basic Auth header and db query param.
        Returns (ok: bool, reason: str, info: dict)
        Sets the session user on success.
        """
        info = {}
        db = request.params.get('db') or request.httprequest.args.get('db')
        if not db:
            return False, 'missing_db', info
        info['db'] = db
        auth = request.httprequest.headers.get('Authorization')
        if not auth or not auth.lower().startswith('basic '):
            return False, 'missing_authorization', info
        try:
            raw = b64decode(auth.split(' ', 1)[1]).decode('utf-8')
            if ':' not in raw:
                return False, 'malformed_authorization', info
            login, password = raw.split(':', 1)
            info['login'] = login
            # Try (db, login, password) first
            try:
                uid = request.session.authenticate(db, login, password)
            except TypeError as e:
                # Fallback: set session db and try (login, password)
                try:
                    request.session.db = db
                except Exception:
                    pass
                try:
                    uid = request.session.authenticate(login, password)
                except Exception as e2:
                    info['exception'] = str(e2)
                    return False, 'exception', info
            if uid:
                info['uid'] = uid
                return True, 'ok', info
            return False, 'bad_credentials', info
        except Exception as e:
            info['exception'] = str(e)
            return False, 'exception', info

    @http.route(
        "/odhr/api/employees",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def list_employees(self, **kwargs):
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        """Return a paginated list of employees (HTTP JSON)."""
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json")
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        search = (params.get("search") or "").strip()

        domain = []
        if search:
            domain = ["|", ("name", "ilike", search), ("work_email", "ilike", search)]

        fields = [
            "name",
            "work_email",
            "work_phone",
            "mobile_phone",
            "job_title",
            "department_id",
            "work_location_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "probation_end_date",
        ]
        employees = request.env["hr.employee"].sudo().search(domain, limit=limit, offset=offset)
        data = employees.read(fields)
        # Expand many2one fields to {id, name}
        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        for rec in data:
            if rec.get("department_id"):
                rec["department_id"] = m2o(rec["department_id"])  # type: ignore
            if rec.get("work_location_id"):
                rec["work_location_id"] = m2o(rec["work_location_id"])  # type: ignore
        payload = {
            "count": len(data),
            "limit": limit,
            "offset": offset,
            "items": data,
        }
        return Response(json.dumps(payload), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/employees/<int:employee_id>",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def employee_detail(self, employee_id, **kwargs):
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        """Return details for a single employee by ID (HTTP JSON)."""
        fields = [
            "name",
            "work_email",
            "work_phone",
            "mobile_phone",
            "job_title",
            "department_id",
            "work_location_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "probation_end_date",
            "image_1920",
        ]
        emp = request.env["hr.employee"].sudo().browse(employee_id)
        if not emp.exists():
            return Response(json.dumps({"error": "not_found", "message": "Employee not found"}), status=404, mimetype="application/json")
        rec = emp.read(fields)[0]

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        if rec.get("department_id"):
            rec["department_id"] = m2o(rec["department_id"])  # type: ignore
        if rec.get("work_location_id"):
            rec["work_location_id"] = m2o(rec["work_location_id"])  # type: ignore
        return Response(json.dumps(rec), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/ping",
        type="http",
        auth="public",
        methods=["GET"],
        csrf=False,
    )
    def ping(self, **kwargs):
        ok, reason, info = self._authenticate_basic()
        status = 200 if ok else 401
        payload = {"ok": ok, "reason": reason, "info": info}
        return Response(json.dumps(payload), status=status, mimetype="application/json")
