import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import EmployeeDetailScreen from './src/screens/EmployeeDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  Employees: undefined;
  EmployeeDetail: { id: number; name?: string };
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
