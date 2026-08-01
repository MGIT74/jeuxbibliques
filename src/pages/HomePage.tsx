import { Loader2, Sparkles } from 'lucide-react';
import { GameCard } from '../components/layout/GameCard';
import { BannerSlider } from '../components/shared/BannerSlider';
import { useGames } from '../hooks/useGameData';
import { useAuth } from '../contexts/AuthContext';
import type { Game } from '../types/database';

interface HomePageProps {
  onSelectGame: (game: Game) => void;
  darkMode: boolean;
}

export function HomePage({ onSelectGame, darkMode }: HomePageProps) {
  const { games, loading } = useGames();
  const { profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BannerSlider />

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="text-amber-500" size={32} />
          <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Bienvenue{profile?.username ? `, ${profile.username}` : ''} !
          </h1>
          <Sparkles className="text-amber-500" size={32} />
        </div>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
          Decouvre la Bible en t'amusant avec nos 9 mini-jeux educatifs.
          Choisis ton jeu prefere et commence l'aventure !
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => onSelectGame(game)}
            darkMode={darkMode}
          />
        ))}
      </div>

      <div className={`mt-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <p className="text-sm">
          Connecte-toi pour sauvegarder ta progression et gagner des points !
        </p>
      </div>
    </div>
  );
}
