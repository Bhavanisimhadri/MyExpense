import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 📱 Screens (keep yours)
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

const db = SQLite.openDatabase({ name: 'ExpenseDB.db', location: 'default' });
const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  // 🔹 Check for saved session
  useEffect(() => {
    db.transaction(tx => {
      // Ensure Session table exists
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Session (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile TEXT
        );`
      );

      // Read saved session
      tx.executeSql(
        'SELECT mobile FROM Session LIMIT 1;',
        [],
        (_, sessionResult) => {
          if (sessionResult.rows.length > 0) {
            const mobile = sessionResult.rows.item(0).mobile;
            console.log("📱 Restoring session for:", mobile);

            // Find user details from Users table
            tx.executeSql(
              'SELECT * FROM Users WHERE mobile = ?;',
              [mobile],
              (_, userResult) => {
                if (userResult.rows.length > 0) {
                  const user = userResult.rows.item(0);
                  const screenMap = {
                    Women: 'WomenScreen',
                    Men: 'MenScreen',
                    Student: 'StudentScreen',
                    Elder: 'ElderScreen',
                    Partners: 'PartnersScreen',
                    Friends: 'FriendsScreen',
                  };

                  setInitialRoute(
                    user.category ? screenMap[user.category] : 'Home'
                  );
                } else {
                  setInitialRoute('Login');
                }
              }
            );
          } else {
            setInitialRoute('Splash');
          }
        },
        err => {
          console.log("❌ Session check error:", err);
          setInitialRoute('Splash');
        }
      );
    });
  }, []);

  // 🔹 Your existing notification + Firebase setup stays as is
  useEffect(() => {
    PushNotification.createChannel(
      {
        channelId: "default-channel-id",
        channelName: "Reminders",
        importance: 4,
        soundName: "default",
        vibrate: true,
      },
      (created) => console.log("📢 Notification channel created:", created)
    );

    PushNotification.configure({
      onNotification: (notification) => {
        console.log("🔔 Local Notification received:", notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });

    async function initFirebase() {
      try {
        const authStatus = await messaging().requestPermission();
        if (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        ) {
          const token = await messaging().getToken();
          console.log("📱 FCM Token:", token);
        }
      } catch (error) {
        console.log("🔥 FCM init error:", error);
      }
    }

    initFirebase();
  }, []);

  // 🔹 Navigation
  return (
    <NavigationContainer>
      {/* Show loading indicator while initialRoute is not set */}
      {!initialRoute ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D35225" />
        </View>
      ) : (
        <Stack.Navigator initialRouteName={initialRoute}>
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
      )}
    </NavigationContainer>
  );
}
