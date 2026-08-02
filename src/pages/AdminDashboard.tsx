import { useState, useEffect } from 'react';
import {
  Users, Trophy, Gamepad2, TrendingUp, Calendar,
  ArrowLeft, Loader2, Shield, BarChart3, Clock, Mail, Download,
  Bell, Megaphone, Check, X, Ban, Unlock, Trash2, AlertTriangle,
  Image, Plus, Pencil, Eye, EyeOff, GripVertical, Code, Send,
  ChevronLeft, ChevronRight, List, CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminStats, useAdminUsers, useAdminScores, useGameStats, useMarketingUsers } from '../hooks/useAdmin';
import { api } from '../lib/api';
import type { Banner, DonationSettings, SmtpSettings } from '../types/database';
import { LiveWorldMap } from '../components/admin/LiveWorldMap';

interface AdminDashboardProps {
  onBack: () => void;
  darkMode: boolean;
}

type Tab = 'overview' | 'users' | 'scores' | 'games' | 'marketing' | 'banners' | 'integration' | 'email';

export function AdminDashboard({ onBack, darkMode }: AdminDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
          <Shield size={64} className="mx-auto mb-4 opacity-50" />
          <p>Acces non autorise</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users size={18} /> },
    { id: 'scores', label: 'Scores recents', icon: <Trophy size={18} /> },
    { id: 'games', label: 'Jeux', icon: <Gamepad2 size={18} /> },
    { id: 'marketing', label: 'Marketing', icon: <Mail size={18} /> },
    { id: 'banners', label: 'Bannieres', icon: <Image size={18} /> },
    { id: 'integration', label: 'Integration', icon: <Code size={18} /> },
    { id: 'email', label: 'Email (SMTP)', icon: <Send size={18} /> },
  ];

  return (
    <div className="min-h-screen">
      <div className={`${darkMode ? 'bg-ink-light border-gold/10' : 'bg-white border-gold-dim/15'} border-b sticky top-16 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
            >
              <ArrowLeft size={20} />
              Retour
            </button>

            <div className="flex items-center gap-2">
              <Shield className="text-gold" size={24} />
              <h2 className={`text-xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                Administration
              </h2>
            </div>

            <div className="w-24" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab darkMode={darkMode} />}
        {activeTab === 'users' && <UsersTab darkMode={darkMode} />}
        {activeTab === 'scores' && <ScoresTab darkMode={darkMode} />}
        {activeTab === 'games' && <GamesTab darkMode={darkMode} />}
        {activeTab === 'marketing' && <MarketingTab darkMode={darkMode} />}
        {activeTab === 'banners' && <BannersTab darkMode={darkMode} />}
        {activeTab === 'integration' && <IntegrationTab darkMode={darkMode} />}
        {activeTab === 'email' && <EmailSettingsTab darkMode={darkMode} />}
      </div>
    </div>
  );
}

function OverviewTab({ darkMode }: { darkMode: boolean }) {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-12 ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
        Impossible de charger les statistiques
      </div>
    );
  }

  const statCards = [
    {
      label: 'Utilisateurs totaux',
      value: stats.total_users,
      icon: <Users size={24} />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Nouveaux (7j)',
      value: stats.new_users_week,
      icon: <TrendingUp size={24} />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Nouveaux (30j)',
      value: stats.new_users_month,
      icon: <Calendar size={24} />,
      color: 'from-teal-500 to-cyan-500',
    },
    {
      label: 'Parties jouees',
      value: stats.total_games_played,
      icon: <Gamepad2 size={24} />,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Parties (7j)',
      value: stats.games_played_week,
      icon: <Clock size={24} />,
      color: 'from-rose-500 to-pink-500',
    },
    {
      label: 'Score moyen',
      value: `${Math.round(stats.avg_score_percentage)}%`,
      icon: <Trophy size={24} />,
      color: 'from-amber-400 to-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              {card.value}
            </p>
            <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <LiveWorldMap darkMode={darkMode} />
    </div>
  );
}

