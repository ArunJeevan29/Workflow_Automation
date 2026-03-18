// client/src/pages/employee/Profile.jsx
import React, { useState } from 'react';
import { User, Mail, Shield, Save, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';

export default function Profile() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword) {
      showAlert('danger', 'Please fill in all password fields.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showAlert('danger', 'New passwords do not match.');
      return;
    }
    if (form.newPassword.length < 6) {
      showAlert('danger', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setIsSaving(true);
      // THE FIX: Calling the dedicated secure password endpoint
      await api.put(`/auth/users/${user._id}/password`, { 
        currentPassword: form.currentPassword,
        newPassword: form.newPassword 
      });
      showAlert('success', 'Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  const roleColors = {
    Admin: 'text-red-600 bg-red-50 border-red-100',
    Manager: 'text-blue-600 bg-blue-50 border-blue-100',
    Finance: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    Employee: 'text-[#58bfa1] bg-teal-50 border-teal-100',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-[#58bfa1]" /> My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your account information and security settings.</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-t-md">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#58bfa1] to-teal-700 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name || '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">{user?.email || '—'}</span>
            </div>
            <div className="mt-2">
              <span className={`text-xs font-semibold px-2.5 py-1 border rounded-md ${roleColors[user?.role] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                {user?.role || 'Unknown Role'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
            <p className="text-sm text-gray-900 mt-1 font-medium">{user?.name}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
            <p className="text-sm text-gray-900 mt-1 font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
            <p className="text-sm text-gray-900 mt-1 font-medium">{user?.role}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status</label>
            <p className="text-sm text-emerald-600 font-semibold mt-1">Active</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-t-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-bold text-gray-900">Change Password</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleChangePassword}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#58bfa1] rounded-lg text-white text-sm font-semibold hover:bg-[#48a98d] transition-colors disabled:opacity-60 shadow-sm hover:shadow"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Verifying & Saving...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}