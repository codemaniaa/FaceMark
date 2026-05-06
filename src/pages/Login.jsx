/**
 * FaceMark - Login Page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Alert } from '../components/UI';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-100 flex">
  {/* Left panel — branding */}
  <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-900 via-teal-700 to-beige-200
                  items-center justify-center p-12 relative overflow-hidden">
    {/* Grid texture */}
    <div className="absolute inset-0 opacity-10"
         style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px' }} />
    {/* Glow */}
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />

    <div className="relative z-10 text-center">
      <div className="w-20 h-20 rounded-2xl bg-teal-500 flex items-center justify-center
                      text-4xl mx-auto mb-8 shadow-2xl shadow-teal-900">
        👁
      </div>
      <h1 className="font-display text-5xl font-bold text-beige-50 mb-4">FaceMark</h1>
      <p className="text-beige-300 text-lg max-w-xs mx-auto leading-relaxed">
        Intelligent face recognition attendance management for modern institutions.
      </p>
      <p className="text-beige-300 text-lg max-w-xs mx-auto leading-relaxed">
        Powered by React, Django, and TensorFlow.& DeepFace Library
      </p>
      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        {[
          { value: '99.8%', label: 'Accuracy' },
          { value: '<1s',   label: 'Recognition' },
          { value: '0',     label: 'Spoofing' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-2xl font-display font-bold text-teal-300">{s.value}</div>
            <div className="text-xs text-beige-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Right panel — form */}
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="w-full max-w-md animate-slide-up">
      <div className="lg:hidden text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center
                        text-2xl mx-auto mb-3">👁</div>
        <h1 className="font-display text-2xl font-bold text-beige-50">FaceMark</h1>
      </div>

      <h2 className="text-2xl font-display font-semibold text-teal-900 mb-1">Sign in</h2>
      <p className="text-beige-600 text-sm mb-8">Enter your credentials to access FaceMark</p>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="alihassan@gmail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Button type="submit" loading={loading} className="w-full py-3 mt-2 bg-teal-600 hover:bg-teal-700 text-beige-50">
          Sign in to FaceMark →
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-beige-700">
        FaceMark | Liveness Detection | Developed By Ali Hassan
      </p>
    </div>
  </div>
    </div>

  );
}
