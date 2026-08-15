import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Search, Trash2, X, Users, BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    courseName: '', courseCode: '', department: '',
    semester: '', section: '', teacherName: '', enrolledStudents: [],
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [coursesData, studentsData] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
      ]);
      setCourses(coursesData.courses || []);
      setStudents(studentsData.students || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createCourse(form);
      setShowModal(false);
      setForm({ courseName: '', courseCode: '', department: '', semester: '', section: '', teacherName: '', enrolledStudents: [] });
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function handleDelete(courseId) {
    if (!confirm('Delete this course?')) return;
    try {
      await api.deleteCourse(courseId);
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  }

  function toggleStudent(studentId) {
    setForm(prev => ({
      ...prev,
      enrolledStudents: prev.enrolledStudents.includes(studentId)
        ? prev.enrolledStudents.filter(id => id !== studentId)
        : [...prev.enrolledStudents, studentId],
    }));
  }

  if (loading) {
    return <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">{courses.length} courses active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-course">
          <Plus size={16} /> Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No courses yet</h3>
            <p>Create your first course and enroll students to start tracking attendance.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Course
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {courses.map((course, i) => (
            <div key={course.courseId} className="card stagger-item" id={`course-card-${course.courseId}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-info">{course.courseCode}</span>
                    <span className="badge" style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      Sem {course.semester}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 8 }}>{course.courseName}</h3>
                </div>
                <button className="btn btn-icon btn-danger" onClick={() => handleDelete(course.courseId)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{course.department}</div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Section</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{course.section}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <Users size={14} style={{ color: 'var(--accent-secondary)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {(course.enrolledStudents || []).length} students enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Course</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Course Name</label>
                  <input className="form-input" placeholder="Cloud Computing" value={form.courseName}
                    onChange={(e) => setForm({ ...form, courseName: e.target.value })} required id="input-course-name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Code</label>
                  <input className="form-input" placeholder="CS501" value={form.courseCode}
                    onChange={(e) => setForm({ ...form, courseCode: e.target.value })} required id="input-course-code" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                    <option value="">Select</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="EEE">EEE</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-select" value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })} required>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Teacher Name</label>
                  <input className="form-input" placeholder="Dr. Name" value={form.teacherName}
                    onChange={(e) => setForm({ ...form, teacherName: e.target.value })} required id="input-teacher-name" />
                </div>
              </div>

              {/* Student Enrollment */}
              <div className="form-group">
                <label className="form-label">Enroll Students ({form.enrolledStudents.length} selected)</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                  {students.map(student => (
                    <label key={student.studentId} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      background: form.enrolledStudents.includes(student.studentId) ? 'rgba(124,58,237,0.1)' : 'transparent',
                      transition: 'background 0.15s',
                    }}>
                      <input
                        type="checkbox"
                        checked={form.enrolledStudents.includes(student.studentId)}
                        onChange={() => toggleStudent(student.studentId)}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <span style={{ fontSize: '0.85rem' }}>{student.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{student.rollNumber}</span>
                    </label>
                  ))}
                  {students.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 20 }}>
                      No students available. Add students first.
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-save-course">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
