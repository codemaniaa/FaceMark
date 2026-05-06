/**
 * FaceMark - Settings Page
 */
import React, { useState } from 'react';
import { authAPI } from '../api';
import { Card, Input, Button, Alert } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('password');

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-3xl font-display font-bold text-white">Settings</h1>

      <div className="flex gap-1 border-b border-border">
        {['password', 'profile'].map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize
                    ${tab === t ? 'border-primary-500 text-primary-300' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'password' && <ChangePasswordTab />}
      {tab === 'profile'  && <ProfileTab user={user} />}
    </div>
  );
}

function ChangePasswordTab() {
  const [form,    setForm]    = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [errors,  setErrors]  = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setErrors({});
    setSuccess(false);
    setLoading(true);
    try {
      await authAPI.changePassword(form);
      setSuccess(true);
      setForm({ old_password: '', new_password: '', new_password_confirm: '' });
      toast.success('Password changed.');
    } catch (err) {
      setErrors(err.response?.data || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-white mb-4">Change Password</h3>
      {success && <Alert type="success" message="Password updated successfully." />}
      <div className="mt-4 space-y-3">
        <Input label="Current Password" type="password" value={form.old_password}
               onChange={e => set('old_password', e.target.value)} error={errors.old_password} />
        <Input label="New Password" type="password" value={form.new_password}
               onChange={e => set('new_password', e.target.value)} error={errors.new_password?.[0]} />
        <Input label="Confirm New Password" type="password" value={form.new_password_confirm}
               onChange={e => set('new_password_confirm', e.target.value)}
               error={errors.new_password_confirm} />
        <Button onClick={handleSubmit} loading={loading}>Update Password</Button>
      </div>
    </Card>
  );
}

function ProfileTab({ user }) {
  return (
    <Card>
      <h3 className="font-semibold text-white mb-4">Profile Information</h3>
      <dl className="space-y-3 text-sm">
        {[
          ['User ID',    user?.user_id],
          ['Name',       `${user?.first_name} ${user?.last_name}`],
          ['Email',      user?.email],
          ['Role',       user?.role],
          ['Member since', user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-border/50">
            <dt className="text-slate-400">{k}</dt>
            <dd className="text-white capitalize">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
