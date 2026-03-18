// server/models/Settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  workspaceName: { type: String, default: 'HaloFlow Workspace' },
  maxIterations: { type: Number, default: 50 },
  retryLimit: { type: Number, default: 3 },
  defaultRuleBehavior: { type: String, enum: ['fail', 'skip', 'continue'], default: 'fail' },
  notifyOnFail: { type: Boolean, default: true },
  notifyOnComplete: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);