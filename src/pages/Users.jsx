/**
 * FaceMark - Users Management Page (Admin only)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { usersAPI, faceAPI } from '../api';
import {
  Button, Input, Select, Card, Table, Modal,
  Badge, Alert, Spinner, StatusBadge
} from '../components/UI';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [showImport, setShowImport] = useState(false);

  const PAGE_SIZE = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list({
        search: search || undefined,
        role:   roleFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setUsers(res.data.results || []);
      setTotal(res.data.count || 0);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (userId) => {
    if (!window.confirm(`Delete user ${userId}? This cannot be undone.`)) return;
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted.');
      loadUsers();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteFace = async (userId) => {
    if (!window.confirm(`Delete face data for ${userId}?`)) return;
    try {
      await faceAPI.delete(userId);
      toast.success('Face data removed.');
      loadUsers();
    } catch {
      toast.error('Failed to delete face data.');
    }
  };

  const columns = [
    { key: 'user_id', label: 'ID',
      render: v => <span className="font-mono text-xs text-primary-300">{v}</span> },
    { key: 'full_name', label: 'Name' },
    { key: 'email',     label: 'Email',
      render: v => <span className="text-slate-400 text-xs">{v}</span> },
    { key: 'role', label: 'Role',
      render: v => {
        const map = { admin: 'purple', teacher: 'info', student: 'default' };
        return <Badge label={v} variant={map[v]} />;
      }
    },
    { key: 'is_face_registered', label: 'Face',
      render: v => <Badge label={v ? '✓ Registered' : 'Not registered'} variant={v ? 'success' : 'danger'} />
    },
    { key: 'is_active', label: 'Status',
      render: v => <Badge label={v ? 'Active' : 'Inactive'} variant={v ? 'success' : 'warning'} />
    },
    { key: 'actions', label: 'Actions',
      render: (uid, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" className="py-1 px-2 text-xs"
                  onClick={() => { setEditUser(row); setShowEdit(true); }}>
            Edit
          </Button>
          {row.is_face_registered && (
            <Button variant="ghost" className="py-1 px-2 text-xs text-amber-400"
                    onClick={() => handleDeleteFace(uid)}>
              Del Face
            </Button>
          )}
          <Button variant="ghost" className="py-1 px-2 text-xs text-red-400"
                  onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-1">{total} total users</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowImport(true)}>📥 Import CSV</Button>
          <Button onClick={() => setShowCreate(true)}>+ Add User</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by ID, name, or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1"
        />
        <Select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="w-40">
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </Select>
        <Button variant="ghost" onClick={loadUsers}>↻ Refresh</Button>
      </div>

      <Table columns={columns} data={users} loading={loading}
             emptyMessage="No users found" />
 
      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <Button variant="ghost" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadUsers(); }} />

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal open={showEdit} user={editUser}
                       onClose={() => setShowEdit(false)}
                       onSuccess={() => { setShowEdit(false); loadUsers(); }} />
      )}

      {/* Import CSV Modal */}
      <ImportCSVModal open={showImport} onClose={() => setShowImport(false)}
                      onSuccess={() => { setShowImport(false); loadUsers(); }} />
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ open, onClose, onSuccess }) {
  const [form, setForm]   = useState({ user_id: '', email: '', first_name: '', last_name: '', role: 'student', password: '', password_confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setErrors({});
    setLoading(true);
    try {
      await usersAPI.create(form);
      toast.success('User created!');
      onSuccess();
    } catch (err) {
      setErrors(err.response?.data || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New User">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="User ID" value={form.user_id} onChange={e => set('user_id', e.target.value)} error={errors.user_id?.[0]} placeholder="STU001" />
          <Select label="Role" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={form.first_name} onChange={e => set('first_name', e.target.value)} error={errors.first_name?.[0]} />
          <Input label="Last Name" value={form.last_name} onChange={e => set('last_name', e.target.value)} error={errors.last_name?.[0]} />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email?.[0]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} error={errors.password?.[0]} />
          <Input label="Confirm" type="password" value={form.password_confirm} onChange={e => set('password_confirm', e.target.value)} />
        </div>
        <Button onClick={handleSubmit} loading={loading} className="w-full">Create User</Button>
      </div>
    </Modal>
  );
}

// ─── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ open, user, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ first_name: user.first_name, last_name: user.last_name, is_active: user.is_active });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await usersAPI.update(user.id, form);
      toast.success('User updated!');
      onSuccess();
    } catch { toast.error('Update failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${user.user_id}`}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} />
          <Input label="Last Name"  value={form.last_name}  onChange={e => setForm(f => ({...f, last_name:  e.target.value}))} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
          <span className="text-sm text-slate-300">Active account</span>
        </label>
        <Button onClick={handleSubmit} loading={loading} className="w-full">Save Changes</Button>
      </div>
    </Modal>
  );
}

// ─── Import CSV Modal ─────────────────────────────────────────────────────────
function ImportCSVModal({ open, onClose, onSuccess }) {
  const [file,    setFile]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!file) { toast.error('Select a CSV file.'); return; }
    const form = new FormData();
    form.append('csv_file', file);
    setLoading(true);
    try {
      const res = await usersAPI.bulkImport(form);
      setResult(res.data);
      if (res.data.created_count > 0) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk Import Users (CSV)">
      <div className="space-y-4">
        <Alert type="info" message="CSV columns: user_id, email, first_name, last_name, role, password, department (opt), class_name (opt)" />
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0])}
               className="text-sm text-slate-300" />
        <Button onClick={handleImport} loading={loading} className="w-full">Import</Button>
        {result && (
          <div className="text-sm space-y-1">
            <p className="text-emerald-400">✓ Created: {result.created_count}</p>
            <p className="text-red-400">✗ Errors: {result.error_count}</p>
            {result.errors?.slice(0,3).map((e, i) => (
              <p key={i} className="text-slate-500 text-xs">Row {e.row}: {e.error}</p>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
