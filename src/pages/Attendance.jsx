import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Users, CalendarDays, History } from 'lucide-react';
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
  const today = getTodayString();
  const { getActivePatients, saveAttendance, attendance } = useAppStore();
  const toast = useToast();

  const activePatients = useMemo(() => getActivePatients(), [getActivePatients]);

  const [attendanceMap, setAttendanceMap] = useState({});
  const [listFilter, setListFilter] = useState('all');

  const filteredPatients = useMemo(() => {
    return activePatients.filter((p) => {
      const isPresent = Boolean(attendanceMap[p.id]);
      if (listFilter === 'present') return isPresent;
      if (listFilter === 'absent') return !isPresent;
      return true;
    });
  }, [activePatients, attendanceMap, listFilter]);

  useEffect(() => {
    const todayRecs = attendance.filter((a) => a.date === today);
    const initial = {};
    activePatients.forEach((p) => {
      const r = todayRecs.find((a) => a.patient_id === p.id);
      initial[p.id] = r ? r.present : false;
    });
    setAttendanceMap(initial);
  }, [activePatients, attendance, today]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;

  const hasSavedToday = useMemo(() => {
    return attendance.some((a) => a.date === today);
  }, [attendance, today]);

  const togglePatient = (id) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handlePatientClick = (patientId, isEditable) => {
    if (!isEditable) {
      toast({ message: 'Attendance already marked. Please switch to the Present/Absent tabs to make updates.', type: 'info' });
      return;
    }
    togglePatient(patientId);
  };

  const markAll = () => {
    if (hasSavedToday && listFilter === 'all') {
      toast({ message: 'Attendance already marked. Please update individual patients on the Present/Absent tabs.', type: 'error' });
      return;
    }
    const next = {};
    activePatients.forEach((p) => { next[p.id] = true; });
    setAttendanceMap(next);
    setSaved(false);
    toast({ message: 'All patients marked present', type: 'info' });
  };

  const clearAll = () => {
    if (hasSavedToday && listFilter === 'all') {
      toast({ message: 'Attendance already marked. Please update individual patients on the Present/Absent tabs.', type: 'error' });
      return;
    }
    const next = {};
    activePatients.forEach((p) => { next[p.id] = false; });
    setAttendanceMap(next);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAttendance(today, attendanceMap);
      setSaved(true);
      toast({
        message: `Attendance saved! ${presentCount} patient${presentCount !== 1 ? 's' : ''} marked present.`,
        type: 'success',
      });
    } catch {
      toast({ message: 'Could not save attendance', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout>
      <Header
        title="Attendance"
        subtitle={formatDate(today)}
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
        <Card gradient>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <CalendarDays size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Today</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(today)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-primary-600">{presentCount}</div>
              <div className="text-xs text-gray-500">/ {activePatients.length} present</div>
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${activePatients.length > 0 ? (presentCount / activePatients.length) * 100 : 0}%` }} />
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Users} onClick={markAll} disabled={hasSavedToday && listFilter === 'all'} className="flex-1">Mark All Present</Button>
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={hasSavedToday && listFilter === 'all'} className="flex-1 border border-gray-200">Clear All</Button>
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
                const isPresent = (listFilter === 'all' && hasSavedToday) ? false : attendanceMap[patient.id];
                const isEditable = !hasSavedToday || listFilter !== 'all';
                return (
                  <div key={patient.id} onClick={() => handlePatientClick(patient.id, isEditable)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 select-none transition-all duration-200
                      ${!isEditable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'}
                      ${isPresent ? 'bg-success-50 border-success-200' : 'bg-white border-gray-100'}`}>
                    <Avatar name={patient.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-bold truncate ${isPresent ? 'text-success-800' : 'text-gray-800'}`}>{patient.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{patient.injury}</p>
                    </div>
                    {isEditable && (
                      <div className={`transition-all duration-200 ${isPresent ? 'text-success-500' : 'text-gray-300'}`}>
                        {isPresent ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={1.5} />}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 pb-3 pt-3 bg-white border-t border-gray-100 z-50">
        <Button size="full" icon={CheckCircle2} loading={saving} onClick={handleSave} variant={saved ? 'success' : 'primary'}>
          {saved ? 'Attendance Saved ✓' : (listFilter === 'all' ? 'Save Attendance' : `Save Attendance (${presentCount} Present)`)}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Attendance;
