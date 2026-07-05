import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Brain, Target, Video, FileText, Trophy,
  ChevronRight, Lock, Star, Check, ArrowDown,
  Users, Clock, Layers, BarChart3
} from 'lucide-react';
import { StripeCheckout } from './StripeCheckout';
import { Footer } from './Footer';

interface LandingPageProps {
  onEnterDashboard: () => void;
  isPro: boolean;
}

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Idea Generator',
    desc: 'Instantly generate winning project ideas aligned to sponsors and judging criteria.',
  },
  {
    icon: Target,
    title: 'Rules Intelligence',
    desc: 'Paste any hackathon page. Our AI extracts deadlines, sponsors, and judging criteria in seconds.',
  },
  {
    icon: FileText,
    title: 'Pitch Script Builder',
    desc: 'Three battle-tested formats: investor pitch, live demo, and a 20-second intro.',
  },
  {
    icon: Video,
    title: 'Video Creator',
    desc: 'Record your demo video with teleprompter, logo overlay, and auto-captions.',
  },
  {
    icon: BarChart3,
    title: 'Judging Scorecard',
    desc: 'See exactly how your idea scores against every judging criterion before you submit.',
  },
  {
    icon: Layers,
    title: 'Multi-Project',
    desc: 'Manage multiple hackathons simultaneously. Switch contexts without losing work.',
  },
];

const SOCIAL_PROOF = [
  { stat: '2,000+', label: 'Hackers using it' },
  { stat: '94%', label: 'Submit on time' },
  { stat: '3x', label: 'More sponsor prizes won' },
];

