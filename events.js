const express = require("express");
const listEndpoints = require("express-list-endpoints");
const app = require("./app"); // Adjust if your main file is not named app.js
const fs = require("fs");

const endpoints = listEndpoints(app);
fs.writeFileSync("endpoints.json", JSON.stringify(endpoints, null, 2));

console.log("✅ All endpoints have been saved to endpoints.json");
