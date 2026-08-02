import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Card } from '../types/database';

interface CardsContextValue {
  hearts: number;
  myCards: Card[];
  allCards: Card[];
  loading: boolean;
  pendingReveal: Card[];
  refreshMyCards: () => Promise<void>;
  useHeart: () => Promise<boolean>;
  notifyUnlocked: (cards: Card[]) => void;
  dismissCurrentReveal: () => void;
}

const CardsContext = createContext<CardsContextValue | undefined>(undefined);

export function CardsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hearts, setHearts] = useState(0);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingReveal, setPendingReveal] = useState<Card[]>([]);

  const refreshMyCards = useCallback(async () => {
    if (!user) {
      setHearts(0);
      setMyCards([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<{ hearts: number; cards: Card[] }>('/my-cards');
      setHearts(data.hearts);
      setMyCards(data.cards);
    } catch (err) {
      console.error('Error fetching my cards:', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    api.get<Card[]>('/cards').then(setAllCards).catch((err) => console.error('Error fetching cards catalogue:', err));
  }, []);

  useEffect(() => {
    refreshMyCards();
  }, [refreshMyCards]);

  async function useHeart(): Promise<boolean> {
    try {
      const data = await api.post<{ hearts: number }>('/hearts/use');
      setHearts(data.hearts);
      return true;
    } catch (err) {
      return false;
    }
  }

  function notifyUnlocked(cards: Card[]) {
    if (cards.length === 0) return;
    setPendingReveal((prev) => [...prev, ...cards]);
  }

  function dismissCurrentReveal() {
    setPendingReveal((prev) => {
      const [current, ...rest] = prev;
      if (current) {
        api.post(`/my-cards/${current.id}/seen`).catch(() => {});
      }
      return rest;
    });
  }

  return (
    <CardsContext.Provider
      value={{ hearts, myCards, allCards, loading, pendingReveal, refreshMyCards, useHeart, notifyUnlocked, dismissCurrentReveal }}
    >
      {children}
    </CardsContext.Provider>
  );
}

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards must be used within a CardsProvider');
  return ctx;
}
