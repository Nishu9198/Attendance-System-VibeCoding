import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Search, Edit2, Trash2, X, UserPlus } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', rollNumber: '', section: '',
    department: '', semester: '', phone: '',
  });

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    try {
      const data = await api.getStudents();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditStudent(null);
    setForm({ name: '', email: '', rollNumber: '', section: '', department: '', semester: '', phone: '' });
    setShowModal(true);
  }

  function openEditModal(student) {
    setEditStudent(student);
    setForm({ ...student });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editStudent) {
        await api.updateStudent(editStudent.studentId, form);
      } else {
        await api.createStudent(form);
      }
      setShowModal(false);
      loadStudents();
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function handleDelete(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.deleteStudent(studentId);
      loadStudents();
    } catch (err) {
      console.error('Error:', err);
    }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} id="btn-add-student">
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Search by name, roll number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-students"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👨‍🎓</div>
            <h3>No students found</h3>
            <p>Add your first student to get started with attendance tracking.</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              <UserPlus size={16} /> Add First Student
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table" id="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Face Memory</th>
                <th>Department</th>
                <th>Section</th>
                <th>Semester</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, i) => {
                let hasFace = false;
                try {
                  hasFace = !!(student.faceRegistered || localStorage.getItem(`face_reg_${student.studentId}`));
                } catch(e) {}

                return (
                  <tr key={student.studentId} className="stagger-item">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="student-avatar">{getInitials(student.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{student.rollNumber}</span></td>
                    <td>
                      {hasFace ? (
                        <span className="badge-face-registered">📸 Registered</span>
                      ) : (
                        <span className="badge-face-pending">⚠️ Auto-Registers on Next Attendance</span>
                      )}
                    </td>
                    <td>{student.department}</td>
                    <td>{student.section}</td>
                    <td>{student.semester}</td>
                    <td>{student.phone}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-secondary" onClick={() => openEditModal(student)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(student.studentId)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="Student name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required id="input-student-name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="student@uni.edu" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} required id="input-student-email" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input className="form-input" placeholder="21CS001" value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required id="input-roll-number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })} required id="select-department">
                    <option value="">Select</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="EEE">EEE</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-select" value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })} required id="select-section">
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })} required id="select-semester">
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" placeholder="9876543210" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} id="input-phone" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-save-student">
                  {editStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
