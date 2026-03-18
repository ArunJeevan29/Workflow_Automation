// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { Search, Filter, Play, Edit2, Activity, GitMerge, DollarSign, AlertOctagon, ChevronDown, Plus, Zap, Users, Clock } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

import Table from '../components/Table';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';
import MetricCard from '../components/MetricCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [workflows, setWorkflows] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [recentExecutions, setRecentExecutions] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5; 

  useEffect(() => {
    fetchWorkflows();
    fetchWalletBalance();
    fetchRecentExecutions();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/workflows');
      setWorkflows(response.data.data || []);
    } catch (error) {
      console.error(error);
      showAlert('danger', 'Failed to load workflows.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get('/fund');
      setWalletBalance(res.data.data.balance || 0);
    } catch (error) {
      console.error('Failed to load wallet balance', error);
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      const res = await api.get('/executions');
      const all = res.data.data || [];
      // Get last 5 executions
      const sorted = all.sort((a, b) => new Date(b.started_at) - new Date(a.started_at)).slice(0, 5);
      setRecentExecutions(sorted);
    } catch (error) {
      console.error('Failed to load executions', error);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || w._id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' ? true : (filterType === 'Active' ? w.is_active : !w.is_active);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredWorkflows.length / recordsPerPage));
  const currentTableData = filteredWorkflows.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const renderStatus = (isActive) => (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58bfa1] opacity-40"></span>}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-[#58bfa1]' : 'bg-gray-300'}`}></span>
      </span>
      <span className={`font-semibold text-xs ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{isActive ? 'Active' : 'Inactive'}</span>
    </div>
  );

  const columns = [
    { 
      label: 'ID', 
      key: '_id',
      render: (val) => <span className="text-[#58bfa1] font-semibold font-mono text-xs bg-teal-50 border border-teal-100 px-2 py-1 rounded-md">{val.substring(0, 8)}</span>
    },
    { label: 'Name', key: 'name', render: (val) => <span className="font-bold text-gray-900">{val}</span> },
    { label: 'Steps', key: 'steps', render: (val) => <span className="text-gray-600 font-medium">{val ? val.length : 0}</span> },
    { label: 'Version', key: 'version', render: (val) => <span className="text-gray-500 font-medium">v{val || 1}</span> },
    { label: 'Status', key: 'is_active', render: renderStatus },
    { 
      label: '', key: 'actions', align: 'center', isAction: true, 
      render: (_, workflow) => (
        <div className="flex justify-center">
          <ActionMenu 
            actions={[
              { label: 'Edit Blueprint', icon: Edit2, onClick: () => navigate(`/workflow/${workflow._id}`) },
              { label: 'Run Execution', icon: Play, onClick: () => navigate(`/execute/${workflow._id}`) }
            ]}
          />
        </div>
      )
    }
  ];

  // Calculate stats for the dashboard
  const activeWorkflows = workflows.filter(w => w.is_active).length;
  const completedToday = recentExecutions.filter(e => {
    const today = new Date().toDateString();
    return new Date(e.started_at).toDateString() === today && e.status === 'completed';
  }).length;

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Monitor your automation health and manage workflows.</p>
        </div>
        <Button 
          variant="solid" 
          color="primary" 
          onClick={() => navigate('/workflow/new')} 
          icon={Plus}
          className="shadow-md hover:shadow-lg"
        >
          Create Workflow
        </Button>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <MetricCard 
          title="Company Wallet" 
          value={`$${walletBalance.toLocaleString()}`} 
          icon={DollarSign} 
          trend="Live" 
          trendUp={true} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <MetricCard 
          title="Total Workflows" 
          value={workflows.length} 
          icon={GitMerge} 
          trend="12%" 
          trendUp={true} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <MetricCard 
          title="Active Automations" 
          value={activeWorkflows} 
          icon={Zap} 
          trend="4%" 
          trendUp={true} 
          colorClass="text-[#58bfa1]" 
          bgClass="bg-teal-50" 
        />
        <MetricCard 
          title="Today's Executions" 
          value={completedToday} 
          icon={Activity} 
          subtitle="completed"
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentExecutions.length > 0 ? (
              recentExecutions.slice(0, 3).map((exec, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    exec.status === 'completed' ? 'bg-green-500' : 
                    exec.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {exec.workflow_id?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(exec.started_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    exec.status === 'completed' ? 'bg-green-50 text-green-600' :
                    exec.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {exec.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Zap className="w-5 h-5 text-[#58bfa1]" />
            </div>
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/workflow/new')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                <Plus className="w-4 h-4 text-[#58bfa1]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New Workflow</p>
                <p className="text-xs text-gray-400">Create automation blueprint</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/analytics')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View Analytics</p>
                <p className="text-xs text-gray-400">Check performance metrics</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/team')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Manage Team</p>
                <p className="text-xs text-gray-400">Add or edit team members</p>
              </div>
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm text-gray-600">Active Workflows</span>
              <span className="text-sm font-semibold text-gray-900">{activeWorkflows} / {workflows.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* WORKFLOWS TABLE CARD */}
      <div className="bg-white border border-gray-200 shadow-card rounded-xl flex flex-col overflow-hidden mt-4">
        
        {/* Card Header & Toolbar */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-[#58bfa1]" />
            Recent Workflows
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search workflows..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all bg-gray-50 focus:bg-white font-medium placeholder:text-gray-400"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors bg-white"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{filterType}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 shadow-lg rounded-lg z-50 py-1.5 overflow-hidden">
                  {['All', 'Active', 'Inactive'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${filterType === type ? 'bg-teal-50/50 text-[#58bfa1] font-bold' : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white">
            <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div>
            <Table columns={columns} data={currentTableData} emptyMessage="No workflows configured yet." />
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
              <span className="text-xs font-medium text-gray-500">
                Showing {currentTableData.length} of {filteredWorkflows.length} workflows
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
