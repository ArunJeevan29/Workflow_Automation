// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await login(email, password);
      showAlert('success', `Welcome back, ${userData.name}!`);
      
      // Role-based redirect to their respective dashboard
      if (userData.role === 'Admin') {
        navigate('/'); // Admin Dashboard
      } else if (userData.role === 'Employee') {
        navigate('/employee/dashboard'); // Employee Dashboard
      } else {
        navigate('/staff/dashboard'); // Staff/Manager Dashboard
      }
    } catch (error) {
      showAlert('danger', error.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#58bfa1] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#58bfa1] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 border-2 border-[#58bfa1]/30 rounded-2xl rotate-45"></div>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <img src="/haloflow-logo.svg" alt="HaloFlow Logo" className="w-12 h-12" />
            <span className="text-4xl font-bold tracking-tight">HaloFlow</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Streamline Your<br/>
            <span className="text-[#58bfa1]">Workflow</span> Automation
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            Empower your team with intelligent workflow automation. 
            Build, manage, and track approvals with ease.
          </p>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#58bfa1] rounded-full"></div>
              <span className="text-gray-300">Smart Approvals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#58bfa1] rounded-full"></div>
              <span className="text-gray-300">Real-time Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#58bfa1] rounded-full"></div>
              <span className="text-gray-300">Team Collaboration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/haloflow-logo.svg" alt="HaloFlow Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-gray-900">HaloFlow</span>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-500">Sign in to continue to your workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <TextInput 
                label="Email Address" 
                type="email" 
                placeholder="name@company.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <TextInput 
                label="Password" 
                type="password" 
                placeholder="Enter your password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#58bfa1] focus:ring-[#58bfa1]"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-[#58bfa1] hover:text-[#4aa88d] font-medium">
                  Forgot password?
                </a>
              </div>
              
              <Button 
                variant="solid" 
                color="primary" 
                className="w-full justify-center py-3 text-base shadow-md hover:shadow-lg transition-shadow" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact your administrator
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            © 2024 HaloFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
