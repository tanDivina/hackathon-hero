import React, { useState } from 'react';
import { Youtube, Twitter, Linkedin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { databaseService } from '../services/database';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      const result = await databaseService.subscribeToNewsletter(email);

      if (result.success) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <footer className="bg-black border-t border-gray-800 mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          <div>
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">
              Stay Updated
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Get the latest updates about HackathonHero features, tips for winning hackathons, and exclusive beta access.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === 'loading' || status === 'success'}
                  className="flex-1 bg-black border border-gray-800 px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:border-accent-yellow focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="bg-accent-yellow text-black px-6 py-3 font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {status === 'loading' ? (
                    'SENDING...'
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle size={16} />
                      DONE
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      SUBSCRIBE
                    </>
                  )}
                </button>
              </div>

              {message && (
                <div className={`flex items-center gap-2 text-sm ${
                  status === 'success' ? 'text-accent-green' : 'text-red-400'
                }`}>
                  {status === 'success' ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  {message}
                </div>
              )}
            </form>
          </div>

          <div>
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">
              Connect With Me
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Follow along for dev content, hackathon tips, and behind-the-scenes of building HackathonHero.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="https://www.youtube.com/@DorienVibecodes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-gray-800 px-4 py-3 hover:border-accent-yellow hover:bg-accent-yellow/10 transition-colors group"
              >
                <Youtube size={20} className="text-gray-400 group-hover:text-accent-yellow transition-colors" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors font-mono">YouTube</span>
              </a>

              <a
                href="https://x.com/DorienVibecodes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-gray-800 px-4 py-3 hover:border-accent-yellow hover:bg-accent-yellow/10 transition-colors group"
              >
                <Twitter size={20} className="text-gray-400 group-hover:text-accent-yellow transition-colors" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors font-mono">Twitter</span>
              </a>

              <a
                href="https://www.linkedin.com/in/dorien-van-den-abbeele-136170b/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-gray-800 px-4 py-3 hover:border-accent-yellow hover:bg-accent-yellow/10 transition-colors group"
              >
                <Linkedin size={20} className="text-gray-400 group-hover:text-accent-yellow transition-colors" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors font-mono">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-600 text-xs font-mono">
            &copy; {new Date().getFullYear()} HackathonHero. Built with passion for hackers by hackers.
          </p>
        </div>
      </div>
    </footer>
  );
};
