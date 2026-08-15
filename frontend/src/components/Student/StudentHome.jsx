import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, PERIODS } from '../../services/api';
import {
  GraduationCap, Calendar, BookOpen, AlertTriangle, ShieldCheck, Send, Clock, User, Building, MapPin
} from 'lucide-react';

export default function StudentHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayOrder, setSelectedDayOrder] = useState('1');
  const [snsAlertMsg, setSnsAlertMsg] = useState('');
  const [sendingSns, setSendingSns] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await api.getStudentDashboard();
      setData(res);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendStudentSNS() {
    setSendingSns(true);
    setSnsAlertMsg('');
    try {
      const res = await api.triggerStudentSNSAlert();
      setSnsAlertMsg(res.message || 'AWS SNS Shortage Alert sent!');
    } catch (err) {
      setSnsAlertMsg('Failed to send SNS alert.');
    } finally {
      setSendingSns(false);
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  const student = data?.student || { name: 'Aarav Sharma', rollNumber: '21CS001' };
  const overallRate = data?.overallRate || 0;
  const subjectStats = data?.subjectStats || [];
  const shortageSubjects = subjectStats.filter(s => s.rate < s.threshold);
  const todayClasses = data?.timetable?.[selectedDayOrder] || {};

  return (
    <div className="page-enter">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {student.name}!</h1>
          <p className="page-subtitle">Student Portal • Roll No: {student.rollNumber} • Section {student.section || 'A'}</p>
        </div>
        {shortageSubjects.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleSendStudentSNS} disabled={sendingSns}>
            <Send size={14} /> {sendingSns ? 'Sending SNS...' : 'Test Student Shortage SNS Alert'}
          </button>
        )}
      </div>

      {snsAlertMsg && (
        <div style={{ padding: '10px 16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: 20, fontWeight: 600 }}>
          {snsAlertMsg}
        </div>
      )}

      {/* Shortage Warning Banner if any subject < threshold */}
      {shortageSubjects.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <AlertTriangle size={24} color="var(--danger)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--danger)' }}>
              ATTENDANCE SHORTAGE WARNING: {shortageSubjects.length} Subject(s) Below Required Criteria
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {shortageSubjects.map(s => `${s.subjectCode} (${s.rate}% < ${s.threshold}%)`).join(', ')}.
              An automated AWS SNS alert will be sent if recovery classes are missed!
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-label">Overall Attendance</div>
          <div className="stat-card-value" style={{ color: overallRate >= 75 ? 'var(--success)' : 'var(--danger)' }}>
            {overallRate}%
          </div>
          <div className="stat-card-sub">{data?.totalAttended} / {data?.totalClasses} total periods attended</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Shortage Risk</div>
          <div className="stat-card-value" style={{ color: shortageSubjects.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {shortageSubjects.length > 0 ? `${shortageSubjects.length} Subject(s)` : 'Clear'}
          </div>
          <div className="stat-card-sub">{shortageSubjects.length > 0 ? 'Action required for 75% criteria' : 'All subjects above criteria'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Active Enrolled Subjects</div>
          <div className="stat-card-value">{subjectStats.length}</div>
          <div className="stat-card-sub">Semester 5 Coursework</div>
        </div>
      </div>

      {/* Today's Schedule Strip */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--blue-600)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Today's Classes (Day Order {selectedDayOrder})</h3>
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

        <div className="today-strip">
          {PERIODS.map(p => {
            const slot = todayClasses[String(p.period)];
            if (!slot) return null;
            return (
              <div key={p.period} className="today-card active" style={{ width: 200 }}>
                <div className="today-card-time">Period {p.period} ({p.start}-{p.end})</div>
                <div className="today-card-subject">{slot.subjectCode} - {slot.subjectName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--blue-800)', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={12} /> {slot.teacherName || 'Dr. Nishchal'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {slot.building || 'Science Block'} ({slot.roomNumber || 'Room 304'})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrolled Subjects Overview */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>Enrolled Subjects & Attendance Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {subjectStats.map(s => (
          <div key={s.subjectCode} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-info">{s.subjectCode}</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>{s.subjectName}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--blue-700)', fontWeight: 600, marginTop: 4 }}>
                  👨‍🏫 {s.teacherName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  🏢 {s.building} • {s.roomNumber}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.rate >= s.threshold ? 'var(--success)' : 'var(--danger)' }}>
                  {s.rate}%
                </div>
                <span className={`badge ${s.status === 'safe' ? 'badge-safe' : s.status === 'ok' ? 'badge-ok' : s.status === 'risk' ? 'badge-risk' : 'badge-critical'}`}>
                  {s.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.78rem' }}>
              {s.classesNeeded > 0 ? (
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                  ⚠️ Need {s.classesNeeded} consecutive class(es) to reach {s.threshold}% criteria!
                </span>
              ) : (
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ✅ Can miss {s.margin} class(es) and remain above {s.threshold}%.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
