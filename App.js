import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Register from "./pages/Authentication/Register";
import Login from "./pages/Authentication/Login";
import Dashboard from "./pages/Dashboard";
import SymptomsAnalysis from "./pages/SymptomsAnalysis";
import ClinicFinder from "./pages/ClinicFinder";
import Settings from "./pages/Settings";
import SplashScreen from "./pages/SplashScreen";
import Toast from "react-native-toast-message";
import MapComponent from "./components/MapComponent";
import VideoConsultationScreen from "./pages/VideoConsultation/VideoConsultationScreen";
import Ambulance from './pages/Ambulance';
import ForgotPassword from './pages/Authentication/ForgotPassword';
import AccountCenter from "./pages/Settings/AccountCenter";
import About from "./pages/Settings/About";
import PrivacyPolicy from "./pages/Settings/PrivacyPolicy";
import TermsOfUse from "./pages/Settings/TermsOfUse";
import Health from './pages/Health';
import { StatusBar } from 'react-native';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false 
        }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="VideoConsultationScreen" component={VideoConsultationScreen} />
        <Stack.Screen name="SymptomsAnalysis" component={SymptomsAnalysis} />
        <Stack.Screen name="ClinicFinder" component={ClinicFinder} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="AccountCenter" component={AccountCenter} />
        <Stack.Screen name="About" component={About} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUse} />
        <Stack.Screen name="MapComponent" component={MapComponent} />
        <Stack.Screen name="Ambulance" component={Ambulance} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Health" component={Health} />
      </Stack.Navigator>

      <Toast />
    </NavigationContainer>
  );
}

export default App;
