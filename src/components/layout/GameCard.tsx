import {
  Search, HelpCircle, BookOpen, MessageCircle, CheckCircle,
  ArrowUpDown, Grid3x3, Users, PenTool, Star, Gem, LucideIcon
} from 'lucide-react';
import type { Game } from '../../types/database';

interface GameCardProps {
  game: Game;
  onClick: () => void;
  darkMode: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Search,
  HelpCircle,
  BookOpen,
  MessageCircle,
  CheckCircle,
  ArrowUpDown,
  Grid3x3,
  Users,
  PenTool,
  Star,
  Gem,
};

// Chaque teinte est traitée comme une "encre" de médaillon : un dégradé
// discret pour le sceau, réutilisé pour le badge de niveaux.
const colorMap: Record<string, { seal: string; ring: string; badge: string }> = {
  emerald: { seal: 'from-emerald-600 to-ink', ring: 'ring-emerald-400/40', badge: 'bg-emerald-600/90' },
  blue: { seal: 'from-lapis to-ink', ring: 'ring-lapis-bright/40', badge: 'bg-lapis/90' },
  amber: { seal: 'from-gold-dim to-ink', ring: 'ring-gold/50', badge: 'bg-gold-dim/90' },
  rose: { seal: 'from-coral to-ink', ring: 'ring-coral-bright/40', badge: 'bg-coral/90' },
  teal: { seal: 'from-teal-600 to-ink', ring: 'ring-teal-400/40', badge: 'bg-teal-600/90' },
  orange: { seal: 'from-orange-600 to-ink', ring: 'ring-orange-400/40', badge: 'bg-orange-600/90' },
  sky: { seal: 'from-sky-600 to-ink', ring: 'ring-sky-400/40', badge: 'bg-sky-600/90' },
  cyan: { seal: 'from-cyan-600 to-ink', ring: 'ring-cyan-400/40', badge: 'bg-cyan-600/90' },
  lime: { seal: 'from-lime-600 to-ink', ring: 'ring-lime-400/40', badge: 'bg-lime-600/90' },
  violet: { seal: 'from-violet-600 to-ink', ring: 'ring-violet-400/40', badge: 'bg-violet-600/90' },
};

export function GameCard({ game, onClick, darkMode }: GameCardProps) {
  const colors = colorMap[game.color || 'blue'] || colorMap.blue;
  const IconComponent = iconMap[game.icon || 'Star'] || Star;

  if (game.cover_image_url) {
    return (
      <button
        onClick={onClick}
        className="card-hover group relative w-full aspect-square rounded-tile overflow-hidden shadow-tile text-left"
      >
        <img
          src={game.cover_image_url}
          alt={game.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Voile degrade pour garder le titre lisible sur n'importe quelle image */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-90" />

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-parchment ${colors.badge} shadow-tile`}>
            {game.min_age}+ ans
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-dark/80 text-gold shadow-tile">
            {game.difficulty_levels.length} niveaux
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-xl font-semibold text-parchment drop-shadow-lg">
            {game.name}
          </h3>
          <p className="text-sm text-parchment/80 mt-1 line-clamp-2 drop-shadow">
            {game.description}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`card card-hover group relative text-left w-full ${darkMode ? '' : ''}`}
    >
      <div
        className={`seal w-14 h-14 mb-4 bg-gradient-to-br ${colors.seal} ${colors.ring} ring-2 text-gold-bright group-hover:scale-105 transition-transform`}
      >
        <IconComponent size={26} />
      </div>

      <h3 className={`font-display text-lg font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
        {game.name}
      </h3>

      <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/60'} mb-4`}>
        {game.description}
      </p>

      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full ${darkMode ? 'bg-ink text-parchment/70' : 'bg-parchment-dim text-ink/70'}`}>
          {game.min_age}+ ans
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full text-parchment ${colors.badge}`}>
          {game.difficulty_levels.length} niveaux
        </span>
      </div>
    </button>
  );
}
