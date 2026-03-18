// client/src/pages/employee/EmployeeInbox.jsx
import React, { useState, useEffect } from 'react';
import { Inbox, Check, Bell, RefreshCw } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';

export default function EmployeeInbox() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    if (user?.email) fetchInbox();
  }, [user]);

  // Inbox = unread notification steps targeted at this employee
  const fetchInbox = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/executions');
      const allExec = res.data.data || [];
      const readIds = JSON.parse(localStorage.getItem(`read_notifs_${user.email}`) || '[]');

      const inbox = [];
      allExec.forEach(ex => {
        (ex.logs || []).forEach((log, index) => {
          if (log.step_type === 'notification' && log.error_message?.includes(user.email)) {
            const uniqueId = `${ex._id}-${index}`;
            if (!readIds.includes(uniqueId)) {
              const msgMatch = log.error_message.match(/"([^"]+)"/);
              inbox.push({
                id: uniqueId,
                executionId: ex._id,
                workflowName: ex.workflow_id?.name || 'Unknown',
                stepName: log.step_name,
                message: msgMatch ? msgMatch[1] : log.error_message,
                date: log.ended_at || log.started_at,
              });
            }
          }
        });
      });

      inbox.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(inbox);
    } catch (err) {
      showAlert('danger', 'Failed to load inbox.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (id) => {
    const readIds = JSON.parse(localStorage.getItem(`read_notifs_${user.email}`) || '[]');
    if (!readIds.includes(id)) {
      localStorage.setItem(`read_notifs_${user.email}`, JSON.stringify([...readIds, id]));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    showAlert('success', 'Marked as read.');
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const existing = JSON.parse(localStorage.getItem(`read_notifs_${user.email}`) || '[]');
    localStorage.setItem(`read_notifs_${user.email}`, JSON.stringify([...existing, ...allIds]));
    setNotifications([]);
    showAlert('success', 'All items marked as read.');
  };

  const totalPages = Math.max(1, Math.ceil(notifications.length / recordsPerPage));
  const currentData = notifications.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-[#58bfa1]" /> Inbox
          </h1>
          <p className="mt-1 text-sm text-gray-500">Action items and messages from your active workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#58bfa1] border border-[#58bfa1] hover:bg-teal-50 transition-colors"
            >
              <Check className="w-4 h-4" /> Mark All Read
            </button>
          )}
          <button 
            onClick={fetchInbox} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-t-md">
        {currentData.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700">Your inbox is empty</p>
            <p className="text-sm text-gray-400 mt-1">No new action items from your workflows.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {currentData.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge text={item.workflowName} status="info" />
                      <span className="text-xs text-gray-400">{item.stepName}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(item.date).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="shrink-0 text-xs font-medium text-[#58bfa1] border border-[#58bfa1] px-3 py-1.5 hover:bg-teal-50 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Done
                  </button>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                <span className="text-sm text-gray-500">{notifications.length} total items</span>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
