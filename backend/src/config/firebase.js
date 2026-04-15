const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production (Cloud Run), uses Application Default Credentials automatically.
// Locally, set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key path.

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'stadiumos-demo'
  });
}

const db = admin.firestore();

module.exports = { admin, db };
