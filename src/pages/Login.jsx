import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { loginRequest, setToken, resetPasswordRequest } from '../services/api';
import { useAppStore } from '../store/AppContext';
import { useToast } from '../components/Toast';

const Login = () => {
  const navigate = useNavigate();
  const { refresh } = useAppStore();
  const toast = useToast();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    try {
      await resetPasswordRequest(form.username);
      toast({ message: 'password reset to admin123', type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to reset password';
      toast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginRequest(form.username, form.password);
      setToken(data.token);
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Invalid username or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Header gradient */}
      <div className="gradient-primary flex flex-col items-center justify-center pt-14 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Activity size={32} className="text-white" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">PhysioAdmin</h1>
            <p className="text-primary-100 text-sm mt-0.5">Clinic Management System</p>
          </div>
        </div>
      </div>

      {/* Form card floating over gradient */}
      <div className="flex-1 px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-card-hover p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Welcome back 👋</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your admin account</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              icon={User}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              icon={Lock}
              required
            />
            {error && (
              <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}
            <Button
              type="submit"
              size="full"
              loading={loading}
              className="mt-2"
            >
              Sign In
            </Button>
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="py-6 text-center text-xs text-gray-400">
        PhysioAdmin v1.0 · Secure Admin Panel
      </div>
    </div>
  );
};

export default Login;

