/**
 * FaceMark - Dashboard Page
 * Real-time stats, quick actions, and recognition log feed
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { attendanceAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Table, Spinner, StatusBadge, Button } from '../components/UI';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

export default function Dashboard() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recLogs,   setRecLogs]   = useState([]);
  const [loading,   setLoading]   = useState(true);

useEffect(() => {
  const load = async () => {
    try {

      // ❗ FIX: sirf admin/teacher ko API call karni hai
      if (!(isAdmin || isTeacher)) {
        setLoading(false);
        return;
      }

      const [attRes, recRes] = await Promise.all([
        attendanceAPI.dashboard(),
        attendanceAPI.recognitionLogs({ page: 1 }),
      ]);

      setStats(attRes.data);
      setRecLogs(recRes.data.results || []);

      if (isAdmin) {
        const uRes = await usersAPI.stats();
        setUserStats(uRes.data);
      }

    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };   
  load();
}, [isAdmin, isTeacher]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
if (!(isAdmin || isTeacher)) {
  return (
    <div className="text-white text-center mt-10">
      You are not allowed to view dashboard
    </div>
  );
}
  const today = stats?.today || {};
  const security = stats?.security || {};

  // Pie chart data
  const pieData = [
    { name: 'Present', value: today.present - (today.late || 0) || 0 },
    { name: 'Late',    value: today.late    || 0 },
    { name: 'Absent',  value: Math.max(0, (userStats?.by_role?.student || 0) - today.present) },
  ].filter(d => d.value > 0);

  // Rec logs table columns
  const logColumns = [
    { key: 'timestamp', label: 'Time',
      render: v => <span className="font-mono text-xs">{format(new Date(v), 'HH:mm:ss')}</span> },
    { key: 'user_id', label: 'User' },
    { key: 'result',  label: 'Result',
      render: v => {
        const map = {
          success:       'success',
          unknown:       'danger',
          liveness_fail: 'warning',
          low_confidence:'warning',
          duplicate:     'info',
          out_of_window: 'purple',
        };
        return <Badge label={v.replace('_', ' ')} variant={map[v] || 'default'} />;
      }
    },
    { key: 'confidence_score', label: 'Confidence',
      render: v => v ? <span className="font-mono text-xs">{(v * 100).toFixed(1)}%</span> : '—' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Good {getGreeting()}, {user?.first_name} 👋
          </h1>
          <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/attendance">
            <Button>Take Attendance →</Button>
          </Link>
          {(isAdmin || isTeacher) && (
            <Link to="/register">
              <Button variant="ghost">Register Face</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Present Today"
          value={today.present ?? '—'}
          icon="✓"
          color="green"
          trend={`${today.late ?? 0} late`}
        />
        <StatCard
          label="Total Records"
          value={today.total_records ?? '—'}
          icon="📋"
          color="primary"
          trend="Today"
        />
        <StatCard
          label="Unknown Faces"
          value={security.unknown_faces_24h ?? 0}
          icon="⚠"
          color="amber"
          trend="Last 24 hours"
        />
        <StatCard
          label="Failed Attempts"
          value={security.failed_attempts_24h ?? 0}
          icon="⛔"
          color="red"
          trend="Liveness / low confidence"
        />
      </div>

      {/* User stats row (admin only) */}
      {isAdmin && userStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users"    value={userStats.total_users}             icon="👥" />
          <StatCard label="Students"       value={userStats.by_role?.student ?? 0}   icon="🎓" />
          <StatCard label="Teachers"       value={userStats.by_role?.teacher ?? 0}   icon="📚" />
          <StatCard label="Face Registered" value={userStats.face_registered ?? 0}   icon="🔬" color="green" />
        </div>
      )}

      {/* Charts + log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance pie */}
        <Card className="flex flex-col items-center">
          <h3 className="font-semibold text-white mb-4 self-start">Today's Breakdown</h3>
          {pieData.length > 0 ? (
            <>
              <PieChart width={180} height={180}>
                <Pie data={pieData} cx={90} cy={90} innerRadius={50} outerRadius={80}
                     dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
              <div className="flex gap-4 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm py-8">No attendance data yet today</p>
          )}
        </Card>

        {/* Recent recognition log */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Live Recognition Feed</h3>
            <Link to="/logs" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          <Table
            columns={logColumns}
            data={recLogs.slice(0, 8)}
            emptyMessage="No recognition events yet"
          />
        </div>
      </div>

      {/* Class stats */}
      {stats?.class_stats_today?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4">Attendance by Class (Today)</h3>
          <div className="space-y-3">
            {stats.class_stats_today.map((cls, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {cls['class_session__class_code'] || 'Unknown'} —{' '}
                  <span className="text-slate-500">{cls['class_session__name']}</span>
                </span>
                <Badge label={`${cls.total} present`} variant="success" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
