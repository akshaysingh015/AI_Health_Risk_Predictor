importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Using your REAL keys here too!
firebase.initializeApp({
  apiKey: "AIzaSyDnGGBB4r7aHd7i51hjgqTaoYRLqoqZZn0",
  authDomain: "healthsync-ai-2eb68.firebaseapp.com",
  projectId: "healthsync-ai-2eb68",
  storageBucket: "healthsync-ai-2eb68.firebasestorage.app",
  messagingSenderId: "25956005308",
  appId: "1:25956005308:web:4f9662944aeca961e9a7b9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});