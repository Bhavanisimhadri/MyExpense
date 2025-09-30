import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './Screens/Splash';
import LoginScreen from './Screens/Login';
import SignUpScreen from './Screens/SignUpScreen';
import HomeScreen from './Screens/Home';
import WomenScreen from './Screens/WomenScreen';
import MenScreen from './Screens/MenScreen';
import StudentScreen from './Screens/StudentScreen';
import ElderScreen from './Screens/ElderScreen';
import PartnersScreen from './Screens/PartnersScreen';
import FriendsScreen from './Screens/FriendsScreen';  
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
           <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false  }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false  }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false  }} />
       <Stack.Screen name="WomenScreen" component={WomenScreen} />
        <Stack.Screen name="MenScreen" component={MenScreen} />
        <Stack.Screen name="StudentScreen" component={StudentScreen} />
        <Stack.Screen name="ElderScreen" component={ElderScreen} />
        <Stack.Screen name="PartnersScreen" component={PartnersScreen} />
        <Stack.Screen name="FriendsScreen" component={FriendsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
