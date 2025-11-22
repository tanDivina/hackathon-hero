import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Lock } from 'lucide-react';
import { databaseService, Project } from '../services/database';

interface ProjectSelectorProps {
  currentProject: Project | null;
  onProjectChange: (project: Project) => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  currentProject,
  onProjectChange,
  isPro = false,
  onUpgradeClick,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const loadedProjects = await databaseService.getProjects();
    setProjects(loadedProjects);

    if (!currentProject && loadedProjects.length > 0) {
      onProjectChange(loadedProjects[0]);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    // Check if user has reached the free limit (1 project)
    if (!isPro && projects.length >= 1) {
      setIsOpen(false);
      onUpgradeClick?.();
      return;
    }

    const project = await databaseService.createProject(newProjectName);
    if (project) {
      setProjects([project, ...projects]);
      onProjectChange(project);
      setNewProjectName('');
      setShowNewProject(false);
      setIsOpen(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const success = await databaseService.deleteProject(id);
    if (success) {
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);

      if (currentProject?.id === id && updatedProjects.length > 0) {
        onProjectChange(updatedProjects[0]);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-colors text-sm"
      >
        <FolderOpen size={16} strokeWidth={1.5} />
        <span className="font-mono">
          {currentProject?.name || 'No Project'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-[#0a0a0a] border border-gray-800 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-800">
              {showNewProject ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    placeholder="Project name..."
                    className="w-full bg-black border border-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-gray-700 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateProject}
                      className="flex-1 bg-accent-yellow text-black py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-accent-green transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewProject(false);
                        setNewProjectName('');
                      }}
                      className="flex-1 border border-gray-800 text-gray-400 py-1.5 text-xs font-bold uppercase tracking-wider hover:text-white hover:border-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
                  >
                    <Plus size={16} strokeWidth={1.5} />
                    <span className="text-xs font-mono uppercase tracking-wider">
                      New Project
                    </span>
                  </button>
                  {!isPro && projects.length >= 1 && (
                    <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                      <Lock size={10} className="text-accent-yellow" />
                      <span>Multiple projects require Pro</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-800">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-xs font-mono">
                  No projects yet
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      onProjectChange(project);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-4 hover:bg-black/50 cursor-pointer transition-colors ${
                      currentProject?.id === project.id ? 'bg-black/50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-600 font-mono mt-1">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="ml-2 p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
