import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Cloud, Database, Server, Globe } from 'lucide-react';
import config from '../../config';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and system configuration</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Profile Card */}
        <div className="card stagger-item">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: 'var(--accent-primary)' }} />
            Profile
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="student-avatar" style={{ width: 64, height: 64, fontSize: '1.2rem' }}>
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.name || 'Teacher'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email || 'teacher@demo.com'}</div>
              <span className="badge badge-present" style={{ marginTop: 8 }}>Active</span>
            </div>
          </div>
        </div>

        {/* Cloud Configuration */}
        <div className="card stagger-item">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cloud size={18} style={{ color: 'var(--accent-secondary)' }} />
            Cloud Configuration
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: Globe, label: 'Region', value: config.AWS_REGION },
              { icon: Shield, label: 'Auth Mode', value: config.USE_MOCK_DATA ? 'Mock (Local)' : 'AWS Cognito' },
              { icon: Server, label: 'API Endpoint', value: config.USE_MOCK_DATA ? 'Mock Data' : config.API_URL },
              { icon: Database, label: 'Database', value: config.USE_MOCK_DATA ? 'In-Memory' : 'DynamoDB' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card stagger-item" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>🛠️ Technology Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { name: 'React + Vite', desc: 'Frontend Framework' },
            { name: 'AWS Lambda', desc: 'Serverless Compute' },
            { name: 'DynamoDB', desc: 'NoSQL Database' },
            { name: 'Cognito', desc: 'Authentication' },
            { name: 'S3', desc: 'Static Hosting & Storage' },
            { name: 'API Gateway', desc: 'REST API' },
            { name: 'Terraform', desc: 'Infrastructure as Code' },
            { name: 'Python 3.12', desc: 'Backend Runtime' },
          ].map(tech => (
            <div key={tech.name} style={{
              padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)', transition: 'all 0.2s',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tech.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
