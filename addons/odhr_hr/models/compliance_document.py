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
        # Simple log-based notifier; integrate with mail if needed
        soon = fields.Date.to_string(date.today())
        docs = self.search([('expiry_date', '!=', False), ('expiry_date', '<=', soon)])
        for d in docs:
            _logger.info('Compliance doc expiring/expired: %s (Emp %s)', d.name, d.employee_id.display_name)
        return True
