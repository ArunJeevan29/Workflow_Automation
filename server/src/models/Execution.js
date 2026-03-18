const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stepLogSchema = new mongoose.Schema({
  step_name: { type: String, required: true },
  step_type: { type: String, required: true },
  evaluated_rules: [{
    rule: { type: String },
    result: { type: Boolean }
  }],
  selected_next_step: { type: String, default: null },
  // Allow all states the engine may write
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending_approval'],
    required: true
  },
  approver_id: { type: String, default: null },
  error_message: { type: String, default: null },
  started_at: { type: Date, required: true },
  ended_at: { type: Date, default: null }  // null is valid for in-progress steps
}, { _id: false });

const executionSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  workflow_id: { type: String, required: true, ref: 'Workflow' },
  workflow_version: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'canceled'],
    default: 'pending'
  },

  data: { type: mongoose.Schema.Types.Mixed, required: true },

  logs: [stepLogSchema],

  current_step_id: { type: String, default: null },

  retries: { type: Number, default: 0 },
  triggered_by: { type: String, required: true },

  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  _id: false
});

module.exports = mongoose.model('Execution', executionSchema);