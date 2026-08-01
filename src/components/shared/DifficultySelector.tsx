import { Sparkles, Zap, Flame } from 'lucide-react';
import type { Difficulty } from '../../types/database';

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  darkMode: boolean;
}

const difficulties: { value: Difficulty; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'easy', label: 'Facile', icon: <Sparkles size={20} />, color: 'from-green-400 to-green-600' },
  { value: 'medium', label: 'Moyen', icon: <Zap size={20} />, color: 'from-amber-400 to-amber-600' },
  { value: 'hard', label: 'Difficile', icon: <Flame size={20} />, color: 'from-red-400 to-red-600' },
];

export function DifficultySelector({ selected, onChange, darkMode }: DifficultySelectorProps) {
  return (
    <div className="flex gap-3 justify-center">
      {difficulties.map((diff) => (
        <button
          key={diff.value}
          onClick={() => onChange(diff.value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            selected === diff.value
              ? `bg-gradient-to-r ${diff.color} text-white shadow-lg scale-105`
              : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {diff.icon}
          {diff.label}
        </button>
      ))}
    </div>
  );
}
