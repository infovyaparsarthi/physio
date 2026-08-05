import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, UserCheck, UserX, History, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useAppStore } from '../store/AppContext';
import { formatDate, getTodayString } from '../utils';

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const { attendance, patients } = useAppStore();
  const [expandedDate, setExpandedDate] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const today = getTodayString();

  // Group by date, descending
  const groupedAttendance = useMemo(() => {
    const groups = {};
    attendance.forEach((rec) => {
      if (!groups[rec.date]) {
        groups[rec.date] = [];
      }
      groups[rec.date].push(rec);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        records: groups[date],
        presentCount: groups[date].filter((r) => r.present).length,
        totalCount: groups[date].length,
      }));
  }, [attendance]);

  // Filtered by selected date (month or exact)
  const filteredGroups = useMemo(() => {
    if (!filterDate) return groupedAttendance;
    return groupedAttendance.filter((g) => g.date === filterDate);
  }, [groupedAttendance, filterDate]);

  const toggleExpand = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const clearFilter = () => {
    setFilterDate('');
    setExpandedDate(null);
  };

  // Auto-expand if single result
  const displayGroups = filteredGroups;

  return (
    <MobileLayout>
      <Header
        title="Attendance History"
        subtitle="Log of all past sessions"
        showBack
      />

      <div className="px-4 pt-4 pb-20 flex flex-col gap-4">
        {/* Date filter bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <CalendarDays size={15} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={filterDate}
              max={today}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setExpandedDate(e.target.value || null);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 font-medium outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              placeholder="Filter by date"
            />
          </div>
          {filterDate && (
            <button
              onClick={clearFilter}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 active:scale-95"
              title="Clear filter"
            >
              <X size={16} />
            </button>
          )}
          {/* Jump to edit that date */}
          {filterDate && (
            <button
              onClick={() => navigate(`/attendance?date=${filterDate}`)}
              className="px-3 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 transition-colors text-white text-xs font-semibold active:scale-95 whitespace-nowrap"
              title="Edit attendance for this date"
            >
              Edit
            </button>
          )}
        </div>

        {/* Summary when filtered */}
        {filterDate && filteredGroups.length === 0 && (
          <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-gray-100">
            <CalendarDays size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">No attendance for {formatDate(filterDate)}</p>
            <button
              onClick={() => navigate(`/attendance?date=${filterDate}`)}
              className="mt-3 text-xs font-semibold text-primary-600 underline underline-offset-2"
            >
              Mark attendance for this date →
            </button>
          </div>
        )}

        {!filterDate && groupedAttendance.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium font-sm">No attendance records found yet.</p>
          </div>
        )}

        {displayGroups.map((group) => {
          const isExpanded = expandedDate === group.date;
          return (
            <div key={group.date} className="flex flex-col gap-2">
              <Card
                onClick={() => toggleExpand(group.date)}
                className={`
                  border-2 transition-all cursor-pointer
                  ${isExpanded ? 'border-primary-200 bg-primary-50/30' : 'border-transparent'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                      <CalendarDays size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatDate(group.date)}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {group.presentCount} present out of {group.totalCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit button for this date */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/attendance?date=${group.date}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 text-[10px] font-bold transition-all active:scale-95"
                      title="Edit this date's attendance"
                    >
                      Edit
                    </button>
                    {isExpanded ? <ChevronUp size={20} className="text-primary-500" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>
              </Card>

              {isExpanded && (
                <div className="flex flex-col gap-2 px-1 animate-in slide-in-from-top-2 duration-300">
                  {group.records
                    .sort((a, b) => {
                      const pA = patients.find(p => p.id === a.patient_id)?.name || '';
                      const pB = patients.find(p => p.id === b.patient_id)?.name || '';
                      return pA.localeCompare(pB);
                    })
                    .map((rec) => {
                      const patient = patients.find((p) => p.id === rec.patient_id);
                      if (!patient) return null;
                      return (
                        <div
                          key={rec.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-2xl border
                            ${rec.present ? 'bg-success-50 border-success-100' : 'bg-gray-50 border-gray-100'}
                          `}
                        >
                          <Avatar name={patient.name} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${rec.present ? 'text-success-800' : 'text-gray-700'}`}>
                              {patient.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{patient.injury}</p>
                          </div>
                          <div>
                            {rec.present ? (
                              <Badge color="success" size="sm" icon={UserCheck}>Present</Badge>
                            ) : (
                              <Badge color="gray" size="sm" icon={UserX}>Absent</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
};

export default AttendanceHistory;
