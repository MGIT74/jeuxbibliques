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
      <div className={`${darkMode ? 'bg-ink-light border-gold/10' : 'bg-white border-gold-dim/15'} border-b sticky top-16 z-30`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
            >
              <ArrowLeft size={20} />
              Retour
            </button>

            <h2 className={`text-xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              {title}
            </h2>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-ink' : 'bg-gold/10'}`}>
                <Trophy className="text-gold" size={20} />
                <span className={`font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  {score}/{maxScore}
                </span>
              </div>
              <button
                onClick={onRestart}
                className={`p-2 rounded-xl ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
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
