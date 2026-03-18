const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  message: { 
    type: String, 
    required: true 
  },
  workflow_id: { 
    type: String,
    required: true 
  },
  execution_id: { 
    type: String,
    required: true 
  },
  is_read: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Notification', notificationSchema);