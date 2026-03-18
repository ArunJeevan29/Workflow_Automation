// client/src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, GitMerge, Activity, Users, Settings2, 
  LogOut, CheckSquare, Bell, Clock, History, ChevronLeft, ChevronRight,
  Play, Archive, MonitorPlay, BarChart2, ClipboardList, Wallet,
  CheckCircle, TrendingUp, User, Inbox, Pencil, ChevronDown,
  Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import api from '../utils/axios';

// Breadcrumb Component
function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      
      // Format labels nicely
      label = label.replace(/-/g, ' ');
      if (label === 'Admin') label = 'Admin';
      if (label === 'Staff') label = 'Staff';
      if (label === 'Employee') label = 'Employee';
      if (label === 'New') label = 'New';
      
      // Skip certain paths
      if (path === 'execute' && paths[index + 1]) {
        // Don't add execute to breadcrumbs
        return;
      }
      
      // Skip if it's just an ID
      if (path.length === 24 && !label.includes(' ')) {
        return;
      }
      
      breadcrumbs.push({ label, path: currentPath });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-2 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          <button
            onClick={() => navigate(crumb.path)}
            className={`transition-colors ${
              index === breadcrumbs.length - 1
                ? 'text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

// Notification Dropdown Component
function NotificationDropdown({ notifications, onMarkRead }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
      >
        <Bell className="w-5 h-5" />
        {notifications?.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications?.length > 0 ? (
              notifications.slice(0, 5).map((notif, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm text-gray-800">{notif.message || notif.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at || notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No notifications
              </div>
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
            <button className="text-sm text-[#58bfa1] font-medium hover:text-teal-600 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Dropdown Component
function ProfileDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#58bfa1] to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {getInitials(user?.name)}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-teal-50 text-[#58bfa1] text-xs font-medium rounded-full">
              {user?.role}
            </span>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(user?.role === 'Employee' ? '/employee/profile' : '/settings');
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 mr-3 text-gray-400" />
              Profile Settings
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sidebar Section Group
function SidebarSection({ title, items, isCollapsed }) {
  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center justify-center p-3 transition-all rounded-lg mx-2 ${
                isActive
                  ? 'bg-[#152e35] text-[#58bfa1]'
                  : 'text-gray-400 hover:bg-[#0a1e26] hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center py-2.5 px-4 mx-3 rounded-lg transition-all group ${
              isActive
                ? 'bg-[#152e35] text-[#58bfa1] font-medium'
                : 'text-gray-400 hover:bg-[#0a1e26] hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={`w-5 h-5 shrink-0 mr-3 transition-colors ${
                isActive ? 'text-[#58bfa1]' : 'text-gray-400 group-hover:text-gray-300'
              }`} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 1. ADMIN MENU - Grouped by sections
  const adminNavItems = {
    MAIN: [
      { path: '/', label: 'Overview', icon: LayoutDashboard },
      { path: '/workflows', label: 'Workflows', icon: GitMerge },
      { path: '/workflow/new', label: 'Builder', icon: Pencil },
    ],
    OPERATIONS: [
      { path: '/live-executions', label: 'Executions', icon: MonitorPlay },
      { path: '/admin/approvals', label: 'Approvals', icon: CheckCircle },
    ],
    INSIGHTS: [
      { path: '/analytics', label: 'Analytics', icon: BarChart2 },
      { path: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
    ],
    MANAGEMENT: [
      { path: '/team', label: 'Team', icon: Users },
      { path: '/wallet', label: 'Wallet', icon: Wallet },
    ],
    SYSTEM: [
      { path: '/settings', label: 'Settings', icon: Settings2 },
    ],
  };

  // 2. STAFF / MANAGER MENU
  const staffNavItems = {
    MAIN: [
      { path: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/staff/requests', label: 'Start Request', icon: Play },
      { path: '/staff/my-requests', label: 'My Requests', icon: ClipboardList },
    ],
    OPERATIONS: [
      { path: '/approvals', label: 'Approvals', icon: Inbox },
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/staff/inbox', label: 'Inbox', icon: Bell },
    ],
    INSIGHTS: [
      { path: '/staff/history', label: 'History', icon: History },
      { path: '/staff/performance', label: 'Performance', icon: TrendingUp },
    ],
    ACCOUNT: [
      { path: '/staff/profile', label: 'Profile', icon: User },
    ],
  };

  // 3. EMPLOYEE MENU
  const employeeNavItems = {
    MAIN: [
      { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/employee/requests', label: 'Start Request', icon: Play },
      { path: '/employee/my-requests', label: 'My Requests', icon: ClipboardList },
    ],
    OPERATIONS: [
      { path: '/employee/inbox', label: 'Inbox', icon: Inbox },
    ],
    INSIGHTS: [
      { path: '/employee/history', label: 'History', icon: Archive },
    ],
    ACCOUNT: [
      { path: '/employee/profile', label: 'Profile', icon: User },
    ],
  };

  let navItems = staffNavItems;
  if (user?.role === 'Admin') navItems = adminNavItems;
  if (user?.role === 'Employee') navItems = employeeNavItems;

  useEffect(() => {
    fetchNotifications();
  }, [user?.email]);

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      const res = await api.get(`/notifications?email=${user.email}`);
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleLogout = () => {
    logout();
    showAlert('info', 'Logged out successfully.');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <div 
        className={`relative bg-[#041419] text-gray-300 flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-20 ${
          isCollapsed ? 'w-20' : 'w-[260px]'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-[#58bfa1] rounded-full items-center justify-center text-white shadow-md z-50 hover:bg-[#48a98d] transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="lg:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className={`flex items-center h-20 pt-4 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div 
            className="cursor-pointer transition-transform hover:scale-105" 
            onClick={() => navigate(user?.role === 'Admin' ? '/' : (user?.role === 'Employee' ? '/employee/dashboard' : '/staff/dashboard'))}
          >
            {isCollapsed ? (
              <img 
                src="/favicon.svg" 
                alt="HaloFlow Logo" 
                className="w-9 h-9 object-contain" 
              />
            ) : (
              <div className="flex items-center gap-2">
                <img 
                  src="/haloflow-logo.svg" 
                  alt="HaloFlow Logo" 
                  className="h-10 w-10 object-contain" 
                />
                <span className="text-xl font-bold text-white tracking-tight">HaloFlow</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {Object.entries(navItems).map(([section, items]) => (
            <SidebarSection 
              key={section} 
              title={section} 
              items={items} 
              isCollapsed={isCollapsed} 
            />
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="py-4 border-t border-[#132c36] bg-[#031014]">
          <div className={`flex items-center mb-3 ${isCollapsed ? 'justify-center' : 'gap-3 px-5'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#58bfa1] to-teal-700 flex shrink-0 items-center justify-center text-white font-bold text-sm shadow-md">
              {getInitials(user?.name)}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate w-32">{user?.name || 'Loading...'}</span>
                <span className="text-xs text-[#58bfa1] font-medium">{user?.role || 'User'}</span>
              </div>
            )}
          </div>
          
          <div className={`px-3 ${isCollapsed && 'px-2'}`}>
            <button 
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : ""}
              className={`flex items-center w-full py-2.5 text-sm text-gray-400 transition-colors hover:bg-[#152e35] hover:text-[#58bfa1] group ${
                isCollapsed ? 'justify-center' : 'px-3'
              }`}
            >
              <LogOut className={`w-4 h-4 text-gray-400 group-hover:text-[#58bfa1] transition-colors shrink-0 ${isCollapsed ? '' : 'mr-4'}`} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-6 z-10">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumbs />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationDropdown notifications={notifications} />
            
            {/* Profile */}
            <ProfileDropdown user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-gray-50">
          <Outlet />
        </main>
      </div>
      
    </div>
  );
}
