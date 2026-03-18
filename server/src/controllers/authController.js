// server/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'halleyx_super_secret_key', { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Suspended') {
        return res.status(403).json({ status: 'error', message: 'Account is suspended.' });
      }

      res.json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error during login' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Name, email, and password are required.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'A user with this email already exists.' });
    }

    const user = await User.create({ name, email, password, role, status });

    res.status(201).json({
      status: 'success',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    console.error('Create staff error:', error.message);
    res.status(500).json({ status: 'error', message: 'Error creating user: ' + error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error fetching users' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { name, email, role, status, password } = req.body;

    const updateData = { name, email, role, status };
    
    // If admin provides a new password, hash it manually
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error updating user: ' + error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    if (user.role === 'Admin' && user.email === 'admin@halleyx.com') {
      return res.status(403).json({ status: 'error', message: 'Cannot delete the Master Admin.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'User removed successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error deleting user: ' + error.message });
  }
};

// THE FIX: Secure Password Change Controller
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    // Step 1: Verify the current password matches what is in the DB
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Incorrect current password.' });
    }

    // Step 2: Update the password 
    // (Using .save() triggers the Mongoose pre-save hook to hash the new password)
    user.password = newPassword;
    await user.save();

    res.json({ status: 'success', message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error changing password: ' + error.message });
  }
};