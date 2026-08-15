import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users, BookOpen, CheckCircle, TrendingUp,
  Calendar, Clock, AlertCircle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error loading summary:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Students',
      value: summary?.totalStudents || 0,
      icon: Users,
      color: 'purple',
      change: '+12 this month',
    },
    {
      label: 'Total Courses',
      value: summary?.totalCourses || 0,
      icon: BookOpen,
      color: 'cyan',
      change: 'Active courses',
    },
    {
      label: "Today's Attendance",
      value: `${summary?.today?.rate || 0}%`,
      icon: CheckCircle,
      color: 'green',
      change: `${summary?.today?.present || 0}/${summary?.today?.total || 0} present`,
    },
    {
      label: "Today's Absent",
      value: summary?.today?.absent || 0,
      icon: AlertCircle,
      color: 'orange',
      change: `${summary?.today?.late || 0} late`,
    },
  ];

  // Weekly trend chart data
  const weeklyData = {
    labels: (summary?.weeklyTrend || []).map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: (summary?.weeklyTrend || []).map(d => d.rate),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const weeklyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (v) => v + '%',
        },
      },
    },
  };

  // Doughnut chart for today's breakdown
  const todayDoughnut = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [
        summary?.today?.present || 0,
        summary?.today?.absent || 0,
        summary?.today?.late || 0,
      ],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderColor: ['#059669', '#dc2626', '#d97706'],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
    },
  };

  return (
    <div className="page-enter">
      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card stagger-item">
            <div className="stat-card-header">
              <div className="stat-card-label">{stat.label}</div>
              <div className={`stat-card-icon ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-change">
              <TrendingUp size={12} />
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container stagger-item">
          <div className="chart-title">
            <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
            Weekly Attendance Trend
          </div>
          <div style={{ height: 280 }}>
            <Line data={weeklyData} options={weeklyOptions} />
          </div>
        </div>

        <div className="chart-container stagger-item">
          <div className="chart-title">
            <Calendar size={18} style={{ color: 'var(--accent-secondary)' }} />
            Today's Breakdown
          </div>
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(summary?.today?.total || 0) > 0 ? (
              <Doughnut data={todayDoughnut} options={doughnutOptions} />
            ) : (
              <div className="empty-state" style={{ padding: 20 }}>
                <Clock size={40} style={{ opacity: 0.3 }} />
                <h3>No attendance yet today</h3>
                <p>Start marking attendance to see today's breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="card stagger-item" style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="stat-card-icon purple">
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>System Status</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>All cloud services operational</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {['AWS Lambda', 'DynamoDB', 'Cognito Auth', 'S3 Storage', 'API Gateway'].map((service) => (
            <div key={service} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
