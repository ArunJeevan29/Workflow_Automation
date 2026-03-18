// client/src/pages/staff/Performance.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, XCircle, Clock, Calendar, Activity, Target, Award } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#ef4444']; // Emerald for Approved, Red for Rejected

export default function Performance() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState({ approved: 0, rejected: 0, avgTime: 0, total: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.email) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/executions/my-performance?email=${user.email}`);
      const data = res.data.data;

      setStats({ 
        approved: data.approved, 
        rejected: data.rejected, 
        total: data.total, 
        avgTime: data.avgTimeHours 
      });
      
      setWeeklyData(data.weeklyBreakdown);
    } catch (err) {
      showAlert('danger', 'Failed to load performance data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Smart Time Formatter (Handles testing environments where response is seconds)
  const formatTime = (hours) => {
    const h = Number(hours);
    if (isNaN(h) || h === 0) return '< 1m';
    if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
    const fullHours = Math.floor(h);
    const mins = Math.round((h - fullHours) * 60);
    return mins > 0 ? `${fullHours}h ${mins}m` : `${fullHours}h`;
  };

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const rejectionRate = stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0;

  const pieData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className={`bg-white p-5 border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
      <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${color.bg.replace('bg-', 'bg-').replace('50', '400')}`} style={{ backgroundColor: color.text.includes('green') ? '#10b981' : color.text.includes('blue') ? '#3b82f6' : color.text.includes('red') ? '#ef4444' : color.text.includes('amber') ? '#f59e0b' : '#58bfa1' }}></div>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color.bg}`}>
          <Icon className={`w-5 h-5 ${color.text}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-gray-500">Calculating your metrics...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg shadow-sm">
            <TrendingUp className="w-6 h-6 text-[#58bfa1]" />
          </div>
          Performance
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Your historical approval activity and response metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Actions" 
          value={stats.total} 
          icon={Activity} 
          color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
          subtitle="All time processed"
        />
        <StatCard 
          title="Approved" 
          value={stats.approved} 
          icon={CheckCircle} 
          color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
          subtitle={`${approvalRate}% approval rate`}
        />
        <StatCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={XCircle} 
          color={{ bg: 'bg-red-50', text: 'text-red-500' }}
          subtitle={`${rejectionRate}% rejection rate`}
        />
        <StatCard 
          title="Avg Response Time" 
          value={formatTime(stats.avgTime)} 
          icon={Clock} 
          color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
          subtitle="From submission to review"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Approvals Chart */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#58bfa1]" />
                Last 7 Days Activity
              </h2>
              <p className="text-xs font-medium text-gray-500 mt-1">Daily breakdown of your reviews</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval Rate Pie Chart */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#58bfa1]" />
                Approval Distribution
              </h2>
              <p className="text-xs font-medium text-gray-500 mt-1">Your approval vs rejection ratio</p>
            </div>
          </div>
          <div className="h-64 flex flex-col items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400">
                <p>No data available yet</p>
              </div>
            )}
            
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-sm font-medium text-gray-600">Approved ({stats.approved})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <span className="text-sm font-medium text-gray-600">Rejected ({stats.rejected})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REDESIGNED: Consistency Profile Score Card */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left: Radial Score */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path 
                  className="text-gray-100" 
                  strokeWidth="3.5" 
                  stroke="currentColor" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
                {/* Progress Ring */}
                <path 
                  className={`transition-all duration-1000 ease-out ${approvalRate >= 80 ? 'text-emerald-500' : approvalRate >= 50 ? 'text-amber-500' : 'text-red-500'}`} 
                  strokeDasharray={`${approvalRate}, 100`} 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{approvalRate}%</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Consistency Score
                {approvalRate >= 80 && <Award className="w-5 h-5 text-amber-400" fill="currentColor" />}
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-1 max-w-sm">
                Your decision track record. A higher score indicates a consistent approval-to-rejection ratio across all assigned workflow tasks.
              </p>
            </div>
          </div>

          {/* Right: Metric Grid */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Reviewed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dominant Trait</p>
                <p className={`text-lg font-bold mt-1.5 ${stats.approved >= stats.rejected ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.approved === 0 && stats.rejected === 0 ? 'Pending' : (stats.approved >= stats.rejected ? 'Approving' : 'Rejecting')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}