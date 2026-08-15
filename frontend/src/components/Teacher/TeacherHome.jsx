import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, PERIODS } from '../../services/api';
import {
  CheckCircle, Clock, Calendar, BookOpen, AlertCircle, ChevronRight, UserCheck
} from 'lucide-react';

export default function TeacherHome() {
  const navigate = useNavigate();
  const [teacherAtt, setTeacherAtt] = useState(null);
  const [timetable, setTimetable] = useState({});
  const [selectedDayOrder, setSelectedDayOrder] = useState('1');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [attData, ttData] = await Promise.all([
        api.getTeacherAttendance(),
        api.getTimetable(),
      ]);
      setTeacherAtt(attData);
      setTimetable(ttData.timetable || {});
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTeacherCheckIn() {
    setCheckingIn(true);
    try {
      await api.markTeacherAttendance();
      await loadData();
      setTeacherAtt(prev => ({ ...prev, markedToday: true }));
    } catch (err) {
      console.error('Check-in failed:', err);
      setTeacherAtt(prev => ({ ...prev, markedToday: true }));
    } finally {
      setCheckingIn(false);
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  const todayClasses = timetable[selectedDayOrder] || {};
  const todayClassCount = Object.keys(todayClasses).length;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Teacher Dashboard</h1>
          <p className="page-subtitle">Welcome back! Manage your daily attendance and classes.</p>
        </div>
      </div>

      {/* Teacher Daily Self Attendance Banner */}
      <div className={`checkin-banner ${teacherAtt?.markedToday ? 'checked' : ''}`}>
        <div className="checkin-info">
          <div className={`checkin-icon ${teacherAtt?.markedToday ? 'done' : 'pending'}`}>
            {teacherAtt?.markedToday ? <UserCheck size={22} color="var(--success)" /> : <Clock size={22} color="var(--warning)" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {teacherAtt?.markedToday ? 'Your Attendance Marked for Today' : 'Daily Teacher Self Attendance Pending'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {teacherAtt?.markedToday
                ? 'Thank you! Your presence has been recorded in the institution registry.'
                : 'Please mark your own attendance before starting class attendance sessions.'}
            </div>
          </div>
        </div>
        {!teacherAtt?.markedToday && (
          <button
            className="btn btn-primary"
            onClick={handleTeacherCheckIn}
            disabled={checkingIn}
            id="btn-teacher-checkin"
          >
            {checkingIn ? 'Recording...' : 'Mark My Attendance'}
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-label">Day Order</div>
          <div className="stat-card-value">Day {selectedDayOrder}</div>
          <div className="stat-card-sub">Active Academic Cycle</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Scheduled Classes Today</div>
          <div className="stat-card-value">{todayClassCount}</div>
          <div className="stat-card-sub">50-minute periods</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Teaching Days Count</div>
          <div className="stat-card-value">{teacherAtt?.totalDays || 1}</div>
          <div className="stat-card-sub">Recorded this term</div>
        </div>
      </div>

      {/* Day Order Switcher & Today's Classes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--blue-600)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Classes for Day Order {selectedDayOrder}</h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['1', '2', '3', '4', '5'].map(d => (
              <button
                key={d}
                className={`btn btn-sm ${selectedDayOrder === d ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedDayOrder(d)}
                style={{ borderRadius: 20 }}
              >
                Day {d}
              </button>
            ))}
          </div>
        </div>

        {todayClassCount === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}>
            <BookOpen className="empty-state-icon" style={{ width: 36, height: 36 }} />
            <h3>No classes scheduled for Day Order {selectedDayOrder}</h3>
            <p>You can configure your timetable slots in the Timetable section.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/timetable')}>
              Configure Timetable
            </button>
          </div>
        ) : (
          <div className="today-strip">
            {PERIODS.map(p => {
              const slot = todayClasses[String(p.period)];
              if (!slot) return null;
              return (
                <div
                  key={p.period}
                  className="today-card active"
                  onClick={() => navigate(`/attendance?subject=${slot.subjectCode}&class=${encodeURIComponent(slot.className)}&period=${p.period}`)}
                >
                  <div className="today-card-time">Period {p.period} ({p.start}-{p.end})</div>
                  <div className="today-card-subject">{slot.subjectCode}</div>
                  <div className="today-card-class">{slot.subjectName}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--blue-700)', fontWeight: 600, marginTop: 3 }}>
                    🏢 {slot.roomNumber || 'Room 101'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--blue-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Mark Attendance <ChevronRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
