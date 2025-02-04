const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assessment: {
    responses: { type: Array, default: [] },
    completedAt: { type: Date, default: null }
  },
  status: { type: String, default: "in-progress" }
});

module.exports = mongoose.model("Session", SessionSchema);
