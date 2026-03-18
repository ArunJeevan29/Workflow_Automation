// client/src/pages/staff/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Inbox, CheckSquare, Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState({ 
    pendingApprovals: 0, 
    pendingTasks: 0, 
    completedToday: 0, 
    slaAlerts: 0,
    approved: 0,
    rejected: 0
  });
  const [recentInbox, setRecentInbox] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.email) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // THE FIX: We only need ONE optimized API call to get all staff data!
      const inboxRes = await api.get(`/executions/my-inbox?email=${user.email}`);

      const dashboardData = inboxRes.data.data;
      const pending = dashboardData.approvals || [];
      const tasks = dashboardData.tasks || [];
      const history = dashboardData.history || [];

      // Calculate completed today
      const today = new Date().toDateString();
      const completedToday = history.filter(h => {
        const itemDate = new Date(h.date).toDateString();
        return h.action === 'completed' && itemDate === today;
      }).length;

      // Calculate SLA alerts (items pending for more than 24 hours)
      const now = new Date();
      let slaCount = 0;
      pending.forEach(item => {
        const submittedTime = new Date(item.started_at || Date.now());
        const hoursDiff = (now - submittedTime) / (1000 * 60 * 60);
        if (hoursDiff > 24) slaCount++;
      });

      const approvedCount = history.filter(h => h.action === 'completed').length;
      const rejectedCount = history.filter(h => h.action === 'failed' || h.action === 'rejected').length;

      setStats({ 
        pendingApprovals: pending.length, 
        pendingTasks: tasks.length, 
        completedToday, 
        slaAlerts: slaCount,
        approved: approvedCount,
        rejected: rejectedCount
      });
      
      setRecentInbox(pending.slice(0, 4));
      setRecentActivity(history.slice(0, 5));
      
    } catch (err) {
      showAlert('danger', 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick, subtitle }) => (
    <div
      onClick={onClick}
      className={`bg-white p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all rounded-xl group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color.bg}`}>
          <Icon className={`w-5 h-5 ${color.text}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-[#58bfa1]" />
            </div>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your workload overview for today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={Inbox} 
          color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
          onClick={() => navigate('/approvals')}
          subtitle="Awaiting your review"
        />
        <StatCard 
          title="Pending Tasks" 
          value={stats.pendingTasks} 
          icon={CheckSquare} 
          color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
          onClick={() => navigate('/tasks')}
          subtitle="Manual actions needed"
        />
        <StatCard 
          title="Completed Today" 
          value={stats.completedToday} 
          icon={CheckCircle} 
          color={{ bg: 'bg-green-50', text: 'text-green-600' }}
          trend={stats.completedToday > 0 ? 12 : 0}
          subtitle="Items processed"
        />
        <StatCard 
          title="SLA Alerts" 
          value={stats.slaAlerts} 
          icon={AlertTriangle} 
          color={{ bg: stats.slaAlerts > 0 ? 'bg-red-50' : 'bg-gray-50', text: stats.slaAlerts > 0 ? 'text-red-600' : 'text-gray-400' }}
          subtitle={stats.slaAlerts > 0 ? 'Over 24 hours pending' : 'All within SLA'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Workload Today */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#58bfa1]" />
              Your Workload Today
            </h2>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-[#58bfa1] font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentInbox.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">All caught up!</h3>
              <p className="text-sm text-gray-500">No pending approvals right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentInbox.map((item, i) => (
                <div 
                  key={i} 
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                  onClick={() => navigate(`/execute/${item._id}`)} // Fixed routing ID
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${item.priority === 'high' ? 'bg-red-50' : 'bg-blue-50'}`}>
                      <Activity className={`w-5 h-5 ${item.priority === 'high' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.workflowName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Step: {item.stepName} • Submitted by {item.triggered_by}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.started_at || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 text-xs font-semibold text-[#58bfa1] bg-teal-50 border border-teal-100 rounded-lg hover:bg-[#58bfa1] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#58bfa1]" />
              Recent Activity
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-[#58bfa1] font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((item, i) => (
                <div key={i} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${item.action === 'completed' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {item.action === 'completed' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.workflowName}</p>
                      <p className="text-xs text-gray-500">{item.stepName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.action === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.action === 'completed' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}