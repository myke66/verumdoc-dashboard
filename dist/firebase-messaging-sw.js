importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyDNYHvwCMLTyqQcKXDbsKAjJRPsK-yS7yw",
  authDomain:        "portal-afastamento.firebaseapp.com",
  projectId:         "portal-afastamento",
  storageBucket:     "portal-afastamento.firebasestorage.app",
  messagingSenderId: "671557450883",
  appId:             "1:671557450883:web:2556e00512996ca4e8efb6",
});

const messaging = firebase.messaging();

// Notificação em background (app fechado)
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
  });
});