const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ruleSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  step_id: { type: String, required: true, ref: 'Step' },
  
  condition: { type: String, required: true },
  
  // UUID of the next step. If null/empty, the workflow terminates successfully.
  next_step_id: { type: String, default: null, ref: 'Step' },
  
  priority: { type: Number, required: true }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  _id: false 
});

module.exports = mongoose.model('Rule', ruleSchema);