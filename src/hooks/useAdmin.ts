import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { AdminStats, Profile, Game, MarketingUser } from '../types/database';

export function useAdminStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    api.get<AdminStats>('/admin/stats/overview')
      .then(setStats)
      .catch((err) => console.error('Error fetching admin stats:', err))
      .finally(() => setLoading(false));
  }, [profile?.is_admin]);

  return { stats, loading };
}

export function useAdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      const data = await api.get<Profile[]>('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [profile?.is_admin]);

  async function blockUser(userId: string, reason?: string) {
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/block`, { reason: reason || null });
      await fetchUsers();
      setActionLoading(null);
      return { error: null };
    } catch (err) {
      console.error('Error blocking user:', err);
      setActionLoading(null);
      return { error: err instanceof Error ? err : new Error('Erreur inconnue') };
    }
  }

  async function unblockUser(userId: string) {
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/unblock`);
      await fetchUsers();
      setActionLoading(null);
      return { error: null };
    } catch (err) {
      console.error('Error unblocking user:', err);
      setActionLoading(null);
      return { error: err instanceof Error ? err : new Error('Erreur inconnue') };
    }
  }

  async function deleteUser(userId: string) {
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      await fetchUsers();
      setActionLoading(null);
      return { error: null };
    } catch (err) {
      console.error('Error deleting user:', err);
      setActionLoading(null);
      return { error: err instanceof Error ? err : new Error('Erreur inconnue') };
    }
  }

  return { users, loading, actionLoading, blockUser, unblockUser, deleteUser, refetch: fetchUsers };
}

export function useAdminScores() {
  const { profile } = useAuth();
  const [scores, setScores] = useState<Array<{
    id: string;
    user_id: string;
    game_id: string;
    score: number;
    max_score: number;
    difficulty: string;
    created_at: string;
    username?: string;
    game_name?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    api.get<typeof scores>('/admin/stats/recent-scores')
      .then(setScores)
      .catch((err) => console.error('Error fetching scores:', err))
      .finally(() => setLoading(false));
  }, [profile?.is_admin]);

  return { scores, loading };
}

export function useGameStats() {
  const { profile } = useAuth();
  const [gameStats, setGameStats] = useState<Array<{
    game: Game;
    total_plays: number;
    avg_score: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    api.get<typeof gameStats>('/admin/stats/by-game')
      .then(setGameStats)
      .catch((err) => console.error('Error fetching game stats:', err))
      .finally(() => setLoading(false));
  }, [profile?.is_admin]);

  return { gameStats, loading };
}

export function useMarketingUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<MarketingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    withNewsletter: 0,
    withMarketing: 0,
  });

  useEffect(() => {
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    api.get<MarketingUser[]>('/admin/users/marketing')
      .then((data) => {
        setUsers(data);
        setStats({
          total: data.length,
          withNewsletter: data.filter((u) => u.newsletter_consent).length,
          withMarketing: data.filter((u) => u.marketing_consent).length,
        });
      })
      .catch((err) => console.error('Error fetching marketing users:', err))
      .finally(() => setLoading(false));
  }, [profile?.is_admin]);

  function exportToCSV() {
    const consentedUsers = users.filter((u) => u.newsletter_consent || u.marketing_consent);

    const headers = ['Email', 'Nom', 'Username', 'Newsletter', 'Marketing', 'Date consentement', 'Inscription'];
    const rows = consentedUsers.map((u) => [
      u.email || '',
      u.full_name || '',
      u.username || '',
      u.newsletter_consent ? 'Oui' : 'Non',
      u.marketing_consent ? 'Oui' : 'Non',
      u.consent_date ? new Date(u.consent_date).toLocaleDateString('fr-FR') : '',
      new Date(u.created_at).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marketing-users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  return { users, loading, stats, exportToCSV };
}
