# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase, tagged


@tagged('-at_install', 'post_install')
class TestOdhrBasic(TransactionCase):
    def test_models_exist(self):
        self.env['odhr.compliance.document']
        self.env['odhr.onboarding.checklist']
        self.env['odhr.onboarding.task']

    def test_probation_cron(self):
        # Should not raise
        self.env['hr.employee'].cron_notify_probation_end()