type Tier = 'lifetime' | 'season';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard, isPro }) => {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<Tier>('lifetime');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled ? 'bg-black/90 border-gray-900' : 'bg-transparent border-transparent'
      }`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'h-14' : 'h-20'
        }`}>
          <span className={`font-black tracking-tight transition-all duration-300 ${
            scrolled ? 'text-lg' : 'text-4xl sm:text-5xl'
          }`}>
            HACKATHON<span className="text-accent-yellow">HERO</span>
          </span>
          <div className="flex items-center gap-3">
            {isPro ? (
              <button
                onClick={onEnterDashboard}
                className="px-5 py-2 bg-accent-yellow text-black text-sm font-bold tracking-wide hover:bg-yellow-300 transition-colors"
              >
                OPEN DASHBOARD
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Login
                </button>
                <button
                  onClick={scrollToPricing}
                  className="px-5 py-2 bg-accent-yellow text-black text-sm font-bold tracking-wide hover:bg-yellow-300 transition-colors"
                >
                  GET ACCESS
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-40 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,255,0,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 border border-gray-800 px-4 py-2 text-xs font-mono text-accent-yellow tracking-widest mb-8">
            <Star size={12} className="fill-accent-yellow" />
            BUILT FOR COMPETITIVE HACKERS
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            WIN MORE<br />
            <span className="text-accent-yellow">HACKATHONS.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Your AI command center for every stage of a hackathon — from rules analysis to
            idea generation, pitch scripts, and demo videos. Stop winging it. Start winning.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isPro ? (
              <button
                onClick={onEnterDashboard}
                className="px-8 py-4 bg-accent-yellow text-black font-bold text-base tracking-wide hover:bg-yellow-300 transition-colors flex items-center gap-2"
              >
                OPEN YOUR DASHBOARD <ChevronRight size={18} />
              </button>
            ) : (
              <>
                <button
                  onClick={scrollToPricing}
                  className="px-8 py-4 bg-accent-yellow text-black font-bold text-base tracking-wide hover:bg-yellow-300 transition-colors flex items-center gap-2"
                >
                  GET INSTANT ACCESS <ChevronRight size={18} />
                </button>
                <button
                  onClick={scrollToPricing}
                  className="px-8 py-4 border border-gray-700 text-gray-300 font-medium text-base hover:border-gray-500 hover:text-white transition-colors"
                >
                  See pricing
                </button>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 border-t border-gray-900 pt-10">
            {SOCIAL_PROOF.map(({ stat, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black text-accent-yellow">{stat}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-16 opacity-30 animate-bounce">
          <ArrowDown size={20} className="text-gray-500" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 sm:px-6 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-accent-yellow tracking-widest mb-3">EVERYTHING YOU NEED</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Your full hackathon stack,<br />in one tool.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-900">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-black p-8 hover:bg-gray-950 transition-colors group"
              >
                <div className="w-10 h-10 border border-gray-800 flex items-center justify-center mb-5 group-hover:border-accent-yellow/50 transition-colors">
                  <Icon size={18} className="text-accent-yellow" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview (locked) ── */}
      {!isPro && (
        <section className="py-20 px-4 sm:px-6 border-t border-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-mono text-accent-yellow tracking-widest mb-3">THE DASHBOARD</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Your command center awaits.
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Everything from rules parsing to pitch generation in a single focused workspace.
                Unlock it instantly below.
              </p>
            </div>

            {/* Blurred dashboard mockup */}
            <div className="relative rounded-none overflow-hidden border border-gray-800">
              <div className="grid grid-cols-2 gap-px bg-gray-900 p-px">
                {[
                  'Rules Parser', 'AI Chat', 'Idea Generator', 'Prompt Optimizer',
                  'Pitch Script', 'Video Creator', 'Scorecard', 'Devpost Draft'
                ].map((label) => (
                  <div key={label} className="bg-[#0a0a0a] p-6 sm:p-8">
                    <div className="h-2 w-16 bg-gray-800 rounded mb-3" />
                    <div className="h-2 w-32 bg-gray-800 rounded mb-2" />
                    <div className="h-2 w-24 bg-gray-800 rounded" />
                    <p className="text-xs text-gray-700 mt-4 font-mono">{label}</p>
                  </div>
                ))}
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-6">
                <div className="border border-gray-700 w-16 h-16 flex items-center justify-center">
                  <Lock size={28} className="text-accent-yellow" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="font-black text-xl tracking-tight mb-2">DASHBOARD LOCKED</p>
                  <p className="text-gray-400 text-sm">Get access below to unlock the full tool.</p>
                </div>
                <button
                  onClick={scrollToPricing}
                  className="px-8 py-3 bg-accent-yellow text-black font-bold text-sm tracking-wide hover:bg-yellow-300 transition-colors flex items-center gap-2"
                >
                  UNLOCK NOW <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Open dashboard CTA for pro users */}
      {isPro && (
        <section className="py-20 px-4 sm:px-6 border-t border-gray-900">
          <div className="max-w-2xl mx-auto text-center">
            <Trophy className="mx-auto text-accent-yellow mb-4" size={40} strokeWidth={1.5} />
            <h2 className="text-3xl font-black tracking-tight mb-4">You have Pro access.</h2>
            <p className="text-gray-400 mb-8">Your full command center is ready.</p>
            <button
              onClick={onEnterDashboard}
              className="px-10 py-4 bg-accent-yellow text-black font-bold text-base tracking-wide hover:bg-yellow-300 transition-colors flex items-center gap-2 mx-auto"
            >
              OPEN DASHBOARD <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* ── Pricing ── */}
      {!isPro && (
        <section id="pricing" className="py-24 px-4 sm:px-6 border-t border-gray-900">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-mono text-accent-yellow tracking-widest mb-3">PRICING</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                One payment. Full access.
              </h2>
              <p className="text-gray-400">No subscriptions. No hidden fees. Pay once, win forever.</p>
            </div>

            {/* Tier selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => { setSelectedTier('lifetime'); setShowCheckout(false); setPaymentError(null); }}
                className={`text-left p-6 border-2 transition-all relative ${
                  selectedTier === 'lifetime'
                    ? 'border-accent-yellow bg-accent-yellow/5'
                    : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-700'
                }`}
              >
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-bold px-2 py-0.5 ${
                    selectedTier === 'lifetime' ? 'bg-accent-yellow text-black' : 'bg-gray-800 text-gray-500'
                  }`}>
                    BEST VALUE
                  </span>
                </div>
                <p className="text-gray-500 text-sm line-through mb-1">$99</p>
                <p className="text-4xl font-black text-white mb-1">
                  $39 <span className="text-base text-gray-500 font-normal">one-time</span>
                </p>
                <p className="text-sm text-gray-400 font-bold mt-2">Lifetime Pass</p>
                <p className="text-xs text-gray-600 mt-1">Pay once, use forever.</p>
                <ul className="mt-4 space-y-2">
                  {['All current features', 'All future updates', 'Unlimited projects', 'Priority support'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check size={14} className="text-accent-yellow flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>

              <button
                onClick={() => { setSelectedTier('season'); setShowCheckout(false); setPaymentError(null); }}
                className={`text-left p-6 border-2 transition-all ${
                  selectedTier === 'season'
                    ? 'border-accent-yellow bg-accent-yellow/5'
                    : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-700'
                }`}
              >
                <p className="text-4xl font-black text-white mb-1">
                  $9 <span className="text-base text-gray-500 font-normal">one-time</span>
                </p>
                <p className="text-sm text-gray-400 font-bold mt-2">Season Pass</p>
                <p className="text-xs text-gray-600 mt-1">Full access for 365 days from purchase.</p>
                <ul className="mt-4 space-y-2">
                  {['All current features', '365 days access', 'Unlimited projects', 'Email support'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check size={14} className="text-accent-yellow flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            </div>

            {/* Checkout */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-6">
              {paymentSuccess ? (
                <div className="text-center py-4">
                  <p className="text-accent-yellow font-black text-lg">PAYMENT SUCCESSFUL!</p>
                  <p className="text-gray-400 text-sm mt-2">Activating your access...</p>
                </div>
              ) : paymentError ? (
                <div className="space-y-4">
                  <p className="text-red-400 text-sm text-center">{paymentError}</p>
                  <button
                    onClick={() => { setPaymentError(null); setShowCheckout(false); }}
                    className="w-full border border-gray-700 text-gray-400 py-3 text-sm font-bold hover:text-white hover:border-gray-500 transition-colors"
                  >
                    TRY AGAIN
                  </button>
                </div>
              ) : showCheckout ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-white uppercase">
                      {selectedTier === 'lifetime' ? 'Lifetime Pass — $39' : 'Season Pass — $9'}
                    </p>
                    <button onClick={() => setShowCheckout(false)} className="text-xs text-gray-600 hover:text-gray-400">
                      change plan
                    </button>
                  </div>
                  <StripeCheckout
                    amount={selectedTier === 'lifetime' ? 3900 : 900}
                    tier={selectedTier}
                    onSuccess={handlePaymentSuccess}
                    onError={(err) => setPaymentError(err)}
                  />
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-accent-yellow text-black font-bold py-4 text-base tracking-wide hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap size={18} />
                    GET {selectedTier === 'lifetime' ? 'LIFETIME' : 'SEASON'} ACCESS — {selectedTier === 'lifetime' ? '$39' : '$9'}
                  </button>
                  <p className="text-xs text-gray-600 text-center mt-3">
                    Secure checkout via Stripe · Instant access after payment
                  </p>
                </div>
              )}
            </div>

            {/* FAQ bullets */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { icon: Clock, label: 'Instant Access', sub: 'Unlocked immediately after payment' },
                { icon: Users, label: 'Lifetime Updates', sub: 'Included with Lifetime Pass' },
                { icon: Trophy, label: 'Win Guarantee', sub: 'Better odds or your money back*' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={20} className="text-accent-yellow" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-gray-600">{sub}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-700 text-center mt-4">*Not a real guarantee. Just vibe.</p>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};
