import React, { useState } from 'react';
import { Download, FileJson, FileText, FileCode, Printer, Lock } from 'lucide-react';

export type ExportFormat = 'json' | 'markdown' | 'pdf' | 'text' | 'docx';

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ onExport, disabled = false, isPro = false, onUpgradeClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    { format: 'markdown' as ExportFormat, label: 'Markdown', icon: FileCode, description: 'Documentation format', free: true },
    { format: 'text' as ExportFormat, label: 'Text', icon: FileText, description: 'Plain text file', free: true },
    { format: 'pdf' as ExportFormat, label: 'PDF', icon: Printer, description: 'Print to PDF', free: false },
    { format: 'docx' as ExportFormat, label: 'DOCX', icon: FileText, description: 'Microsoft Word format', free: false },
  ];

  const handleExport = (format: ExportFormat, isFree: boolean) => {
    if (!isFree && !isPro) {
      setIsOpen(false);
      onUpgradeClick?.();
      return;
    }
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-colors text-sm ${
          disabled ? 'opacity-30 cursor-not-allowed' : ''
        }`}
      >
        <Download size={16} strokeWidth={1.5} />
        <span className="font-mono">EXPORT</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-gray-800 z-50">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isLocked = !option.free && !isPro;
              return (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format, option.free)}
                  className={`w-full flex items-start gap-3 p-4 hover:bg-black/50 transition-colors text-left border-b border-gray-800 last:border-b-0 ${isLocked ? 'opacity-60' : ''}`}
                >
                  <Icon size={18} strokeWidth={1.5} className="text-accent-yellow mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium">{option.label}</p>
                      {isLocked && <Lock size={12} className="text-accent-yellow" />}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
