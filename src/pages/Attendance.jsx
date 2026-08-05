import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, Users, CalendarDays, History, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { formatDate, getTodayString } from '../utils';

const Attendance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = getTodayString();
  const { getActivePatients, saveAttendance, attendance, getPatientEnrollmentDate } = useAppStore();
  const toast = useToast();
  const dateInputRef = useRef(null);

  const activePatients = useMemo(() => getActivePatients(), [getActivePatients]);

  // Allow pre-seeding the date from ?date= query param (e.g. from AttendanceHistory "Edit" button)
  const initialDate = (() => {
    const qd = searchParams.get('date');
    return qd && qd <= today ? qd : today;
  })();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [listFilter, setListFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  // Navigate days
  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
    setSaved(false);
  };

  const goToNextDay = () => {
    if (isToday) return; // Can't go to future
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const next = `${y}-${m}-${day}`;
    if (next <= today) {
      setSelectedDate(next);
      setSaved(false);
    }
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val && val <= today) {
      setSelectedDate(val);
      setSaved(false);
    } else if (val > today) {
      toast({ message: 'Cannot mark attendance for future dates', type: 'error' });
    }
  };

  const filteredPatients = useMemo(() => {
    return activePatients.filter((p) => {
      const isPresent = Boolean(attendanceMap[p.id]);
      if (listFilter === 'present') return isPresent;
      if (listFilter === 'absent') return !isPresent;
      return true;
    });
  }, [activePatients, attendanceMap, listFilter]);

  // Load attendance for selected date
  useEffect(() => {
    const dateRecs = attendance.filter((a) => a.date === selectedDate);
    const initial = {};
    activePatients.forEach((p) => {
      const r = dateRecs.find((a) => a.patient_id === p.id);
      initial[p.id] = r ? r.present : false;
    });
    setAttendanceMap(initial);
    setSaved(false);
  }, [activePatients, attendance, selectedDate]);

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;

  const hasSavedForDate = useMemo(() => {
    return attendance.some((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  // Returns true if a patient was not yet enrolled on the selected date
  const isPatientPreEnrollment = useCallback((patientId) => {
    const enrollmentDate = getPatientEnrollmentDate(patientId);
    if (!enrollmentDate) return false;
    return selectedDate < enrollmentDate;
  }, [getPatientEnrollmentDate, selectedDate]);

  const enrollablePatients = useMemo(
    () => activePatients.filter((p) => !isPatientPreEnrollment(p.id)),
    [activePatients, isPatientPreEnrollment]
  );

  const togglePatient = (id) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handlePatientClick = (patientId, isEditable, isLocked) => {
    if (isLocked) {
      const ed = getPatientEnrollmentDate(patientId);
      toast({ message: `Patient not yet enrolled on this date. Enrollment: ${formatDate(ed)}`, type: 'info' });
      return;
    }
    if (!isEditable) {
      toast({ message: 'Attendance already marked. Switch to Present/Absent tabs to update.', type: 'info' });
      return;
    }
    togglePatient(patientId);
  };

  const markAll = () => {
    if (hasSavedForDate && listFilter === 'all') {
      toast({ message: 'Attendance already marked. Use Present/Absent tabs to update individual patients.', type: 'error' });
      return;
    }
    const next = { ...attendanceMap };
    // Only mark enrollable patients
    enrollablePatients.forEach((p) => { next[p.id] = true; });
    setAttendanceMap(next);
    setSaved(false);
    toast({ message: `${enrollablePatients.length} enrolled patients marked present`, type: 'info' });
  };

  const clearAll = () => {
    if (hasSavedForDate && listFilter === 'all') {
      toast({ message: 'Attendance already marked. Use Present/Absent tabs to update individual patients.', type: 'error' });
      return;
    }
    const next = { ...attendanceMap };
    enrollablePatients.forEach((p) => { next[p.id] = false; });
    setAttendanceMap(next);
    setSaved(false);
  };

  const handleSave = async () => {
    const skippedCount = activePatients.filter((p) => isPatientPreEnrollment(p.id)).length;
    setSaving(true);
    try {
      await saveAttendance(selectedDate, attendanceMap);
      setSaved(true);
      const msg = skippedCount > 0
        ? `Attendance saved! ${presentCount} present. ${skippedCount} patient${skippedCount !== 1 ? 's' : ''} skipped (not yet enrolled).`
        : `Attendance saved for ${formatDate(selectedDate)}! ${presentCount} patient${presentCount !== 1 ? 's' : ''} present.`;
      toast({ message: msg, type: 'success' });
    } catch {
      toast({ message: 'Could not save attendance', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = isToday ? 'Today' : selectedDate === (() => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
  })() ? 'Yesterday' : formatDate(selectedDate);

  return (
    <MobileLayout>
      <Header
        title="Attendance"
        subtitle={formatDate(selectedDate)}
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            icon={History}
            onClick={() => navigate('/attendance/history')}
          >
            History
          </Button>
        }
      />

      <div className="px-4 pt-4 pb-44 flex flex-col gap-4">
        {/* Date selector card */}
        <Card gradient>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Prev day */}
              <button
                onClick={goToPrevDay}
                className="w-8 h-8 rounded-xl bg-white/60 hover:bg-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                title="Previous day"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>

              {/* Calendar icon — taps to open date picker */}
              <div className="relative">
                <button
                  onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center hover:bg-primary-200 active:scale-95 transition-all cursor-pointer"
                  title="Pick a date"
                >
                  <CalendarDays size={20} className="text-primary-600" />
                </button>
                {/* Hidden native date input */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={handleDateChange}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  style={{ zIndex: 1 }}
                />
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">{dateLabel}</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(selectedDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-2xl font-extrabold text-primary-600">{presentCount}</div>
                <div className="text-xs text-gray-500">/ {enrollablePatients.length} present</div>
              </div>
              {/* Next day */}
              <button
                onClick={goToNextDay}
                disabled={isToday}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                  ${isToday ? 'opacity-30 cursor-not-allowed' : 'bg-white/60 hover:bg-white active:scale-90 shadow-sm'}`}
                title="Next day"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Past date badge */}
          {!isToday && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                <CalendarDays size={10} />
                Editing past date
              </span>
              {hasSavedForDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold">
                  ✓ Already saved
                </span>
              )}
            </div>
          )}

          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${enrollablePatients.length > 0 ? (presentCount / enrollablePatients.length) * 100 : 0}%` }} />
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Users} onClick={markAll} disabled={hasSavedForDate && listFilter === 'all'} className="flex-1">Mark All Present</Button>
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={hasSavedForDate && listFilter === 'all'} className="flex-1 border border-gray-200">Clear All</Button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
            {['all', 'present', 'absent'].map((f) => {
              const count = f === 'all'
                ? activePatients.length
                : f === 'present'
                  ? presentCount
                  : activePatients.length - presentCount;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setListFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                    ${listFilter === f ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {f === 'all' ? 'All' : f === 'present' ? 'Present' : 'Absent'} ({count})
                </button>
              );
            })}
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Patients Shown ({filteredPatients.length})
          </p>

          <div className="flex flex-col gap-2">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">No patients found in this filter</p>
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const preEnrollment = isPatientPreEnrollment(patient.id);
                const isPresent = (!preEnrollment && listFilter === 'all' && hasSavedForDate) ? false : attendanceMap[patient.id];
                const isEditable = !preEnrollment && (!hasSavedForDate || listFilter !== 'all');
                return (
                  <div key={patient.id} onClick={() => handlePatientClick(patient.id, isEditable, preEnrollment)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 select-none transition-all duration-200
                      ${preEnrollment ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-100' :
                        !isEditable ? 'cursor-not-allowed opacity-90 bg-white border-gray-100' :
                          `cursor-pointer active:scale-95 ${isPresent ? 'bg-success-50 border-success-200' : 'bg-white border-gray-100'}`}
                    `}>
                    <Avatar name={patient.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-bold truncate ${preEnrollment ? 'text-gray-400' : isPresent ? 'text-success-800' : 'text-gray-800'}`}>
                          {patient.name}
                        </p>
                      </div>
                      {preEnrollment ? (
                        <p className="text-[10px] text-amber-600 font-semibold truncate">
                          Enrolled: {formatDate(getPatientEnrollmentDate(patient.id))}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 truncate">{patient.injury}</p>
                      )}
                    </div>
                    {preEnrollment ? (
                      <div className="text-gray-300" title="Not yet enrolled on this date">
                        <Lock size={18} strokeWidth={1.5} />
                      </div>
                    ) : isEditable ? (
                      <div className={`transition-all duration-200 ${isPresent ? 'text-success-500' : 'text-gray-300'}`}>
                        {isPresent ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={1.5} />}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 z-30 drop-shadow-xl">
        <Button size="full" icon={CheckCircle2} loading={saving} onClick={handleSave} variant={saved ? 'success' : 'primary'} className="shadow-2xl rounded-2xl">
          {saved
            ? `Saved for ${formatDate(selectedDate)} ✓`
            : isToday
              ? (listFilter === 'all' ? 'Save Attendance' : `Save Attendance (${presentCount} Present)`)
              : `Update Attendance — ${formatDate(selectedDate)}`
          }
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Attendance;
