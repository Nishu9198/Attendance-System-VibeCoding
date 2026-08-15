import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Send, X, Clock, User, Edit2, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/': 'Dashboard',
  '/timetable': 'Weekly Timetable (Grid)',
  '/attendance': 'Class Attendance Session',
  '/roster': 'Student Attendance Roster',
  '/subject-settings': 'Subject & Attendance Criteria',
  '/subjects': 'Subject Breakdown',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();

  const title = pageTitles[location.pathname] || 'Presently';

  const [unmarked, setUnmarked] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sendingSns, setSendingSns] = useState(false);
  const [snsAlert, setSnsAlert] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const res = await api.getNotifications();
      setUnmarked(res.unmarked || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  async function handleSendSNS() {
    setSendingSns(true);
    setSnsAlert('');
    try {
      const res = await api.triggerSNSReminder();
      setSnsAlert(res.message || 'AWS SNS alert published successfully!');
    } catch (err) {
      setSnsAlert('Failed to send SNS alert.');
    } finally {
      setSendingSns(false);
    }
  }

  function openProfileModal() {
    setEditName(user?.name || '');
    setProfileSuccess(false);
    setShowProfileModal(true);
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    updateUserProfile({ name: editName.trim() });
    setProfileSuccess(true);
    setTimeout(() => {
      setShowProfileModal(false);
      setProfileSuccess(false);
    }, 800);
  }

  return (
    <header className="header" id="main-header">
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: 440, width: '90%', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--blue-600)" /> Edit Display Name
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowProfileModal(false)} style={{ borderRadius: '50%', width: 28, height: 28 }}>✕</button>
            </div>

            {profileSuccess ? (
              <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 600 }}>
                ✅ Name updated successfully!
              </div>
            ) : (
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label">Email (Cognito Account)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Name</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <h2 className="header-title">{title}</h2>
      <div className="header-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* User Profile Button with Edit Name */}
        <button
          className="btn btn-secondary"
          onClick={openProfileModal}
          title="Click to edit your display name"
          style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <User size={14} color="var(--blue-600)" />
          <span style={{ fontWeight: 600 }}>{user?.name || 'User'}</span>
          <Edit2 size={12} style={{ opacity: 0.6 }} />
        </button>

        {/* Notification Bell Button */}
        <button
          className="btn btn-icon btn-secondary"
          id="header-notifications"
          title="24-Hour Unmarked Class Notifications"
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {unmarked.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: 17,
                height: 17,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
              }}
            >
              {unmarked.length}
            </span>
          )}
        </button>

        {/* Notifications Popover Dropdown */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 46,
              right: 0,
              width: 340,
              background: 'white',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 300,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} color="var(--warning)" />
                24h Unmarked Class Reminders
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            </div>

            {snsAlert && (
              <div style={{ padding: '8px 12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', marginBottom: 10, fontWeight: 600 }}>
                {snsAlert}
              </div>
            )}

            {unmarked.length === 0 ? (
              <div style={{ padding: '20px 0', textCenter: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ✅ All class attendance sessions from the last 24h are marked!
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  You have not marked attendance for {unmarked.length} session(s) older than 24 hours:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {unmarked.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--warning-bg)',
                        border: '1px solid var(--warning-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate(`/attendance?subject=${item.subjectCode}&period=${item.period}`);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.82rem', color: 'var(--warning)' }}>
                        <span>{item.subjectCode} ({item.subjectName})</span>
                        <span>Period {item.period}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> Overdue by {item.hoursOverdue} hours ({item.date})
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={handleSendSNS}
                  disabled={sendingSns}
                >
                  <Send size={13} />
                  {sendingSns ? 'Dispatching SNS...' : 'Dispatch AWS SNS Notification'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
