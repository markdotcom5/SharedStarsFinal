const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true // ✅ `unique: true` automatically creates an index
  },
  simulationId: { 
    type: String, 
    required: true, 
    index: true // ✅ Keep this if frequently queried
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
    // ❌ Remove `index: true` unless you frequently search by userId
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ If needed, define composite or additional indexes efficiently:
simulationSchema.index({ simulationId: 1, userId: 1 }); // Example: Combined index for faster queries

module.exports = mongoose.model("Simulation", simulationSchema);
