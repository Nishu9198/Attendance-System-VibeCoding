import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Layout/Sidebar';
import StudentSidebar from './components/Layout/StudentSidebar';
import Header from './components/Layout/Header';

// Teacher Pages
import TeacherHome from './components/Teacher/TeacherHome';
import TimetablePage from './components/Teacher/TimetablePage';
import MarkAttendancePage from './components/Teacher/MarkAttendancePage';
import StudentRosterPage from './components/Teacher/StudentRosterPage';
import SubjectSettingsPage from './components/Teacher/SubjectSettingsPage';

// Student Pages
import StudentHome from './components/Student/StudentHome';
import StudentTimetablePage from './components/Student/StudentTimetablePage';
import StudentSubjectsPage from './components/Student/StudentSubjectsPage';

import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading Presently...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  return (
    <div className="app-layout">
      {isStudent ? <StudentSidebar /> : <Sidebar />}
      <Header />
      <main className="main-content">
        {isStudent ? (
          <Routes>
            <Route path="/" element={<StudentHome />} />
            <Route path="/timetable" element={<StudentTimetablePage />} />
            <Route path="/subjects" element={<StudentSubjectsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<TeacherHome />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/attendance" element={<MarkAttendancePage />} />
            <Route path="/roster" element={<StudentRosterPage />} />
            <Route path="/subject-settings" element={<SubjectSettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading Presently...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
