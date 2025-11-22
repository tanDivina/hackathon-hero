import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  suggested_completion: number;
}

interface HackathonTimerProps {
  deadline?: string;
  projectId?: string;
}

export const HackathonTimer: React.FC<HackathonTimerProps> = ({ deadline, projectId }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', title: 'Project ideation and planning', completed: false, suggested_completion: 15 },
    { id: '2', title: 'Core features implementation', completed: false, suggested_completion: 50 },
    { id: '3', title: 'Testing and bug fixes', completed: false, suggested_completion: 70 },
    { id: '4', title: 'Demo video and pitch script', completed: false, suggested_completion: 85 },
    { id: '5', title: 'Final polishing and submission', completed: false, suggested_completion: 95 },
  ]);

  useEffect(() => {
    if (!deadline) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineDate = new Date(deadline).getTime();
      const distance = deadlineDate - now;

      if (distance < 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: distance });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  useEffect(() => {
    if (projectId) {
      loadMilestones();
    }
  }, [projectId]);

  const loadMilestones = async () => {
    if (!projectId) return;
    const saved = await databaseService.getTimeline(projectId);
    if (saved && saved.milestones) {
      setMilestones(saved.milestones);
    }
  };

  const handleToggleMilestone = async (id: string) => {
    const updated = milestones.map(m =>
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    setMilestones(updated);

    if (projectId) {
      await databaseService.saveTimeline(projectId, updated);
    }
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progressPercentage = (completedCount / milestones.length) * 100;

  const getUrgencyStatus = () => {
    if (!timeRemaining) return 'none';
    const hoursRemaining = timeRemaining.total / (1000 * 60 * 60);

    if (hoursRemaining < 6) return 'critical';
    if (hoursRemaining < 24) return 'urgent';
    if (hoursRemaining < 72) return 'attention';
    return 'good';
  };

  const getUrgencyColor = () => {
    const status = getUrgencyStatus();
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'urgent': return 'text-orange-500';
      case 'attention': return 'text-yellow-500';
      default: return 'text-accent-green';
    }
  };

  const getUrgencyMessage = () => {
    const status = getUrgencyStatus();
    switch (status) {
      case 'critical': return 'CRITICAL: Submission deadline approaching!';
      case 'urgent': return 'URGENT: Less than 24 hours remaining';
      case 'attention': return 'Focus on completing your submission';
      default: return 'On track - keep building!';
    }
  };

  return (
    <CyberCard
      icon={<Clock size={32} strokeWidth={1.5} />}
      title="Deadline Tracker"
      description="Stay on schedule and complete your hackathon submission on time."
      badge={deadline ? 'ACTIVE' : undefined}
    >
      <div className="space-y-4">
        {!deadline ? (
          <div className="border border-gray-800 bg-black/50 p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">No deadline set</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Parse hackathon rules to automatically extract the submission deadline.
            </p>
          </div>
        ) : (
          <>
            {timeRemaining && timeRemaining.total > 0 ? (
              <>
                <div className="border border-gray-800 bg-black/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className={getUrgencyColor()} />
                    <p className={`text-xs font-mono uppercase tracking-wider ${getUrgencyColor()}`}>
                      {getUrgencyMessage()}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white font-mono">
                        {String(timeRemaining.days).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">DAYS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white font-mono">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">HOURS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white font-mono">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">MINS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white font-mono">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">SECS</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-600 text-center">
                      Deadline: {new Date(deadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border border-gray-800 bg-black/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                      Progress Milestones
                    </p>
                    <span className="text-xs text-gray-600">
                      {completedCount}/{milestones.length}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="h-2 bg-gray-900 border border-gray-800">
                      <div
                        className="h-full bg-accent-yellow transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        onClick={() => handleToggleMilestone(milestone.id)}
                        className="flex items-center gap-3 p-2 hover:bg-black/50 transition-colors cursor-pointer group"
                      >
                        {milestone.completed ? (
                          <CheckCircle size={16} className="text-accent-green flex-shrink-0" />
                        ) : (
                          <Circle size={16} className="text-gray-700 group-hover:text-gray-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`text-xs ${milestone.completed ? 'text-gray-600 line-through' : 'text-gray-400'}`}>
                            {milestone.title}
                          </p>
                        </div>
                        <span className="text-xs text-gray-700 font-mono">
                          {milestone.suggested_completion}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/50 border border-gray-800 p-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong className="text-gray-500">Tip:</strong> Check off milestones as you complete them to track your progress. The suggested percentages show ideal timeline allocation for a successful submission.
                  </p>
                </div>
              </>
            ) : (
              <div className="border border-red-900/30 bg-red-950/20 p-6 text-center">
                <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-400 mb-2">Deadline Passed</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  The submission deadline for this hackathon has expired.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </CyberCard>
  );
};
