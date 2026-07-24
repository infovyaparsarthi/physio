import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AppProvider } from './store/AppContext';
import { getToken, getUserInfo } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import Attendance from './pages/Attendance';
import AttendanceHistory from './pages/AttendanceHistory';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Enquiries from './pages/Enquiries';
import Companies from './pages/Companies';
import CompanySubscriptions from './pages/CompanySubscriptions';


const ProtectedRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  if (!getToken()) return <Navigate to="/login" replace />;
  const user = getUserInfo();
  if (!user || user.isAdmin !== 1) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
            <Route path="/patients/new" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
            <Route path="/patients/:id/edit" element={<ProtectedRoute><PatientForm /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/attendance/history" element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>} />
            <Route path="/payments" element={<AdminRoute><Payments /></AdminRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/companies" element={<AdminRoute><Companies /></AdminRoute>} />
            <Route path="/companies/:companyId/subscriptions" element={<AdminRoute><CompanySubscriptions /></AdminRoute>} />
            <Route path="/enquiries" element={<ProtectedRoute><Enquiries /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
