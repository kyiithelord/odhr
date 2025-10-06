# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request
import base64
import json


def _json_response(data=None, status=200):
    content = json.dumps(data or {}, default=str)
    return request.make_response(
        content,
        headers=[('Content-Type', 'application/json')],
        status=status,
    )


def _error(message: str, status=400):
    return _json_response({'error': message}, status=status)


def _parse_basic_auth(auth_header: str):
    try:
        if not auth_header or not auth_header.lower().startswith('basic '):
            return None, None
        token = auth_header.split(' ', 1)[1].strip()
        raw = base64.b64decode(token).decode('utf-8')
        login, password = raw.split(':', 1)
        return login, password
    except Exception:
        return None, None


def _authenticate_from_request():
    db = request.params.get('db') or request.httprequest.args.get('db')
    if not db:
        return None, _error('Missing db parameter', status=400)
    auth = request.httprequest.headers.get('Authorization')
    login, pwd = _parse_basic_auth(auth)
    if not login or not pwd:
        return None, _error('Missing or invalid Authorization header', status=401)
    try:
        uid = request.session.authenticate(db, login, pwd)
        if not uid:
            return None, _error('Unauthorized', status=401)
        env = request.env(user=uid)
        return env, None
    except Exception:
        return None, _error('Unauthorized', status=401)


