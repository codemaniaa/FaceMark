/**
 * FaceMark - Audit Logs Page (Admin only)
 */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { usersAPI, attendanceAPI } from '../api';
import { Table, Badge, Card, Select, Input, Button } from '../components/UI';
import toast from 'react-hot-toast';

const ACTION_VARIANTS = {
  login:           'info',
  logout:          'default',
  face_register:   'success',
  face_recognize:  'success',
  attendance_mark: 'success',
  attendance_edit: 'warning',
  user_create:     'info',
  user_update:     'info',
  user_delete:     'danger',
  unknown_face:    'danger',
  liveness_fail:   'warning',
  spoof_attempt:   'danger',
};

export default function LogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.auditLogs({ action: action || undefined, page });
      setLogs(res.data.results || []);
      setTotal(res.data.count   || 0);
    } catch { toast.error('Failed to load logs.'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, [action, page]);

  const columns = [
    { key: 'timestamp', label: 'Time',
      render: v => <span className="font-mono text-xs text-slate-400">{format(new Date(v), 'MMM d HH:mm:ss')}</span> },
    { key: 'actor_name', label: 'Actor',
      render: v => <span className="text-sm">{v}</span> },
    { key: 'action', label: 'Action',
      render: v => <Badge label={v.replace(/_/g, ' ')} variant={ACTION_VARIANTS[v] || 'default'} /> },
    { key: 'target_name', label: 'Target' },
    { key: 'ip_address',  label: 'IP', render: v => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'description', label: 'Details',
      render: v => <span className="text-slate-400 text-xs max-w-xs block truncate">{v || '—'}</span> },
  ];

  const actions = [
    'login','logout','face_register','face_recognize','attendance_mark',
    'attendance_edit','user_create','user_update','user_delete',
    'unknown_face','liveness_fail','spoof_attempt',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400 mt-1">Immutable log of all system actions — {total} total entries</p>
      </div>

      <Card>
        <div className="flex gap-3 items-center">
          <Select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
                  className="w-56">
            <option value="">All actions</option>
            {actions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </Select>
          <Button variant="ghost" onClick={loadLogs}>↻ Refresh</Button>
        </div>
      </Card>

      <Table columns={columns} data={logs} loading={loading}
             emptyMessage="No audit logs found" />

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{total} total entries</span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <Button variant="ghost" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
