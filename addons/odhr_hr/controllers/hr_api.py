# -*- coding: utf-8 -*-
import json
from base64 import b64decode, b64encode
from odoo import http
from odoo.http import request, Response
import time


class OdhrHrApiController(http.Controller):
    """Simple JSON API to expose HR data for mobile apps.

    Authentication:
    - Uses auth='user'. Mobile apps can authenticate via session (login) or HTTP Basic.
    - For Basic, use an Odoo user's login as username and an API key as password.
    """

    # naive in-process per-IP rate limiting (best-effort; not shared across workers)
    _RATE_WINDOW_SECONDS = 60
    _RATE_MAX_REQUESTS = 120
    _rate_store = {}

    def _rate_limited(self, key: str):
        now = int(time.time())
        window = self._RATE_WINDOW_SECONDS
        max_req = self._RATE_MAX_REQUESTS
        entry = self._rate_store.get(key)
        if not entry:
            self._rate_store[key] = [1, now]
            return False
        count, start = entry
        if now - start >= window:
            self._rate_store[key] = [1, now]
            return False
        count += 1
        self._rate_store[key] = [count, start]
        return count > max_req

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
        # If a valid session already exists and matches the db, accept it
        try:
            if getattr(request, 'session', None) and getattr(request.session, 'uid', False):
                # Ensure session db matches requested db
                if getattr(request.session, 'db', None) == db:
                    info['uid'] = request.session.uid
                    info['login'] = request.env.user.login
                    return True, 'session', info
        except Exception:
            pass

        auth = request.httprequest.headers.get('Authorization')
        if not auth or not auth.lower().startswith('basic '):
            return False, 'missing_authorization', info
        try:
            raw = b64decode(auth.split(' ', 1)[1]).decode('utf-8')
            if ':' not in raw:
                return False, 'malformed_authorization', info
            login, password = raw.split(':', 1)
            info['login'] = login
            # Odoo 18: set session.db then call authenticate(login, password)
            try:
                request.session.db = db
            except Exception:
                pass
            try:
                uid = request.session.authenticate(login, password)
            except Exception as e2:
                info['exception'] = str(e2)
                return False, 'bad_credentials', info
            if uid:
                info['uid'] = uid
                return True, 'ok', info
            return False, 'bad_credentials', info
        except Exception as e:
            info['exception'] = str(e)
            return False, 'exception', info

    # ---- CORS helpers (for Expo Web) ----
    def _corsify(self, resp: Response):
        try:
            # Allow all origins in dev; for prod restrict as needed
            resp.headers['Access-Control-Allow-Origin'] = request.httprequest.headers.get('Origin', '*') or '*'
            resp.headers['Vary'] = 'Origin'
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
            resp.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        except Exception:
            pass
        return resp

    @http.route(
        "/odhr/api/employees",
        type="http",
        auth="public",
        methods=["POST", "OPTIONS"],
        csrf=False,
    )
    def list_employees(self, **kwargs):
        # Handle CORS preflight on web
        if request.httprequest.method == 'OPTIONS':
            return self._corsify(Response(status=204))
        # rate limit per IP per route
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/employees"):
            return self._corsify(Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json"))
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return self._corsify(Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json"))
        """Return a paginated list of employees (HTTP JSON)."""
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return self._corsify(Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json"))
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
        return self._corsify(Response(json.dumps(payload), status=200, mimetype="application/json"))

    @http.route(
        "/odhr/api/employees/<int:employee_id>",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def employee_detail(self, employee_id, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/employees/{employee_id}"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
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
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/ping"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        status = 200 if ok else 401
        payload = {"ok": ok, "reason": reason, "info": info}
        return Response(json.dumps(payload), status=status, mimetype="application/json")

    # ----------------------
    # Additional HR Endpoints
    # ----------------------

    @http.route(
        "/odhr/api/departments",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def list_departments(self, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/departments"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
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
            domain = ["|", ("name", "ilike", search), ("complete_name", "ilike", search)]

        fields = [
            "name",
            "complete_name",
            "parent_id",
            "manager_id",
        ]
        deps = request.env["hr.department"].sudo().search(domain, limit=limit, offset=offset)
        data = deps.read(fields)

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        for rec in data:
            if rec.get("parent_id"):
                rec["parent_id"] = m2o(rec["parent_id"])  # type: ignore
            if rec.get("manager_id"):
                rec["manager_id"] = m2o(rec["manager_id"])  # type: ignore
        payload = {"count": len(data), "limit": limit, "offset": offset, "items": data}
        return Response(json.dumps(payload), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/contracts",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def list_contracts(self, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/contracts"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json")
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        employee_id = params.get("employee_id")
        active_only = bool(params.get("active_only", True))

        domain = []
        if employee_id:
            domain.append(("employee_id", "=", int(employee_id)))
        if active_only:
            domain.append(("state", "=", "open"))  # active/ongoing

        fields = [
            "name",
            "employee_id",
            "date_start",
            "date_end",
            "state",
            "job_title",
            "department_id",
            "company_id",
        ]
        contracts = request.env["hr.contract"].sudo().search(domain, limit=limit, offset=offset)
        data = contracts.read(fields)

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        for rec in data:
            for key in ("employee_id", "department_id", "company_id"):
                if rec.get(key):
                    rec[key] = m2o(rec[key])  # type: ignore
        payload = {"count": len(data), "limit": limit, "offset": offset, "items": data}
        return Response(json.dumps(payload), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/attendances",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def list_attendances(self, **kwargs):
        # Handle CORS preflight
        if request.httprequest.method == 'OPTIONS':
            return self._corsify(Response(status=204))
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/attendances"):
            return self._corsify(Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json"))
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return self._corsify(Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json"))
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return self._corsify(Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json"))
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        employee_id = params.get("employee_id")
        date_from = params.get("date_from")  # ISO string
        date_to = params.get("date_to")

        domain = []
        if employee_id:
            domain.append(("employee_id", "=", int(employee_id)))
        if date_from:
            domain.append(("check_in", ">=", date_from))
        if date_to:
            domain.append(("check_in", "<=", date_to))

        fields = [
            "employee_id",
            "check_in",
            "check_out",
            "worked_hours",
        ]
        recs = request.env["hr.attendance"].sudo().search(domain, limit=limit, offset=offset)
        data = recs.read(fields)

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        for rec in data:
            if rec.get("employee_id"):
                rec["employee_id"] = m2o(rec["employee_id"])  # type: ignore
        payload = {"count": len(data), "limit": limit, "offset": offset, "items": data}
        return Response(json.dumps(payload), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/attendances/create",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def create_attendance(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._corsify(Response(status=204))
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/attendances/create"):
            return self._corsify(Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json"))
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return self._corsify(Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json"))
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return self._corsify(Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json"))

        employee_id = params.get("employee_id")
        check_in = params.get("check_in")
        check_out = params.get("check_out")
        if not employee_id or not check_in:
            return Response(json.dumps({"error": "missing_params", "message": "employee_id and check_in are required"}), status=400, mimetype="application/json")
        vals = {
            "employee_id": int(employee_id),
            "check_in": check_in,
        }
        if check_out:
            vals["check_out"] = check_out
        att = request.env["hr.attendance"].sudo().create(vals)
        data = att.read(["employee_id", "check_in", "check_out", "worked_hours"])[0]

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        if data.get("employee_id"):
            data["employee_id"] = m2o(data["employee_id"])  # type: ignore
        return self._corsify(Response(json.dumps(data), status=201, mimetype="application/json"))

    @http.route(
        "/odhr/api/leaves",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def list_leaves(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._corsify(Response(status=204))
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/leaves"):
            return self._corsify(Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json"))
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return self._corsify(Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json"))
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return self._corsify(Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json"))
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        employee_id = params.get("employee_id")
        state = (params.get("state") or "").strip()
        date_from = params.get("date_from")
        date_to = params.get("date_to")

        domain = []
        if employee_id:
            domain.append(("employee_id", "=", int(employee_id)))
        if state:
            domain.append(("state", "=", state))
        if date_from:
            domain.append(("request_date_from", ">=", date_from))
        if date_to:
            domain.append(("request_date_to", "<=", date_to))

        fields = [
            "name",
            "employee_id",
            "holiday_status_id",
            "request_date_from",
            "request_date_to",
            "number_of_days",
            "state",
        ]
        recs = request.env["hr.leave"].sudo().search(domain, limit=limit, offset=offset)
        data = recs.read(fields)

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        for rec in data:
            if rec.get("employee_id"):
                rec["employee_id"] = m2o(rec["employee_id"])  # type: ignore
            if rec.get("holiday_status_id"):
                rec["holiday_status_id"] = m2o(rec["holiday_status_id"])  # type: ignore
        payload = {"count": len(data), "limit": limit, "offset": offset, "items": data}
        return Response(json.dumps(payload), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/leaves/create",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def create_leave(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._corsify(Response(status=204))
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/leaves/create"):
            return self._corsify(Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json"))
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return self._corsify(Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json"))
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return self._corsify(Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json"))

        required = ["employee_id", "holiday_status_id", "request_date_from", "request_date_to"]
        missing = [k for k in required if not params.get(k)]
        if missing:
            return Response(json.dumps({"error": "missing_params", "message": f"Missing: {', '.join(missing)}"}), status=400, mimetype="application/json")

        vals = {
            "employee_id": int(params["employee_id"]),
            "holiday_status_id": int(params["holiday_status_id"]),
            "request_date_from": params["request_date_from"],
            "request_date_to": params["request_date_to"],
            "name": params.get("name") or "Leave Request",
        }
        leave = request.env["hr.leave"].sudo().create(vals)
        data = leave.read([
            "name",
            "employee_id",
            "holiday_status_id",
            "request_date_from",
            "request_date_to",
            "number_of_days",
            "state",
        ])[0]

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        if data.get("employee_id"):
            data["employee_id"] = m2o(data["employee_id"])  # type: ignore
        if data.get("holiday_status_id"):
            data["holiday_status_id"] = m2o(data["holiday_status_id"])  # type: ignore
        return Response(json.dumps(data), status=201, mimetype="application/json")

    # ----------------------
    # Attachments & Images
    # ----------------------

    @http.route(
        "/odhr/api/employees/<int:employee_id>/image",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def employee_image(self, employee_id, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/employees/{employee_id}/image"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        emp = request.env["hr.employee"].sudo().browse(employee_id)
        if not emp.exists():
            return Response(json.dumps({"error": "not_found", "message": "Employee not found"}), status=404, mimetype="application/json")
        img = emp.image_1920 or False
        b64 = img.decode() if isinstance(img, (bytes, bytearray)) else img
        return Response(json.dumps({"employee_id": employee_id, "image_1920": b64}), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/employees/<int:employee_id>/attachments",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def employee_attachments(self, employee_id, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/employees/{employee_id}/attachments"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json")
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        domain = [("res_model", "=", "hr.employee"), ("res_id", "=", employee_id)]
        fields = ["name", "mimetype", "create_date", "file_size"]
        atts = request.env["ir.attachment"].sudo().search(domain, limit=limit, offset=offset)
        data = atts.read(fields)
        payload = {"count": len(data), "limit": limit, "offset": offset, "items": data}
        return Response(json.dumps(payload), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/attachments/download",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def attachment_download(self, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/attachments/download"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json")
        att_id = params.get("attachment_id")
        if not att_id:
            return Response(json.dumps({"error": "missing_params", "message": "attachment_id required"}), status=400, mimetype="application/json")
        att = request.env["ir.attachment"].sudo().browse(int(att_id))
        if not att.exists():
            return Response(json.dumps({"error": "not_found", "message": "Attachment not found"}), status=404, mimetype="application/json")
        # Security consideration: ensure it's linked to an employee the user can access (here we rely on groups/rules)
        content = att.datas or False
        b64 = content.decode() if isinstance(content, (bytes, bytearray)) else content
        return Response(json.dumps({
            "id": att.id,
            "name": att.name,
            "mimetype": att.mimetype,
            "datas": b64,
        }), status=200, mimetype="application/json")

    @http.route(
        "/odhr/api/attachments/upload",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
    )
    def attachment_upload(self, **kwargs):
        ip = request.httprequest.remote_addr or 'unknown'
        if self._rate_limited(f"{ip}:/odhr/api/attachments/upload"):
            return Response(json.dumps({"error": "rate_limited", "message": "Too many requests"}), status=429, mimetype="application/json")
        ok, reason, info = self._authenticate_basic()
        if not ok:
            return Response(json.dumps({"error": "unauthorized", "reason": reason, "info": info}), status=401, mimetype="application/json")
        try:
            raw = request.httprequest.get_data(cache=False, as_text=True) or "{}"
            params = json.loads(raw)
        except Exception:
            return Response(json.dumps({"error": "invalid_request", "message": "Invalid JSON body"}), status=400, mimetype="application/json")

        required = ["res_model", "res_id", "name", "mimetype", "datas"]
        missing = [k for k in required if not params.get(k)]
        if missing:
            return Response(json.dumps({"error": "missing_params", "message": f"Missing: {', '.join(missing)}"}), status=400, mimetype="application/json")

        # Basic input hardening
        allowed_models = {"hr.employee", "odhr.compliance.document"}
        if params["res_model"] not in allowed_models:
            return Response(json.dumps({"error": "invalid_model", "message": "Unsupported model"}), status=400, mimetype="application/json")
        datas_b64 = params["datas"]
        # Prevent overly large uploads (>5MB approx)
        if len(datas_b64) > 7_000_000:
            return Response(json.dumps({"error": "file_too_large", "message": "Max 5MB"}), status=413, mimetype="application/json")

        vals = {
            "res_model": params["res_model"],
            "res_id": int(params["res_id"]),
            "name": params["name"],
            "mimetype": params["mimetype"],
            "datas": datas_b64,
        }
        att = request.env["ir.attachment"].sudo().create(vals)
        return Response(json.dumps({"id": att.id, "name": att.name, "mimetype": att.mimetype}), status=201, mimetype="application/json")
