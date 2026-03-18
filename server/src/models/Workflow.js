// server/models/Workflow.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workflowSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true }, 
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  
  // THE FIX: Added parent_id to group different versions of the same workflow together
  parent_id: { type: String, default: null },
  
  // Stores the dynamic JSON schema for the form
  input_schema: { type: mongoose.Schema.Types.Mixed, required: true },
  
  // Stores the array of steps (Approval, Task, etc.)
  steps: { type: Array, default: [] }, 
  
  start_step_id: { type: String, default: null }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  _id: false,
  minimize: false // Ensures empty objects in input_schema are saved
});

module.exports = mongoose.model('Workflow', workflowSchema);