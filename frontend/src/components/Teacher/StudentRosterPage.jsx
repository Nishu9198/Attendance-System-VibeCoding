import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Download, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function StudentRosterPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('CS501');
  const [rosterData, setRosterData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectCode && subjects.length > 0) {
      fetchRosterForSubject(selectedSubjectCode, subjects);
    }
  }, [selectedSubjectCode]);

  async function loadSubjects() {
    try {
      const [subjData, studData] = await Promise.all([
        api.getSubjects().catch(() => ({ subjects: [] })),
        api.getStudents().catch(() => ({ students: [] })),
      ]);

      const list = subjData.subjects || [];
      setSubjects(list);

      const studList = studData.students || [];
      setStudents(studList);

      if (list.length > 0) {
        const code = list[0].subjectCode;
        setSelectedSubjectCode(code);
        fetchRosterForSubject(code, list, studList);
      } else {
        setRosterData({ threshold: 75, roster: [] });
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRosterForSubject(code, currentSubjList, currentStudList) {
    try {
      const subjList = currentSubjList || subjects;
      const studList = currentStudList || students;
      const subj = subjList.find(s => s.subjectCode === code);
      const className = subj ? subj.className : '5th Year';
      const data = await api.getRoster(code, className).catch(() => null);

      if (data && data.roster && data.roster.length > 0) {
        setRosterData(data);
      } else {
        // Enrolled students in this subject
        const enrolledIds = subj?.enrolledStudents || [];
        const enrolledStudents = studList.filter(s =>
          enrolledIds.includes(s.studentId) || enrolledIds.includes(s.rollNumber)
        );

        const defaultRoster = enrolledStudents.map((s) => ({
          studentId: s.studentId,
          present: 0,
          absent: 0,
          late: 0,
          totalClasses: 0,
          rate: 100,
          margin: 0,
          classesNeeded: 0,
          status: 'safe'
        }));

        setRosterData({ threshold: subj?.threshold || 75, roster: defaultRoster });
      }
    } catch (err) {
      console.error('Error loading roster:', err);
    }
  }

  function getStudentDetails(studentId) {
    const s = students.find(item => item.studentId === studentId);
    return s || { name: studentId, rollNumber: studentId, email: '' };
  }

  function handleExportCSV() {
    if (!rosterData?.roster) return;
    const rows = [
      ['Roll Number', 'Student Name', 'Present', 'Absent', 'Late', 'Total Classes', 'Attendance Rate (%)', 'Margin (Classes Can Miss)', 'Classes Needed to 75%', 'Status'],
      ...rosterData.roster.map(r => {
        const details = getStudentDetails(r.studentId);
        return [
          details.rollNumber,
          `"${details.name}"`,
          r.present,
          r.absent,
          r.late,
          r.totalClasses,
          r.rate,
          r.margin,
          r.classesNeeded,
          r.status.toUpperCase(),
        ];
      }),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Roster_${selectedSubjectCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentSection, setNewStudentSection] = useState('A');
  const [newStudentDept, setNewStudentDept] = useState('Computer Science');
  const [newStudentSubjects, setNewStudentSubjects] = useState([]);
  const [addingStudent, setAddingStudent] = useState(false);

  function openAddStudentModal() {
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentRoll(`21CS${Math.floor(100 + Math.random() * 900)}`);
    setNewStudentSection('A');
    setNewStudentDept('Computer Science');
    setNewStudentSubjects([selectedSubjectCode]);
    setShowAddModal(true);
  }

  async function handleCreateStudent(e) {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentRoll.trim()) {
      alert('Please fill in student name, email, and roll number.');
      return;
    }

    setAddingStudent(true);
    try {
      const studentId = `STU${Math.floor(100 + Math.random() * 900)}`;
      const payload = {
        studentId,
        name: newStudentName.trim(),
        email: newStudentEmail.trim().toLowerCase(),
        rollNumber: newStudentRoll.trim().toUpperCase(),
        section: newStudentSection,
        department: newStudentDept,
        semester: '5th Year',
        enrolledSubjects: newStudentSubjects,
      };

      await api.createStudent(payload);
      alert(`✅ Student ${payload.name} (${payload.rollNumber}) added and enrolled in ${newStudentSubjects.length} subject(s)!`);
      setShowAddModal(false);
      await loadSubjects();
    } catch (err) {
      console.error('Error creating student:', err);
      alert(`❌ Failed to add student: ${err.message}`);
    } finally {
      setAddingStudent(false);
    }
  }

  const roster = (rosterData?.roster || []).filter(r => {
    const d = getStudentDetails(r.studentId);
    return d.name.toLowerCase().includes(search.toLowerCase()) ||
           d.rollNumber.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: 540, width: '92%', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>👨‍🎓 Add New Student to Roster</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)} style={{ borderRadius: '50%', width: 32, height: 32 }}>✕</button>
            </div>

            <form onSubmit={handleCreateStudent}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Nishchal Mahant"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Used for Student Login) *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. nishchal@university.edu"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  When this student logs in with this email, their dashboard will immediately show their enrolled courses!
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 21CS042"
                    value={newStudentRoll}
                    onChange={e => setNewStudentRoll(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-select" value={newStudentSection} onChange={e => setNewStudentSection(e.target.value)}>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Enroll in Subjects</label>
                <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 8, background: '#fafafa' }}>
                  {subjects.map(subj => {
                    const isChecked = newStudentSubjects.includes(subj.subjectCode);
                    return (
                      <label key={subj.subjectCode} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewStudentSubjects(prev =>
                              isChecked ? prev.filter(c => c !== subj.subjectCode) : [...prev, subj.subjectCode]
                            );
                          }}
                        />
                        <span style={{ fontSize: '0.82rem' }}><strong>{subj.subjectCode}</strong> - {subj.subjectName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={addingStudent}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addingStudent}>
                  {addingStudent ? 'Saving...' : 'Add Student & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Student Attendance Roster</h1>
          <p className="page-subtitle">Per-subject attendance criteria, threshold safety, margin & recovery analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={openAddStudentModal}>
            + Add New Student
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV} id="btn-export-csv">
            <Download size={15} /> Export CSV Roster
          </button>
        </div>
      </div>

      {/* Subject Filter Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={selectedSubjectCode}
              onChange={e => setSelectedSubjectCode(e.target.value)}
              id="select-roster-subject"
            >
              {subjects.map(s => (
                <option key={s.subjectCode} value={s.subjectCode}>
                  {s.subjectCode} - {s.subjectName} ({s.className} Sec {s.section})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subject Attendance Criteria</label>
            <div className="form-input" style={{ background: 'var(--blue-50)', color: 'var(--blue-800)', fontWeight: 700 }}>
              {rosterData?.threshold || 75}% Required Attendance Threshold
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="search-roster"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="table-container">
        <table className="table" id="roster-table">
          <thead>
            <tr>
              <th>Student Details</th>
              <th>Present / Late / Absent</th>
              <th>Total Held</th>
              <th>Rate (%)</th>
              <th>Margin (Can Miss)</th>
              <th>Classes Needed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  No student roster records found for this subject.
                </td>
              </tr>
            ) : (
              roster.map(r => {
                const details = getStudentDetails(r.studentId);
                const badgeClass =
                  r.status === 'safe' ? 'badge-safe' :
                  r.status === 'ok' ? 'badge-ok' :
                  r.status === 'risk' ? 'badge-risk' : 'badge-critical';

                const progressClass =
                  r.rate >= (rosterData?.threshold || 75) ? 'good' :
                  r.rate >= (rosterData?.threshold || 75) - 10 ? 'warning' : 'danger';

                return (
                  <tr key={r.studentId}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{details.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{details.rollNumber}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>{r.present}P</span> / {' '}
                      <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{r.late}L</span> / {' '}
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{r.absent}A</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.totalClasses}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${progressClass}`}
                            style={{ width: `${Math.min(100, r.rate)}%` }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{r.rate}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: r.margin > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {r.margin > 0 ? `${r.margin} classes` : '0 classes'}
                      </span>
                    </td>
                    <td>
                      {r.classesNeeded > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                          Need {r.classesNeeded} consecutive
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '0.78rem' }}>On track</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
