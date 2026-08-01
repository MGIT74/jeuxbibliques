import { Loader2 } from 'lucide-react';
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
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BannerSlider />

      <div className="text-center mb-12">
        <p className="eyebrow mb-3">9 mini-jeux · un seul livre</p>
        <h1 className={`font-display text-3xl sm:text-4xl font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Bienvenue{profile?.username ? `, ${profile.username}` : ''}
        </h1>
        <p className={`text-lg mt-3 ${darkMode ? 'text-parchment/60' : 'text-ink/60'} max-w-2xl mx-auto`}>
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

      <div className={`mt-12 text-center ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
        <p className="text-sm">
          Connecte-toi pour sauvegarder ta progression et gagner des points !
        </p>
      </div>
    </div>
  );
}