function UsersTab({ darkMode }: { darkMode: boolean }) {
  const { profile } = useAuth();
  const { users, loading, actionLoading, blockUser, unblockUser, deleteUser } = useAdminUsers();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const handleBlock = async (userId: string) => {
    await blockUser(userId);
  };

  const handleUnblock = async (userId: string) => {
    await unblockUser(userId);
  };

  const handleDelete = async (userId: string) => {
    await deleteUser(userId);
    setConfirmDelete(null);
  };

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  Confirmer la suppression
                </h3>
                <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                  Cette action est irreversible
                </p>
              </div>
            </div>
            <p className={`mb-6 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
              Voulez-vous vraiment supprimer cet utilisateur ? Toutes ses donnees seront perdues.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className={`flex-1 px-4 py-2 rounded-xl font-medium ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading === confirmDelete}
                className="flex-1 px-4 py-2 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === confirmDelete ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            Liste des utilisateurs ({users.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-ink' : 'bg-parchment-dim'}>
              <tr>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Utilisateur
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Eglise
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Age
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Points
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Statut
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Inscription
                </th>
                <th className={`text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gold/10' : 'divide-gold-dim/15'}`}>
              {users.map((user) => (
                <tr key={user.id} className={`${darkMode ? 'hover:bg-ink/40' : 'hover:bg-parchment-dim'} ${user.is_blocked ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${user.is_blocked ? 'bg-gray-400' : 'bg-gradient-to-br from-lapis to-gold'} flex items-center justify-center text-white font-bold`}>
                        {(user.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                          {user.username || 'Sans nom'}
                        </span>
                        {user.email && (
                          <span className={`block text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                    {user.church_name || '-'}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.age_group === 'child'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : user.age_group === 'teen'
                          ? 'bg-blue-100 text-lapis-dim dark:bg-blue-900/30 dark:text-lapis-bright'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.age_group === 'child' ? 'Enfant' : user.age_group === 'teen' ? 'Ado' : 'Adulte'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gold">
                      <Trophy size={16} />
                      <span className="font-semibold">{user.total_points}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4`}>
                    {user.is_admin ? (
                      <span className="flex items-center gap-1 text-gold">
                        <Shield size={16} />
                        Admin
                      </span>
                    ) : user.is_blocked ? (
                      <span className="flex items-center gap-1 text-red-500">
                        <Ban size={16} />
                        Bloque
                      </span>
                    ) : (
                      <span className={`${darkMode ? 'text-green-400' : 'text-green-600'}`}>Actif</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {user.id !== profile?.id && !user.is_admin && (
                      <div className="flex items-center justify-end gap-2">
                        {user.is_blocked ? (
                          <button
                            onClick={() => handleUnblock(user.id)}
                            disabled={actionLoading === user.id}
                            className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                            title="Debloquer"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Unlock size={18} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlock(user.id)}
                            disabled={actionLoading === user.id}
                            className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                            title="Bloquer"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Ban size={18} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ScoresTab({ darkMode }: { darkMode: boolean }) {
  const { scores, loading } = useAdminScores();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
      <div className="p-4 border-b ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'}">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          100 derniers scores
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={darkMode ? 'bg-ink' : 'bg-parchment-dim'}>
            <tr>
              <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                Joueur
              </th>
              <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                Jeu
              </th>
              <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                Score
              </th>
              <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                Difficulte
              </th>
              <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                Date
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gold/10' : 'divide-gold-dim/15'}`}>
            {scores.map((score) => (
              <tr key={score.id} className={darkMode ? 'hover:bg-ink/40' : 'hover:bg-parchment-dim'}>
                <td className={`px-6 py-4 font-medium ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  {score.username}
                </td>
                <td className={`px-6 py-4 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  {score.game_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${
                    score.score / score.max_score >= 0.8
                      ? 'text-green-500'
                      : score.score / score.max_score >= 0.5
                        ? 'text-gold'
                        : 'text-red-500'
                  }`}>
                    {score.score}/{score.max_score}
                  </span>
                </td>
                <td className={`px-6 py-4 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    score.difficulty === 'easy'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : score.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {score.difficulty === 'easy' ? 'Facile' : score.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                  </span>
                </td>
                <td className={`px-6 py-4 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                  {new Date(score.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GamesTab({ darkMode }: { darkMode: boolean }) {
  const { gameStats, loading } = useGameStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {gameStats.map(({ game, total_plays, avg_score }) => (
        <div
          key={game.id}
          className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}
        >
          <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            {game.name}
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
            {game.description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>Parties jouees</span>
              <span className={`font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{total_plays}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>Score moyen</span>
              <span className={`font-bold ${
                avg_score >= 80 ? 'text-green-500' : avg_score >= 50 ? 'text-gold' : 'text-red-500'
              }`}>
                {avg_score}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  avg_score >= 80 ? 'bg-green-500' : avg_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${avg_score}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingTab({ darkMode }: { darkMode: boolean }) {
  const { users, loading, stats, exportToCSV } = useMarketingUsers();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <Users size={20} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>Total utilisateurs</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{stats.total}</p>
        </div>

        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
              <Bell size={20} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>Newsletter</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{stats.withNewsletter}</p>
        </div>

        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
              <Megaphone size={20} />
            </div>
            <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>Marketing</span>
          </div>
          <p className={`text-3xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{stats.withMarketing}</p>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
        <div className={`p-4 border-b ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'} flex items-center justify-between`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            Liste des contacts ({users.filter(u => u.newsletter_consent || u.marketing_consent).length} avec consentement)
          </h3>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            <Download size={18} />
            Exporter CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-ink' : 'bg-parchment-dim'}>
              <tr>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Utilisateur
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Email
                </th>
                <th className={`text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Newsletter
                </th>
                <th className={`text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Marketing
                </th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                  Inscription
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gold/10' : 'divide-gold-dim/15'}`}>
              {users.map((user) => (
                <tr key={user.id} className={darkMode ? 'hover:bg-ink/40' : 'hover:bg-parchment-dim'}>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`font-medium ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                        {user.full_name || user.username || 'Sans nom'}
                      </span>
                      {user.full_name && user.username && (
                        <span className={`block text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                          @{user.username}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="opacity-50" />
                      {user.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.newsletter_consent ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">
                        <X size={14} />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.marketing_consent ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">
                        <X size={14} />
                      </span>
                    )}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BannersTab({ darkMode }: { darkMode: boolean }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    is_active: true,
    display_order: 0,
    duration_seconds: 5,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const data = await api.get<Banner[]>('/admin/banners');
      setBanners(data);
    } catch (err) {
      console.error('Error fetching banners:', err);
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      is_active: true,
      display_order: banners.length,
      duration_seconds: 5,
      start_date: '',
      end_date: '',
    });
    setEditingBanner(null);
    setShowForm(false);
    setUploadMethod('file');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner une image (JPG ou PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas depasser 5 MB');
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append('file', file);

      const { url } = await api.post<{ path: string; url: string }>('/admin/banners/upload', body);
      setFormData((prev) => ({ ...prev, image_url: url }));
    } catch (err) {
      console.error('Error uploading banner image:', err);
      alert('Erreur lors du telechargement de l\'image');
    } finally {
      setUploading(false);
    }
  }

  function formatDateTimeLocal(isoString: string | null): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function handleEdit(banner: Banner) {
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
      duration_seconds: banner.duration_seconds || 5,
      start_date: formatDateTimeLocal(banner.start_date),
      end_date: formatDateTimeLocal(banner.end_date),
    });
    setEditingBanner(banner);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading('form');

    const startDate = formData.start_date ? new Date(formData.start_date).toISOString() : null;
    const endDate = formData.end_date ? new Date(formData.end_date).toISOString() : null;

    const payload = {
      title: formData.title,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      is_active: formData.is_active,
      display_order: formData.display_order,
      duration_seconds: formData.duration_seconds,
      start_date: startDate,
      end_date: endDate,
    };

    try {
      if (editingBanner) {
        await api.put(`/admin/banners/${editingBanner.id}`, payload);
      } else {
        // created_by est déterminé côté serveur à partir de l'utilisateur authentifié
        await api.post('/admin/banners', payload);
      }
      await fetchBanners();
      resetForm();
    } catch (err) {
      console.error('Error saving banner:', err);
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      alert(`Erreur lors de l'enregistrement de la bannière : ${message}`);
    }

    setActionLoading(null);
  }

  async function toggleActive(banner: Banner) {
    setActionLoading(banner.id);
    try {
      await api.post(`/admin/banners/${banner.id}/toggle`);
    } catch (err) {
      console.error('Error toggling banner:', err);
      alert('Erreur : impossible de changer le statut de la bannière.');
    }
    await fetchBanners();
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette banniere ?')) return;

    setActionLoading(id);
    try {
      await api.delete(`/admin/banners/${id}`);
    } catch (err) {
      console.error('Error deleting banner:', err);
    }
    await fetchBanners();
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  function getBannersForDay(day: Date): Banner[] {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

    return banners.filter((banner) => {
      if (!banner.is_active) return false;

      const startDate = banner.start_date ? new Date(banner.start_date) : null;
      const endDate = banner.end_date ? new Date(banner.end_date) : null;

      if (!startDate && !endDate) return true;

      const hasStarted = !startDate || startDate <= dayEnd;
      const hasNotEnded = !endDate || endDate >= dayStart;

      return hasStarted && hasNotEnded;
    });
  }

  function getCalendarDays(): (Date | null)[] {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];

    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function prevMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  }

  const calendarDays = getCalendarDays();
  const monthNames = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
  ];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Bannieres publicitaires ({banners.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className={`flex rounded-xl overflow-hidden ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-white'
                  : darkMode ? 'text-parchment/80 hover:bg-ink/60' : 'text-ink/70 hover:bg-parchment-dim/70'
              }`}
            >
              <List size={16} />
              Liste
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-amber-500 text-white'
                  : darkMode ? 'text-parchment/80 hover:bg-ink/60' : 'text-ink/70 hover:bg-parchment-dim/70'
              }`}
            >
              <CalendarDays size={16} />
              Calendrier
            </button>
          </div>
          <button
            onClick={() => {
              setFormData({ ...formData, display_order: banners.length });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {showForm && (
        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            {editingBanner ? 'Modifier la banniere' : 'Nouvelle banniere'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                  Titre
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                  placeholder="Titre de la banniere"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                Image de la banniere
              </label>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadMethod === 'file'
                      ? 'bg-amber-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Uploader un fichier
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadMethod === 'url'
                      ? 'bg-amber-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Entrer une URL
                </button>
              </div>

              {uploadMethod === 'file' ? (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-500 file:text-white hover:file:bg-amber-600 file:cursor-pointer disabled:opacity-50`}
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                    JPG ou PNG, max 5 MB. Format recommande: 1200x400 pixels (ratio 3:1)
                  </p>
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-gold">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm">Upload en cours...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                    placeholder="https://exemple.com/image.jpg"
                    required
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                    Format recommande: 1200x400 pixels (ratio 3:1)
                  </p>
                </div>
              )}
            </div>

            {formData.image_url && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={formData.image_url}
                  alt="Apercu"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                Lien (optionnel)
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                placeholder="https://exemple.com/page"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                Duree d'affichage (secondes)
              </label>
              <input
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 5 })}
                className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                min={1}
                max={60}
                required
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                Entre 1 et 60 secondes
              </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-blue-50'} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className={darkMode ? 'text-lapis-bright' : 'text-lapis'} />
                <h5 className={`text-sm font-semibold ${darkMode ? 'text-lapis-bright' : 'text-lapis-dim'}`}>
                  Plage horaire de diffusion
                </h5>
              </div>
              <p className={`text-xs mb-4 ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
                Definissez la periode pendant laquelle cette banniere sera affichee. Laissez vide pour aucune restriction.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                    Date de debut
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-gold focus:ring-amber-500"
              />
              <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                Banniere active
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className={`flex-1 px-4 py-2 rounded-xl font-medium ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading === 'form' || uploading || (uploadMethod === 'file' && !formData.image_url)}
                className="flex-1 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'form' || uploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingBanner ? (
                  'Modifier'
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'} flex items-center justify-between`}>
            <button
              onClick={prevMonth}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-ink/60 text-parchment/80' : 'hover:bg-parchment-dim text-ink/70'} transition-colors`}
            >
              <ChevronLeft size={20} />
            </button>
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </h4>
            <button
              onClick={nextMonth}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-ink/60 text-parchment/80' : 'hover:bg-parchment-dim text-ink/70'} transition-colors`}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className={`text-center text-xs font-semibold py-2 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayBanners = getBannersForDay(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const hasScheduledBanners = dayBanners.some(b => b.start_date || b.end_date);
                const hasPermanentBanners = dayBanners.some(b => !b.start_date && !b.end_date);

                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square p-1 rounded-lg border ${
                      isToday
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : darkMode
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    } transition-colors group relative`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday
                        ? 'text-amber-600 dark:text-amber-400'
                        : darkMode ? 'text-parchment/80' : 'text-ink/80'
                    }`}>
                      {day.getDate()}
                    </div>

                    {dayBanners.length > 0 && (
                      <div className="space-y-0.5">
                        {dayBanners.length <= 3 ? (
                          dayBanners.map((banner) => (
                            <div
                              key={banner.id}
                              className={`h-1.5 rounded-full ${
                                !banner.start_date && !banner.end_date
                                  ? 'bg-gray-400 dark:bg-gray-500'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
                              }`}
                              title={banner.title}
                            />
                          ))
                        ) : (
                          <>
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                            <div className={`text-[10px] ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                              +{dayBanners.length - 1}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {dayBanners.length > 0 && (
                      <div className={`absolute left-full top-0 ml-2 z-50 w-48 p-2 rounded-lg shadow-xl ${
                        darkMode ? 'bg-ink border border-gold/15' : 'bg-white border border-gold-dim/15'
                      } opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none`}>
                        <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                          {day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </div>
                        <div className="space-y-1.5">
                          {dayBanners.map((banner) => (
                            <div
                              key={banner.id}
                              className={`flex items-center gap-2 text-xs ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                !banner.start_date && !banner.end_date
                                  ? 'bg-gray-400'
                                  : 'bg-amber-500'
                              }`} />
                              <span className="truncate">{banner.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'} flex items-center gap-6 text-xs`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>Banniere programmee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500" />
                <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>Banniere permanente</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="grid gap-4">
          {banners.length === 0 ? (
            <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-8 text-center shadow-lg`}>
              <Image className={`mx-auto mb-4 ${darkMode ? 'text-parchment/50' : 'text-ink/40'}`} size={48} />
              <p className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>
                Aucune banniere configuree
              </p>
            </div>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl overflow-hidden shadow-lg ${!banner.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 h-32 sm:h-auto flex-shrink-0">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x150?text=Image+non+disponible';
                      }}
                    />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <GripVertical className={darkMode ? 'text-parchment/50' : 'text-ink/40'} size={16} />
                      <span className={`text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                        Position: {banner.display_order}
                      </span>
                      {!banner.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                      {(() => {
                        const now = new Date();
                        const startDate = banner.start_date ? new Date(banner.start_date) : null;
                        const endDate = banner.end_date ? new Date(banner.end_date) : null;

                        if (startDate && now < startDate) {
                          return (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-lapis dark:text-lapis-bright">
                              Programmee
                            </span>
                          );
                        } else if (endDate && now > endDate) {
                          return (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              Expiree
                            </span>
                          );
                        } else if (startDate || endDate) {
                          return (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                              En cours
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <h4 className={`font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                      {banner.title}
                    </h4>
                    {banner.link_url && (
                      <p className={`text-xs truncate mt-1 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                        {banner.link_url}
                      </p>
                    )}
                    {(banner.start_date || banner.end_date) && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                        <Calendar size={12} />
                        <span>
                          {banner.start_date
                            ? new Date(banner.start_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Debut immediat'}
                          {' - '}
                          {banner.end_date
                            ? new Date(banner.end_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Sans fin'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => toggleActive(banner)}
                      disabled={actionLoading === banner.id}
                      className={`p-2 rounded-lg ${banner.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} hover:opacity-80 transition-colors disabled:opacity-50`}
                      title={banner.is_active ? 'Desactiver' : 'Activer'}
                    >
                      {actionLoading === banner.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : banner.is_active ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-lapis dark:text-lapis-bright hover:opacity-80 transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={actionLoading === banner.id}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:opacity-80 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function IntegrationTab({ darkMode }: { darkMode: boolean }) {
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    iframe_code: '',
    is_active: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await api.get<DonationSettings | null>('/admin/donation-settings');
      if (data) {
        setSettings(data);
        setFormData({
          iframe_code: data.iframe_code,
          is_active: data.is_active,
        });
      }
    } catch (err) {
      console.error('Error fetching donation settings:', err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Admin\DonationSettingController::update crée la ligne si elle
      // n'existe pas encore, donc un seul appel suffit dans les deux cas.
      await api.put('/admin/donation-settings', {
        iframe_code: formData.iframe_code,
        is_active: formData.is_active,
      });
      await fetchSettings();
      alert('Parametres sauvegardes avec succes !');
    } catch (err) {
      console.error('Error saving donation settings:', err);
      alert('Erreur lors de la sauvegarde');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            <Code size={24} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Integration iframe de donation
            </h3>
            <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              Configurez l'iframe qui sera affiche sur la page "Faire un don"
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
              Code iframe complet
            </label>
            <textarea
              value={formData.iframe_code}
              onChange={(e) => setFormData({ ...formData, iframe_code: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm`}
              placeholder='<iframe src="..." width="100%" height="600"></iframe>'
              rows={8}
              required
            />
            <p className={`text-xs mt-2 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              Collez le code HTML complet de l'iframe fourni par votre plateforme de don (Paymattic, etc.)
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-blue-50'} rounded-xl p-4`}>
            <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-lapis-bright' : 'text-lapis-dim'}`}>
              Exemple de code iframe :
            </h4>
            <pre className={`text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/70'} overflow-x-auto`}>
{`<iframe
  src="https://votre-plateforme.com/donation"
  width="100%"
  height="600"
  frameborder="0"
  scrolling="auto">
</iframe>`}
            </pre>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active_donation"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded text-lapis focus:ring-blue-500"
            />
            <label
              htmlFor="is_active_donation"
              className={`text-sm font-medium ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}
            >
              Activer l'iframe sur la page de donation
            </label>
          </div>

          {formData.iframe_code && formData.is_active && (
            <div className={`${darkMode ? 'bg-ink-dark/50' : 'bg-parchment-dim'} rounded-xl p-4`}>
              <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                Apercu de l'iframe :
              </h4>
              <div
                className="w-full min-h-[400px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
                dangerouslySetInnerHTML={{ __html: formData.iframe_code }}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Enregistrer les parametres
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {settings && (
        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            Informations
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>Statut :</span>
              <span className={`font-medium ${settings.is_active ? 'text-green-500' : 'text-gray-500'}`}>
                {settings.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>Derniere modification :</span>
              <span className={darkMode ? 'text-parchment/80' : 'text-ink/80'}>
                {new Date(settings.updated_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailSettingsTab({ darkMode }: { darkMode: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from_email: '',
    from_name: 'Jeux Bibliques',
    is_active: false,
    require_email_verification: false,
  });
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await api.get<SmtpSettings | null>('/admin/smtp-settings');
      if (data) {
        setFormData({
          host: data.host || '',
          port: data.port || 587,
          secure: !!data.secure,
          username: data.username || '',
          password: '',
          from_email: data.from_email || '',
          from_name: data.from_name || 'Jeux Bibliques',
          is_active: !!data.is_active,
          require_email_verification: !!data.require_email_verification,
        });
        setHasExistingPassword(!!data.has_password);
      }
    } catch (err) {
      console.error('Error fetching SMTP settings:', err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTestMessage(null);

    try {
      await api.put('/admin/smtp-settings', formData);
      await fetchSettings();
      alert('Parametres SMTP sauvegardes avec succes !');
    } catch (err) {
      console.error('Error saving SMTP settings:', err);
      alert('Erreur lors de la sauvegarde');
    }

    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestMessage(null);
    try {
      const result = await api.post<{ message: string }>('/admin/smtp-settings/test', {});
      setTestMessage({ type: 'success', text: result.message });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Echec du test SMTP.';
      setTestMessage({ type: 'error', text: message });
    }
    setTesting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border ${
    darkMode
      ? 'bg-ink border-gold/20 text-parchment placeholder-parchment/40'
      : 'bg-white border-gold-dim/25 text-ink placeholder-ink/40'
  } focus:ring-2 focus:ring-gold focus:border-transparent`;

  const labelClass = `block text-sm font-medium mb-2 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`;

  return (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="seal w-12 h-12">
            <Send size={22} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Serveur email (SMTP)
            </h3>
            <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              Utilisé pour l'email de bienvenue et la vérification de compte des utilisateurs
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Serveur SMTP (hôte)</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className={inputClass}
                placeholder="smtp.hostinger.com"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                className={inputClass}
                placeholder="465"
                required
              />
            </div>

            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.secure}
                  onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                  className="w-4 h-4 rounded border-gold-dim/40 text-lapis focus:ring-lapis"
                />
                <span className={darkMode ? 'text-parchment/80' : 'text-ink/80'}>
                  Connexion SSL/TLS (port 465)
                </span>
              </label>
            </div>

            <div>
              <label className={labelClass}>Identifiant SMTP (adresse email complète)</label>
              <input
                type="email"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={inputClass}
                placeholder="contact@jeuxbibliques.org"
              />
            </div>

            <div>
              <label className={labelClass}>
                Mot de passe SMTP {hasExistingPassword && <span className="text-xs opacity-60">(laisser vide pour garder l'actuel)</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputClass}
                placeholder={hasExistingPassword ? '••••••••' : ''}
              />
            </div>

            <div>
              <label className={labelClass}>Email expéditeur</label>
              <input
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                className={inputClass}
                placeholder="contact@jeuxbibliques.org"
              />
            </div>

            <div>
              <label className={labelClass}>Nom expéditeur</label>
              <input
                type="text"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                className={inputClass}
                placeholder="Jeux Bibliques"
              />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-ink/40' : 'bg-parchment-dim'} rounded-xl p-4 space-y-3`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gold-dim/40 text-lapis focus:ring-lapis"
              />
              <span className={`font-medium ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                Activer l'envoi d'emails
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_email_verification}
                onChange={(e) => setFormData({ ...formData, require_email_verification: e.target.checked })}
                className="w-4 h-4 rounded border-gold-dim/40 text-lapis focus:ring-lapis"
              />
              <span className={darkMode ? 'text-parchment/80' : 'text-ink/80'}>
                Envoyer un email de vérification à l'inscription
              </span>
            </label>
            <p className={`text-xs ${darkMode ? 'text-parchment/50' : 'text-ink/50'}`}>
              Note : le compte reste utilisable même si l'email n'est pas encore vérifié — aucun utilisateur n'est bloqué par cette option.
            </p>
          </div>

          {testMessage && (
            <div className={`rounded-xl p-4 text-sm ${
              testMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-coral/10 text-coral'
            }`}>
              {testMessage.text}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className={`px-6 py-3 rounded-full font-semibold border-2 transition-all disabled:opacity-50 ${
                darkMode ? 'border-gold/30 text-parchment hover:bg-ink' : 'border-gold-dim/40 text-ink hover:bg-parchment-dim'
              }`}
            >
              {testing ? 'Envoi...' : 'Envoyer un email de test'}
            </button>
          </div>
        </form>

        <div className={`mt-6 rounded-xl p-4 text-sm ${darkMode ? 'bg-ink/40 text-parchment/70' : 'bg-parchment-dim text-ink/70'}`}>
          <p className="font-semibold mb-1">Paramètres Hostinger typiques :</p>
          <p>Hôte : <code>smtp.hostinger.com</code> — Port : <code>465</code> (SSL activé) ou <code>587</code> (SSL désactivé)</p>
          <p>Identifiant : ton adresse email complète — Mot de passe : celui de cette boîte mail</p>
        </div>
      </div>
    </div>
  );
}
