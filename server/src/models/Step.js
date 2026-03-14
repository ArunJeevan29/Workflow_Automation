const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stepSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  workflow_id: { type: String, required: true, ref: 'Workflow' },
  name: { type: String, required: true, trim: true },
  
  step_type: { 
    type: String, 
    required: true, 
    enum: ['task', 'approval', 'notification'] 
  },
  
  order: { type: Number, required: true },
  
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  _id: false 
});

module.exports = mongoose.model('Step', stepSchema);