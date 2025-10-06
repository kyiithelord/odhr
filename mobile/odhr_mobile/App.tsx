import 'intl-pluralrules';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './src/screens/LoginScreen';
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import EmployeeDetailScreen from './src/screens/EmployeeDetailScreen';
import LeavesListScreen from './src/screens/LeavesListScreen';
import LeaveCreateScreen from './src/screens/LeaveCreateScreen';
import AttendanceListScreen from './src/screens/AttendanceListScreen';
import AttendanceCreateScreen from './src/screens/AttendanceCreateScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import PayslipsScreen from './src/screens/PayslipsScreen';
import PayslipDetailScreen from './src/screens/PayslipDetailScreen';
import ManagerDashboardScreen from './src/screens/ManagerDashboardScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { ThemeProvider } from './src/ui/themeProvider';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './src/i18n';
import { NotificationsProvider, useNotifications } from './src/contexts/NotificationsContext';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  EmployeeDetail: { id: number; name?: string };
  LeaveCreate: undefined;
  AttendanceCreate: undefined;
  PayslipDetail: { id: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export type TabParamList = {
  Dashboard: undefined;
  Employees: undefined;
  Attendance: undefined;
  Leaves: undefined;
  Payslips: undefined;
  Announcements: undefined;
  ManagerDashboard?: undefined;
  Settings: undefined;
};
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  return (
    <Tab.Navigator initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'home',
            Employees: 'people',
            Attendance: 'time',
            Leaves: 'calendar',
            Payslips: 'cash',
            Announcements: 'megaphone',
            Notifications: 'notifications',
            ManagerDashboard: 'speedometer',
            Settings: 'settings',
          };
          const name = map[route.name] || 'ellipse';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('tab.dashboard') }} />
      <Tab.Screen name="Employees" component={EmployeeListScreen} options={{ title: t('tab.employees') }} />
      <Tab.Screen name="Attendance" component={AttendanceListScreen} options={{ title: t('tab.attendance') }} />
      <Tab.Screen name="Leaves" component={LeavesListScreen} options={{ title: t('tab.leaves') }} />
      <Tab.Screen name="Payslips" component={PayslipsScreen} options={{ title: t('tab.payslips') }} />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{
          title: t('tab.announcements'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      {hasRole('manager','hr','admin') ? (
        <Tab.Screen name="ManagerDashboard" component={ManagerDashboardScreen} options={{ title: t('tab.manager') }} />
      ) : null}
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('tab.settings') }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { loading, me } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {me ? (
        <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={({ route }) => ({ headerShown: true, title: route.params.name || 'Employee' })} />
          <Stack.Screen name="LeaveCreate" component={LeaveCreateScreen} options={{ headerShown: true, title: 'New Leave' }} />
          <Stack.Screen name="AttendanceCreate" component={AttendanceCreateScreen} options={{ headerShown: true, title: 'New Attendance' }} />
          <Stack.Screen name="PayslipDetail" component={PayslipDetailScreen} options={{ headerShown: true, title: 'Payslip' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ODHR Login' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <NotificationsProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
