// client/src/pages/employee/EmployeeDashboard.jsx
import React, { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { Play, Clock, CheckCircle2, XCircle, ArrowRight, Activity, FileText } from'lucide-react';
import { useAuth } from'../../context/AuthContext';
import api from'../../utils/axios';
import Badge from'../../components/Badge';
import Button from'../../components/Button';
import Pagination from'../../components/Pagination';

export default function EmployeeDashboard() {
 const { user } = useAuth();
 const navigate = useNavigate();
 const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, failed: 0 });
 const [recentExecutions, setRecentExecutions] = useState([]);
 const [isLoading, setIsLoading] = useState(true);

 // Pagination State for Recent Activity
 const [currentPage, setCurrentPage] = useState(1);
 const recordsPerPage = 7;

 useEffect(() => {
 fetchEmployeeData();
 }, [user]);

 const fetchEmployeeData = async () => {
 try {
 const response = await api.get('/executions');
 const allExecutions = response.data.data || [];
 const myExecutions = allExecutions.filter(ex => ex.triggered_by === user.email);

 let pending = 0, completed = 0, failed = 0;

 myExecutions.forEach(ex => {
 if (ex.status ==='completed') completed++;
 else if (ex.status ==='failed' || ex.status ==='canceled') failed++;
 else pending++;
 });

 setStats({ total: myExecutions.length, pending, completed, failed });
 
 setRecentExecutions(myExecutions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at)));
 } catch (error) {
 console.error("Failed to fetch dashboard data");
 } finally {
 setIsLoading(false);
 }
 };

 // Pagination Logic
 const totalPages = Math.max(1, Math.ceil(recentExecutions.length / recordsPerPage));
 const currentRecentData = recentExecutions.slice(
 (currentPage - 1) * recordsPerPage, 
 currentPage * recordsPerPage
 );

 const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
 <div className="bg-white p-5 border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow rounded-t-md">
 <div className={`p-3 border ${bgColorClass} ${colorClass}`}>
 <Icon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{title}</p>
 <h3 className="text-2xl font-bold text-gray-900 leading-none">{value}</h3>
 </div>
 </div>
 );

 if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div></div>;

 return (
 <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
 
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name ||'Employee'}!</h1>
 <p className="text-sm text-gray-500 mt-1">Track your requests, respond to tasks, and launch new workflows.</p>
 </div>
 <Button variant="solid" color="primary" onClick={() => navigate('/employee/requests')} className="bg-[#58bfa1] hover:bg-teal-600 shadow-sm">
 <Play className="w-4 h-4 mr-2" /> New Request
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard title="Total Requests" value={stats.total} icon={Activity} colorClass="text-blue-600 border-blue-100" bgColorClass="bg-blue-50" />
 <StatCard title="In Progress" value={stats.pending} icon={Clock} colorClass="text-amber-500 border-amber-100" bgColorClass="bg-amber-50" />
 <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} colorClass="text-[#58bfa1] border-teal-100" bgColorClass="bg-teal-50" />
 <StatCard title="Failed / Canceled" value={stats.failed} icon={XCircle} colorClass="text-red-500 border-red-100" bgColorClass="bg-red-50" />
 </div>

 <div className="bg-white border border-gray-200 shadow-sm mt-6 flex flex-col rounded-t-md">
 <div className="flex items-center justify-between p-5 border-b border-gray-100">
 <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
 <button onClick={() => navigate('/employee/history')} className="text-xs text-gray-500 font-medium hover:text-[#58bfa1] flex items-center gap-1 transition-colors">
 View History <ArrowRight className="w-3.5 h-3.5" />
 </button>
 </div>
 
 {recentExecutions.length === 0 ? (
 <div className="text-center py-12">
 <p className="text-sm text-gray-500">You haven't submitted any requests yet.</p>
 </div>
 ) : (
 <>
 <div className="divide-y divide-gray-100">
 {currentRecentData.map(ex => (
 <div key={ex._id} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/execute/${ex._id}`)}>
 <div className="flex items-center gap-4">
 <div className="p-2 bg-gray-50 border border-gray-100 text-gray-400">
 <FileText className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-gray-900">{ex.workflow_id?.name ||'Unknown'}</h4>
 <p className="text-xs text-gray-500 mt-0.5">{new Date(ex.started_at).toLocaleString()}</p>
 </div>
 </div>
 <Badge 
 text={ex.status ==='pending' || ex.status ==='in_progress' ?'In Progress' : ex.status ==='completed' ?'Completed' :'Failed'} 
 status={ex.status ==='pending' || ex.status ==='in_progress' ?'info' : ex.status ==='completed' ?'success' :'error'} 
 />
 </div>
 ))}
 </div>
 {/* Pagination Controls */}
 {totalPages > 1 && (
 <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
 <span className="text-sm text-gray-500">
 Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, recentExecutions.length)} of {recentExecutions.length}
 </span>
 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
 </div>
 )}
 </>
 )}
 </div>
 </div>
 );
}