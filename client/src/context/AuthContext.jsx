// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from'react';
import api from'../utils/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 // Check if user is logged in on page load
 const storedUser = localStorage.getItem('halleyx_user');
 if (storedUser) {
 setUser(JSON.parse(storedUser));
 }
 setLoading(false);
 }, []);

 const login = async (email, password) => {
 const response = await api.post('/auth/login', { email, password });
 const userData = response.data.data;
 localStorage.setItem('halleyx_user', JSON.stringify(userData));
 localStorage.setItem('halleyx_token', userData.token);
 setUser(userData);
 return userData;
 };

 const logout = () => {
 localStorage.removeItem('halleyx_user');
 localStorage.removeItem('halleyx_token');
 setUser(null);
 };

 return (
 <AuthContext.Provider value={{ user, login, logout, loading }}>
 {!loading && children}
 </AuthContext.Provider>
 );
};