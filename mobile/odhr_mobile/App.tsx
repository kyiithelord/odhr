import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import EmployeeDetailScreen from './src/screens/EmployeeDetailScreen';
import LeavesListScreen from './src/screens/LeavesListScreen';
import LeaveCreateScreen from './src/screens/LeaveCreateScreen';
import AttendanceListScreen from './src/screens/AttendanceListScreen';
import AttendanceCreateScreen from './src/screens/AttendanceCreateScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Employees: undefined;
  EmployeeDetail: { id: number; name?: string };
  Leaves: undefined;
  LeaveCreate: undefined;
  Attendance: undefined;
  AttendanceCreate: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ODHR Login' }} />
        <Stack.Screen name="Employees" component={EmployeeListScreen} options={{ title: 'Employees' }} />
        <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={({ route }) => ({ title: route.params.name || 'Employee' })} />
        <Stack.Screen name="Leaves" component={LeavesListScreen} options={{ title: 'Leaves' }} />
        <Stack.Screen name="LeaveCreate" component={LeaveCreateScreen} options={{ title: 'New Leave' }} />
        <Stack.Screen name="Attendance" component={AttendanceListScreen} options={{ title: 'Attendance' }} />
        <Stack.Screen name="AttendanceCreate" component={AttendanceCreateScreen} options={{ title: 'New Attendance' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
