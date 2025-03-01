const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

// Import Firebase Config
const firebaseConfig = require("./firebase.config.js"); // ✅ Ensure `.js` extension

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const firestore = firebase.firestore();

module.exports = { auth, firestore };
