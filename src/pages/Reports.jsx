/**
 * FaceMark - Reports Page
 * View attendance summaries, export reports, see defaulters
 */
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { attendanceAPI, reportsAPI } from '../api';
import {
  Card, Button, Input, Select, Table, Badge,
  StatCard, ProgressBar, Alert, Spinner
} from '../components/UI';
import { useDownload } from '../hooks';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [tab, setTab] = useState('summary'); // summary | defaulters | records

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-white">Reports & Analytics</h1>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: 'summary',    label: 'Summary'    },
          { id: 'defaulters', label: 'Defaulters' },
          { id: 'records',    label: 'Records'    },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === t.id
                ? 'border-primary-500 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary'    && <SummaryTab />}
      {tab === 'defaulters' && <DefaultersTab />}
      {tab === 'records'    && <RecordsTab />}
    </div>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────
function SummaryTab() {
  const [userId,   setUserId]   = useState('');
  const [month,    setMonth]    = useState(format(new Date(), 'yyyy-MM'));
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const { exportExcel, exportPDF } = useDownload();

  const load = async () => {
    if (!userId) { toast.error('Enter a User ID.'); return; }
    setLoading(true);
    try {
      const res = await attendanceAPI.summary({ user_id: userId, month });
      setData(res.data);
    } catch {
      toast.error('User not found or no records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex gap-3 items-end">
          <Input label="User ID" placeholder="STU001" value={userId}
                 onChange={e => setUserId(e.target.value)} className="w-40" />
          <Input label="Month" type="month" value={month}
                 onChange={e => setMonth(e.target.value)} className="w-44" />
          <Button onClick={load} loading={loading}>Generate</Button>
        </div>
      </Card>

      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Export buttons */}
          <div className="flex gap-3">
            <Button variant="ghost"
                    onClick={() => exportExcel({ start: `${month}-01`, end: format(endOfMonth(new Date(month)), 'yyyy-MM-dd') })}>
              📊 Export Excel
            </Button>
            <Button variant="ghost"
                    onClick={() => exportPDF({ start: `${month}-01`, end: format(endOfMonth(new Date(month)), 'yyyy-MM-dd') })}>
              📄 Export PDF
            </Button>
          </div>

          {data.is_defaulter && (
            <Alert type="warning" message={`${data.user_name} is a DEFAULTER — attendance below 75%`} />
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Attendance %" value={`${data.attendance_percentage}%`}
                      color={data.attendance_percentage >= 75 ? 'green' : 'red'} />
            <StatCard label="Present Days" value={data.present} color="green" />
            <StatCard label="Late"         value={data.late}    color="amber" />
            <StatCard label="Absent"       value={data.absent}  color="red"   />
          </div>

          <Card>
            <h3 className="font-semibold text-white mb-4">{data.user_name} — {month}</h3>
            <ProgressBar
              value={data.attendance_percentage}
              max={100}
              color={data.attendance_percentage >= 75 ? 'green' : data.attendance_percentage >= 60 ? 'amber' : 'red'}
              label="Attendance Percentage"
            />
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Total Working Days', value: data.total_days },
                { label: 'Present + Late', value: data.present },
                { label: 'Absent', value: data.absent },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-slate-800">
                  <div className="text-2xl font-display font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Defaulters Tab ───────────────────────────────────────────────────────────
function DefaultersTab() {
  const [month,     setMonth]     = useState(format(new Date(), 'yyyy-MM'));
  const [threshold, setThreshold] = useState(75);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const { exportExcel } = useDownload();

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.defaulters({ threshold, month });
      setData(res.data);
    } catch { toast.error('Failed to load defaulters.'); }
    finally   { setLoading(false); }
  };

  const columns = [
    { key: 'user_id',   label: 'ID', render: v => <span className="font-mono text-xs text-primary-300">{v}</span> },
    { key: 'name',      label: 'Name' },
    { key: 'attendance_percentage', label: 'Attendance %',
      render: v => (
        <span className={`font-bold ${v < 60 ? 'text-red-400' : 'text-amber-400'}`}>{v}%</span>
      )
    },
    { key: 'total_days',  label: 'Total Days' },
    { key: 'present',     label: 'Present' },
    { key: 'shortfall',   label: 'Shortfall',
      render: v => <Badge label={`-${v}%`} variant="danger" />
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex gap-3 items-end">
          <Input label="Month" type="month" value={month}
                 onChange={e => setMonth(e.target.value)} className="w-44" />
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Threshold %
            </label>
            <input type="number" min="50" max="100" value={threshold}
                   onChange={e => setThreshold(e.target.value)}
                   className="w-full bg-slate-800 border border-border rounded-lg px-3 py-2.5
                              text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <Button onClick={load} loading={loading}>Find Defaulters</Button>
          {data && (
            <Button variant="ghost"
                    onClick={() => exportExcel({ start: `${month}-01`, end: format(endOfMonth(new Date(month)), 'yyyy-MM-dd') })}>
              📊 Export
            </Button>
          )}
        </div>
      </Card>

      {data && (
        <div className="space-y-4 animate-fade-in">
          {data.defaulter_count > 0 && (
            <Alert type="warning"
                   message={`${data.defaulter_count} student(s) have attendance below ${data.threshold}% for ${month}`} />
          )}
          <Table columns={columns} data={data.defaulters || []}
                 emptyMessage="No defaulters found — great attendance!" />
        </div>
      )}
    </div>
  );
}

// ─── Records Tab ──────────────────────────────────────────────────────────────
function RecordsTab() {
  const [start,   setStart]   = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [end,     setEnd]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { exportExcel, exportPDF } = useDownload();

  const load = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.range({ start, end });
      setRecords(res.data);
    } catch { toast.error('Failed to load records.'); }
    finally   { setLoading(false); }
  };

  const columns = [
    { key: 'date',      label: 'Date' },
    { key: 'user_info', label: 'User',
      render: v => <span>{v?.user_id} — {v?.name}</span> },
    { key: 'status', label: 'Status',
      render: v => {
        const map = { present: 'success', late: 'warning', absent: 'danger', excused: 'info' };
        return <Badge label={v} variant={map[v] || 'default'} />;
      }
    },
    { key: 'method', label: 'Method',
      render: v => <Badge label={v} variant="default" />
    },
    { key: 'confidence_score', label: 'Confidence',
      render: v => v ? `${(v * 100).toFixed(1)}%` : '—'
    },
    { key: 'is_edited', label: 'Edited',
      render: v => v ? <Badge label="Edited" variant="warning" /> : '—'
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-3 items-end flex-wrap">
          <Input label="Start Date" type="date" value={start}
                 onChange={e => setStart(e.target.value)} className="w-44" />
          <Input label="End Date" type="date" value={end}
                 onChange={e => setEnd(e.target.value)} className="w-44" />
          <Button onClick={load} loading={loading}>Load Records</Button>
          <Button variant="ghost" onClick={() => exportExcel({ start, end })}>📊 Excel</Button>
          <Button variant="ghost" onClick={() => exportPDF({ start, end })}>📄 PDF</Button>
        </div>
      </Card>

      {records.length > 0 && (
        <p className="text-slate-400 text-sm">{records.length} records found</p>
      )}

      <Table columns={columns} data={records} loading={loading}
             emptyMessage="No records found for this date range" />
    </div>
  );
}
