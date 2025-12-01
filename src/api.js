// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LocatorProvider } from './src/context';
import FamilySetupScreen from './src/screens/FamilySetupScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import SosScreen from './src/screens/SosScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <LocatorProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="FamilySetup"
            component={FamilySetupScreen}
            options={{ title: 'Family & Trip Setup' }}
          />
          <Stack.Screen
            name="Tracking"
            component={TrackingScreen}
            options={{ title: 'Live Tracking' }}
          />
          <Stack.Screen
            name="SOS"
            component={SosScreen}
            options={{ title: 'SOS – Emergency' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LocatorProvider>
  );
}
