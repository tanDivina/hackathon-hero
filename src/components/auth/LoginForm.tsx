import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

type View = 'login' | 'forgot' | 'sent';

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        onSuccess?.();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setView('sent');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── SENT CONFIRMATION ──────────────────────────────────────────────────────
  if (view === 'sent') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gray-900 border border-accent-yellow p-8 text-center">
          <CheckCircle2 className="text-accent-yellow mx-auto mb-4" size={40} strokeWidth={1.5} />
          <div className="text-accent-yellow font-mono text-xs mb-2">// PASSWORD RECOVERY</div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-3">CHECK YOUR EMAIL</h2>
          <p className="text-sm text-gray-400 font-mono leading-relaxed mb-6">
            We sent a password reset link to<br />
            <span className="text-accent-yellow">{resetEmail}</span>.<br /><br />
            Click the link in the email to set a new password.
          </p>
          <button
            onClick={() => { setView('login'); setResetEmail(''); setError(null); }}
            className="text-xs font-mono text-gray-500 hover:text-accent-yellow transition-colors flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft size={12} />
            BACK TO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  // ── FORGOT PASSWORD ────────────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gray-900 border border-accent-yellow p-8">
          <div className="mb-8">
            <div className="text-accent-yellow font-mono text-xs mb-2">// PASSWORD RECOVERY</div>
            <h2 className="text-2xl font-black tracking-tight text-white">RESET PASSWORD</h2>
            <p className="text-sm text-gray-500 font-mono mt-2 leading-relaxed">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500">
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetRequest} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-mono text-accent-yellow mb-2 tracking-wider">
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-yellow text-black py-3 px-4 font-bold tracking-wide hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setView('login'); setError(null); }}
              className="text-xs font-mono text-gray-500 hover:text-accent-yellow transition-colors flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft size={12} />
              BACK TO SIGN IN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SIGN IN ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900 border border-accent-yellow p-8">
        <div className="mb-8">
          <div className="text-accent-yellow font-mono text-xs mb-2">// AUTHENTICATE</div>
          <h2 className="text-2xl font-black tracking-tight text-white">SIGN IN</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500">
            <p className="text-sm text-red-400 font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs font-mono text-accent-yellow mb-2 tracking-wider">
              EMAIL_ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="text-xs font-mono text-accent-yellow tracking-wider">
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() => { setView('forgot'); setResetEmail(email); setError(null); }}
                className="text-[10px] font-mono text-gray-500 hover:text-accent-yellow transition-colors tracking-wider"
              >
                FORGOT PASSWORD?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-accent-yellow transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-yellow text-black py-3 px-4 font-bold tracking-wide hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 font-mono">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-accent-yellow hover:text-gray-300 font-bold transition-colors"
            >
              SIGN UP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
