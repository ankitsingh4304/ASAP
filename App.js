import React from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MenuScreen from "./screens/MenuScreen";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen"; // Patient Dashboard
import DoctorDashboard from "./screens/DoctorDashboard"; // Doctor Dashboard
import ReportsScreen from "./screens/ReportsScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import BPHIstoryScreen from "./screens/BPHistoryScreen";
import PatientDetailsScreen from "./screens/PatientDetailsScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignupScreen"
          component={SignupScreen}
          options={{ headerShown: false }}
        />

        {/* Patient */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="MenuScreen" component={MenuScreen} />
        <Stack.Screen name="ReportsScreen" component={ReportsScreen} />
        <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />
        <Stack.Screen name="BPHIstoryScreen" component={BPHIstoryScreen} />

        {/* Doctor */}
        <Stack.Screen
          name="DoctorDashboard"
          component={DoctorDashboard}
          options={{ headerShown: true, title: "Doctor Dashboard" }}
        />
        <Stack.Screen
          name="PatientDetailsScreen"
          component={PatientDetailsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
