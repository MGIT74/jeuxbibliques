import { useState, useEffect, useCallback } from 'react';

const FREE_TRIAL_KEY = 'bible_games_free_trials';

interface FreeTrialData {
  [gameId: string]: number;
}

export function useFreeTrial(gameId: string, isAuthenticated: boolean) {
  const [canPlay, setCanPlay] = useState(true);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setCanPlay(true);
      setHasUsedTrial(false);
      return;
    }

    const trialData = getTrialData();
    const playCount = trialData[gameId] || 0;

    setCanPlay(playCount === 0);
    setHasUsedTrial(playCount > 0);
  }, [gameId, isAuthenticated]);

  const markTrialUsed = useCallback(() => {
    if (isAuthenticated) return;

    const trialData = getTrialData();
    trialData[gameId] = (trialData[gameId] || 0) + 1;
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(trialData));

    setCanPlay(false);
    setHasUsedTrial(true);
  }, [gameId, isAuthenticated]);

  return { canPlay, hasUsedTrial, markTrialUsed };
}

function getTrialData(): FreeTrialData {
  try {
    const data = localStorage.getItem(FREE_TRIAL_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}
