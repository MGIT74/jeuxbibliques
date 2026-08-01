import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import type { Difficulty } from '../../types/database';
import { DifficultySelector } from './DifficultySelector';

interface GameWrapperProps {
  title: string;
  score: number;
  maxScore: number;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onBack: () => void;
  onRestart: () => void;
  darkMode: boolean;
  children: React.ReactNode;
  showDifficulty?: boolean;
}

export function GameWrapper({
  title,
  score,
  maxScore,
  difficulty,
  onDifficultyChange,
  onBack,
  onRestart,
  darkMode,
  children,
  showDifficulty = true,
}: GameWrapperProps) {
  return (
    <div className="min-h-screen">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-16 z-30`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition-colors`}
            >
              <ArrowLeft size={20} />
              Retour
            </button>

            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {title}
            </h2>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-amber-50'}`}>
                <Trophy className="text-amber-500" size={20} />
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {score}/{maxScore}
                </span>
              </div>
              <button
                onClick={onRestart}
                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition-colors`}
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          {showDifficulty && (
            <DifficultySelector
              selected={difficulty}
              onChange={onDifficultyChange}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
