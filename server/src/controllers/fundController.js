// server/controllers/fundController.js
const Fund = require('../models/Fund');

// Helper to get the single company wallet (creates one if it doesn't exist)
const getCompanyWallet = async () => {
  let fund = await Fund.findOne();
  if (!fund) {
    fund = await Fund.create({ balance: 94500, transactions: [] }); // Starting balance based on your UI
  }
  return fund;
};

exports.getWalletData = async (req, res, next) => {
  try {
    const fund = await getCompanyWallet();
    
    // Calculate "This Month" (Credits) and "Spent" (Debits)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let topUpThisMonth = 0;
    let spentThisMonth = 0;

    fund.transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear && tx.status === 'success') {
        if (tx.type === 'credit') topUpThisMonth += tx.amount;
        if (tx.type === 'debit') spentThisMonth += tx.amount;
      }
    });

    // Sort transactions newest first
    const sortedTransactions = fund.transactions.sort((a, b) => b.created_at - a.created_at);

    res.status(200).json({ 
      status: 'success', 
      data: {
        balance: fund.balance,
        topUpThisMonth,
        spentThisMonth,
        transactions: sortedTransactions
      } 
    });
  } catch (error) {
    next(error);
  }
};

exports.topUpWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ status: 'error', message: 'Invalid amount' });

    const fund = await getCompanyWallet();
    
    fund.balance += amount;
    fund.transactions.push({
      type: 'credit',
      amount: amount,
      description: 'Manual Top Up via Dashboard',
      status: 'success'
    });

    await fund.save();

    res.status(200).json({ status: 'success', message: 'Funds added successfully', data: fund.balance });
  } catch (error) {
    next(error);
  }
};

exports.withdrawWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ status: 'error', message: 'Invalid amount' });

    const fund = await getCompanyWallet();

    if (fund.balance < amount) {
      return res.status(400).json({ status: 'error', message: 'Insufficient funds for withdrawal' });
    }

    fund.balance -= amount;
    fund.transactions.push({
      type: 'debit',
      amount: amount,
      description: 'Manual Withdrawal via Dashboard',
      status: 'success'
    });

    await fund.save();

    res.status(200).json({ status: 'success', message: 'Funds withdrawn successfully', data: fund.balance });
  } catch (error) {
    next(error);
  }
};