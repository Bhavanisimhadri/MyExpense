import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './Screens/Splash';
import LoginScreen from './Screens/Login';
import SignUpScreen from './Screens/SignUpScreen';
import HomeScreen from './Screens/Home';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
           <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false  }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false  }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false  }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
