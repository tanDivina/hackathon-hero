import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { databaseService } from '../../services/database';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (error) {
        setError(error.message);
      } else {
        // Automatically enable beta access for new signups
        await databaseService.enableTestMode();
        onSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900 border border-accent-yellow p-8">
        <div className="mb-8">
          <div className="text-accent-yellow font-mono text-xs mb-2">// CREATE_ACCOUNT</div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            SIGN UP
          </h2>
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
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-mono text-accent-yellow mb-2 tracking-wider">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-accent-yellow transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-mono text-accent-yellow mb-2 tracking-wider">
              CONFIRM_PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 text-white font-mono text-sm focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-accent-yellow transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-yellow text-black py-3 px-4 font-bold tracking-wide hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 font-mono">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-accent-yellow hover:text-gray-300 font-bold transition-colors"
            >
              SIGN IN
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}