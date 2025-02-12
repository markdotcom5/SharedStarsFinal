const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  name: { type: String, required: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  description: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  progress: { type: Number, default: 0 },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
