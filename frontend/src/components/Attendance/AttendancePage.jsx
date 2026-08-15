import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Camera, Check, Save, Calendar, RefreshCw } from 'lucide-react';

export default function AttendancePage() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [existingRecords, setExistingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [activeStudentFaceStatus, setActiveStudentFaceStatus] = useState(null);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [faceResultToast, setFaceResultToast] = useState(null);
  const [registeredFacesMap, setRegisteredFacesMap] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      loadExistingAttendance();
    }
  }, [selectedCourse, selectedDate]);

  async function loadData() {
    try {
      const [coursesData, studentsData] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
      ]);
      const stList = studentsData.students || [];
      setCourses(coursesData.courses || []);
      setStudents(stList);

      // Check initial face registration statuses
      const regMap = {};
      await Promise.all(stList.map(async s => {
        try {
          const res = await api.getFaceStatus(s.studentId);
          if (res.faceRegistered) regMap[s.studentId] = true;
        } catch (e) {}
      }));
      setRegisteredFacesMap(regMap);

      if (coursesData.courses?.length > 0) {
        setSelectedCourse(coursesData.courses[0].courseId);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingAttendance() {
    try {
      const data = await api.getAttendance(selectedCourse, selectedDate);
      const records = data.records || [];
      setExistingRecords(records);
      const existing = {};
      records.forEach(r => { existing[r.studentId] = r.status; });
      setAttendance(existing);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  function getEnrolledStudents() {
    const course = courses.find(c => c.courseId === selectedCourse);
    if (!course) return [];
    return students.filter(s => (course.enrolledStudents || []).includes(s.studentId));
  }

  function setStatus(studentId, status) {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    const enrolled = getEnrolledStudents();
    const allPresent = {};
    enrolled.forEach(s => { allPresent[s.studentId] = 'present'; });
    setAttendance(allPresent);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.markAttendance({
        courseId: selectedCourse,
        date: selectedDate,
        records,
      });

      alert('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  // Webcam & Face Recognition functions
  async function startWebcam(studentId) {
    setActiveStudentId(studentId);
    setShowWebcam(true);
    setVerifyingFace(false);
    setFaceResultToast(null);

    // Fetch face registration status
    try {
      const st = await api.getFaceStatus(studentId);
      setActiveStudentFaceStatus(st);
    } catch (e) {
      setActiveStudentFaceStatus({ faceRegistered: false });
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Webcam error:', err);
      alert('Could not access webcam. Please allow camera permissions.');
      setShowWebcam(false);
    }
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || !activeStudentId) return;
    setVerifyingFace(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await api.verifyFace(activeStudentId, imageBase64);
      if (res.verified) {
        setStatus(activeStudentId, 'present');
        setRegisteredFacesMap(prev => ({ ...prev, [activeStudentId]: true }));
        setFaceResultToast({
          type: 'success',
          text: res.isFirstTime
            ? `📸 Face remembered & saved for student! Attendance marked present.`
            : `✅ Face matched (${res.confidence}% confidence)! Attendance marked present.`,
        });
      } else {
        setFaceResultToast({
          type: 'danger',
          text: `⚠️ Facial verification failed. ${res.message}`,
        });
      }
    } catch (err) {
      console.error('Face verification error:', err);
      setFaceResultToast({
        type: 'danger',
        text: `⚠️ Facial verification failed: ${err.message || 'Error processing face matching.'}`,
      });
    } finally {
      setVerifyingFace(false);
      setTimeout(() => {
        stopWebcam();
      }, 1600);
    }
  }

  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
    setActiveStudentId(null);
    setActiveStudentFaceStatus(null);
  }

  const enrolled = getEnrolledStudents();
  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Select a course and date to mark attendance with Facial Recognition</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={markAllPresent} id="btn-mark-all-present">
            <Check size={16} /> Mark All Present
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || enrolled.length === 0} id="btn-save-attendance">
            {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Course</label>
            <select className="form-select" value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)} id="select-attendance-course">
              {courses.map(c => (
                <option key={c.courseId} value={c.courseId}>{c.courseCode} - {c.courseName}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)} id="input-attendance-date" />
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      {enrolled.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--success-bg)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>Present: {presentCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>Absent: {absentCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)' }}>Late: {lateCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total: {enrolled.length}</span>
          </div>
        </div>
      )}

      {/* Student Attendance Grid */}
      {enrolled.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No students enrolled</h3>
            <p>This course has no enrolled students. Go to Courses to enroll students first.</p>
          </div>
        </div>
      ) : (
        <div className="attendance-grid">
          {enrolled.map((student, i) => {
            const status = attendance[student.studentId] || 'absent';
            const isFaceReg = registeredFacesMap[student.studentId];
            return (
              <div key={student.studentId} className="attendance-student-card stagger-item">
                <div className="student-avatar" style={{
                  background: status === 'present' ? 'var(--success)' : status === 'late' ? 'var(--warning)' : 'var(--bg-glass)',
                  border: status === 'absent' ? '2px solid var(--border-subtle)' : 'none',
                  color: status === 'absent' ? 'var(--text-muted)' : 'white',
                }}>
                  {getInitials(student.name)}
                </div>
                <div className="student-info">
                  <div className="student-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {student.name}
                    {isFaceReg ? (
                      <span className="badge-face-registered" title="Face Profile Saved">📸 Reg</span>
                    ) : (
                      <span className="badge-face-pending" title="Face Not Yet Registered">⚠️ New</span>
                    )}
                  </div>
                  <div className="student-roll">{student.rollNumber}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn btn-icon btn-secondary" onClick={() => startWebcam(student.studentId)} title="Verify & Capture Face Attendance"
                    style={{ width: 30, height: 30, position: 'relative' }}>
                    <Camera size={13} />
                  </button>
                  <div className="toggle-group">
                    {['present', 'late', 'absent'].map(s => (
                      <button key={s} className={`toggle-option ${status === s ? `active-${s}` : ''}`}
                        onClick={() => setStatus(student.studentId, s)}>
                        {s.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Webcam Face Recognition Modal */}
      {showWebcam && (
        <div className="modal-overlay" onClick={stopWebcam}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">📸 Facial Recognition Attendance</h3>
              <button className="modal-close" onClick={stopWebcam}>✕</button>
            </div>

            <div className="webcam-container">
              <video ref={videoRef} autoPlay playsInline muted />

              {/* Face Finder Overlay & Scan Line */}
              <div className="face-finder-frame">
                <div className="face-scan-line" />
              </div>

              <div className="face-status-badge">
                {activeStudentFaceStatus?.faceRegistered ? (
                  <span>🔒 Facial Memory Active</span>
                ) : (
                  <span>✨ 1st Capture: Will save face</span>
                )}
              </div>

              {verifyingFace && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 20
                }}>
                  <div className="spinner" style={{ borderTopColor: '#60a5fa', width: 40, height: 40 }} />
                  <p style={{ color: 'white', marginTop: 12, fontWeight: 600, fontSize: '0.9rem' }}>
                    Comparing Facial Embedding...
                  </p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {faceResultToast ? (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: faceResultToast.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: faceResultToast.type === 'success' ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${faceResultToast.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                fontWeight: 600, fontSize: '0.85rem', textAlign: 'center'
              }}>
                {faceResultToast.text}
              </div>
            ) : (
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={capturePhoto}
                  disabled={verifyingFace}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Camera size={16} /> Scan & Mark Attendance
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8 }}>
                  Align face inside the target ring for optimal facial recognition
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

