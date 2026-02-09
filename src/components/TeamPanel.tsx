import React, { useState, useEffect } from 'react';
import { Users, Link as LinkIcon, Copy, Check, Crown, User, Loader2 } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';
import { supabase } from '../lib/supabase';

interface TeamPanelProps {
  projectId?: string;
  projectName?: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ projectId, projectName }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };

    const loadMembers = async () => {
      if (!projectId) return;
      setIsLoading(true);
      const projectMembers = await databaseService.getProjectMembers(projectId);
      setMembers(projectMembers);
      setIsLoading(false);
    };

    checkAuth();
    if (projectId) {
      loadMembers();
    }
  }, [projectId]);

  const createInviteLink = async () => {
    if (!projectId) return;
    setIsCreatingLink(true);
    const token = await databaseService.createInviteLink(projectId);
    if (token) {
      const link = `${window.location.origin}?invite=${token}`;
      setInviteLink(link);
    }
    setIsCreatingLink(false);
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentUserId) {
    return (
      <CyberCard title="TEAM COLLABORATION" icon={<Users size={20} />}>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sign in to collaborate with teammates</p>
        </div>
      </CyberCard>
    );
  }

  return (
    <CyberCard title="TEAM COLLABORATION" icon={<Users size={20} />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
          <button
            onClick={createInviteLink}
            disabled={isCreatingLink}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent-yellow/10 text-accent-yellow rounded hover:bg-accent-yellow/20 transition-colors disabled:opacity-50"
          >
            {isCreatingLink ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LinkIcon size={14} />
            )}
            CREATE INVITE LINK
          </button>
        </div>

        {inviteLink && (
          <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-transparent text-xs text-gray-300 focus:outline-none truncate"
              />
              <button
                onClick={copyToClipboard}
                className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
              >
                {copied ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Share this link with teammates. Expires in 7 days.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded bg-gray-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  {member.role === 'owner' ? (
                    <Crown size={16} className="text-accent-yellow" />
                  ) : (
                    <User size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{member.email}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No team members yet</p>
            <p className="text-gray-600 text-xs mt-1">Create an invite link to add teammates</p>
          </div>
        )}

        {projectName && (
          <p className="text-xs text-gray-600 text-center">
            Project: {projectName}
          </p>
        )}
      </div>
    </CyberCard>
  );
};
