# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


class OdhrHrApiController(http.Controller):
    """Simple JSON API to expose HR data for mobile apps.

    Authentication:
    - Uses auth='user'. Mobile apps can authenticate via session (login) or HTTP Basic.
    - For Basic, use an Odoo user's login as username and an API key as password.
    """

    @http.route(
        "/odhr/api/employees",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def list_employees(self, **kwargs):
        """Return a paginated list of employees.

        Expected JSON body:
        {
            "limit": 50,
            "offset": 0,
            "search": "optional name/email search"
        }
        """
        params = request.jsonrequest or {}
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
        return {
            "count": len(data),
            "limit": limit,
            "offset": offset,
            "items": data,
        }

    @http.route(
        "/odhr/api/employees/<int:employee_id>",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def employee_detail(self, employee_id, **kwargs):
        """Return details for a single employee by ID."""
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
            return {"error": "not_found", "message": "Employee not found"}
        rec = emp.read(fields)[0]

        def m2o(val):
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return {"id": val[0], "name": val[1]}
            return None

        if rec.get("department_id"):
            rec["department_id"] = m2o(rec["department_id"])  # type: ignore
        if rec.get("work_location_id"):
            rec["work_location_id"] = m2o(rec["work_location_id"])  # type: ignore
        return rec
