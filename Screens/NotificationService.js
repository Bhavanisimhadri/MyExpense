// Services/NotificationService.js
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

// Configure PushNotification
PushNotification.configure({
  onNotification: function (notification) {
    console.log('NOTIFICATION RECEIVED:', notification);
    
    // Mark as notified in database when notification is opened
    if (notification.userInfo && notification.userInfo.id) {
      const DatabaseHelper = require('./DatabaseHelper').DatabaseHelper;
      DatabaseHelper.markAsNotified(notification.userInfo.id);
    }
  },

  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true,
  requestPermissions: true, // Request permissions for both iOS and Android
});

// Create notification channel (Required for Android 8+)
PushNotification.createChannel(
  {
    channelId: "default-channel-id",
    channelName: "Default Channel",
    channelDescription: "A default channel for app notifications",
    playSound: true,
    soundName: "default",
    importance: 4, // IMPORTANCE_HIGH
    vibrate: true,
  },
  (created) => console.log(`Notification channel ready: ${created}`)
);

export default PushNotification;