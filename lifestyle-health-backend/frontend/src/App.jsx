import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

// Importing your newly created pages!
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import TargetSetup from './pages/TargetSetup';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

function App() {
  useEffect(() => {
    const syncNotificationToken = async () => {
      console.log("1️⃣ Starting notification setup...");
      try {
        console.log("2️⃣ Requesting permission from browser...");
        const permission = await Notification.requestPermission();
        console.log("3️⃣ Browser permission status:", permission);
        
        if (permission === 'granted') {
          console.log("4️⃣ Permission granted! Manually locating Service Worker...");
          
          // 1. Register the service worker file
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          
          // 2. WAIT for it to fully wake up and become active (This fixes the error!)
          const registration = await navigator.serviceWorker.ready;
          console.log("✅ Service Worker is fully awake! Reaching out to Firebase...");

          // 3. Pass the awake registration directly to Firebase
          const currentToken = await getToken(messaging, { 
            vapidKey: 'BPASZLPspLQGyIkNSyzXJshAZme_WF24sgEXz4M3OtGZ22G5zmSW6Rp5-uMo4YoI6F5ufcAcvg8CP3Xd6Dy6yrU',
            serviceWorkerRegistration: registration 
          });

          console.log("5️⃣ Firebase responded!");

          if (currentToken) {
            console.log("👇👇👇 HERE IS YOUR TOKEN 👇👇👇");
            console.log(currentToken);
            console.log("👆👆👆 COPY THE LONG TEXT ABOVE 👆👆👆");

            const jwtToken = localStorage.getItem('token');
            if (!jwtToken) return; 

            await fetch('http://localhost:3000/api/users/update-token', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
              },
              body: JSON.stringify({ token: currentToken })
            });
            console.log("🚀 FCM Device Token successfully registered with backend.");
          } else {
            console.warn("⚠️ Token was empty.");
          }
        } else {
          console.log("❌ Permission was NOT granted. It is:", permission);
        }
      } catch (error) {
        console.error("❌ FIRBASE ERROR:", error);
      }
    };

    syncNotificationToken();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        
        {/* We can drop your Navbar component right here later! */}

        <Routes>
          {/* Automatically redirect the home page to the login screen */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* App Core Routes */}
          <Route path="/setup" element={<ProfileSetup />} />
          <Route path="/target-setup" element={<TargetSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;