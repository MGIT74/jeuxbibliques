import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from '../contexts/CardsContext';
import type { Difficulty, Card } from '../types/database';

export function useScore() {
  const { user } = useAuth();
  const { notifyUnlocked, refreshMyCards } = useCards();

  async function saveScore(gameSlug: string, score: number, maxScore: number, difficulty: Difficulty, timeSpent: number) {
    if (!user) return;

    // Toute la logique (score + progression + calcul des points) est maintenant
    // gérée côté serveur par ScoreController::store, dans une transaction.
    try {
      const result = await api.post<{ newly_unlocked_cards?: Card[] }>('/scores', {
        game_slug: gameSlug,
        score,
        max_score: maxScore,
        difficulty,
        time_spent: timeSpent,
      });

      if (result.newly_unlocked_cards && result.newly_unlocked_cards.length > 0) {
        notifyUnlocked(result.newly_unlocked_cards);
        await refreshMyCards();
      }
    } catch (err) {
      console.error('Error saving score:', err);
    }
  }

  return { saveScore };
}
