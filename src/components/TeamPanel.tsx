import React, { useState, useEffect } from 'react';
import { Users, Link as LinkIcon, Copy, Check, Crown, User, Loader2, UserX } from 'lucide-react';
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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      if (user && projectId) {
        await databaseService.ensureOwnerMember(projectId);
        loadMembers(user.id);
      }
    };
    init();
  }, [projectId]);

  const loadMembers = async (userId?: string) => {
    if (!projectId) return;
    setIsLoading(true);
    const projectMembers = await databaseService.getProjectMembers(projectId);
    setMembers(projectMembers);
    const uid = userId || currentUserId;
    if (uid) {
      const me = projectMembers.find(m => m.id === uid);
      setIsOwner(me?.role === 'owner');
    }
    setIsLoading(false);
  };

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

  const removeMember = async (memberId: string) => {
    if (!projectId) return;
    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  if (!currentUserId) {
    return (
      <CyberCard title="TEAM COLLABORATION" icon={<Users size={20} />}>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sign in to collaborate with teammates</p>
          <p className="text-gray-600 text-xs mt-1">Share your project and work together in real time</p>
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
          {isOwner && (
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
          )}
        </div>

        {inviteLink && (
          <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
            <p className="text-[10px] text-accent-yellow uppercase tracking-wider mb-2 font-mono">Invite Link (7 days)</p>
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
              Teammates who open this link will be added to your project.
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
                className="flex items-center gap-3 p-2 rounded bg-gray-800/50 group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {member.role === 'owner' ? (
                    <Crown size={16} className="text-accent-yellow" />
                  ) : (
                    <User size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{member.email}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{member.role}</p>
                </div>
                {isOwner && member.role !== 'owner' && member.id !== currentUserId && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                    title="Remove member"
                  >
                    <UserX size={14} />
                  </button>
                )}
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
          <p className="text-xs text-gray-600 text-center border-t border-gray-800 pt-3">
            {projectName}
          </p>
        )}
      </div>
    </CyberCard>
  );
};
