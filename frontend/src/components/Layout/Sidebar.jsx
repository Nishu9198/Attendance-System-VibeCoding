import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  Users,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/timetable', icon: Calendar, label: 'Timetable (Grid)' },
    { path: '/attendance', icon: ClipboardCheck, label: 'Mark Attendance' },
    { path: '/roster', icon: Users, label: 'Student Roster' },
    { path: '/subject-settings', icon: Settings, label: 'Subject Settings' },
  ];

  const getInitials = (name) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📋</div>
        <div>
          <h1>Presently</h1>
          <p>Teacher Portal</p>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Main Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            id={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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
        <div className="sidebar-avatar">
          {getInitials(user?.name || user?.email)}
        </div>
        <div>
          <div className="sidebar-user-name">{user?.name || 'Dr. Nishchal'}</div>
          <div className="sidebar-user-email">{user?.email || 'teacher@demo.com'}</div>
        </div>
      </div>
    </aside>
  );
}
