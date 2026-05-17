const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workflowSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  
  parent_id: { type: String, default: null },
  
  input_schema: { type: mongoose.Schema.Types.Mixed, required: true },
  
  steps: { type: Array, default: [] }, 
  
  start_step_id: { type: String, default: null }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  _id: false,
  minimize: false
});

module.exports = mongoose.model('Workflow', workflowSchema);