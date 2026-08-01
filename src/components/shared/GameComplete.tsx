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
    <div className={`text-center py-12 px-6 rounded-2xl ${darkMode ? 'bg-ink-light' : 'bg-white'} shadow-lg`}>
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4">
          <Trophy className="text-white" size={40} />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Partie terminée !
        </h2>
        <p className={`text-lg ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
          {percentage >= 90 ? 'Excellent travail !' : percentage >= 70 ? 'Très bien !' : percentage >= 50 ? 'Pas mal !' : 'Continue à t\'entraîner !'}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={40}
            className={i <= stars ? 'text-amber-400 fill-amber-400' : darkMode ? 'text-parchment/50' : 'text-ink/30'}
          />
        ))}
      </div>

      <div className={`text-4xl font-bold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
        {score}/{maxScore}
      </div>
      <p className={`text-lg ${darkMode ? 'text-parchment/60' : 'text-ink/70'} mb-8`}>
        {percentage}% de réussite
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lapis to-gold text-white rounded-xl font-semibold hover:from-lapis-bright hover:to-gold-bright transition-all"
        >
          <RotateCcw size={20} />
          Rejouer
        </button>
        <button
          onClick={onHome}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-ink text-parchment hover:bg-ink/70' : 'bg-parchment-dim text-ink hover:bg-parchment-dim/70'}`}
        >
          <Home size={20} />
          Accueil
        </button>
      </div>
    </div>
  );
}
