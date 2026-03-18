// client/src/pages/admin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, CheckCircle2, XCircle, Clock, Activity, 
  Calendar, ChevronDown, RefreshCw, Zap, AlertTriangle, GripVertical, X, Layers
} from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';

// Modern Date Range Filter
function DateRangeFilter({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1]"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span>{options.find(o => o.value === value)?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    value === option.value 
                      ? 'bg-teal-50/50 text-[#58bfa1] font-bold' 
                      : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Premium Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-gray-100 rounded-xl shadow-xl z-[9999]">
        <p className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                <span className="text-gray-600">{entry.name}</span>
              </div>
              <span className="text-gray-900 font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Modern Stat Card Component
function StatCard({ title, value, sub, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-[#58bfa1]', border: 'border-emerald-100' },
    red: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100' },
  };

  const currentTheme = colorClasses[color];

  return (
    <div className="group bg-white p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${currentTheme.bg.replace('50', '400')}`} style={{ backgroundColor: color === 'green' ? '#58bfa1' : undefined }}></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
            {trend && (
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {sub && <p className="text-xs font-medium text-gray-500 mt-2">{sub}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${currentTheme.bg} ${currentTheme.border} ${currentTheme.text} transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

// The Micro-Dashboard (Renders when a workflow is dropped into a slot)
const WorkflowMicroDashboard = ({ wfName, allExecutions, onRemove }) => {
  const myExecutions = allExecutions.filter(ex => (ex.workflow_id?.name || 'Unknown') === wfName);
  
  const completed = myExecutions.filter(e => e.status === 'completed').length;
  const failed = myExecutions.filter(e => e.status === 'failed' || e.status === 'canceled').length;
  const pending = myExecutions.filter(e => e.status === 'pending' || e.status === 'in_progress').length;
  const total = myExecutions.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const durations = myExecutions.filter(e => e.status === 'completed' && e.started_at && e.ended_at)
    .map(e => (new Date(e.ended_at) - new Date(e.started_at)) / 60000);
  const avgTime = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : 0;

  const stepFailuresMap = {};
  myExecutions.forEach(ex => {
    if ((ex.status === 'failed' || ex.status === 'canceled') && ex.logs) {
      const failedLogs = ex.logs.filter(l => l.status === 'failed');
      failedLogs.forEach(log => {
        const sName = log.step_name || 'Unknown Step';
        stepFailuresMap[sName] = (stepFailuresMap[sName] || 0) + 1;
      });
    }
  });

  const bottleneckData = Object.entries(stepFailuresMap)
    .map(([name, count]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      fullName: name,
      count 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const pieData = [
    { name: 'Success', value: completed, color: '#58bfa1' },
    { name: 'Failed', value: failed, color: '#ef4444' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col animate-in zoom-in-95 duration-300">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-start justify-between rounded-t-xl">
        <h3 className="text-sm font-bold text-gray-900 leading-tight pr-2">{wfName}</h3>
        <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-white">
        <div className="p-3 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Runs</p>
          <p className="text-lg font-black text-gray-900">{total}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Rate</p>
          <p className={`text-lg font-black ${rate >= 80 ? 'text-[#58bfa1]' : rate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{rate}%</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Avg Time</p>
          <p className="text-lg font-black text-blue-600">{avgTime}m</p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-6 bg-white rounded-b-xl overflow-y-auto custom-scrollbar">
        <div>
          <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500"/> Health Status</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500"/> Step Failures</p>
          {bottleneckData.length > 0 ? (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottleneckData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} width={85} axisLine={false} tickLine={false} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl z-[9999]">
                            <p className="text-xs font-bold text-white">{data.fullName}</p>
                            <p className="text-xs text-gray-300">{data.count} failure{data.count !== 1 ? 's' : ''}</p>
                          </div>
                        );
                      }
                      return null;
                    }} 
                    cursor={{ fill: '#f8fafc' }} 
                  />
                  <Bar dataKey="count" name="Failures" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-emerald-100 bg-emerald-50/50 rounded-xl text-emerald-600 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> No recorded failures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Analytics() {
  const { showAlert } = useAlert();
  const [allExecutions, setAllExecutions] = useState([]);
  const [globalStats, setGlobalStats] = useState({ total: 0, completed: 0, failed: 0, pending: 0, avgTime: 0 });
  const [timeSeries, setTimeSeries] = useState([]);
  const [uniqueWorkflows, setUniqueWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  
  const [slots, setSlots] = useState([null, null, null]);

  useEffect(() => { fetchAnalytics(); }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/executions');
      let all = res.data.data || [];

      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('d', ''));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        all = all.filter(e => new Date(e.started_at) >= cutoffDate);
      }

      setAllExecutions(all);

      const completed = all.filter(e => e.status === 'completed');
      const failed = all.filter(e => e.status === 'failed' || e.status === 'canceled');
      const pending = all.filter(e => e.status === 'pending' || e.status === 'in_progress');

      const durations = completed.filter(e => e.started_at && e.ended_at)
        .map(e => (new Date(e.ended_at) - new Date(e.started_at)) / 60000);
      const avgTime = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : 0;

      setGlobalStats({ 
        total: all.length, 
        completed: completed.length, 
        failed: failed.length, 
        pending: pending.length, 
        avgTime 
      });

      // Format Time Series Data correctly using local timezone string matching
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 30; 
      const chartData = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        // Create strict YYYY-MM-DD local format
        const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        
        chartData.push({
          dateKey,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed: 0,
          failed: 0,
          pending: 0
        });
      }

      all.forEach(ex => {
        if(!ex.started_at) return;
        const exDate = new Date(ex.started_at);
        const dateKey = `${exDate.getFullYear()}-${String(exDate.getMonth()+1).padStart(2,'0')}-${String(exDate.getDate()).padStart(2,'0')}`;
        
        const dayMatch = chartData.find(d => d.dateKey === dateKey);
        if (dayMatch) {
          if (ex.status === 'completed') dayMatch.completed++;
          else if (ex.status === 'failed' || ex.status === 'canceled') dayMatch.failed++;
          else dayMatch.pending++;
        }
      });
      setTimeSeries(chartData);

      const wfNames = [...new Set(all.map(ex => ex.workflow_id?.name).filter(Boolean))];
      setUniqueWorkflows(wfNames.sort());

    } catch (err) {
      showAlert('danger', 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, wfName) => {
    e.dataTransfer.setData('workflowName', wfName);
    e.currentTarget.classList.add('opacity-50');
  };
  const handleDragEnd = (e) => e.currentTarget.classList.remove('opacity-50');
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    const wfName = e.dataTransfer.getData('workflowName');
    if (wfName) {
      const newSlots = [...slots];
      newSlots[slotIndex] = wfName;
      setSlots(newSlots);
    }
  };
  const removeSlot = (slotIndex) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
  };

  const globalSuccessRate = globalStats.total > 0 ? Math.round((globalStats.completed / globalStats.total) * 100) : 0;
  
  const globalPieData = [
    { name: 'Completed', value: globalStats.completed, color: '#58bfa1' },
    { name: 'Failed', value: globalStats.failed, color: '#ef4444' },
    { name: 'Pending', value: globalStats.pending, color: '#f59e0b' },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen -mt-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Compiling Engine Data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-[1600px] mx-auto">
      
      {/* Simple Header matched to other pages */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#58bfa1]" />
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">Global execution trends, success rates, and workflow performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <button onClick={fetchAnalytics} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Executions" 
          value={globalStats.total} 
          icon={Activity} 
          color="blue"
          trend={12}
        />
        <StatCard 
          title="Completed Successfully" 
          value={globalStats.completed} 
          sub={`${globalSuccessRate}% global success rate`} 
          icon={CheckCircle2} 
          color="green"
        />
        <StatCard 
          title="Failed / Canceled" 
          value={globalStats.failed} 
          icon={XCircle} 
          color="red"
          trend={-5}
        />
        <StatCard 
          title="Avg. Processing Time" 
          value={`${globalStats.avgTime}m`} 
          sub="from trigger to completion" 
          icon={Clock} 
          color="amber"
        />
      </div>

      {/* Global Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Velocity Area Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Execution Velocity
              </h2>
              <p className="text-xs font-medium text-gray-500 mt-1">Daily volume of engine triggers</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletedGlobal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58bfa1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#58bfa1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailedGlobal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 12, fontWeight: 500 }} stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fontWeight: 500 }} stroke="#94a3b8" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }} />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  name="Completed"
                  stroke="#58bfa1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCompletedGlobal)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#58bfa1' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  name="Failed"
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorFailedGlobal)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global System Health Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex flex-col">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              System Health
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-1">Global status distribution</p>
          </div>
          
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={globalPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {globalPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-gray-900">{globalSuccessRate}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Success</span>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {globalPieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md shadow-sm" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm font-semibold text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The Drag & Drop Workflow Comparison Board */}
      <div className="pt-8 mt-8 border-t border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            Workflow Comparison Board
          </h2>
          <p className="text-sm text-gray-500 mt-1">Drag and drop workflows from the palette into the slots below to analyze specific step failures and bottlenecks.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Sidebar: Workflow Palette */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#58bfa1]" />
              Executed Workflows
            </h3>
            {uniqueWorkflows.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm font-medium text-gray-400 bg-white">
                No executions found.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {uniqueWorkflows.map(wf => (
                  <div 
                    key={wf}
                    draggable
                    onDragStart={(e) => handleDragStart(e, wf)}
                    onDragEnd={handleDragEnd}
                    className="group flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#58bfa1] cursor-grab active:cursor-grabbing transition-all"
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-[#58bfa1]" />
                    <span className="text-sm font-bold text-gray-700 truncate">{wf}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Stage: 3 Drop Slots */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6">
            {slots.map((slotWfName, index) => (
              <div 
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="min-h-[450px]"
              >
                {slotWfName ? (
                  <WorkflowMicroDashboard 
                    wfName={slotWfName} 
                    allExecutions={allExecutions} 
                    onRemove={() => removeSlot(index)} 
                  />
                ) : (
                  <div className="h-full border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-colors hover:border-[#58bfa1] hover:bg-teal-50/30">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 mb-1">Empty Slot</h3>
                    <p className="text-xs font-medium text-gray-400 max-w-[150px]">Drag a workflow here to analyze its drop-off points.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}