import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, CalendarCheck, CreditCard, Phone, Activity, FileText, ChevronRight, MessageSquare, Plus, Trash2, Check, X } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { formatDate, formatCurrency, getRelativeTime, getTodayString } from '../utils';
import { PAYMENT_MODES } from '../constants';
import { fetchPatientPayments } from '../services/api';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-semibold mt-0.5 leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    getPatientById,
    getSessionsRemaining,
    getPatientAttendance,
    markPatientPresent,
    getPatientRemarks,
    addRemark,
    updateRemark,
    deleteRemark,
    attendance,
    loading,
    user,
  } = useAppStore();

  const [markingPresent, setMarkingPresent] = useState(false);
  const [patientPayments, setPatientPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Remarks state
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(true);
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const patient = useMemo(() => getPatientById(id), [id, getPatientById]);
  const patientAttendance = useMemo(() => getPatientAttendance(id), [id, getPatientAttendance]);

  const loadPatientPayments = useCallback(() => {
    setPaymentsLoading(true);
    fetchPatientPayments(id)
      .then((data) => setPatientPayments(data))
      .catch(() => setPatientPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, [id]);

  const loadRemarks = useCallback(() => {
    setRemarksLoading(true);
    getPatientRemarks(id)
      .then((data) => setRemarks(data))
      .catch(() => setRemarks([]))
      .finally(() => setRemarksLoading(false));
  }, [id, getPatientRemarks]);

  useEffect(() => {
    loadPatientPayments();
    loadRemarks();
  }, [loadPatientPayments, loadRemarks]);

  if (loading) {
    return (
      <MobileLayout>
        <Header title="Patient Profile" showBack />
        <div className="px-4 py-12 text-center text-gray-500 text-sm">Loading…</div>
      </MobileLayout>
    );
  }

  if (!patient) {
    return (
      <MobileLayout>
        <Header title="Patient Profile" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">Patient not found.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/patients')}>Back</Button>
        </div>
      </MobileLayout>
    );
  }

  const remaining = getSessionsRemaining(patient);
  const sessionColor = remaining <= 0 ? 'danger' : remaining <= 2 ? 'warning' : 'success';
  const presentCount = patientAttendance.filter((a) => a.present).length;

  const handleMarkPresent = async () => {
    const today = getTodayString();
    const alreadyMarked = attendance.find(
      (a) => a.patient_id === id && a.date === today && a.present
    );
    if (alreadyMarked) {
      toast({ message: 'Already marked present today!', type: 'info' });
      return;
    }
    if (patient.payment_mode === 'advance' && remaining <= 0) {
      const confirmMark = window.confirm(
        `This patient has ${remaining} sessions remaining. Are you sure you want to mark them present? This will result in negative remaining sessions.`
      );
      if (!confirmMark) return;
    }
    setMarkingPresent(true);
    try {
      await markPatientPresent(id, today);
      toast({ message: `${patient.name} marked present for today!`, type: 'success' });
    } catch {
      toast({ message: 'Could not mark attendance', type: 'error' });
    } finally {
      setMarkingPresent(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;
    setAddingRemark(true);
    try {
      await addRemark({
        patient_id: id,
        message: newRemark.trim(),
        author_name: user?.username || 'Staff',
      });
      setNewRemark('');
      toast({ message: 'Remark added!', type: 'success' });
      loadRemarks();
    } catch {
      toast({ message: 'Failed to add remark', type: 'error' });
    } finally {
      setAddingRemark(false);
    }
  };

  const handleStartEdit = (rem) => {
    setEditingRemarkId(rem.id);
    setEditMessage(rem.message);
  };

  const handleSaveEdit = async (remarkId) => {
    if (!editMessage.trim()) return;
    setSavingEdit(true);
    try {
      await updateRemark(remarkId, editMessage.trim());
      setEditingRemarkId(null);
      setEditMessage('');
      toast({ message: 'Remark updated!', type: 'success' });
      loadRemarks();
    } catch {
      toast({ message: 'Failed to update remark', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRemark = async (remarkId) => {
    if (!window.confirm('Are you sure you want to delete this remark?')) return;
    try {
      await deleteRemark(remarkId);
      toast({ message: 'Remark deleted!', type: 'success' });
      loadRemarks();
    } catch {
      toast({ message: 'Failed to delete remark', type: 'error' });
    }
  };

  return (
    <MobileLayout>
      <Header title="Patient Profile" showBack
        rightAction={
          <Button size="sm" variant="ghost" icon={Edit2} onClick={() => navigate(`/patients/${id}/edit`)}>Edit</Button>
        }
      />
      <div className="px-4 pt-4 pb-32 flex flex-col gap-4">
        <Card gradient>
          <div className="flex items-center gap-4">
            <Avatar name={patient.name} photo={patient.photo} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-gray-900 truncate">{patient.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{patient.injury}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge color={patient.status === 'active' ? 'success' : 'gray'} dot>{patient.status}</Badge>
                <Badge color={PAYMENT_MODES[patient.payment_mode]?.color || 'primary'}>
                  {PAYMENT_MODES[patient.payment_mode]?.label}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {patient.payment_mode === 'advance' && (
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sessions</p>
            <div className="flex gap-3">
              <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-extrabold text-gray-800">{patient.sessions_total}</div>
                <div className="text-xs text-gray-500 mt-0.5">Bought</div>
              </div>
              <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-extrabold text-gray-800">{patient.sessions_used}</div>
                <div className="text-xs text-gray-500 mt-0.5">Used</div>
              </div>
              <div className={`flex-1 text-center p-3 rounded-xl
                ${sessionColor === 'danger' ? 'bg-danger-50' : sessionColor === 'warning' ? 'bg-warning-50' : 'bg-success-50'}`}>
                <div className={`text-xl font-extrabold ${sessionColor === 'danger' ? 'text-danger-600' : sessionColor === 'warning' ? 'text-warning-600' : 'text-success-600'}`}>
                  {remaining}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Remaining</div>
              </div>
            </div>
            {remaining <= 2 && (
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2
                ${remaining <= 0 ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'}`}>
                ⚠️ {remaining <= 0 ? 'Sessions exhausted! Please renew.' : `Only ${remaining} session(s) left.`}
              </div>
            )}
          </Card>
        )}

        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Details</p>
          <InfoRow icon={Phone} label="Phone" value={patient.phone} />
          <InfoRow icon={Activity} label="Injury / Condition" value={patient.injury} />
          <InfoRow icon={FileText} label="Prescription" value={patient.prescription} />
          <InfoRow icon={CalendarCheck} label="Last Visit" value={getRelativeTime(patient.last_visit)} />
          <InfoRow icon={CreditCard} label="Payment Mode" value={PAYMENT_MODES[patient.payment_mode]?.label} />
          <InfoRow icon={CreditCard} label="Consultancy Fee" value={patient.consultancy_fee ? formatCurrency(patient.consultancy_fee) : '—'} />
          <InfoRow icon={CalendarCheck} label="Enrollment Date" value={formatDate(patient.created_at)} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance</p>
            <Badge color="primary">{presentCount} present</Badge>
          </div>
          {patientAttendance.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No attendance records yet</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {patientAttendance.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 font-medium">{formatDate(a.date)}</span>
                  <Badge color={a.present ? 'success' : 'danger'} size="sm" dot>{a.present ? 'Present' : 'Absent'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Remarks / Doctor Notes Card - Positioned after Attendance & above Payment History */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-primary-600" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Remarks & Doctor Notes</p>
            </div>
            <Badge color="indigo" size="sm">{remarks.length} notes</Badge>
          </div>

          <form onSubmit={handleAddRemark} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Write a patient remark or note..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
            <Button type="submit" size="sm" loading={addingRemark} icon={Plus}>Add</Button>
          </form>

          {remarksLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading remarks...</p>
          ) : remarks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No remarks added yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {remarks.map((rem) => {
                const isEditing = editingRemarkId === rem.id;
                const isUpdated = rem.updated_at && rem.updated_at !== rem.created_at;

                return (
                  <div key={rem.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{rem.author_name || 'Staff'}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(rem.created_at)}</span>
                        {isUpdated && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(rem)}
                            className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
                            title="Edit Remark"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRemark(rem.id)}
                            className="p-1 text-gray-400 hover:text-danger-600 rounded transition-colors"
                            title="Delete Remark"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-800 outline-none focus:border-primary-500"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingRemarkId(null)}
                            className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            <X size={12} /> Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(rem.id)}
                            disabled={savingEdit}
                            className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 flex items-center gap-1"
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-snug whitespace-pre-wrap">{rem.message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment History</p>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/payments?patient=${id}&type=extra`)} className="text-xs text-indigo-600 font-semibold hover:underline">
                + Extra Payment
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={() => navigate(`/payments?patient=${id}`)} className="flex items-center gap-1 text-xs text-primary-600 font-semibold">
                Add <ChevronRight size={12} />
              </button>
            </div>
          </div>
          {paymentsLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : patientPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No payments recorded</p>
          ) : (
            <div className="flex flex-col gap-2">
              {patientPayments.map((pay) => {
                const isExtra = pay.payment_type === 'extra';
                return (
                  <div key={pay.id} className="p-2.5 rounded-xl border border-gray-100 bg-white flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900 font-bold">{formatCurrency(pay.amount)}</p>
                        <p className="text-xs text-gray-400">{formatDate(pay.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <Badge color={PAYMENT_MODES[pay.payment_type]?.color || 'primary'} size="sm">
                          {isExtra ? 'Extra Payment' : `${pay.sessions} sessions`}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{PAYMENT_MODES[pay.payment_type]?.label || pay.payment_type}</p>
                      </div>
                    </div>
                    {pay.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 italic mt-0.5">
                        💬 <span className="font-medium">{pay.notes}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 pb-5 pt-3 bg-white border-t border-gray-100 z-50">
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" icon={CreditCard}
            onClick={() => navigate(`/payments?patient=${id}`)}>Add Payment</Button>
          <Button size="md" className="flex-1" icon={CalendarCheck} loading={markingPresent} onClick={handleMarkPresent}>
            Mark Present
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PatientProfile;
