import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart3, Download, TrendingUp, Users } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseReport, setCourseReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedCourse) loadCourseReport();
  }, [selectedCourse]);

  async function loadData() {
    try {
      const [coursesData, studentsData] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
      ]);
      setCourses(coursesData.courses || []);
      setStudents(studentsData.students || []);
      if (coursesData.courses?.length > 0) {
        setSelectedCourse(coursesData.courses[0].courseId);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseReport() {
    try {
      const data = await api.getCourseReport(selectedCourse);
      setCourseReport(data);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  function getStudentName(studentId) {
    const student = students.find(s => s.studentId === studentId);
    return student?.name || studentId;
  }

  function handleExport() {
    // Simple CSV export
    const report = courseReport?.studentReport || [];
    const csv = [
      'Student ID,Student Name,Present,Absent,Late,Total,Rate (%)',
      ...report.map(r => `${r.studentId},"${getStudentName(r.studentId)}",${r.present},${r.absent},${r.late || 0},${r.total},${r.rate}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${selectedCourse}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const report = courseReport?.studentReport || [];

  // Bar chart data
  const chartData = {
    labels: report.map(r => getStudentName(r.studentId).split(' ')[0]),
    datasets: [
      {
        label: 'Present',
        data: report.map(r => r.present),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Absent',
        data: report.map(r => r.absent),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Late',
        data: report.map(r => r.late || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', padding: 16, font: { size: 12 }, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#1a2236',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(124, 58, 237, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 } },
        stacked: true,
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1 },
        stacked: true,
      },
    },
  };

  if (loading) {
    return <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Attendance insights and student performance</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport} id="btn-export-csv">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Course Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Course</label>
          <select className="form-select" value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)} id="select-report-course">
            {courses.map(c => (
              <option key={c.courseId} value={c.courseId}>{c.courseCode} - {c.courseName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      {report.length > 0 && (
        <div className="chart-container stagger-item" style={{ marginBottom: 24 }}>
          <div className="chart-title">
            <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
            Student Attendance Breakdown
          </div>
          <div style={{ height: 320 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {report.length > 0 ? (
        <div className="table-container stagger-item">
          <table className="table" id="reports-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Total Classes</th>
                <th>Attendance Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, i) => {
                const rate = r.rate;
                const statusClass = rate >= 75 ? 'badge-present' : rate >= 50 ? 'badge-late' : 'badge-absent';
                const statusText = rate >= 75 ? 'Good' : rate >= 50 ? 'Warning' : 'Critical';
                return (
                  <tr key={r.studentId} className="stagger-item">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="student-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                          {getStudentName(r.studentId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getStudentName(r.studentId)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.present}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{r.absent}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{r.late || 0}</td>
                    <td>{r.total}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 60, height: 6, background: 'var(--bg-glass)', borderRadius: 3, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${rate}%`, height: '100%', borderRadius: 3,
                            background: rate >= 75 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)',
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{rate}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${statusClass}`}>{statusText}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No attendance data yet</h3>
            <p>Start marking attendance to generate reports and analytics.</p>
          </div>
        </div>
      )}
    </div>
  );
}
