# -*- coding: utf-8 -*-
from odoo import api, fields, models


class OffboardingChecklist(models.Model):
    _name = 'odhr.offboarding.checklist'
    _description = 'Offboarding Checklist'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(required=True, tracking=True)
    employee_id = fields.Many2one('hr.employee', required=True, index=True, ondelete='cascade', tracking=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('cancel', 'Cancelled'),
    ], default='draft', tracking=True)
    task_ids = fields.One2many('odhr.offboarding.task', 'checklist_id', string='Tasks')
    progress = fields.Float(compute='_compute_progress', store=False)

    @api.depends('task_ids.state')
    def _compute_progress(self):
        for rec in self:
            total = len(rec.task_ids)
            if not total:
                rec.progress = 0.0
                continue
            done = len(rec.task_ids.filtered(lambda t: t.state == 'done'))
            rec.progress = 100.0 * done / total

    def action_start(self):
        for rec in self:
            rec.state = 'in_progress'
        return True

    def action_done(self):
        for rec in self:
            rec.state = 'done'
        return True

    def action_cancel(self):
        for rec in self:
            rec.state = 'cancel'
        return True


class OffboardingTask(models.Model):
    _name = 'odhr.offboarding.task'
    _description = 'Offboarding Task'
    _order = 'sequence, id'

    name = fields.Char(required=True)
    checklist_id = fields.Many2one('odhr.offboarding.checklist', required=True, ondelete='cascade', index=True)
    sequence = fields.Integer(default=10)
    owner_id = fields.Many2one('res.users', string='Owner')
    due_date = fields.Date()
    state = fields.Selection([
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ], default='todo')
    notes = fields.Text()
