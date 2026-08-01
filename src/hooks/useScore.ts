import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Difficulty } from '../types/database';

export function useScore() {
  const { user } = useAuth();

  async function saveScore(gameSlug: string, score: number, maxScore: number, difficulty: Difficulty, timeSpent: number) {
    if (!user) return;

    // Toute la logique (score + progression + calcul des points) est maintenant
    // gérée côté serveur par ScoreController::store, dans une transaction.
    try {
      await api.post('/scores', {
        game_slug: gameSlug,
        score,
        max_score: maxScore,
        difficulty,
        time_spent: timeSpent,
      });
    } catch (err) {
      console.error('Error saving score:', err);
    }
  }

  return { saveScore };
}
