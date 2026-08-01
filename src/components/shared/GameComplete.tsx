import { Trophy, Star, RotateCcw, Home } from 'lucide-react';

interface GameCompleteProps {
  score: number;
  maxScore: number;
  onRestart: () => void;
  onHome: () => void;
  darkMode: boolean;
}

export function GameComplete({ score, maxScore, onRestart, onHome, darkMode }: GameCompleteProps) {
  const percentage = Math.round((score / maxScore) * 100);
  const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

  return (
    <div className={`text-center py-12 px-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4">
          <Trophy className="text-white" size={40} />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Partie terminée !
        </h2>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {percentage >= 90 ? 'Excellent travail !' : percentage >= 70 ? 'Très bien !' : percentage >= 50 ? 'Pas mal !' : 'Continue à t\'entraîner !'}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={40}
            className={i <= stars ? 'text-amber-400 fill-amber-400' : darkMode ? 'text-gray-600' : 'text-gray-300'}
          />
        ))}
      </div>

      <div className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {score}/{maxScore}
      </div>
      <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
        {percentage}% de réussite
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-teal-600 transition-all"
        >
          <RotateCcw size={20} />
          Rejouer
        </button>
        <button
          onClick={onHome}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          <Home size={20} />
          Accueil
        </button>
      </div>
    </div>
  );
}
