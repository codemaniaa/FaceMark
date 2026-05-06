/**
 * FaceMark - Shared UI Components
 * Reusable building blocks for the interface
 */
import React from 'react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg
      className={`animate-spin text-primary-500 ${sizes[size]} ${className}`}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, variant = 'default' }) {
  const variants = {
    default:  'bg-slate-700 text-slate-300',
    success:  'bg-emerald-900/60 text-emerald-400 border border-emerald-700/50',
    warning:  'bg-amber-900/60  text-amber-400  border border-amber-700/50',
    danger:   'bg-red-900/60    text-red-400    border border-red-700/50',
    info:     'bg-blue-900/60   text-blue-400   border border-blue-700/50',
    purple:   'bg-purple-900/60 text-purple-400 border border-purple-700/50',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${variants[variant]}`}>
      {label}
    </span>
  );
}

// Status badge helper
export function StatusBadge({ status }) {
  const map = {
    present:  { label: 'Present', variant: 'success' },
    late:     { label: 'Late',    variant: 'warning' },
    absent:   { label: 'Absent',  variant: 'danger'  },
    excused:  { label: 'Excused', variant: 'info'    },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge {...cfg} />;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, trend, color = 'primary' }) {
  const colors = {
    primary: 'from-primary-600/20 to-primary-900/10 border-primary-700/30',
    green:   'from-emerald-600/20 to-emerald-900/10 border-emerald-700/30',
    amber:   'from-amber-600/20   to-amber-900/10   border-amber-700/30',
    red:     'from-red-600/20     to-red-900/10     border-red-700/30',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-display font-bold text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        {icon && (
          <div className="text-3xl opacity-60">{icon}</div>
        )}
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', loading = false,
                         className = '', disabled, ...props }) {
  const variants = {
    primary:   'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/40',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    danger:    'bg-red-700 hover:bg-red-600 text-white',
    ghost:     'bg-transparent hover:bg-slate-800 text-slate-300 border border-border',
    success:   'bg-emerald-700 hover:bg-emerald-600 text-white',
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                  font-medium text-sm transition-all duration-200 disabled:opacity-50
                  disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      )}
      <input
        className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-white text-sm
                    placeholder-slate-500 outline-none transition-all
                    focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${error ? 'border-red-500' : 'border-border'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      )}
      <select
        className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-white text-sm
                    outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${error ? 'border-red-500' : 'border-border'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ columns, data, emptyMessage = 'No records found', loading = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80 border-b border-border">
            {columns.map((col) => (
              <th key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="py-12 text-center text-slate-500">
              <Spinner size="lg" className="mx-auto" />
            </td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length}
                    className="py-12 text-center text-slate-500">{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}
                  className="border-b border-border/50 hover:bg-slate-800/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-300">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-card border border-border rounded-2xl w-full ${width} animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold font-display text-white">{title}</h2>
          <button onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', message }) {
  const styles = {
    info:    'bg-blue-900/30  border-blue-700/50  text-blue-300',
    success: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300',
    warning: 'bg-amber-900/30 border-amber-700/50 text-amber-300',
    error:   'bg-red-900/30   border-red-700/50   text-red-300',
  };
  const icons = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${styles[type]}`}>
      <span className="font-bold mt-0.5">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm">{description}</p>}
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl">👁</span>
        </div>
        <p className="text-slate-400 font-medium">Loading FaceMark…</p>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'primary', label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary: 'bg-primary-500',
    green:   'bg-emerald-500',
    amber:   'bg-amber-500',
    red:     'bg-red-500',
  };
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
