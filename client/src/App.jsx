// client/src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context & Layout
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Layout from './components/Layout';

// Public & Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkflowList from './pages/WorkflowList';
import LiveExecutions from './pages/LiveExecutions';
import AuditLogs from './pages/AuditLogs';
import TeamAccess from './pages/TeamAccess';

// Lazy load heavy pages for code splitting
const WorkflowEditor = lazy(() => import('./pages/WorkflowEditor'));
const ExecuteWorkflow = lazy(() => import('./pages/ExecuteWorkflow'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Staff / Manager Pages
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StaffMyRequests = lazy(() => import('./pages/staff/StaffMyRequests'));
const StaffHistory = lazy(() => import('./pages/staff/StaffHistory'));
const Approvals = lazy(() => import('./pages/staff/Approvals'));
const Tasks = lazy(() => import('./pages/staff/Tasks'));
const Notifications = lazy(() => import('./pages/staff/Notifications'));
const History = lazy(() => import('./pages/staff/History'));
const Performance = lazy(() => import('./pages/staff/Performance'));

// Employee Pages
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const StartRequest = lazy(() => import('./pages/employee/StartRequest'));
const MyRequests = lazy(() => import('./pages/employee/MyRequests'));
const LogHistory = lazy(() => import('./pages/employee/LogHistory'));
const EmployeeNotifications = lazy(() => import('./pages/employee/Notifications'));
const EmployeeInbox = lazy(() => import('./pages/employee/EmployeeInbox'));
const Profile = lazy(() => import('./pages/employee/Profile'));

// Wallet page
import Wallet from './pages/Wallet';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Employee') return <Navigate to="/employee/dashboard" replace />;
    if (user.role === 'Staff' || user.role === 'Manager') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <ConfirmProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />
                
                {/* All Protected Routes inside Layout */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  
                  {/* ── ADMIN ROUTES ── */}
                  <Route index element={<ProtectedRoute allowedRoles={['Admin']}><Dashboard /></ProtectedRoute>} />
                  <Route path="workflows" element={<ProtectedRoute allowedRoles={['Admin']}><WorkflowList /></ProtectedRoute>} />
                  <Route path="workflow/new" element={<ProtectedRoute allowedRoles={['Admin']}><WorkflowEditor /></ProtectedRoute>} />
                  <Route path="workflow/:id" element={<ProtectedRoute allowedRoles={['Admin']}><WorkflowEditor /></ProtectedRoute>} />
                  <Route path="live-executions" element={<ProtectedRoute allowedRoles={['Admin']}><LiveExecutions /></ProtectedRoute>} />
                  <Route path="admin/approvals" element={<ProtectedRoute allowedRoles={['Admin']}><AdminApprovals /></ProtectedRoute>} />
                  <Route path="analytics" element={<ProtectedRoute allowedRoles={['Admin']}><Analytics /></ProtectedRoute>} />
                  <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['Admin']}><AuditLogs /></ProtectedRoute>} />
                  <Route path="team" element={<ProtectedRoute allowedRoles={['Admin']}><TeamAccess /></ProtectedRoute>} />
                  <Route path="wallet" element={<ProtectedRoute allowedRoles={['Admin']}><Wallet /></ProtectedRoute>} />
                  <Route path="settings" element={<ProtectedRoute allowedRoles={['Admin']}><AdminSettings /></ProtectedRoute>} />

                  {/* ── EXECUTION ROUTE (all roles) ── */}
                  <Route path="execute/:id" element={<ProtectedRoute><ExecuteWorkflow /></ProtectedRoute>} />

                  {/* ── STAFF / MANAGER ROUTES ── */}
                  <Route path="staff/dashboard" element={<ProtectedRoute><StaffDashboard /></ProtectedRoute>} />
                  <Route path="staff/requests" element={<ProtectedRoute><StartRequest /></ProtectedRoute>} />
                  <Route path="staff/my-requests" element={<ProtectedRoute><StaffMyRequests /></ProtectedRoute>} />
                  <Route path="approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
                  <Route path="tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="staff/inbox" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="staff/history" element={<ProtectedRoute><StaffHistory /></ProtectedRoute>} />
                  <Route path="staff/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                  <Route path="staff/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                  {/* ── EMPLOYEE ROUTES ── */}
                  <Route path="employee/dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
                  <Route path="employee/requests" element={<ProtectedRoute><StartRequest /></ProtectedRoute>} />
                  <Route path="employee/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
                  <Route path="employee/inbox" element={<ProtectedRoute><EmployeeInbox /></ProtectedRoute>} />
                  <Route path="employee/notifications" element={<ProtectedRoute><EmployeeNotifications /></ProtectedRoute>} />
                  <Route path="employee/history" element={<ProtectedRoute><LogHistory /></ProtectedRoute>} />
                  <Route path="employee/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </ConfirmProvider>
      </AlertProvider>
    </AuthProvider>
  );
}
