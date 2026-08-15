import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BookOpen, User, MapPin, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function StudentSubjectsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [snsAlertMsg, setSnsAlertMsg] = useState('');
  const [sendingSns, setSendingSns] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await api.getStudentDashboard();
      setData(res);
    } catch (err) {
      console.error('Error loading subject details:', err);
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

  const subjectStats = data?.subjectStats || [];

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Breakdown & Attendance History</h1>
          <p className="page-subtitle">Detailed attendance logs, teacher info, building/room location, and threshold recovery status</p>
        </div>
        <button className="btn btn-secondary" onClick={handleSendStudentSNS} disabled={sendingSns}>
          <Send size={14} /> {sendingSns ? 'Sending SNS...' : 'Dispatch Student SNS Shortage Alert'}
        </button>
      </div>

      {snsAlertMsg && (
        <div style={{ padding: '10px 16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: 20, fontWeight: 600 }}>
          {snsAlertMsg}
        </div>
      )}

      {/* Detailed Subjects Table */}
      <div className="table-container">
        <table className="table" id="student-subjects-table">
          <thead>
            <tr>
              <th>Subject & Code</th>
              <th>Teacher</th>
              <th>Building & Room No.</th>
              <th>Present / Late / Absent</th>
              <th>Attendance Rate (%)</th>
              <th>Margin / Recovery</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map(s => {
              const isExpanded = expandedSubject === s.subjectCode;
              const badgeClass =
                s.status === 'safe' ? 'badge-safe' :
                s.status === 'ok' ? 'badge-ok' :
                s.status === 'risk' ? 'badge-risk' : 'badge-critical';

              return (
                <tr key={s.subjectCode} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.subjectCode} - {s.subjectName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.className}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--blue-800)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={13} /> {s.teacherName}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="var(--blue-600)" /> {s.building}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.roomNumber}</div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{s.present}P</span> / {' '}
                    <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{s.late}L</span> / {' '}
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{s.absent}A</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: s.rate >= s.threshold ? 'var(--success)' : 'var(--danger)' }}>
                      {s.rate}%
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Criteria: {s.threshold}%</div>
                  </td>
                  <td>
                    {s.classesNeeded > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        Need {s.classesNeeded} consecutive
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        Can miss {s.margin}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${badgeClass}`}>{s.status.toUpperCase()}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setExpandedSubject(isExpanded ? null : s.subjectCode)}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} History Log
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Date History Log */}
      {expandedSubject && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>
            Date-by-Date Attendance Log for {expandedSubject}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {subjectStats.find(s => s.subjectCode === expandedSubject)?.history.map((record, idx) => (
              <div key={idx} style={{ padding: '10px 14px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{record.date}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Period {record.period}</div>
                </div>
                <span className={`badge ${record.status === 'present' ? 'badge-present' : record.status === 'late' ? 'badge-late' : 'badge-absent'}`}>
                  {record.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
