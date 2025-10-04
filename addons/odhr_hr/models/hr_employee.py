# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import date
import logging

_logger = logging.getLogger(__name__)


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    emergency_contact_name = fields.Char(string='Emergency Contact Name')
    emergency_contact_phone = fields.Char(string='Emergency Contact Phone')
    probation_end_date = fields.Date(string='Probation End Date')

    @api.model
    def cron_notify_probation_end(self):
        """Daily notifier for employees whose probation ends today.
        Currently logs; can be extended to mail activity/notifications.
        """
        today = date.today()
        recs = self.sudo().search([('probation_end_date', '=', today)])
        activity_type = self.env.ref('mail.mail_activity_data_todo')
        hr_group = self.env.ref('hr.group_hr_user')
        for emp in recs:
            _logger.info('Probation ends today for %s', emp.display_name)
            user = emp.user_id or (hr_group.users[:1] if hr_group and hr_group.users else False)
            if not user:
                continue
            existing = self.env['mail.activity'].search([
                ('res_model', '=', emp._name),
                ('res_id', '=', emp.id),
                ('activity_type_id', '=', activity_type.id),
                ('user_id', '=', user.id),
            ], limit=1)
            if existing:
                continue
            self.env['mail.activity'].create({
                'activity_type_id': activity_type.id,
                'res_model': emp._name,
                'res_id': emp.id,
                'user_id': user.id,
                'summary': 'Probation ends today',
                'note': 'Employee %s probation ends today.' % emp.display_name,
            })
        return True
