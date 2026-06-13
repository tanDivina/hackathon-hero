import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

type View = 'loading' | 'form' | 'success' | 'invalid';

export function ResetPasswordPage() {
  const [view, setView] = useState<View>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('form');
      }
    });

    // If Supabase doesn't fire PASSWORD_RECOVERY within 5s, the link is invalid/expired.
    const timeout = setTimeout(() => {
      setView(v => v === 'loading' ? 'invalid' : v);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setView('success');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-accent-yellow font-mono text-sm animate-pulse tracking-wider">
          VERIFYING RESET LINK...
        </div>
      </div>
    );
  }

  if (view === 'invalid') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-red-800 p-8 max-w-md w-full text-center">
          <AlertTriangle className="text-red-400 mx-auto mb-4" size={40} strokeWidth={1.5} />
          <div className="text-red-400 font-mono text-xs mb-2">// ERROR</div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-3">INVALID RESET LINK</h2>
          <p className="text-sm text-gray-400 font-mono leading-relaxed mb-6">
            This reset link is invalid or has expired.<br />
            Please request a new password reset.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-accent-yellow text-black font-bold py-3 px-6 hover:bg-yellow-400 transition-colors tracking-wide uppercase text-sm"
          >
            BACK TO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-accent-yellow p-8 max-w-md w-full text-center">
          <CheckCircle2 className="text-accent-yellow mx-auto mb-4" size={40} strokeWidth={1.5} />
          <div className="text-accent-yellow font-mono text-xs mb-2">// SUCCESS</div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-3">PASSWORD UPDATED</h2>
          <p className="text-sm text-gray-400 font-mono leading-relaxed">
            Your password has been updated.<br />
            Redirecting you to the app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-accent-yellow p-8">
          <div className="mb-8">
            <div className="text-accent-yellow font-mono text-xs mb-2">// SET NEW PASSWORD</div>
            <h2 className="text-2xl font-black tracking-tight text-white">RESET PASSWORD</h2>
            <p className="text-sm text-gray-500 font-mono mt-2">
              Choose a strong password for your account.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500">
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-xs font-mono text-accent-yellow mb-2 tracking-wider">
                NEW_PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                  placeholder="Min. 8 characters"
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

            <div>
              <label htmlFor="confirm" className="block text-xs font-mono text-accent-yellow mb-2 tracking-wider">
                CONFIRM_PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-accent-yellow transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-yellow text-black py-3 px-4 font-bold tracking-wide hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase"
            >
              {loading ? 'UPDATING...' : 'SET NEW PASSWORD'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
