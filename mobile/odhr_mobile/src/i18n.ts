import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      tab: {
        dashboard: 'Dashboard',
        employees: 'Employees',
        attendance: 'Attendance',
        leaves: 'Leaves',
        payslips: 'Payslips',
        announcements: 'News',
        notifications: 'Notifications',
        manager: 'Manager',
        settings: 'Settings',
      },
    },
  },
  my: {
    translation: {
      tab: {
        dashboard: 'ဒက်ရှ်ဘုတ်',
        employees: 'ဝန်ထမ်းများ',
        attendance: 'တက်ရောက်မှု',
        leaves: 'ခွင့်များ',
        payslips: 'လစာစောင်',
        announcements: 'သတင်း',
        notifications: 'အကြောင်းကြားချက်များ',
        manager: 'မန်နေဂျာ',
        settings: 'ပြင်ဆင်ချက်',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
