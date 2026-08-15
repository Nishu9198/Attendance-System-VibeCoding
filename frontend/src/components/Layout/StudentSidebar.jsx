import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  LogOut,
  User,
  RefreshCw,
} from 'lucide-react';

export default function StudentSidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: GraduationCap, label: 'My Attendance' },
    { path: '/timetable', icon: Calendar, label: 'My Timetable (Editable)' },
    { path: '/subjects', icon: BookOpen, label: 'Subject Breakdown' },
  ];

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar" id="student-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'var(--success)' }}>🎓</div>
        <div>
          <h1>Presently</h1>
          <p>Student Portal</p>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Student Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            id={`nav-student-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 24 }}>System</div>
        <button
          className="sidebar-link"
          onClick={logout}
          id="nav-logout"
        >
          <LogOut />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar" style={{ background: 'var(--success)' }}>
          {getInitials(user?.name || user?.email)}
        </div>
        <div>
          <div className="sidebar-user-name">{user?.name || 'Aarav Sharma'}</div>
          <div className="sidebar-user-email">Role: Student (21CS001)</div>
        </div>
      </div>
    </aside>
  );
}
