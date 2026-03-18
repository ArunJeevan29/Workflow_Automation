// server/models/Fund.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true }, // e.g., "Top Up", "Withdrawal", or "Workflow: Expense Flow"
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  created_at: { type: Date, default: Date.now }
});

const fundSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactions: [transactionSchema] // Array of all history
}, { timestamps: true });

module.exports = mongoose.model('Fund', fundSchema);