import React, { useState, useRef, useEffect } from 'react';
import { Crown, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ProDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    localStorage.removeItem('hackathon_session_id');
    window.location.href = '/';
  };

  const handleProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2.5 text-sm font-bold tracking-wide transition-all rounded bg-accent-yellow text-black hover:bg-yellow-300 flex items-center gap-2"
      >
        <Crown size={16} />
        PRO ACTIVE
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 shadow-xl z-50">
          <button
            onClick={handleProfile}
            className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3 font-mono"
          >
            <User size={16} />
            PROFILE
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3 font-mono border-t border-gray-800"
          >
            <LogOut size={16} />
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