class OdhrApiController(http.Controller):
    @http.route('/odhr/api/auth/me', type='http', auth='none', methods=['GET'], csrf=False)
    def auth_me(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        user = env.user
        roles = []
        try:
            if user.has_group('base.group_system'):
                roles.append('admin')
            if user.has_group('hr.group_hr_manager'):
                roles.append('manager')
                roles.append('hr')
            elif user.has_group('hr.group_hr_user'):
                roles.append('hr')
        except Exception:
            pass
        if not roles:
            roles.append('employee')

        employee = env['hr.employee'].sudo().search([('user_id', '=', user.id)], limit=1)
        company = user.company_id
        data = {
            'user_id': user.id,
            'employee_id': employee.id or None,
            'name': user.name,
            'login': user.login,
            'roles': roles,
            'company_id': company.id if company else None,
            'company_name': company.name if company else None,
        }
        return _json_response(data)

    @http.route('/odhr/api/employees/team', type='http', auth='none', methods=['POST'], csrf=False)
    def employees_team(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        manager_id = payload.get('manager_id')
        if manager_id:
            manager = env['hr.employee'].sudo().browse(int(manager_id))
        else:
            manager = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not manager or not manager.exists():
            return _error('Manager not found', status=404)
        members = env['hr.employee'].sudo().search([('parent_id', '=', manager.id)], order='name')
        return _json_response({'manager': self._serialize_employee(manager), 'members': [self._serialize_employee(e) for e in members]})

    # ===== Employees =====
    def _serialize_employee(self, emp):
        return {
            'id': emp.id,
            'name': emp.name,
            'work_email': emp.work_email,
            'work_phone': emp.work_phone,
            'mobile_phone': emp.mobile_phone,
            'job_title': emp.job_title,
            'department_id': emp.department_id.id if emp.department_id else None,
            'department_name': emp.department_id.name if emp.department_id else None,
            'manager_id': emp.parent_id.id if emp.parent_id else None,
            'manager_name': emp.parent_id.name if emp.parent_id else None,
            'work_location_id': emp.work_location_id.id if hasattr(emp, 'work_location_id') and emp.work_location_id else None,
            'join_date': emp.first_contract_date or emp.create_date,
            'image_128': emp.image_128,
        }

    @http.route('/odhr/api/employees/me', type='http', auth='none', methods=['GET'], csrf=False)
    def employees_me(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        return _json_response(self._serialize_employee(emp))

    @http.route('/odhr/api/employees/me/update', type='http', auth='none', methods=['POST'], csrf=False)
    def employees_me_update(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        # Limit editable fields
        allowed = {k: v for k, v in payload.items() if k in ['work_email', 'work_phone', 'mobile_phone', 'job_title', 'department_id', 'work_location_id', 'image_1920']}
        if 'department_id' in allowed and not env.user.has_group('hr.group_hr_user'):
            allowed.pop('department_id', None)
        if 'work_location_id' in allowed and not env.user.has_group('hr.group_hr_user'):
            allowed.pop('work_location_id', None)
        if allowed:
            emp.write(allowed)
        return _json_response(self._serialize_employee(emp))

    @http.route('/odhr/api/employees/<int:emp_id>', type='http', auth='none', methods=['GET'], csrf=False)
    def employees_get(self, emp_id, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().browse(emp_id)
        if not emp.exists():
            return _error('Employee not found', status=404)
        return _json_response(self._serialize_employee(emp))

    @http.route('/odhr/api/employees/search', type='http', auth='none', methods=['POST'], csrf=False)
    def employees_search(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        domain = []
        q = payload.get('q')
        if q:
            domain += ['|', '|', ('name', 'ilike', q), ('work_email', 'ilike', q), ('job_title', 'ilike', q)]
        dept_id = payload.get('department_id')
        if dept_id:
            domain.append(('department_id', '=', int(dept_id)))
        manager_id = payload.get('manager_id')
        if manager_id:
            domain.append(('parent_id', '=', int(manager_id)))
        limit = int(payload.get('limit') or 20)
        offset = int(payload.get('offset') or 0)
        Employee = env['hr.employee'].sudo()
        count = Employee.search_count(domain)
        items = Employee.search(domain, limit=limit, offset=offset, order='name')
        data = {
            'total': count,
            'limit': limit,
            'offset': offset,
            'items': [self._serialize_employee(e) for e in items],
        }
        return _json_response(data)

    @http.route('/odhr/api/departments', type='http', auth='none', methods=['POST'], csrf=False)
    def departments(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        domain = []
        search = payload.get('search')
        if search:
            domain.append(('name', 'ilike', search))
        limit = int(payload.get('limit') or 50)
        offset = int(payload.get('offset') or 0)
        Department = env['hr.department'].sudo()
        count = Department.search_count(domain)
        items = Department.search(domain, limit=limit, offset=offset, order='name')
        data = {
            'total': count,
            'limit': limit,
            'offset': offset,
            'items': [{'id': d.id, 'name': d.name, 'parent_id': d.parent_id.id or None} for d in items],
        }
        return _json_response(data)

    # ===== Attendance =====
    def _serialize_attendance(self, att):
        return {
            'id': att.id,
            'check_in': att.check_in,
            'check_out': att.check_out,
            'worked_hours': att.worked_hours,
            'manual': True,
            'reason': None,
        }

    @http.route('/odhr/api/attendance/checkin', type='http', auth='none', methods=['POST'], csrf=False)
    def attendance_checkin(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        # close any open attendance before new check-in
        open_att = env['hr.attendance'].sudo().search([('employee_id', '=', emp.id), ('check_out', '=', False)], limit=1)
        if open_att:
            open_att.write({'check_out': fields.Datetime.now()})
        att = env['hr.attendance'].sudo().create({'employee_id': emp.id, 'check_in': fields.Datetime.now()})
        return _json_response(self._serialize_attendance(att))

    @http.route('/odhr/api/attendance/checkout', type='http', auth='none', methods=['POST'], csrf=False)
    def attendance_checkout(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        open_att = env['hr.attendance'].sudo().search([('employee_id', '=', emp.id), ('check_out', '=', False)], limit=1)
        if not open_att:
            return _error('No open attendance to checkout', status=400)
        open_att.write({'check_out': fields.Datetime.now()})
        return _json_response(self._serialize_attendance(open_att))

    @http.route('/odhr/api/attendance/history', type='http', auth='none', methods=['POST'], csrf=False)
    def attendance_history(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        domain = [('employee_id', '=', emp.id)]
        from_str = payload.get('from')
        to_str = payload.get('to')
        if from_str:
            domain.append(('check_in', '>=', from_str))
        if to_str:
            domain.append(('check_in', '<=', to_str))
        limit = int(payload.get('limit') or 50)
        offset = int(payload.get('offset') or 0)
        Attendance = env['hr.attendance'].sudo()
        count = Attendance.search_count(domain)
        items = Attendance.search(domain, limit=limit, offset=offset, order='check_in desc')
        data = {
            'total': count,
            'limit': limit,
            'offset': offset,
            'items': [self._serialize_attendance(a) for a in items],
        }
        return _json_response(data)

    # ===== Leave (Time Off) =====
    def _serialize_leave(self, leave):
        return {
            'id': leave.id,
            'type_id': leave.holiday_status_id.id if hasattr(leave, 'holiday_status_id') and leave.holiday_status_id else None,
            'type_name': leave.holiday_status_id.name if hasattr(leave, 'holiday_status_id') and leave.holiday_status_id else None,
            'date_from': getattr(leave, 'request_date_from', None) or getattr(leave, 'date_from', None),
            'date_to': getattr(leave, 'request_date_to', None) or getattr(leave, 'date_to', None),
            'duration': getattr(leave, 'number_of_days', 0.0) or 0.0,
            'reason': getattr(leave, 'name', None),
            'state': leave.state,
            'employee_id': leave.employee_id.id if leave.employee_id else None,
        }

    @http.route('/odhr/api/leave/types', type='http', auth='none', methods=['GET'], csrf=False)
    def leave_types(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        types = env['hr.leave.type'].sudo().search([])
        data = [{'id': t.id, 'name': t.name, 'code': getattr(t, 'code', None)} for t in types]
        return _json_response(data)

    @http.route('/odhr/api/leave/apply', type='http', auth='none', methods=['POST'], csrf=False)
    def leave_apply(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        type_id = int(payload.get('type_id') or 0) or None
        date_from = payload.get('date_from') or payload.get('request_date_from')
        date_to = payload.get('date_to') or payload.get('request_date_to')
        reason = payload.get('reason') or payload.get('name')
        if not (type_id and date_from and date_to):
            return _error('type_id, date_from, date_to are required', status=400)
        vals = {
            'employee_id': emp.id,
            'holiday_status_id': type_id,
            'request_date_from': date_from,
            'request_date_to': date_to,
        }
        if reason:
            vals['name'] = reason
        leave = env['hr.leave'].sudo().create(vals)
        # Submit for approval if flow requires
        try:
            if hasattr(leave, 'action_confirm'):
                leave.action_confirm()
        except Exception:
            pass
        return _json_response(self._serialize_leave(leave))

    @http.route('/odhr/api/leave/my', type='http', auth='none', methods=['POST'], csrf=False)
    def leave_my(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        domain = [('employee_id', '=', emp.id)]
        states = payload.get('state')
        if states and isinstance(states, list):
            domain.append(('state', 'in', states))
        limit = int(payload.get('limit') or 20)
        offset = int(payload.get('offset') or 0)
        Leave = env['hr.leave'].sudo()
        count = Leave.search_count(domain)
        items = Leave.search(domain, limit=limit, offset=offset, order='request_date_from desc')
        data = {
            'total': count,
            'limit': limit,
            'offset': offset,
            'items': [self._serialize_leave(l) for l in items],
        }
        return _json_response(data)

    @http.route('/odhr/api/leave/balances', type='http', auth='none', methods=['GET'], csrf=False)
    def leave_balances(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        # Basic placeholder: remaining = 0; extend with proper computation later
        types = env['hr.leave.type'].sudo().search([])
        data = [{'type_id': t.id, 'type_name': t.name, 'remaining': 0, 'unit': 'days'} for t in types]
        return _json_response(data)

    @http.route('/odhr/api/leave/<int:leave_id>/approve', type='http', auth='none', methods=['POST'], csrf=False)
    def leave_approve(self, leave_id, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        if not (env.user.has_group('hr.group_hr_user') or env.user.has_group('hr.group_hr_manager')):
            return _error('Forbidden', status=403)
        leave = env['hr.leave'].sudo().browse(leave_id)
        if not leave.exists():
            return _error('Leave not found', status=404)
        try:
            if hasattr(leave, 'action_approve'):
                leave.action_approve()
            elif hasattr(leave, 'action_validate'):
                leave.action_validate()
        except Exception:
            return _error('Unable to approve leave', status=400)
        return _json_response(self._serialize_leave(leave))

    @http.route('/odhr/api/leave/<int:leave_id>/reject', type='http', auth='none', methods=['POST'], csrf=False)
    def leave_reject(self, leave_id, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        if not (env.user.has_group('hr.group_hr_user') or env.user.has_group('hr.group_hr_manager')):
            return _error('Forbidden', status=403)
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        reason = payload.get('reason')
        leave = env['hr.leave'].sudo().browse(leave_id)
        if not leave.exists():
            return _error('Leave not found', status=404)
        try:
            if reason and hasattr(leave, 'message_post'):
                leave.message_post(body=f"Rejected: {reason}")
            if hasattr(leave, 'action_refuse'):
                leave.action_refuse()
        except Exception:
            return _error('Unable to reject leave', status=400)
        return _json_response(self._serialize_leave(leave))

    @http.route('/odhr/api/leave/calendar', type='http', auth='none', methods=['POST'], csrf=False)
    def leave_calendar(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        manager_id = payload.get('team_manager_id')
        if manager_id:
            employees = env['hr.employee'].sudo().search([('parent_id', '=', int(manager_id))])
        else:
            me = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
            employees = env['hr.employee'].sudo().search([('parent_id', '=', me.id)]) if me else env['hr.employee'].sudo().browse([])
        from_str = payload.get('from')
        to_str = payload.get('to')
        domain = [('employee_id', 'in', employees.ids)]
        if from_str:
            domain.append(('request_date_from', '>=', from_str))
        if to_str:
            domain.append(('request_date_to', '<=', to_str))
        leaves = env['hr.leave'].sudo().search(domain, order='request_date_from')
        return _json_response([self._serialize_leave(l) for l in leaves])

    # ===== Devices / Notifications =====
    @http.route('/odhr/api/devices/register', type='http', auth='none', methods=['POST'], csrf=False)
    def devices_register(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        platform = payload.get('platform')
        token = payload.get('token')
        if not platform or not token:
            return _error('platform and token are required', status=400)
        # Store as a partner device token via ir.config_parameter or a simple model if available
        # Minimal implementation: write on user/partner to avoid new model
        partner = env.user.partner_id.sudo()
        key_name = f'x_odhr_push_token_{platform}'
        try:
            partner.write({key_name: token})
        except Exception:
            # Fallback: store in system parameters keyed by user
            icp = env['ir.config_parameter'].sudo()
            icp.set_param(f'odhr.push.{platform}.{env.user.id}', token)
        return _json_response({'ok': True})

    # ===== Manager Overview (stub) =====
    @http.route('/odhr/api/manager/team_overview', type='http', auth='none', methods=['POST'], csrf=False)
    def manager_team_overview(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        if not (env.user.has_group('hr.group_hr_user') or env.user.has_group('hr.group_hr_manager')):
            return _error('Forbidden', status=403)
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        manager_id = payload.get('manager_id')
        if manager_id:
            manager = env['hr.employee'].sudo().browse(int(manager_id))
        else:
            manager = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not manager.exists():
            return _error('Manager not found', status=404)
        team = env['hr.employee'].sudo().search([('parent_id', '=', manager.id)])
        # Simple KPIs
        today = fields.Date.today()
        Attendance = env['hr.attendance'].sudo()
        Leave = env['hr.leave'].sudo()
        att_count = Attendance.search_count([('employee_id', 'in', team.ids), ('check_in', '>=', f'{today} 00:00:00')])
        leaves_count = Leave.search_count([('employee_id', 'in', team.ids), ('state', 'in', ['confirm', 'validate1', 'validate'])])
        return _json_response({'team_size': len(team), 'today_attendance_count': att_count, 'open_leaves_count': leaves_count})

    # ===== Announcements / News =====
    @http.route('/odhr/api/announcements', type='http', auth='none', methods=['POST'], csrf=False)
    def announcements(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        limit = int(payload.get('limit') or 20)
        offset = int(payload.get('offset') or 0)
        # Strategy: Prefer explicit channel_id if provided; else a channel named 'Announcements'; else fallback to public channel messages
        Channel = env['mail.channel'].sudo()
        chan = None
        channel_id = payload.get('channel_id')
        if channel_id:
            c = Channel.browse(int(channel_id))
            if c.exists():
                chan = c
        if not chan:
            chan = Channel.search([('name', 'ilike', 'Announcements')], limit=1)
        Message = env['mail.message'].sudo()
        domain = [('model', '=', 'mail.channel')]
        if chan:
            domain.append(('res_id', '=', chan.id))
        else:
            # Fallback: any public channel messages
            domain += [('message_type', '=', 'comment')]
        count = Message.search_count(domain)
        msgs = Message.search(domain, limit=limit, offset=offset, order='date desc')
        items = []
        for m in msgs:
            items.append({
                'id': m.id,
                'subject': (m.subject or (m.record_name or ''))[:120],
                'body_html': m.body,
                'body_text': (m.body or '').replace('<br>', '\n'),
                'date': m.date,
                'author_name': m.author_id.name if m.author_id else None,
            })
        return _json_response({'total': count, 'limit': limit, 'offset': offset, 'items': items})

    # ===== Payroll / Payslips =====
    def _serialize_payslip(self, p):
        return {
            'id': p.id,
            'name': p.name,
            'date_from': p.date_from,
            'date_to': p.date_to,
            'net_wage': getattr(p, 'net_wage', 0.0) or 0.0,
            'state': p.state,
        }

    @http.route('/odhr/api/payroll/payslips', type='http', auth='none', methods=['POST'], csrf=False)
    def payroll_payslips(self, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        try:
            payload = json.loads(request.httprequest.data.decode('utf-8') or '{}')
        except Exception:
            payload = {}
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        limit = int(payload.get('limit') or 20)
        offset = int(payload.get('offset') or 0)
        Payslip = env['hr.payslip'].sudo()
        domain = [('employee_id', '=', emp.id)]
        count = Payslip.search_count(domain)
        slips = Payslip.search(domain, limit=limit, offset=offset, order='date_from desc')
        return _json_response({'total': count, 'limit': limit, 'offset': offset, 'items': [self._serialize_payslip(p) for p in slips]})

    @http.route('/odhr/api/payroll/payslips/<int:slip_id>', type='http', auth='none', methods=['GET'], csrf=False)
    def payroll_payslip_detail(self, slip_id, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        slip = env['hr.payslip'].sudo().browse(slip_id)
        if not slip.exists() or slip.employee_id.id != emp.id:
            return _error('Payslip not found', status=404)
        lines = [{'code': l.code, 'name': l.name, 'amount': l.total} for l in slip.line_ids]
        return _json_response({'payslip': self._serialize_payslip(slip), 'lines': lines})

    @http.route('/odhr/api/payroll/payslips/<int:slip_id>/pdf', type='http', auth='none', methods=['GET'], csrf=False)
    def payroll_payslip_pdf(self, slip_id, **kwargs):
        env, err = _authenticate_from_request()
        if err:
            return err
        emp = env['hr.employee'].sudo().search([('user_id', '=', env.user.id)], limit=1)
        if not emp:
            return _error('No employee linked to current user', status=404)
        slip = env['hr.payslip'].sudo().browse(slip_id)
        if not slip.exists() or slip.employee_id.id != emp.id:
            return _error('Payslip not found', status=404)
        # Try common external id for payslip report
        report = env.ref('hr_payroll.action_report_payslip', raise_if_not_found=False)
        if not report:
            return _error('Payslip PDF report not available', status=404)
        pdf_bytes = report._render_qweb_pdf([slip.id])[0]
        pdf_b64 = base64.b64encode(pdf_bytes).decode('ascii')
        filename = f"payslip_{slip.id}.pdf"
        return _json_response({'filename': filename, 'pdf_base64': pdf_b64})
