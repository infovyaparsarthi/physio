import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, CreditCard, AlertTriangle, Plus, TrendingUp, Clock, Lock, Key, LogOut, MessageSquare } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useAppStore } from '../store/AppContext';
import { formatCurrency } from '../utils';
import { changePasswordRequest, clearToken } from '../services/api';

const StatCard = ({ icon, label, value, color, sub }) => (
  <Card className="flex-1 min-w-0" gradient>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3
      ${color === 'primary' ? 'bg-primary-100 text-primary-600' :
        color === 'success' ? 'bg-success-100 text-success-600' :
          color === 'warning' ? 'bg-warning-100 text-warning-600' :
            'bg-danger-100 text-danger-600'}
    `}>
      {React.createElement(icon, { size: 18, strokeWidth: 2.5 })}
    </div>
    <div className="text-2xl font-extrabold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    getTodayPatients, getActivePatients, getLowSessionPatients,
    payments, getSessionsRemaining, loading, user,
  } = useAppStore();
  const isAdmin = user?.isAdmin === 1;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters long');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await changePasswordRequest(pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess('Password changed successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwSuccess('');
      }, 1500);
    } catch (err) {
      setPwError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayPatients = useMemo(() => getTodayPatients(), [getTodayPatients]);
  const activePatients = useMemo(() => getActivePatients(), [getActivePatients]);
  const lowSessionPatients = useMemo(() => getLowSessionPatients(), [getLowSessionPatients]);

  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

  if (loading) {
    return (
      <MobileLayout>
        <div className="px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Top banner */}
      <div className="gradient-primary px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-xs font-medium">{today}</p>
              <h1 className="text-white text-xl font-bold mt-0.5">Good Morning, {user?.name} 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer text-white"
                title="Change Password"
              >
                <Lock size={20} />
              </button>
              <button
                onClick={() => {
                  clearToken();
                  navigate('/login');
                }}
                className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer text-white"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="bg-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-semibold">{todayPatients.length} patients today</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-4 flex flex-col gap-5">
        {/* Stat cards */}
        <div className="flex gap-3">
          <StatCard icon={CalendarCheck} label="Today" value={todayPatients.length} color="primary" sub="Attended" />
          <StatCard icon={Users} label="Active" value={activePatients.length} color="success" sub="Patients" />
        </div>
        <div className="flex gap-3">
          <StatCard icon={AlertTriangle} label="Low Sessions" value={lowSessionPatients.length} color="warning" sub="Need renewal" />
          {isAdmin && (
            <StatCard icon={CreditCard} label="Revenue" value={formatCurrency(totalRevenue)} color="primary" sub="Total collected" />
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <button onClick={() => navigate('/attendance')}
              className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-primary-600 text-white active:scale-95 transition-transform">
              <CalendarCheck size={20} />
              <span className="text-[10px] font-bold text-center">Mark Attend</span>
            </button>
            <button onClick={() => navigate('/patients/new')}
              className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-success-600 text-white active:scale-95 transition-transform">
              <Plus size={20} />
              <span className="text-[10px] font-bold text-center">Add Patient</span>
            </button>
            <button onClick={() => navigate('/enquiries')}
              className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-warning-600 text-white active:scale-95 transition-transform">
              <MessageSquare size={20} />
              <span className="text-[10px] font-bold text-center">Enquiries</span>
            </button>
          </div>
        </div>

        {/* Low session alerts */}
        {lowSessionPatients.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning-500" /> Session Alerts
              </h2>
              <Badge color="warning">{lowSessionPatients.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {lowSessionPatients.map((p) => {
                const remaining = getSessionsRemaining(p);
                return (
                  <Card key={p.id} onClick={() => navigate(`/patients/${p.id}`)} className="border-l-4 border-l-warning-400">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.injury}</p>
                      </div>
                      <Badge color={remaining <= 0 ? 'danger' : 'warning'}>{remaining} left</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's patients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Clock size={14} className="text-primary-500" /> Today's Patients
            </h2>
            <button onClick={() => navigate('/patients')} className="text-xs text-primary-600 font-semibold">View All</button>
          </div>
          {todayPatients.length === 0 ? (
            <Card className="text-center py-6">
              <p className="text-gray-400 text-sm">No attendance marked yet today</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/attendance')}>
                Mark Attendance
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {todayPatients.map((p) => (
                <Card key={p.id} onClick={() => navigate(`/patients/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.injury}</p>
                    </div>
                    <Badge color="success" dot>Present</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Key size={18} className="text-primary-600" /> Change Password
            </h3>
            <p className="text-xs text-gray-500 mb-4">Secure your account with a new password.</p>

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => {
                    setPwForm({ ...pwForm, currentPassword: e.target.value });
                    setPwError('');
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  placeholder="Enter current password"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => {
                    setPwForm({ ...pwForm, newPassword: e.target.value });
                    setPwError('');
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  placeholder="Enter new password"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={(e) => {
                    setPwForm({ ...pwForm, confirmPassword: e.target.value });
                    setPwError('');
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  placeholder="Confirm new password"
                />
              </div>

              {pwError && (
                <div className="bg-danger-50 text-danger-600 text-xs px-3 py-2 rounded-lg font-semibold">
                  ⚠️ {pwError}
                </div>
              )}

              {pwSuccess && (
                <div className="bg-success-50 text-success-700 text-xs px-3 py-2 rounded-lg font-semibold">
                  ✓ {pwSuccess}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 border border-gray-200 text-gray-600"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPwError('');
                    setPwSuccess('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={pwLoading}
                >
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default Dashboard;
