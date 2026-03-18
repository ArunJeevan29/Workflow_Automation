// client/src/pages/staff/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Search, Check, Clock, FileText, Inbox, RefreshCw } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

export default function Notifications() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => { 
    if (user?.email) fetchNotifications(); 
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/executions');
      const allExecutions = res.data.data || [];
      
      const userNotifications = [];
      const readIds = JSON.parse(localStorage.getItem(`read_notifs_${user.email}`) || '[]');

      allExecutions.forEach(ex => {
        (ex.logs || []).forEach((log, index) => {
          if (log.step_type === 'notification' && log.error_message?.includes(user.email)) {
            const uniqueAlertId = `${ex._id}-${index}`;
            
            // Only show UNREAD notifications
            if (!readIds.includes(uniqueAlertId)) {
              const msgMatch = log.error_message.match(/"([^"]+)"/);
              const cleanMessage = msgMatch ? msgMatch[1] : log.error_message;

              userNotifications.push({
                _id: uniqueAlertId,
                executionId: ex._id,
                workflowName: ex.workflow_id?.name || 'Unknown Workflow',
                stepName: log.step_name,
                message: cleanMessage,
                timestamp: log.ended_at || log.started_at
              });
            }
          }
        });
      });

      userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(userNotifications);
    } catch (err) { 
      showAlert('danger', 'Failed to load notifications.'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    
    const readIds = JSON.parse(localStorage.getItem(`read_notifs_${user.email}`) || '[]');
    readIds.push(id);
    localStorage.setItem(`read_notifs_${user.email}`, JSON.stringify(readIds));
    
    showAlert('success', 'Marked as read and archived to History.');
  };

  // Search filter
  const filteredNotifications = notifications.filter(n => 
    n.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.stepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / recordsPerPage));
  const currentData = filteredNotifications.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Loading notifications...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your automated alerts and workflow updates.</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              {notifications.length} unread
            </span>
          </div>
        )}
      </div>

      {/* Search Row */}
      <div className="flex items-center gap-3">
        <button 
          onClick={fetchNotifications} 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-4 py-2 border border-gray-200 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#58bfa1] focus:border-[#58bfa1]" 
          />
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <Inbox className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Inbox Zero</h3>
          <p className="text-sm text-gray-500">You have no unread notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentData.map(notif => (
            <div 
              key={notif._id} 
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#58bfa1]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#58bfa1]">{notif.workflowName}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-600">{notif.stepName}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">{notif.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(notif.timestamp).toLocaleString()}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono">ID: {notif.executionId.substring(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="ml-auto shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#58bfa1] border border-[#58bfa1] rounded-lg hover:bg-[#58bfa1] hover:text-white transition-all"
                >
                  <Check className="w-4 h-4" /> 
                  Mark as Read
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-white border border-gray-200 rounded-xl">
          <span className="text-sm text-gray-500">
            Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredNotifications.length)}
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
