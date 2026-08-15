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

      let list = subjData.subjects || [];
      if (list.length === 0) {
        list = [
          { subjectCode: 'CS501', subjectName: 'Cloud Computing & AWS', className: '5th Year', section: 'A', threshold: 75 },
          { subjectCode: 'CS502', subjectName: 'Deep Learning & AI', className: '5th Year', section: 'A', threshold: 75 },
          { subjectCode: 'CS503', subjectName: 'Distributed Systems', className: '5th Year', section: 'B', threshold: 80 },
        ];
      }
      setSubjects(list);

      let studList = studData.students || [];
      if (studList.length === 0) {
        studList = [
          { studentId: 'STU001', name: 'Aarav Sharma', rollNumber: '21CS001', email: 'aarav@university.edu' },
          { studentId: 'STU002', name: 'Priya Patel', rollNumber: '21CS002', email: 'priya@university.edu' },
          { studentId: 'STU003', name: 'Rahul Kumar', rollNumber: '21CS003', email: 'rahul@university.edu' },
          { studentId: 'STU004', name: 'Sneha Gupta', rollNumber: '21CS004', email: 'sneha@university.edu' },
          { studentId: 'STU005', name: 'Vikram Singh', rollNumber: '21CS005', email: 'vikram@university.edu' },
          { studentId: 'STU006', name: 'Ananya Reddy', rollNumber: '21CS006', email: 'ananya@university.edu' },
          { studentId: 'STU007', name: 'Karthik Nair', rollNumber: '21CS007', email: 'karthik@university.edu' },
          { studentId: 'STU008', name: 'Divya Menon', rollNumber: '21CS008', email: 'divya@university.edu' },
        ];
      }
      setStudents(studList);

      const code = list[0]?.subjectCode || 'CS501';
      setSelectedSubjectCode(code);
      fetchRosterForSubject(code, list, studList);
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
        const fallbackStudents = studList.length > 0 ? studList : [
          { studentId: 'STU001', name: 'Aarav Sharma', rollNumber: '21CS001' },
          { studentId: 'STU002', name: 'Priya Patel', rollNumber: '21CS002' },
          { studentId: 'STU003', name: 'Rahul Kumar', rollNumber: '21CS003' },
          { studentId: 'STU004', name: 'Sneha Gupta', rollNumber: '21CS004' },
          { studentId: 'STU005', name: 'Vikram Singh', rollNumber: '21CS005' },
          { studentId: 'STU006', name: 'Ananya Reddy', rollNumber: '21CS006' },
          { studentId: 'STU007', name: 'Karthik Nair', rollNumber: '21CS007' },
          { studentId: 'STU008', name: 'Divya Menon', rollNumber: '21CS008' },
        ];

        const defaultRoster = fallbackStudents.map((s) => ({
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Attendance Roster</h1>
          <p className="page-subtitle">Per-subject attendance criteria, threshold safety, margin & recovery analysis</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportCSV} id="btn-export-csv">
          <Download size={15} /> Export CSV Roster
        </button>
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
