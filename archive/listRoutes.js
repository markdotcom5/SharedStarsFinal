const express = require("express");
const app = require("./app");
const listEndpoints = require("express-list-endpoints");

console.log("📌 Available API Routes:");
console.table(listEndpoints(app));
