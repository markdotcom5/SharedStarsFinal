import { initUI } from "../ui/menu.js";
import { initNavigation } from "../ui/navigation.js";
import { initTraining } from "../training/trainingIndex.js";
import { initAPI } from "./dashboard.js";  
import { initAuth } from "../auth/signup.js";

// Initialize App
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ App Initialized");

    // Initialize Modules
    initUI();
    initNavigation();
    initTraining();
    initAPI();
    initAuth();
});
