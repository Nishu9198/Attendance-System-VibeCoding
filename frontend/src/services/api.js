import config from '../config';
import { authService } from './auth';

// ============================================================
// MOCK DATA — AttendCloud (Teacher & Student Portals)
// ============================================================

const PERIODS = [
  { period: 1, start: '08:00', end: '08:50' },
  { period: 2, start: '08:50', end: '09:40' },
  { period: 3, start: '09:40', end: '10:30' },
  { period: 4, start: '10:30', end: '11:20' },
  { period: 5, start: '11:20', end: '12:10' },
  { period: 6, start: '12:10', end: '13:00' },
  { period: 7, start: '13:00', end: '13:50' },
  { period: 8, start: '13:50', end: '14:40' },
  { period: 9, start: '14:40', end: '15:30' },
  { period: 10, start: '15:30', end: '16:20' },
  { period: 11, start: '16:20', end: '17:00' },
];

let mockSubjects = [
  { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304', threshold: 75, editWindowDays: 10, enrolledStudents: ['STU001','STU002','STU003','STU004','STU005','STU006'], totalClasses: 0 },
  { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201', threshold: 75, editWindowDays: 10, enrolledStudents: ['STU001','STU003','STU004','STU005','STU007','STU008'], totalClasses: 0 },
  { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', teacherName: 'Dr. A. Sharma', building: 'Main Academic Block', roomNumber: 'Hall B', threshold: 80, editWindowDays: 10, enrolledStudents: ['STU001','STU002','STU006','STU007','STU008'], totalClasses: 0 },
];

let mockTimetable = {
  '1': { '2': { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304' }, '3': { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304' }, '7': { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', teacherName: 'Dr. A. Sharma', building: 'Main Academic Block', roomNumber: 'Hall B' }, '10': { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201' } },
  '2': { '3': { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201' }, '4': { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201' }, '8': { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', teacherName: 'Dr. A. Sharma', building: 'Main Academic Block', roomNumber: 'Hall B' } },
  '3': { '2': { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', teacherName: 'Dr. A. Sharma', building: 'Main Academic Block', roomNumber: 'Hall B' }, '5': { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304' }, '9': { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201' } },
  '4': { '2': { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201' }, '7': { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304' }, '10': { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', teacherName: 'Dr. A. Sharma', building: 'Main Academic Block', roomNumber: 'Hall B' } },
  '5': { '2': { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304' }, '4': { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', teacherName: 'Dr. A. Sharma', building: 'Main Academic Block', roomNumber: 'Hall B' }, '8': { subjectCode: 'CS502', subjectName: 'Machine Learning', className: '5th Year', section: 'B', teacherName: 'Dr. S. Rao', building: 'Engineering Block', roomNumber: 'Lab 201' }, '11': { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', teacherName: 'Dr. Nishchal', building: 'Science & Tech Block', roomNumber: 'Room 304' } },
};

const mockStudents = [
  { studentId: 'STU001', name: 'Aarav Sharma', rollNumber: '21CS001', email: 'aarav@student.edu', section: 'A' },
  { studentId: 'STU002', name: 'Priya Patel', rollNumber: '21CS002', email: 'priya@student.edu', section: 'A' },
  { studentId: 'STU003', name: 'Rahul Kumar', rollNumber: '21CS003', email: 'rahul@student.edu', section: 'A' },
  { studentId: 'STU004', name: 'Sneha Gupta', rollNumber: '21CS004', email: 'sneha@student.edu', section: 'B' },
  { studentId: 'STU005', name: 'Vikram Singh', rollNumber: '21CS005', email: 'vikram@student.edu', section: 'B' },
  { studentId: 'STU006', name: 'Ananya Reddy', rollNumber: '21CS006', email: 'ananya@student.edu', section: 'A' },
  { studentId: 'STU007', name: 'Karthik Nair', rollNumber: '21CS007', email: 'karthik@student.edu', section: 'B' },
  { studentId: 'STU008', name: 'Divya Menon', rollNumber: '21CS008', email: 'divya@student.edu', section: 'A' },
];

// Mock attendance records for STU001 across subjects
const generateMockAttendance = () => {
  const records = [];
  const today = new Date();

  // CS501: Safe (82.4%)
  for (let i = 0; i < 15; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    records.push({
      subjectClass: 'CS501#5th Year',
      recordKey: `${dateStr}#2#STU001`,
      studentId: 'STU001', date: dateStr, period: '2',
      status: i === 3 || i === 7 ? 'absent' : i === 5 ? 'late' : 'present',
      markedBy: 'teacher@demo.com', markedAt: `${dateStr}T09:00:00Z`
    });
  }

  // CS502: At Risk / Below (68.5%)
  for (let i = 0; i < 15; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    records.push({
      subjectClass: 'CS502#5th Year',
      recordKey: `${dateStr}#3#STU001`,
      studentId: 'STU001', date: dateStr, period: '3',
      status: i === 1 || i === 2 || i === 4 || i === 8 || i === 10 ? 'absent' : 'present',
      markedBy: 'teacher@demo.com', markedAt: `${dateStr}T09:50:00Z`
    });
  }

  // CS503: Critical Shortage (55.0%)
  for (let i = 0; i < 12; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    records.push({
      subjectClass: 'CS503#5th Year',
      recordKey: `${dateStr}#7#STU001`,
      studentId: 'STU001', date: dateStr, period: '7',
      status: i % 2 === 0 ? 'absent' : 'present',
      markedBy: 'teacher@demo.com', markedAt: `${dateStr}T13:00:00Z`
    });
  }

  return records;
};

let mockAttendance = generateMockAttendance();
let mockTeacherAttendance = [{ date: new Date().toISOString().split('T')[0], status: 'present' }];

// API Call Helper
async function apiCall(method, path, body = null) {
  if (config.USE_MOCK_DATA) return handleMock(method, path, body);

  let token = null;
  try {
    token = await authService.getToken();
  } catch (e) {}

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = (config.API_URL || '').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${baseUrl}${cleanPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API request failed');
  return data;
}

// Mock Handler
function handleMock(method, path, body) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Student Dashboard Overview
      if (path.startsWith('/student/dashboard') && method === 'GET') {
        const studentId = 'STU001';
        const studentSubjects = mockSubjects.filter(s => s.enrolledStudents.includes(studentId));

        let totalAttended = 0, totalClassesCount = 0;
        const subjectStats = studentSubjects.map(subj => {
          const sc = `${subj.subjectCode}#${subj.className}`;
          const recs = mockAttendance.filter(r => r.subjectClass === sc && r.studentId === studentId);
          const present = recs.filter(r => r.status === 'present').length;
          const late = recs.filter(r => r.status === 'late').length;
          const absent = recs.filter(r => r.status === 'absent').length;
          const total = recs.length;
          const attended = present + late;

          totalAttended += attended;
          totalClassesCount += total;

          const rate = total > 0 ? Math.round((attended / total) * 100 * 10) / 10 : 0;
          const threshold = subj.threshold || 75;

          const margin = threshold > 0 ? Math.max(0, Math.floor((attended * 100 / threshold) - total)) : 999;
          let classesNeeded = 0;
          if (rate < threshold && threshold < 100) {
            classesNeeded = Math.max(0, Math.ceil((threshold * total - attended * 100) / (100 - threshold)));
          }

          let status = 'safe';
          if (rate < threshold - 10) status = 'critical';
          else if (rate < threshold) status = 'risk';
          else if (rate < threshold + 10) status = 'ok';

          return {
            subjectCode: subj.subjectCode,
            subjectName: subj.subjectName,
            className: subj.className,
            teacherName: subj.teacherName || 'Dr. Nishchal',
            building: subj.building || 'Science Block',
            roomNumber: subj.roomNumber || 'Room 304',
            present, absent, late, total, rate, threshold, margin, classesNeeded, status,
            history: recs.sort((a,b) => b.date.localeCompare(a.date)),
          };
        });

        const overallRate = totalClassesCount > 0 ? Math.round((totalAttended / totalClassesCount) * 100 * 10) / 10 : 0;
        const shortageSubjects = subjectStats.filter(s => s.rate < s.threshold);

        resolve({
          student: mockStudents.find(s => s.studentId === studentId),
          overallRate,
          totalClasses: totalClassesCount,
          totalAttended,
          shortageSubjectsCount: shortageSubjects.length,
          subjectStats,
          timetable: mockTimetable,
        });
      }

      // Student Shortage SNS Alert
      else if (path === '/student/trigger-sns-alert' && method === 'POST') {
        resolve({
          message: 'AWS SNS Email & SMS Shortage Alert dispatched to student aarav@student.edu!',
          sent: true,
          messageId: 'student-sns-' + Math.random().toString(36).substr(2, 9),
        });
      }

      // Timetable
      else if (path === '/timetable' && method === 'GET') {
        const slots = [];
        Object.entries(mockTimetable).forEach(([day, periods]) => {
          Object.entries(periods).forEach(([p, slot]) => {
            slots.push({ slotKey: `${day}#${p}`, ...slot });
          });
        });
        resolve({ timetable: mockTimetable, slots });
      } else if (path === '/timetable' && method === 'POST') {
        const { dayOrder, period, ...rest } = body;
        if (!mockTimetable[String(dayOrder)]) mockTimetable[String(dayOrder)] = {};
        mockTimetable[String(dayOrder)][String(period)] = rest;
        resolve({ message: 'Slot updated' });
      } else if (path.startsWith('/timetable/') && method === 'DELETE') {
        const parts = path.split('/');
        const day = parts[2], period = parts[3];
        if (mockTimetable[day]) delete mockTimetable[day][period];
        resolve({ message: 'Slot cleared' });
      }

      // Subjects
      else if (path === '/subjects' && method === 'GET') {
        resolve({ subjects: mockSubjects });
      } else if (path === '/subjects' && method === 'POST') {
        mockSubjects.push(body);
        resolve({ message: 'Created', subject: body });
      } else if (path.startsWith('/subjects/') && method === 'PUT') {
        const code = path.split('/')[2];
        const idx = mockSubjects.findIndex(s => s.subjectCode === code);
        if (idx >= 0) Object.assign(mockSubjects[idx], body);
        resolve({ message: 'Updated', subject: mockSubjects[idx] });
      } else if (path.startsWith('/subjects/') && method === 'DELETE') {
        const code = path.split('/')[2];
        mockSubjects = mockSubjects.filter(s => s.subjectCode !== code);
        resolve({ message: 'Deleted' });
      }

      // Teacher attendance
      else if (path === '/teacher-attendance' && method === 'POST') {
        const today = new Date().toISOString().split('T')[0];
        if (!mockTeacherAttendance.find(r => r.date === today)) {
          mockTeacherAttendance.push({ date: today, status: 'present', markedAt: new Date().toISOString() });
        }
        resolve({ message: 'Marked' });
      } else if (path === '/teacher-attendance' && method === 'GET') {
        const today = new Date().toISOString().split('T')[0];
        resolve({ records: mockTeacherAttendance, markedToday: mockTeacherAttendance.some(r => r.date === today), totalDays: mockTeacherAttendance.length });
      }

      // Attendance Roster & Marking
      else if (path === '/attendance' && method === 'POST') {
        const { subjectCode, className, date, period: per, records } = body;
        const sc = `${subjectCode}#${className}`;
        records.forEach(r => {
          const rk = `${date}#${per}#${r.studentId}`;
          const idx = mockAttendance.findIndex(a => a.subjectClass === sc && a.recordKey === rk);
          const item = { subjectClass: sc, recordKey: rk, studentId: r.studentId, date, period: per, status: r.status, markedBy: 'teacher@demo.com', markedAt: new Date().toISOString() };
          if (idx >= 0) mockAttendance[idx] = item;
          else mockAttendance.push(item);
        });
        resolve({ message: `Marked ${records.length} students` });
      } else if (path.startsWith('/attendance') && method === 'GET' && path.includes('roster')) {
        const rawCode = path.split('/roster/')[1] || '';
        const subjectCode = rawCode.split('?')[0];
        const params = new URLSearchParams(rawCode.includes('?') ? rawCode.substring(rawCode.indexOf('?')) : '');
        const cn = params.get('className') || mockSubjects.find(s => s.subjectCode === subjectCode)?.className || '';
        const subj = mockSubjects.find(s => s.subjectCode === subjectCode);
        const threshold = subj?.threshold || 75;
        const enrolled = subj?.enrolledStudents || [];
        const sc = `${subjectCode}#${cn}`;
        const recs = mockAttendance.filter(r => r.subjectClass === sc);
        const uniqueClasses = new Set(recs.map(r => `${r.date}#${r.period}`));
        const totalClasses = uniqueClasses.size;
        const stats = {};
        recs.forEach(r => {
          if (!stats[r.studentId]) stats[r.studentId] = { present: 0, absent: 0, late: 0, total: 0 };
          stats[r.studentId].total++;
          stats[r.studentId][r.status]++;
        });
        const roster = enrolled.map(sid => {
          const s = stats[sid] || { present: 0, absent: 0, late: 0, total: 0 };
          const attended = s.present + s.late;
          const rate = totalClasses > 0 ? Math.round(attended / totalClasses * 100 * 10) / 10 : 0;
          const margin = threshold > 0 ? Math.max(0, Math.floor((attended * 100 / threshold) - totalClasses)) : 999;
          let needed = 0;
          if (rate < threshold && threshold < 100) needed = Math.max(0, Math.ceil((threshold * totalClasses - attended * 100) / (100 - threshold)));
          let status = 'safe';
          if (rate < threshold - 10) status = 'critical';
          else if (rate < threshold) status = 'risk';
          else if (rate < threshold + 10) status = 'ok';
          return { studentId: sid, present: s.present, absent: s.absent, late: s.late, totalClasses, attended, rate, margin, classesNeeded: needed, status };
        });
        roster.sort((a, b) => a.rate - b.rate);
        resolve({ subjectCode, className: cn, threshold, totalClasses, roster });
      } else if (path.startsWith('/attendance') && method === 'GET') {
        const url = new URL('http://x' + path);
        const sc = url.searchParams.get('subjectCode');
        const cn = url.searchParams.get('className');
        const date = url.searchParams.get('date');
        const period = url.searchParams.get('period');
        let recs = mockAttendance;
        if (sc && cn) recs = recs.filter(r => r.subjectClass === `${sc}#${cn}`);
        if (date) recs = recs.filter(r => r.date === date);
        if (period) recs = recs.filter(r => r.period === period);
        resolve({ records: recs, count: recs.length });
      }

      // Notifications (SNS)
      else if (path === '/notifications/unmarked' && method === 'GET') {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const unmarkedMock = [
          { subjectCode: 'CS501', subjectName: 'Cloud Computing', className: '5th Year', section: 'A', period: '2', date: yesterday, hoursOverdue: 24 },
          { subjectCode: 'CS503', subjectName: 'Database Systems', className: '5th Year', section: 'A', period: '7', date: yesterday, hoursOverdue: 26 },
        ];
        resolve({ unmarked: unmarkedMock, count: unmarkedMock.length });
      } else if (path === '/notifications/trigger-sns' && method === 'POST') {
        resolve({
          message: 'AWS SNS email & SMS notification dispatched to teacher@demo.com!',
          sent: true,
          messageId: 'sns-msg-' + Math.random().toString(36).substr(2, 9),
        });
      }

      // Students
      else if (path === '/students' && method === 'GET') {
        resolve({ students: mockStudents });
      } else if (path.startsWith('/students/') && method === 'GET') {
        const id = path.split('/')[2];
        resolve({ student: mockStudents.find(s => s.studentId === id) });
      }

      // Face Recognition & Memory
      else if (path === '/faces/register' && method === 'POST') {
        const { studentId, imageBase64 } = body;
        const student = mockStudents.find(s => s.studentId === studentId);
        if (student) {
          student.faceRegistered = true;
          student.facePhotoUrl = imageBase64;
        }
        try { localStorage.setItem(`face_reg_${studentId}`, imageBase64); } catch (e) {}
        resolve({
          message: `Face registered for student ${studentId}!`,
          verified: true,
          isFirstTime: true,
          studentId,
          photoUrl: imageBase64
        });
      } else if (path === '/faces/verify' && method === 'POST') {
        const { studentId, imageBase64 } = body;
        let storedFace = null;
        try { storedFace = localStorage.getItem(`face_reg_${studentId}`); } catch (e) {}
        const student = mockStudents.find(s => s.studentId === studentId);

        if (!storedFace && student && student.facePhotoUrl) {
          storedFace = student.facePhotoUrl;
        }

        if (!storedFace) {
          // First-time capture! Save face profile automatically for next time.
          if (student) {
            student.faceRegistered = true;
            student.facePhotoUrl = imageBase64;
          }
          try { localStorage.setItem(`face_reg_${studentId}`, imageBase64); } catch (e) {}
          resolve({
            verified: true,
            isFirstTime: true,
            confidence: 100.0,
            message: `First-time face capture! Saved profile for ${student?.name || studentId}`,
            photoUrl: imageBase64
          });
        } else {
          // Subsequent attendance verification
          const confidence = Math.round((95 + Math.random() * 4.8) * 10) / 10;
          resolve({
            verified: true,
            isFirstTime: false,
            confidence: confidence,
            message: `Face matched with ${confidence}% confidence!`,
            photoUrl: storedFace
          });
        }
      } else if (path === '/faces/verify-teacher' && method === 'POST') {
        const { imageBase64 } = body || {};
        let storedTeacherFace = null;
        try { storedTeacherFace = localStorage.getItem('teacher_face_reg'); } catch (e) {}
        if (!storedTeacherFace) {
          try { localStorage.setItem('teacher_face_reg', imageBase64 || 'registered'); } catch (e) {}
          resolve({
            verified: true,
            isFirstTime: true,
            confidence: 100.0,
            message: '✨ Master Teacher Face profile registered successfully!',
          });
        } else {
          resolve({
            verified: true,
            isFirstTime: false,
            confidence: 98.4,
            message: '✅ Teacher Face Verified (98.4% match)!',
          });
        }
      } else if (path.startsWith('/faces/status/') && method === 'GET') {
        const id = path.split('/faces/status/')[1];
        let storedFace = null;
        try { storedFace = localStorage.getItem(`face_reg_${id}`); } catch (e) {}
        const student = mockStudents.find(s => s.studentId === id);
        const registered = !!(storedFace || (student && student.faceRegistered));
        resolve({
          studentId: id,
          faceRegistered: registered,
          photoUrl: storedFace || student?.facePhotoUrl || ''
        });
      }

      else { resolve({ error: 'Not found' }); }
    }, 200);
  });
}

// ============================================================
// EXPORTED API
// ============================================================

export const api = {
  // Student Portal APIs
  getStudentDashboard: () => apiCall('GET', '/student/dashboard'),
  triggerStudentSNSAlert: () => apiCall('POST', '/student/trigger-sns-alert'),

  // Timetable
  getTimetable: () => apiCall('GET', '/timetable'),
  setSlot: (data) => apiCall('POST', '/timetable', data),
  deleteSlot: (dayOrder, period) => apiCall('DELETE', `/timetable/${dayOrder}/${period}`),

  // Subjects
  getSubjects: () => apiCall('GET', '/subjects'),
  createSubject: (data) => apiCall('POST', '/subjects', data),
  updateSubject: (code, data) => apiCall('PUT', `/subjects/${code}`, data),
  deleteSubject: (code) => apiCall('DELETE', `/subjects/${code}`),

  // Teacher attendance
  markTeacherAttendance: () => apiCall('POST', '/teacher-attendance'),
  getTeacherAttendance: () => apiCall('GET', '/teacher-attendance'),

  // Student attendance
  markAttendance: (data) => apiCall('POST', '/attendance', data),
  getAttendance: (subjectCode, className, date, period) => {
    let path = `/attendance?subjectCode=${subjectCode}&className=${encodeURIComponent(className)}`;
    if (date) path += `&date=${date}`;
    if (period) path += `&period=${period}`;
    return apiCall('GET', path);
  },
  getRoster: (subjectCode, className) => apiCall('GET', `/attendance/roster/${subjectCode}?className=${encodeURIComponent(className || '')}`),

  // Notifications (SNS)
  getNotifications: () => apiCall('GET', '/notifications/unmarked'),
  triggerSNSReminder: () => apiCall('POST', '/notifications/trigger-sns'),

  // Students
  getStudents: () => apiCall('GET', '/students'),
  getStudent: (id) => apiCall('GET', `/students/${id}`),
  createStudent: (data) => apiCall('POST', '/students', data),
  updateStudent: (id, data) => apiCall('PUT', `/students/${id}`, data),

  // Face Recognition & Memory
  registerFace: (studentId, imageBase64) => apiCall('POST', '/faces/register', { studentId, imageBase64 }),
  registerTeacherFace: (imageBase64) => apiCall('POST', '/faces/register-teacher', { imageBase64 }),
  verifyFace: (studentId, imageBase64) => apiCall('POST', '/faces/verify', { studentId, imageBase64 }),
  verifyTeacherFace: (imageBase64) => apiCall('POST', '/faces/verify-teacher', { imageBase64 }),
  getFaceStatus: (studentId) => apiCall('GET', `/faces/status/${studentId}`),

  // Helpers
  getPeriods: () => PERIODS,
  getStudentInfo: (id) => mockStudents.find(s => s.studentId === id),
};

export { PERIODS };

