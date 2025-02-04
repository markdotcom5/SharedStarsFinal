const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://steltrek-mvp5.firebaseio.com", // Replace with your Realtime Database URL
});

module.exports = admin;

