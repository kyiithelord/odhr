# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from datetime import date
import logging

_logger = logging.getLogger(__name__)


class ComplianceDocument(models.Model):
    _name = 'odhr.compliance.document'
    _description = 'Employee Compliance Document'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(required=True, tracking=True)
    employee_id = fields.Many2one('hr.employee', required=True, index=True, ondelete='cascade', tracking=True)
    document_type = fields.Selection([
        ('id', 'National ID'),
        ('visa', 'Visa/Permit'),
        ('certificate', 'Certificate'),
        ('other', 'Other'),
    ], default='other', required=True)
    issue_date = fields.Date()
    expiry_date = fields.Date(index=True)
    attachment_id = fields.Many2one('ir.attachment', string='Attachment')
    notes = fields.Text()
    is_expired = fields.Boolean(compute='_compute_is_expired', store=True)

    @api.depends('expiry_date')
    def _compute_is_expired(self):
        today = date.today()
        for rec in self:
            rec.is_expired = bool(rec.expiry_date and rec.expiry_date < today)

    @api.model
    def cron_notify_expiring_documents(self):
        # Create a TODO activity on the document for the document owner or HR
        today_str = fields.Date.to_string(date.today())
        docs = self.search([('expiry_date', '!=', False), ('expiry_date', '<=', today_str)])
        activity_type = self.env.ref('mail.mail_activity_data_todo')
        hr_group = self.env.ref('hr.group_hr_user')
        for d in docs:
            _logger.info('Compliance doc expiring/expired: %s (Emp %s)', d.name, d.employee_id.display_name)
            # assign to employee's user if available; else any HR user
            user = d.employee_id.user_id or (hr_group.users[:1] if hr_group and hr_group.users else False)
            if not user:
                continue
            existing = self.env['mail.activity'].search([
                ('res_model', '=', d._name),
                ('res_id', '=', d.id),
                ('activity_type_id', '=', activity_type.id),
                ('user_id', '=', user.id),
            ], limit=1)
            if existing:
                continue
            self.env['mail.activity'].create({
                'activity_type_id': activity_type.id,
                'res_model': d._name,
                'res_id': d.id,
                'user_id': user.id,
                'summary': _('Compliance document expiring/expired'),
                'note': _('Document %s for %s is expiring or has expired (expiry: %s).') % (d.name, d.employee_id.display_name, d.expiry_date or ''),
            })
        return True
