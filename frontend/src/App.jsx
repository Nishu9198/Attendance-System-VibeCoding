import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

// Teacher & Faculty Management Pages
import TeacherHome from './components/Teacher/TeacherHome';
import TimetablePage from './components/Teacher/TimetablePage';
import MarkAttendancePage from './components/Teacher/MarkAttendancePage';
import StudentRosterPage from './components/Teacher/StudentRosterPage';
import SubjectSettingsPage from './components/Teacher/SubjectSettingsPage';

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
  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TeacherHome />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/attendance" element={<MarkAttendancePage />} />
          <Route path="/roster" element={<StudentRosterPage />} />
          <Route path="/subject-settings" element={<SubjectSettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
