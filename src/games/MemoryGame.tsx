import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useBibleWords, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty } from '../types/database';

interface MemoryGameProps {
  onBack: () => void;
  darkMode: boolean;
}

interface MemoryCard {
  id: number;
  content: string;
  type: 'word' | 'hint';
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const cardColors = [
  'from-blue-400 to-blue-600',
  'from-teal-400 to-teal-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-emerald-400 to-emerald-600',
  'from-cyan-400 to-cyan-600',
  'from-orange-400 to-orange-600',
  'from-sky-400 to-sky-600',
];

export function MemoryGame({ onBack, darkMode }: MemoryGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { words, loading } = useBibleWords(difficulty);
  const { saveScore } = useScore();

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [isChecking, setIsChecking] = useState(false);

  const pairCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const maxScore = pairCount;

  const initGame = useCallback(() => {
    if (words.length > 0) {
      const selectedWords = shuffleArray(words).slice(0, pairCount);
      const gameCards: MemoryCard[] = [];

      selectedWords.forEach((word, index) => {
        gameCards.push({
          id: index * 2,
          content: word.word,
          type: 'word',
          pairId: index,
          isFlipped: false,
          isMatched: false,
        });
        gameCards.push({
          id: index * 2 + 1,
          content: word.hint || word.category || 'Bible',
          type: 'hint',
          pairId: index,
          isFlipped: false,
          isMatched: false,
        });
      });

      setCards(shuffleArray(gameCards));
      setFlippedCards([]);
      setMatchedPairs(0);
      setMoves(0);
      setIsComplete(false);
      setIsChecking(false);
    }
  }, [words, pairCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  function handleCardClick(cardId: number) {
    if (isChecking) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsChecking(true);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c
          ));
          setMatchedPairs(m => {
            const newMatched = m + 1;
            if (newMatched === pairCount) {
              setIsComplete(true);
              saveScore('memory', pairCount, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
            }
            return newMatched;
          });
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Memory Chretien"
        score={matchedPairs}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
        showDifficulty={false}
      >
        <GameComplete
          score={matchedPairs}
          maxScore={maxScore}
          onRestart={initGame}
          onHome={onBack}
          darkMode={darkMode}
        />
      </GameWrapper>
    );
  }

  const gridCols = difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4';

  return (
    <GameWrapper
      title="Memory Chretien"
      score={matchedPairs}
      maxScore={maxScore}
      difficulty={difficulty}
      onDifficultyChange={(d) => { setDifficulty(d); }}
      onBack={onBack}
      onRestart={initGame}
      darkMode={darkMode}
    >
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="flex justify-between items-center mb-6">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Coups : <span className="font-bold">{moves}</span>
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Paires trouvees : <span className="font-bold text-sky-500">{matchedPairs}/{pairCount}</span>
          </div>
        </div>

        <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Trouve les paires mot / definition
        </p>

        <div className={`grid ${gridCols} gap-3`}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || isChecking}
              className={`aspect-square rounded-xl transition-all duration-300 transform ${
                card.isFlipped || card.isMatched
                  ? 'rotate-y-180'
                  : 'hover:scale-105'
              }`}
              style={{ perspective: '1000px' }}
            >
              <div
                className={`w-full h-full rounded-xl flex items-center justify-center p-2 text-center transition-all duration-300 ${
                  card.isFlipped || card.isMatched
                    ? card.isMatched
                      ? `bg-gradient-to-br ${cardColors[card.pairId % cardColors.length]} text-white shadow-lg`
                      : darkMode
                        ? 'bg-gray-600 text-white'
                        : 'bg-white border-2 border-sky-300 text-gray-800'
                    : `bg-gradient-to-br from-sky-400 to-sky-600 shadow-md hover:shadow-lg`
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <span className={`text-xs sm:text-sm font-medium ${
                    card.type === 'word' ? 'font-bold' : 'italic'
                  }`}>
                    {card.content}
                  </span>
                ) : (
                  <RotateCcw className="text-white opacity-50" size={24} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </GameWrapper>
  );
}
