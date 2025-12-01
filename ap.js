import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import FamilyLocatorScreen from './src/screens/FamilyLocatorScreen';
import SpiritualEventsScreen from './src/screens/SpiritualEventsScreen';
import VoucherScreen from './src/screens/VoucherScreen';
import DriverTripsScreen from './src/screens/DriverTripsScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator>
        {!session ? (
          // Not logged in → only Login screen
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Driver Login' }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Arfeen Travel' }}
            />
            <Stack.Screen
              name="FamilyLocator"
              component={FamilyLocatorScreen}
              options={{ title: 'Family Locator' }}
            />
            <Stack.Screen
              name="SpiritualEvents"
              component={SpiritualEventsScreen}
              options={{ title: 'Spiritual Tracker' }}
            />
            <Stack.Screen
              name="Voucher"
              component={VoucherScreen}
              options={{ title: 'My Voucher' }}
            />
            <Stack.Screen
              name="DriverTrips"
              component={DriverTripsScreen}
              options={{ title: 'Driver Trips' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
