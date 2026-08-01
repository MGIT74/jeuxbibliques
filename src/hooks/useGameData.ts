import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Game, Verse, QuizQuestion, BibleWord, BibleCharacter, Difficulty } from '../types/database';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Game[]>('/games')
      .then((data) => setGames(data.sort((a, b) => a.min_age - b.min_age)))
      .catch((err) => console.error('Error fetching games:', err))
      .finally(() => setLoading(false));
  }, []);

  return { games, loading };
}

export function useVerses(difficulty?: Difficulty) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = difficulty ? `?difficulty=${difficulty}` : '';
    api.get<Verse[]>(`/verses${qs}`)
      .then(setVerses)
      .catch((err) => console.error('Error fetching verses:', err))
      .finally(() => setLoading(false));
  }, [difficulty]);

  return { verses, loading };
}

export function useQuizQuestions(gameType: string, difficulty?: Difficulty) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ game_type: gameType });
    if (difficulty) params.set('difficulty', difficulty);

    api.get<QuizQuestion[]>(`/quiz-questions?${params.toString()}`)
      .then(setQuestions)
      .catch((err) => console.error('Error fetching questions:', err))
      .finally(() => setLoading(false));
  }, [gameType, difficulty]);

  return { questions, loading };
}

export function useBibleWords(difficulty?: Difficulty) {
  const [words, setWords] = useState<BibleWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = difficulty ? `?difficulty=${difficulty}` : '';
    api.get<BibleWord[]>(`/bible-words${qs}`)
      .then(setWords)
      .catch((err) => console.error('Error fetching words:', err))
      .finally(() => setLoading(false));
  }, [difficulty]);

  return { words, loading };
}

export function useBibleCharacters(difficulty?: Difficulty) {
  const [characters, setCharacters] = useState<BibleCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = difficulty ? `?difficulty=${difficulty}` : '';
    api.get<BibleCharacter[]>(`/bible-characters${qs}`)
      .then(setCharacters)
      .catch((err) => console.error('Error fetching characters:', err))
      .finally(() => setLoading(false));
  }, [difficulty]);

  return { characters, loading };
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
