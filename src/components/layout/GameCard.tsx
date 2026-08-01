import {
  Search, HelpCircle, BookOpen, MessageCircle, CheckCircle,
  ArrowUpDown, Grid3x3, Users, PenTool, Star, LucideIcon
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
};

export function GameCard({ game, onClick, darkMode }: GameCardProps) {
  const colors = colorMap[game.color || 'blue'] || colorMap.blue;
  const IconComponent = iconMap[game.icon || 'Star'] || Star;

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
