// client/src/pages/admin/Wallet.jsx
import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, CreditCard, RefreshCw, DollarSign } from 'lucide-react';
import api from '../utils/axios'; // Adjusted path to match your structure
import { useAlert } from '../context/AlertContext';
import { useConfirm } from '../context/ConfirmContext';

import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Wallet() {
  const { showAlert } = useAlert();
  const { promptAction } = useConfirm();
  const [walletData, setWalletData] = useState({
    balance: 0,
    topUpThisMonth: 0,
    spentThisMonth: 0,
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/fund');
      setWalletData(res.data.data);
    } catch (error) {
      console.error('Failed to load wallet data', error);
      showAlert('danger', 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amountStr = await promptAction({
      title: 'Top Up Wallet',
      message: 'Enter amount to Top Up ($):',
      defaultValue: '1000',
      type: 'info',
      confirmText: 'Top Up',
      cancelText: 'Cancel'
    });
    if (!amountStr) return;
    
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return showAlert('danger', 'Please enter a valid positive number');
    }

    try {
      setIsProcessing(true);
      await api.post('/fund/topup', { amount });
      showAlert('success', `Successfully added ${amount} to wallet`);
      fetchWalletData(); // Refresh table and balances
    } catch (error) {
      showAlert('danger', error.response?.data?.message || 'Failed to top up');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amountStr = await promptAction({
      title: 'Withdraw from Wallet',
      message: 'Enter amount to Withdraw ($):',
      defaultValue: '500',
      type: 'warning',
      confirmText: 'Withdraw',
      cancelText: 'Cancel'
    });
    if (!amountStr) return;
    
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return showAlert('danger', 'Please enter a valid positive number');
    }

    if (amount > walletData.balance) {
      return showAlert('danger', 'Insufficient funds available');
    }

    try {
      setIsProcessing(true);
      await api.post('/fund/withdraw', { amount });
      showAlert('success', `Successfully withdrew ${amount}`);
      fetchWalletData(); // Refresh table and balances
    } catch (error) {
      showAlert('danger', error.response?.data?.message || 'Failed to withdraw');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success': return <Badge text="Success" status="success" />;
      case 'failed': return <Badge text="Failed" status="error" />;
      case 'pending': return <Badge text="Pending" status="warning" />;
      default: return <Badge text={status} status="default" />;
    }
  };

  const columns = [
    { label: 'Transaction ID', key: '_id', render: (val) => (
      <span className="font-mono text-xs text-gray-500">{val.substring(0, 8)}...</span>
    )},
    { label: 'Description', key: 'description', render: (val) => (
      <span className="font-medium text-gray-900">{val}</span>
    )},
    { label: 'Amount', key: 'amount', render: (val, row) => (
      <span className={`font-semibold ${row.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
        {row.type === 'credit' ? '+' : '-'}${val.toFixed(2)}
      </span>
    )},
    { label: 'Status', key: 'status', render: getStatusBadge },
    { label: 'Date', key: 'created_at', render: (val) => (
      <span className="text-sm text-gray-500">{val ? new Date(val).toLocaleDateString() : '--'}</span>
    )},
  ];

  if (isLoading && !walletData.transactions.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading secure ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <WalletIcon className="w-6 h-6 text-emerald-600" />
          </div>
          Company Wallet
        </h1>
        <p className="mt-1 text-sm text-gray-500">Manage company funds and view transaction history.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Balance */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#58bfa1] to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Available Balance</p>
                <h2 className="text-4xl font-bold tracking-tight">${walletData.balance.toLocaleString()}</h2>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-3">
              <button 
                onClick={handleTopUp}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-white text-emerald-600 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-70"
              >
                Top Up Funds
              </button>
              <button 
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-white/20 text-white rounded-lg font-bold text-sm hover:bg-white/30 transition-colors disabled:opacity-70"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-green-50 rounded-lg shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Up (This Month)</p>
              <p className="text-xl font-bold text-gray-900">${walletData.topUpThisMonth.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-red-50 rounded-lg shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Spent (This Month)</p>
              <p className="text-xl font-bold text-gray-900">${walletData.spentThisMonth.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{walletData.transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Ledger History</h2>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchWalletData} disabled={isProcessing}>
            Refresh
          </Button>
        </div>
        
        {walletData.transactions.length > 0 ? (
          <>
            <Table columns={columns} data={walletData.transactions} />
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <p className="text-xs font-medium text-gray-500">
                Showing all {walletData.transactions.length} records
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No transactions found</p>
            <p className="text-sm mt-1">Top up your wallet or run a workflow to see history.</p>
          </div>
        )}
      </div>
    </div>
  );
}