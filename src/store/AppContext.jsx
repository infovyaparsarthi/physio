import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { formatDate, getTodayString } from '../utils';
import {
  getToken,
  getUserInfo,
  fetchPatients,
  fetchAttendance,
  fetchPayments,
  saveAttendanceBulk,
  createPatient,
  updatePatient,
  createPayment,
  markPresentRequest,
  fetchEnquiries,
  createEnquiry,
  deleteEnquiryRequest,
  fetchReportsSummary,
  fetchCompanies,
  createCompany,
  updateCompany,
} from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [user, setUser] = useState(() => getUserInfo());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!getToken()) {
      setPatients([]);
      setAttendance([]);
      setPayments([]);
      setEnquiries([]);
      setCompanies([]);
      setReportSummary(null);
      setLoading(false);
      return;
    }
    const currentUser = getUserInfo();
    setUser(currentUser);
    const isAdmin = currentUser?.isAdmin === 1;
    setLoading(true);
    setError(null);
    try {
      const baseFetches = [
        fetchPatients(),
        fetchAttendance(),
        fetchEnquiries(),
        fetchReportsSummary(),
        fetchPayments(), // Scoped by company_id on the backend for non-admin users
      ];
      // Only fetch admin-only data if user is admin
      if (isAdmin) {
        baseFetches.push(fetchCompanies());
      }
      const results = await Promise.all(baseFetches);
      setPatients(results[0]);
      setAttendance(results[1]);
      setEnquiries(results[2]);
      setReportSummary(results[3]);
      setPayments(results[4]);
      if (isAdmin) {
        setCompanies(results[5]);
      } else {
        setCompanies([]);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load data');
      setPatients([]);
      setAttendance([]);
      setPayments([]);
      setEnquiries([]);
      setCompanies([]);
      setReportSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addPatient = useCallback(
    async (patientData) => {
      const body = {
        name: patientData.name,
        phone: patientData.phone,
        injury: patientData.injury,
        prescription: patientData.prescription || '',
        payment_mode: patientData.payment_mode,
        sessions_total:
          patientData.payment_mode === 'advance' ? patientData.sessions_total : 0,
        photo: patientData.photo || null,
        initial_payment_amount:
          patientData.initial_payment_amount !== '' && patientData.initial_payment_amount !== undefined
            ? Number(patientData.initial_payment_amount)
            : 0,
        consultancy_fee:
          patientData.consultancy_fee !== '' && patientData.consultancy_fee !== undefined
            ? Number(patientData.consultancy_fee)
            : 0,
      };
      const created = await createPatient(body);
      await loadAll();
      return created;
    },
    [loadAll]
  );

  const updatePatientById = useCallback(
    async (id, updates) => {
      const body = {
        name: updates.name,
        phone: updates.phone,
        injury: updates.injury,
        prescription: updates.prescription,
        payment_mode: updates.payment_mode,
        status: updates.status,
        photo: updates.photo,
        consultancy_fee:
          updates.consultancy_fee !== '' && updates.consultancy_fee !== undefined
            ? Number(updates.consultancy_fee)
            : 0,
      };
      if (updates.payment_mode === 'advance') {
        if (updates.sessions_total !== undefined) {
          body.sessions_total = Number(updates.sessions_total);
        }
        if (updates.sessions_used !== undefined) {
          body.sessions_used = Number(updates.sessions_used);
        }
      }
      const updated = await updatePatient(id, body);
      await loadAll();
      return updated;
    },
    [loadAll]
  );

  const saveAttendance = useCallback(
    async (dateString, attendanceMap) => {
      // Filter out patients who were not yet enrolled on the selected date
      const entries = Object.entries(attendanceMap)
        .filter(([patient_id]) => {
          const patient = patients.find((p) => p.id === patient_id);
          if (!patient?.created_at) return true; // allow if unknown
          const enrollmentDate = patient.created_at.slice(0, 10); // 'YYYY-MM-DD'
          return dateString >= enrollmentDate;
        })
        .map(([patient_id, present]) => ({
          patient_id,
          present: Boolean(present),
        }));
      await saveAttendanceBulk(dateString, entries);
      await loadAll();
    },
    [loadAll, patients]
  );

  const addPayment = useCallback(
    async (paymentData) => {
      await createPayment({
        patient_id: paymentData.patient_id,
        amount: Number(paymentData.amount),
        payment_type: paymentData.payment_type,
        sessions: paymentData.sessions,
      });
      await loadAll();
    },
    [loadAll]
  );

  const markPatientPresent = useCallback(
    async (patientId, date) => {
      await markPresentRequest(patientId, date);
      await loadAll();
    },
    [loadAll]
  );

  const getPatientById = useCallback(
    (id) => patients.find((p) => p.id === id),
    [patients]
  );

  /**
   * Returns the enrollment date of a patient as a 'YYYY-MM-DD' string,
   * or null if not found.
   */
  const getPatientEnrollmentDate = useCallback(
    (patientId) => {
      const patient = patients.find((p) => p.id === patientId);
      if (!patient?.created_at) return null;
      return patient.created_at.slice(0, 10);
    },
    [patients]
  );

  const getSessionsRemaining = useCallback((patient) => {
    if (!patient) return 0;
    return patient.sessions_total - patient.sessions_used;
  }, []);

  const getPatientAttendance = useCallback(
    (patientId) =>
      attendance
        .filter((a) => a.patient_id === patientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [attendance]
  );

  const getPatientPayments = useCallback(
    (patientId) =>
      payments
        .filter((p) => p.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [payments]
  );

  const getTodayAttendance = useCallback(() => {
    const today = getTodayString();
    return attendance.filter((a) => a.date === today);
  }, [attendance]);

  const getTodayPatients = useCallback(() => {
    const today = getTodayString();
    const todayIds = attendance
      .filter((a) => a.date === today && a.present)
      .map((a) => a.patient_id);
    return patients.filter((p) => todayIds.includes(p.id));
  }, [patients, attendance]);

  const getActivePatients = useCallback(
    () => patients.filter((p) => p.status === 'active'),
    [patients]
  );

  const getLowSessionPatients = useCallback(
    () =>
      patients.filter((p) => {
        const remaining = p.sessions_total - p.sessions_used;
        return p.payment_mode === 'advance' && remaining <= 2;
      }),
    [patients]
  );

  const addEnquiry = useCallback(
    async (enquiryData) => {
      await createEnquiry(enquiryData);
      await loadAll();
    },
    [loadAll]
  );

  const deleteEnquiry = useCallback(
    async (id) => {
      await deleteEnquiryRequest(id);
      await loadAll();
    },
    [loadAll]
  );

  const addNewCompany = useCallback(
    async (companyData) => {
      const created = await createCompany(companyData);
      await loadAll();
      return created;
    },
    [loadAll]
  );

  const updateCompanyById = useCallback(
    async (id, updates) => {
      const updated = await updateCompany(id, updates);
      await loadAll();
      return updated;
    },
    [loadAll]
  );

  const value = {
    user,
    patients,
    attendance,
    payments,
    enquiries,
    companies,
    reportSummary,
    loading,
    error,
    refresh: loadAll,
    addPatient,
    updatePatient: updatePatientById,
    saveAttendance,
    addPayment,
    markPatientPresent,
    getPatientById,
    getPatientEnrollmentDate,
    getSessionsRemaining,
    getPatientAttendance,
    getPatientPayments,
    getTodayAttendance,
    getTodayPatients,
    getActivePatients,
    getLowSessionPatients,
    addEnquiry,
    deleteEnquiry,
    addNewCompany,
    updateCompanyById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppProvider>');
  return ctx;
};

export default AppContext;
