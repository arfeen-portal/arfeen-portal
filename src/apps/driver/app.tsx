// @ts-nocheck
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DriverHomeScreen } from "./src/screens/DriverHomeScreen";
import { RideDetailScreen } from "./src/screens/RideDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={DriverHomeScreen}
          options={{ title: "My rides" }}
        />
        <Stack.Screen
          name="RideDetail"
          component={RideDetailScreen}
          options={{ title: "Ride detail" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
