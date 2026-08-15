import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, PERIODS } from '../../services/api';
import { Save, Camera, Check, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';

export default function MarkAttendancePage() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'CS501';
  const initialClass = searchParams.get('class') || '5th Year';
  const initialPeriod = searchParams.get('period') || '1';

  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherAtt, setTeacherAtt] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isTeacherCamCheckin, setIsTeacherCamCheckin] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [editWarning, setEditWarning] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const subjParam = searchParams.get('subject');
    const periodParam = searchParams.get('period');
    if (subjParam) setSelectedSubject(subjParam);
    if (periodParam) setSelectedPeriod(periodParam);
  }, [searchParams]);

  useEffect(() => {
    if (selectedSubject && selectedDate && selectedPeriod) {
      loadAttendance();
      checkEditWindow();
    }
  }, [selectedSubject, selectedDate, selectedPeriod]);

  async function loadInitialData() {
    try {
      const [subjData, studData, tAtt] = await Promise.all([
        api.getSubjects().catch(() => ({ subjects: [] })),
        api.getStudents().catch(() => ({ students: [] })),
        api.getTeacherAttendance().catch(() => ({ markedToday: false })),
      ]);
      setSubjects(subjData.subjects || []);
      setStudents(studData.students || []);
      setTeacherAtt(tAtt);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getCanvasSnapshot() {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  async function handleTeacherCheckinCapture() {
    const imageBase64 = getCanvasSnapshot();
    if (!imageBase64) {
      alert('⚠️ No image captured from webcam. Please try again.');
      return;
    }

    try {
      const result = await api.verifyTeacherFace(imageBase64);
      if (result.verified) {
        await api.markTeacherAttendance().catch(() => {});
        setTeacherAtt({ markedToday: true });
        stopWebcam();
        alert(result.message || '✅ Teacher Face Verified! Student marking is now UNLOCKED.');
      } else {
        alert(result.message || '❌ Teacher Verification Failed: Face does not match registered teacher profile.');
      }
    } catch (err) {
      console.error('Teacher check-in error:', err);
      alert(`❌ Teacher Verification Failed: ${err.message || 'Camera check error'}`);
    }
  }

  async function handleStudentFaceCapture() {
    const imageBase64 = getCanvasSnapshot();
    if (!imageBase64) {
      alert('⚠️ No image captured from webcam. Please try again.');
      return;
    }

    const currentStudentId = activeStudentId;
    try {
      const result = await api.verifyFace(currentStudentId, imageBase64);
      if (result.verified) {
        setStatus(currentStudentId, 'present');
        stopWebcam();
        alert(result.message || `✅ Face verified (${result.confidence}% match)! Student marked present.`);
      } else {
        alert(result.message || '❌ Face verification failed! Face does not match student profile.');
      }
    } catch (err) {
      console.error('Student face check error:', err);
      alert(`❌ Facial verification failed: ${err.message || 'Error processing facial comparison.'}`);
    }
  }

  async function loadAttendance() {
    try {
      const subj = subjects.find(s => s.subjectCode === selectedSubject);
      const className = subj ? subj.className : '5th Year';
      const data = await api.getAttendance(selectedSubject, className, selectedDate, selectedPeriod);
      const map = {};
      (data.records || []).forEach(r => {
        map[r.studentId] = r.status;
      });
      setAttendance(map);
    } catch (err) {
      console.error('Error loading attendance records:', err);
    }
  }

  function checkEditWindow() {
    const subj = subjects.find(s => s.subjectCode === selectedSubject);
    const windowDays = subj?.editWindowDays || 10;
    const dateObj = new Date(selectedDate);
    const today = new Date();
    const diffDays = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));

    if (diffDays > windowDays) {
      setEditWarning(`⚠️ The selected date (${selectedDate}) is older than the allowed ${windowDays}-day edit window!`);
    } else if (diffDays > 0) {
      setEditWarning(`Note: Editing past attendance from ${diffDays} day(s) ago (allowed up to ${windowDays} days).`);
    } else {
      setEditWarning('');
    }
  }

  function getEnrolledStudents() {
    const subj = subjects.find(s => s.subjectCode === selectedSubject);
    if (!subj || !subj.enrolledStudents || subj.enrolledStudents.length === 0) return students;
    const filtered = students.filter(s => (subj.enrolledStudents || []).includes(s.studentId));
    return filtered.length > 0 ? filtered : students;
  }

  function setStatus(studentId, status) {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  }

  function markAll(status) {
    const enrolled = getEnrolledStudents();
    const map = {};
    enrolled.forEach(s => { map[s.studentId] = status; });
    setAttendance(map);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const subj = subjects.find(s => s.subjectCode === selectedSubject);
      const className = subj ? subj.className : '5th Year';
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.markAttendance({
        subjectCode: selectedSubject,
        className,
        date: selectedDate,
        period: selectedPeriod,
        records,
      });

      alert('Attendance saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  }

  // Webcam controls
  async function startWebcam(studentId) {
    setActiveStudentId(studentId);
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera access denied or unavailable.');
      setShowWebcam(false);
    }
  }

  function capturePhoto() {
    if (isTeacherCamCheckin) {
      handleTeacherCheckinCapture();
    } else if (activeStudentId) {
      handleStudentFaceCapture();
    } else {
      stopWebcam();
    }
  }

  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
    setActiveStudentId(null);
    setIsTeacherCamCheckin(false);
  }

  const enrolled = getEnrolledStudents();
  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  const teacherVerified = !!teacherAtt?.markedToday;

  async function startTeacherWebcam() {
    setIsTeacherCamCheckin(true);
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera access denied or unavailable.');
      setShowWebcam(false);
      setIsTeacherCamCheckin(false);
    }
  }

  return (
    <div className="page-enter">
      {/* Teacher Attendance Lock Banner */}
      {!teacherVerified && (
        <div style={{ padding: '16px 20px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <Camera size={20} color="var(--warning)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--warning)' }}>
                🔒 Teacher Camera Verification Required
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                You must capture your own attendance via camera first to unlock student attendance marking for this class.
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={startTeacherWebcam}>
            <Camera size={14} /> Verify Teacher Presence & Unlock
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Attendance Session</h1>
          <p className="page-subtitle">Mark per-period attendance for your assigned subject class</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => markAll('present')} disabled={!teacherVerified} id="btn-mark-all-present">
            <Check size={15} /> All Present
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || enrolled.length === 0 || !teacherVerified} id="btn-save-attendance">
            {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Attendance Session'}
          </button>
        </div>
      </div>

      {/* Selectors Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              id="select-subject"
            >
              {subjects.map(s => (
                <option key={s.subjectCode} value={s.subjectCode}>
                  {s.subjectCode} - {s.subjectName} ({s.building || 'Main Block'} • {s.roomNumber || 'Room 101'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Period (50 Min)</label>
            <select
              className="form-select"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              id="select-period"
            >
              {PERIODS.map(p => (
                <option key={p.period} value={p.period}>
                  Period {p.period} ({p.start} - {p.end})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              id="input-date"
            />
          </div>
        </div>
      </div>

      {/* Retroactive Edit Banner */}
      {editWarning && (
        <div className="edit-banner">
          <AlertTriangle size={16} />
          <span>{editWarning}</span>
        </div>
      )}

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="badge badge-present" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          Present: {presentCount}
        </div>
        <div className="badge badge-late" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          Late: {lateCount}
        </div>
        <div className="badge badge-absent" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          Absent: {absentCount}
        </div>
        <div className="badge badge-info" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          Total Students: {enrolled.length}
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="attendance-list" style={{ opacity: teacherVerified ? 1 : 0.6, pointerEvents: teacherVerified ? 'auto' : 'none' }}>
        {enrolled.map((student, idx) => {
          const status = attendance[student.studentId] || 'absent';
          return (
            <div key={student.studentId} className="attendance-row">
              <div className="attendance-row-num">{idx + 1}</div>
              <div className="attendance-row-avatar">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="attendance-row-info">
                <div className="attendance-row-name">{student.name}</div>
                <div className="attendance-row-roll">{student.rollNumber} • {student.email}</div>
              </div>

              {/* Photo capture button */}
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => startWebcam(student.studentId)}
                title="Capture Photo Proof"
                style={{ width: 32, height: 32 }}
                disabled={!teacherVerified}
              >
                <Camera size={14} />
              </button>

              {/* P / L / A Toggle */}
              <div className="toggle-group">
                <button
                  className={`toggle-option ${status === 'present' ? 'active-present' : ''}`}
                  onClick={() => setStatus(student.studentId, 'present')}
                  disabled={!teacherVerified}
                >
                  P
                </button>
                <button
                  className={`toggle-option ${status === 'late' ? 'active-late' : ''}`}
                  onClick={() => setStatus(student.studentId, 'late')}
                  disabled={!teacherVerified}
                >
                  L
                </button>
                <button
                  className={`toggle-option ${status === 'absent' ? 'active-absent' : ''}`}
                  onClick={() => setStatus(student.studentId, 'absent')}
                  disabled={!teacherVerified}
                >
                  A
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="modal-overlay" onClick={stopWebcam}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {isTeacherCamCheckin ? '📷 Teacher Camera Verification' : '📷 Student Face Recognition Capture'}
              </h3>
              <button className="modal-close" onClick={stopWebcam}>✕</button>
            </div>
            <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', height: 260, position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={stopWebcam}>Cancel</button>
              <button className="btn btn-primary" onClick={capturePhoto}>
                {isTeacherCamCheckin ? 'Verify Teacher Attendance' : 'Capture & Match Face'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
