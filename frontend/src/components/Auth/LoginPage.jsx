import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LogIn, UserPlus, Mail, Lock, User, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { login, register, confirmRegistration } = useAuth();
  const [role, setRole] = useState('teacher');
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      if (role === 'student') {
        try {
          const randNum = Math.floor(100 + Math.random() * 900);
          await api.createStudent({
            studentId: `STU${randNum}`,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            rollNumber: `21CS${randNum}`,
            section: 'A',
            department: 'Computer Science',
            semester: '5th Year',
          });
        } catch (dbErr) {
          console.error('Error auto-creating student DynamoDB record:', dbErr);
        }
      }
      setMode('confirm');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmRegistration(email, code);
      setMode('login');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">📋</div>
          <h2>Presently</h2>
          <p>AI Facial Recognition Attendance</p>
        </div>

        {/* Role Selector */}
        <div className="auth-role-tabs">
          <button
            className={`auth-role-tab ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
            type="button"
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <User size={14} /> Teacher
            </span>
          </button>
          <button
            className={`auth-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
            type="button"
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <GraduationCap size={14} /> Student
            </span>
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                <input id="login-email" type="email" className="form-input" style={{ paddingLeft: 38 }}
                  placeholder={role === 'teacher' ? 'teacher@university.edu' : 'student@university.edu'}
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                <input id="login-password" type="password" className="form-input" style={{ paddingLeft: 38 }}
                  placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <button id="login-submit" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <LogIn size={15} />}
              {loading ? 'Signing in...' : `Sign In as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
            </button>
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Demo mode: any email & password works
            </p>
            <div className="auth-footer">
              Don't have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); setMode('register'); setError(''); }}>Create Account</a>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="register-name" type="text" className="form-input" placeholder="Full name"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input id="register-email" type="email" className="form-input" placeholder="email@university.edu"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="register-password" type="password" className="form-input" placeholder="Min 8 chars"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating...' : <><UserPlus size={15} /> Create {role === 'teacher' ? 'Teacher' : 'Student'} Account</>}
            </button>
            <div className="auth-footer">
              Already have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>Sign In</a>
            </div>
          </form>
        )}

        {mode === 'confirm' && (
          <form onSubmit={handleConfirm}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 18 }}>
              Verification code sent to <strong>{email}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input type="text" className="form-input" style={{ textAlign: 'center', letterSpacing: 4, fontSize: '1.1rem' }}
                placeholder="000000" value={code} onChange={e => setCode(e.target.value)} required maxLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
            <div className="auth-footer">
              <a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>Back to Sign In</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
