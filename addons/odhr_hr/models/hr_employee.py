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
        for emp in recs:
            _logger.info('Probation ends today for %s', emp.display_name)
        return True
