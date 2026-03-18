import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Filter, Users, ChevronDown, RefreshCw } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useConfirm } from '../context/ConfirmContext';

// THE FIX: Changed from '../../' back to '../'
import api from '../utils/axios';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import Pagination from '../components/Pagination';

export default function TeamAccess() {
  const { showAlert } = useAlert();
  const { confirmAction } = useConfirm();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All Roles');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState({ _id: null, name: '', email: '', password: '', role: 'Employee', status: 'Active' });

  const roleOptions = [
    { label: 'Admin (Full Access)', value: 'Admin' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Finance Lead', value: 'Finance' },
    { label: 'HR Lead', value: 'HR' },
    { label: 'Employee', value: 'Employee' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Suspended', value: 'Suspended' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data.data || []);
    } catch (error) {
      showAlert('danger', 'Failed to load staff members.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchMatch = (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const roleMatch = filterRole === 'All Roles' ? true : u.role === filterRole;
    return searchMatch && roleMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / recordsPerPage));
  const currentData = filteredUsers.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const openModal = (user = null) => {
    if (user) {
      setEditingUser({ _id: user._id, name: user.name, email: user.email, password: '', role: user.role, status: user.status });
    } else {
      setEditingUser({ _id: null, name: '', email: '', password: '', role: 'Employee', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const saveUser = async () => {
    if (!editingUser.name || !editingUser.email) {
      showAlert('danger', 'Name and Email are required.');
      return;
    }

    try {
      if (editingUser._id) {
        const response = await api.put(`/auth/users/${editingUser._id}`, editingUser);
        setUsers(users.map(u => u._id === editingUser._id ? response.data.data : u));
        showAlert('success', 'Staff member updated successfully.');
      } else {
        if (!editingUser.password) {
          showAlert('danger', 'A temporary password is required for new staff.');
          return;
        }
        const response = await api.post('/auth/users', editingUser);
        setUsers([...users, response.data.data]);
        showAlert('success', 'New staff account created successfully.');
      }
      setIsModalOpen(false);
    } catch (error) {
      showAlert('danger', error.response?.data?.message || 'Error saving user.');
    }
  };

  const deleteUser = async (id) => {
    const confirmed = await confirmAction({
      title: 'Remove Staff Member',
      message: 'Are you sure you want to remove this staff member? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Remove'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      showAlert('success', 'Staff member removed.');
    } catch (error) {
      showAlert('danger', error.response?.data?.message || 'Error deleting user.');
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      Admin: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
      Manager: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
      Finance: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
      HR: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
      Employee: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
    };
    const colors = roleColors[role] || roleColors.Employee;
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${colors.bg} ${colors.text} border ${colors.border}`}>
        {role}
      </span>
    );
  };

  const columns = [
    { 
      label: 'Staff Member', 
      key: 'user',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58bfa1] to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{user.name}</span>
            <span className="text-xs font-medium text-gray-500">{user.email}</span>
          </div>
        </div>
      )
    },
    { label: 'Role', key: 'role', render: (val) => getRoleBadge(val) },
    { 
      label: 'Status', 
      key: 'status',
      render: (val) => (
        <span className={`flex items-center text-xs font-bold ${val === 'Active' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${val === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></span>
          {val}
        </span>
      )
    },
    { 
      label: '', 
      key: 'actions', 
      align: 'right',
      render: (_, user) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openModal(user)} className="p-2 text-gray-400 hover:text-[#58bfa1] hover:bg-teal-50 rounded-lg transition-all">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteUser(user._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">
  
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Users className="w-6 h-6 text-[#58bfa1]" />
            </div>
            Team & Access
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Create staff accounts and manage workspace roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="solid" color="primary" onClick={() => openModal()} icon={Plus} className="bg-[#58bfa1] hover:bg-teal-600 shadow-sm hover:shadow transition-all rounded-lg py-2.5 px-5">
            Create Staff
          </Button>
          <button 
            onClick={fetchUsers} 
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admins</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{users.filter(u => u.role === 'Admin').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{users.filter(u => u.status === 'Active').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suspended</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">{users.filter(u => u.status !== 'Active').length}</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search staff members..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#58bfa1]/20 focus:border-[#58bfa1] bg-gray-50 font-medium placeholder:text-gray-400 transition-all"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg bg-white shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span>{filterRole}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 shadow-xl rounded-lg z-50 py-1.5 overflow-hidden">
                  {['All Roles', 'Admin', 'Manager', 'Finance', 'HR', 'Employee'].map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setFilterRole(role);
                        setIsFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        filterRole === role 
                          ? 'bg-teal-50/50 text-[#58bfa1] font-bold' 
                          : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <>
            <Table columns={columns} data={currentData} emptyMessage="No users found matching your criteria." />
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50 bg-white">
              <span className="text-xs font-medium text-gray-500">
                Showing {currentData.length} of {filteredUsers.length} members
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingUser._id ? "Edit Staff Account" : "Create New Staff Account"}
        footer={
          <>
            <Button variant="text" color="secondary" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:bg-gray-100">Cancel</Button>
            <Button variant="solid" color="primary" onClick={saveUser} className="bg-[#58bfa1] hover:bg-teal-600 shadow-sm hover:shadow">
              {editingUser._id ? 'Update Staff' : 'Create Account'}
            </Button>
          </>
        }
      >
        <div className="space-y-5 pt-2">
          <TextInput 
            label="Full Name" 
            placeholder="e.g., Jane Doe" 
            required 
            value={editingUser.name} 
            onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} 
          />
          <TextInput 
            label="Email Address (Login ID)" 
            placeholder="jane@halleyx.com" 
            required 
            value={editingUser.email} 
            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
          />
          
          <TextInput 
            label={editingUser._id ? "New Password (leave blank to keep current)" : "Temporary Password"} 
            type="password" 
            placeholder={editingUser._id ? "Enter new password to change..." : "Enter initial password..."} 
            required={!editingUser._id} 
            value={editingUser.password} 
            onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} 
          />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="System Role" 
              options={roleOptions} 
              value={editingUser.role} 
              onChange={(val) => setEditingUser({...editingUser, role: val})} 
            />
            <Select 
              label="Account Status" 
              options={statusOptions} 
              value={editingUser.status} 
              onChange={(val) => setEditingUser({...editingUser, status: val})} 
            />
          </div>

          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-lg text-sm text-[#48a98d] font-medium flex items-start gap-3">
            <Shield className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Once created, this staff member can log in and will be available for selection in the Workflow Builder step assignments.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}