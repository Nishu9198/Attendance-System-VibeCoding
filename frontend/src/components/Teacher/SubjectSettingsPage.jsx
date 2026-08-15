import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Edit, Save, Shield, Settings, Check } from 'lucide-react';

export default function SubjectSettingsPage() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    subjectCode: '',
    subjectName: '',
    className: '4th year',
    section: 'Section A',
    building: 'UB',
    roomNumber: '1207',
    threshold: 75,
    editWindowDays: 10,
    enrolledStudents: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [subjData, studData] = await Promise.all([
        api.getSubjects().catch(() => ({ subjects: [] })),
        api.getStudents().catch(() => ({ students: [] })),
      ]);
      const subjList = subjData.subjects || [];
      const studList = studData.students || [];
      setSubjects(subjList);
      setStudents(studList);

      setForm(prev => ({
        ...prev,
        enrolledStudents: prev.enrolledStudents.length > 0 
          ? prev.enrolledStudents 
          : studList.map(s => s.studentId)
      }));
    } catch (err) {
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  }

  function startNewSubject() {
    setEditingCode(null);
    setForm({
      subjectCode: '',
      subjectName: '',
      className: '4th year',
      section: 'Section A',
      building: 'UB',
      roomNumber: '1207',
      threshold: 75,
      editWindowDays: 10,
      enrolledStudents: students.map(s => s.studentId),
    });
  }

  function editSubject(subj) {
    setEditingCode(subj.subjectCode);
    setForm({
      building: subj.building || '',
      roomNumber: subj.roomNumber || '',
      ...subj,
      enrolledStudents: subj.enrolledStudents || [],
    });
  }

  function toggleStudentEnrollment(studentId) {
    setForm(prev => ({
      ...prev,
      enrolledStudents: prev.enrolledStudents.includes(studentId)
        ? prev.enrolledStudents.filter(id => id !== studentId)
        : [...prev.enrolledStudents, studentId],
    }));
  }

  async function handleSaveSubject(e) {
    e.preventDefault();
    setFeedback(null);

    if (!form.subjectCode.trim() || !form.subjectName.trim()) {
      const msg = '⚠️ Please enter both Subject Code (e.g. CS501) and Subject Name (e.g. Cloud Computing).';
      setFeedback({ type: 'error', message: msg });
      alert(msg);
      return;
    }

    const availableStudents = students.length > 0 ? students : DEFAULT_STUDENTS;
    const payload = {
      ...form,
      subjectCode: form.subjectCode.trim().toUpperCase(),
      subjectName: form.subjectName.trim(),
      enrolledStudents: form.enrolledStudents.length > 0 
        ? form.enrolledStudents 
        : availableStudents.map(s => s.studentId)
    };

    setSubmitting(true);
    try {
      if (editingCode) {
        await api.updateSubject(editingCode, payload);
        const successMsg = `✅ Subject ${editingCode} updated successfully!`;
        setFeedback({ type: 'success', message: successMsg });
        alert(successMsg);
      } else {
        await api.createSubject(payload);
        const successMsg = `✅ Subject ${payload.subjectCode} created successfully!`;
        setFeedback({ type: 'success', message: successMsg });
        alert(successMsg);
      }
      setEditingCode(null);
      setForm({
        subjectCode: '', subjectName: '', className: '4th year', section: 'Section A',
        building: 'UB', roomNumber: '1207', threshold: 75, editWindowDays: 10,
        enrolledStudents: availableStudents.map(s => s.studentId),
      });
      await loadData();
    } catch (err) {
      console.error('Error saving subject:', err);
      const errMsg = `❌ Failed to save subject: ${err.message || 'Unknown error'}`;
      setFeedback({ type: 'error', message: errMsg });
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSubject(code) {
    if (!confirm(`Are you sure you want to delete subject ${code}?`)) return;
    try {
      await api.deleteSubject(code);
      alert(`✅ Subject ${code} deleted.`);
      loadData();
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert(`❌ Failed to delete subject: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject & Attendance Criteria</h1>
          <p className="page-subtitle">Configure subject thresholds (e.g., 75%), building/room location, edit windows, and student enrollments</p>
        </div>
        <button className="btn btn-primary" onClick={startNewSubject} id="btn-add-subject">
          <Plus size={15} /> Add New Subject
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Subject Form Card */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="var(--blue-600)" />
            {editingCode ? `Edit Subject: ${editingCode}` : 'Create / Configure Subject'}
          </h3>

          {feedback && (
            <div className={`auth-error`} style={{
              background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: 16, fontWeight: 600
            }}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSaveSubject}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input
                  className="form-input"
                  placeholder="e.g. CS501"
                  value={form.subjectCode}
                  onChange={e => setForm({ ...form, subjectCode: e.target.value })}
                  disabled={!!editingCode}
                  required
                  id="input-subject-code"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Cloud Computing"
                  value={form.subjectName}
                  onChange={e => setForm({ ...form, subjectName: e.target.value })}
                  required
                  id="input-subject-name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Class Year</label>
                <input
                  className="form-input"
                  placeholder="e.g. 5th Year"
                  value={form.className}
                  onChange={e => setForm({ ...form, className: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  className="form-input"
                  placeholder="e.g. Section A or Section 1"
                  value={form.section}
                  onChange={e => setForm({ ...form, section: e.target.value })}
                  required
                  id="input-section"
                />
              </div>
            </div>

            {/* Building & Room Location Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Building Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Science & Tech Block"
                  value={form.building}
                  onChange={e => setForm({ ...form, building: e.target.value })}
                  required
                  id="input-building"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Class / Room No.</label>
                <input
                  className="form-input"
                  placeholder="e.g. Room 304 / Lab 2"
                  value={form.roomNumber}
                  onChange={e => setForm({ ...form, roomNumber: e.target.value })}
                  required
                  id="input-room-number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Attendance Threshold (%)</label>
                <input
                  type="number"
                  className="form-input"
                  min="50"
                  max="100"
                  value={form.threshold}
                  onChange={e => setForm({ ...form, threshold: parseInt(e.target.value) || 75 })}
                  required
                  id="input-threshold"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: 75% required attendance</span>
              </div>

              <div className="form-group">
                <label className="form-label">Retroactive Edit Window (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="30"
                  value={form.editWindowDays}
                  onChange={e => setForm({ ...form, editWindowDays: parseInt(e.target.value) || 10 })}
                  required
                  id="input-edit-window"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Allowed past edit limit (e.g., 10 days)</span>
              </div>
            </div>

            {/* Enrolled Students Selection */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  🎓 Enrolled Students ({form.enrolledStudents.length} of {students.length} Enrolled)
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => setForm(p => ({ ...p, enrolledStudents: students.map(s => s.studentId) }))}>Select All</button>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => setForm(p => ({ ...p, enrolledStudents: [] }))}>Clear All</button>
                </div>
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 6, background: '#fafafa' }}>
                {students.map(s => {
                  const isEnrolled = form.enrolledStudents.includes(s.studentId);
                  return (
                    <label key={s.studentId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 4, cursor: 'pointer', background: isEnrolled ? 'var(--blue-50)' : 'transparent', marginBottom: 2 }}>
                      <input
                        type="checkbox"
                        checked={isEnrolled}
                        onChange={() => toggleStudentEnrollment(s.studentId)}
                      />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: isEnrolled ? 600 : 400 }}>{s.name} ({s.rollNumber})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting} id="btn-save-subject">
              {submitting ? <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> : <Save size={15} />}
              {submitting ? ' Saving Subject...' : (editingCode ? 'Update Subject Settings' : 'Create Subject')}
            </button>
          </form>
        </div>

        {/* Existing Subjects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {subjects.map(s => (
            <div key={s.subjectCode} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-info">{s.subjectCode}</span>
                    <span className="badge badge-safe">{s.threshold}% Criteria</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>{s.subjectName}</h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--blue-700)', fontWeight: 600, marginTop: 4 }}>
                    🏢 {s.building || 'Main Block'} • {s.roomNumber || 'Room 101'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {s.className} • Section {s.section} • {(s.enrolledStudents || []).length} Enrolled Students
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Allowed past edit window: {s.editWindowDays || 10} Days
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-icon btn-secondary" onClick={() => editSubject(s)} title="Edit">
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-icon btn-danger" onClick={() => handleDeleteSubject(s.subjectCode)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
