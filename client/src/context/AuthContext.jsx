import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('sos_user');
    const token = localStorage.getItem('sos_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function setSession(data) {
    localStorage.setItem('sos_token', data.token);
    localStorage.setItem('sos_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setSession(data);
    return data.user;
  }

  // Registration no longer logs the user in directly — it creates the
  // account and sends an OTP. The caller should route to /verify-otp.
  async function register(name, email, password, phone) {
    const { data } = await api.post('/auth/register', { name, email, password, phone });
    return data; // { success, message, email }
  }

  async function verifyOtp(email, otp) {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    setSession(data);
    return data.user;
  }

  async function resendOtp(email) {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  }

  function logout() {
    localStorage.removeItem('sos_token');
    localStorage.removeItem('sos_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
