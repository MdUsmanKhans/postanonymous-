// firebase-config.js
// 1. Go to https://console.firebase.google.com, create a project.
// 2. Add a "Web app" to the project to get this config object
//    (Project settings → General → Your apps → SDK setup and configuration).
// 3. Paste your real values below.
// 4. Enable "Firestore Database" (Build → Firestore Database → Create database).
// 5. Enable "Authentication" → Sign-in method → Email/Password.
// 6. Set the security rules shown in README.md.
//
// NOTE: We do NOT use Firebase Storage here, since Google removed it from the
// free Spark plan (it now requires the paid Blaze plan with billing enabled).
// Images are instead uploaded directly to Cloudinary's free tier from the
// browser — see cloudinary-config.js.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: " your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
  };

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
