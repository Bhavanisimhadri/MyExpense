// App.js
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 🧭 Screens
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
import AdminLoginScreen from './Screens/AdminLogin';
import AdminPanelScreen from './Screens/AdminPanel';

// Create stack navigator
const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // ✅ Step 1: Create notification channel (Android)
    PushNotification.createChannel(
      {
        channelId: "default-channel-id", // must match the ID used in WomenScreen.js
        channelName: "Reminders",
        importance: 4,
        soundName: "default",
        vibrate: true,
      },
      (created) => console.log("📢 Notification channel created:", created)
    );

    // ✅ Step 2: Configure local notification behavior
    PushNotification.configure({
      onNotification: (notification) => {
        console.log("🔔 Local Notification received:", notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });

    // ✅ Step 3: Initialize Firebase Messaging (FCM)
    async function initFirebase() {
      try {
        // Ask user for permission (mainly needed on iOS)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log("✅ FCM permission granted");
          const token = await messaging().getToken();
          console.log("📱 FCM Token:", token);
          // You can save this token in SQLite or send to your backend for remote notifications
        } else {
          console.log("⚠️ FCM permission denied");
        }

        // Handle messages when app is in background/quit state
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log("💬 Background FCM Message:", remoteMessage);
        });

        // Foreground messages
        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
          console.log("📨 Foreground FCM Message:", remoteMessage);
        });

        return unsubscribe;
      } catch (error) {
        console.log("🔥 FCM init error:", error);
      }
    }

    initFirebase();
  }, []);

  // ✅ Step 4: Keep your navigation as is
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WomenScreen" component={WomenScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MenScreen" component={MenScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StudentScreen" component={StudentScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ElderScreen" component={ElderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PartnersScreen" component={PartnersScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FriendsScreen" component={FriendsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
