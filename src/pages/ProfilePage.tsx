import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Crown, User, Mail, Calendar, CreditCard, ArrowLeft, LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { CyberCard } from '../components/CyberCard';

interface SubscriptionData {
  price_id: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);

      const { data: subData } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (subData) {
        setSubscription(subData);
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('session_id', currentUser.id)
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (error) {
      setPasswordError('Failed to update password');
    }
  };

  const getPlanName = (priceId: string) => {
    if (priceId === 'price_1SW2yhEOOYpADD50jiAQgeeP') {
      return 'Lifetime Pass';
    }
    if (priceId === 'price_1SW1yzEOOYpADD50JGzWjIig') {
      return 'Season Pass';
    }
    return 'Premium Plan';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Profile</h1>
          <p className="text-gray-500">Manage your account and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CyberCard title="Account Information" icon={<User size={24} />}>
              <div className="space-y-4">
                <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
                  <Mail className="text-accent-yellow flex-shrink-0 mt-1" size={18} />
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Email Address</h3>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
                  <Calendar className="text-accent-yellow flex-shrink-0 mt-1" size={18} />
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Member Since</h3>
                    <p className="text-gray-400 text-sm">
                      {formatDate(user?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
                  <User className="text-accent-yellow flex-shrink-0 mt-1" size={18} />
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">User ID</h3>
                    <p className="text-gray-400 text-xs font-mono">{user?.id}</p>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 mt-4">
                  <div className="flex items-start gap-3 border-l-2 border-gray-800 pl-4 py-2">
                    <Lock className="text-accent-yellow flex-shrink-0 mt-1" size={18} />
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm mb-1">Password</h3>
                      <p className="text-gray-400 text-sm mb-3">••••••••</p>

                      {!isChangingPassword ? (
                        <button
                          onClick={() => setIsChangingPassword(true)}
                          className="text-accent-yellow text-xs font-bold hover:text-gray-300 transition-colors uppercase tracking-wide"
                        >
                          Change Password
                        </button>
                      ) : (
                        <div className="space-y-3 mt-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">New Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-black border border-gray-700 text-white px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-black border border-gray-700 text-white px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                              placeholder="Confirm new password"
                            />
                          </div>

                          {passwordError && (
                            <p className="text-red-400 text-xs">{passwordError}</p>
                          )}

                          {passwordSuccess && (
                            <p className="text-green-400 text-xs">{passwordSuccess}</p>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={handlePasswordChange}
                              className="bg-accent-yellow text-black px-4 py-2 text-xs font-bold hover:bg-gray-200 transition-colors uppercase tracking-wide"
                            >
                              Update Password
                            </button>
                            <button
                              onClick={() => {
                                setIsChangingPassword(false);
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordError('');
                              }}
                              className="border border-gray-700 text-gray-400 px-4 py-2 text-xs font-bold hover:border-gray-500 hover:text-white transition-colors uppercase tracking-wide"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CyberCard>

            <CyberCard title="Subscription Details" icon={<CreditCard size={24} />}>
              {subscription ? (
                <div className="space-y-4">
                  <div className="bg-black border border-accent-yellow p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Crown className="text-accent-yellow" size={24} />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {getPlanName(subscription.price_id)}
                        </h3>
                        <p className="text-sm text-accent-yellow uppercase tracking-wide">
                          {subscription.status}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Activated On</span>
                        <span className="text-white">{formatDate(subscription.created_at)}</span>
                      </div>
                      {subscription.expires_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expires On</span>
                          <span className="text-white">{formatDate(subscription.expires_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-900/30 border border-gray-800 p-4">
                    <h4 className="font-bold text-white mb-3 text-sm">Pro Features Active</h4>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-yellow rounded-full"></span>
                        Parse rules from URL
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-yellow rounded-full"></span>
                        AI Rules Chat
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-yellow rounded-full"></span>
                        GitHub Analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-yellow rounded-full"></span>
                        Pro Video Recording (3 min)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-yellow rounded-full"></span>
                        Multi-Project Support
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-yellow rounded-full"></span>
                        All Export Formats
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Crown className="text-gray-600 mx-auto mb-4" size={48} />
                  <p className="text-gray-500 mb-4">No active subscription</p>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="bg-accent-yellow text-black px-6 py-2 font-bold hover:bg-gray-200 transition-colors"
                  >
                    UPGRADE TO PRO
                  </button>
                </div>
              )}
            </CyberCard>
          </div>

          <div className="space-y-6">
            <CyberCard title="Quick Stats">
              <div className="space-y-4">
                <div className="text-center p-4 bg-black border border-gray-800">
                  <div className="text-3xl font-black text-accent-yellow mb-1">
                    {projects.length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Total Projects
                  </div>
                </div>

                <div className="text-center p-4 bg-black border border-gray-800">
                  <div className="text-3xl font-black text-accent-green mb-1">
                    {subscription ? '100%' : '0%'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Features Unlocked
                  </div>
                </div>
              </div>
            </CyberCard>

            <div className="bg-gray-900/30 border border-gray-800 p-6">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">
                Account Actions
              </h3>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 border border-red-900/30 text-red-400 py-3 hover:bg-red-950/20 transition-colors text-sm font-bold uppercase tracking-wide"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
