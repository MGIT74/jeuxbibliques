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

const colorMap: Record<string, { bg: string; gradient: string; border: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    gradient: 'from-emerald-400 to-emerald-600',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    gradient: 'from-blue-400 to-blue-600',
    border: 'border-blue-200 dark:border-blue-800'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    gradient: 'from-amber-400 to-amber-600',
    border: 'border-amber-200 dark:border-amber-800'
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    gradient: 'from-rose-400 to-rose-600',
    border: 'border-rose-200 dark:border-rose-800'
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    gradient: 'from-teal-400 to-teal-600',
    border: 'border-teal-200 dark:border-teal-800'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    gradient: 'from-orange-400 to-orange-600',
    border: 'border-orange-200 dark:border-orange-800'
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    gradient: 'from-sky-400 to-sky-600',
    border: 'border-sky-200 dark:border-sky-800'
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    gradient: 'from-cyan-400 to-cyan-600',
    border: 'border-cyan-200 dark:border-cyan-800'
  },
  lime: {
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    gradient: 'from-lime-400 to-lime-600',
    border: 'border-lime-200 dark:border-lime-800'
  },
};

export function GameCard({ game, onClick, darkMode }: GameCardProps) {
  const colors = colorMap[game.color || 'blue'] || colorMap.blue;
  const IconComponent = iconMap[game.icon || 'Star'] || Star;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border-2 ${colors.border} ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <IconComponent size={28} className="text-white" />
      </div>

      <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {game.name}
      </h3>

      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
        {game.description}
      </p>

      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {game.min_age}+ ans
        </span>
        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${colors.gradient} text-white`}>
          {game.difficulty_levels.length} niveaux
        </span>
      </div>
    </button>
  );
}
