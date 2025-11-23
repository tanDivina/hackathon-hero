import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-gray-500 hover:text-accent-yellow transition-colors"
      title="How to use this feature"
    >
      <HelpCircle size={18} />
    </button>
  );
};
