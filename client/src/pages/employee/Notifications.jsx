// client/src/pages/employee/Notification.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Search, Check, CheckCircle2 } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

export default function Notifications() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => { 
    if (user?.email) fetchNotifications(); 
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // THE FIX: Fetching directly from the real Notification DB table
      const res = await api.get(`/notifications?email=${user.email}`);
      const activeNotifs = res.data.data.filter(n => !n.is_read) || [];
      setNotifications(activeNotifs);
    } catch (err) { 
      showAlert('danger', 'Failed to load notifications.'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic update for snappy UI
      setNotifications(prev => prev.filter(n => n._id !== id));
      await api.put(`/notifications/${id}/read`);
      showAlert('success', 'Marked as read');
    } catch (error) {
      showAlert('danger', 'Failed to update status');
      fetchNotifications(); // Revert on failure
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await api.post('/notifications/read-all', { email: user.email });
      setNotifications([]);
      showAlert('success', 'All notifications cleared');
    } catch (error) {
      showAlert('danger', 'Failed to clear notifications');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    (n.workflow_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.message || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / recordsPerPage));
  const currentData = filteredNotifications.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* Professional Flush Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Bell className="w-6 h-6 text-[#58bfa1]" />
            </div>
            My Inbox
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Review alerts and updates regarding your workflow requests.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search inbox..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all bg-white shadow-sm" 
            />
          </div>
          {notifications.length > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Inbox Zero</h3>
          <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto">You have no unread notifications. All caught up!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {currentData.map(notif => (
              <div key={notif._id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-l-[#58bfa1]">
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#58bfa1] bg-teal-50 px-2 py-0.5 rounded">
                      {notif.workflow_id?.name || 'Workflow System'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    Ref ID: {notif.execution_id?.substring(0,8) || 'SYSTEM'} | {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>

                <button 
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="ml-auto text-xs font-bold text-gray-600 hover:text-[#58bfa1] bg-white border border-gray-200 hover:border-[#58bfa1] hover:bg-teal-50 rounded-lg px-4 py-2 transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Mark as Read
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-white">
            <span className="text-xs font-medium text-gray-500">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}
    </div>
  );
}