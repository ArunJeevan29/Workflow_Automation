// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Manager', 'Finance', 'HR', 'Employee'], 
    default: 'Employee' 
  },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  // If the password wasn't modified, just return and let Mongoose continue
  if (!this.isModified('password')) {
    return; 
  }
  
  // Otherwise, hash the new password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);