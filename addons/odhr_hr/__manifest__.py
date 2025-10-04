# -*- coding: utf-8 -*-
{
    'name': 'ODHR HR Extensions',
    'version': '18.0.1.0.0',
    'summary': 'Customizations for HR on Odoo 18',
    'author': 'ODHR',
    'website': '',
    'category': 'Human Resources',
    'license': 'LGPL-3',
    'depends': [
        'hr',
        'hr_contract',
        'hr_attendance',
        'hr_holidays',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_employee_views.xml',
    ],
    'installable': True,
    'application': False,
}
