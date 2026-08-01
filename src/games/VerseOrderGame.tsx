import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, ArrowRight, GripVertical } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useVerses, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty, Verse } from '../types/database';

interface VerseOrderGameProps {
  onBack: () => void;
  darkMode: boolean;
}

interface DraggableWord {
  id: number;
  word: string;
}

export function VerseOrderGame({ onBack, darkMode }: VerseOrderGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { verses, loading } = useVerses(difficulty);
  const { saveScore } = useScore();

  const [gameVerses, setGameVerses] = useState<Verse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [words, setWords] = useState<DraggableWord[]>([]);
  const [orderedWords, setOrderedWords] = useState<DraggableWord[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [draggedItem, setDraggedItem] = useState<DraggableWord | null>(null);

  const initGame = useCallback(() => {
    if (verses.length > 0) {
      setGameVerses(shuffleArray(verses).slice(0, 5));
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setIsComplete(false);
    }
  }, [verses]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (gameVerses[currentIndex]) {
      const verseWords = gameVerses[currentIndex].text
        .replace(/[.,;:!?]/g, '')
        .split(' ')
        .filter(w => w.length > 0)
        .slice(0, difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10)
        .map((word, index) => ({ id: index, word }));
      setWords(shuffleArray(verseWords));
      setOrderedWords([]);
      setShowResult(false);
      setIsCorrect(false);
    }
  }, [currentIndex, gameVerses, difficulty]);

  const currentVerse = gameVerses[currentIndex];
  const maxScore = gameVerses.length;

  function handleWordClick(word: DraggableWord, fromOrdered: boolean) {
    if (showResult) return;

    if (fromOrdered) {
      setOrderedWords(prev => prev.filter(w => w.id !== word.id));
      setWords(prev => [...prev, word]);
    } else {
      setWords(prev => prev.filter(w => w.id !== word.id));
      setOrderedWords(prev => [...prev, word]);
    }
  }

  function handleDragStart(word: DraggableWord) {
    setDraggedItem(word);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDropToOrdered(e: React.DragEvent) {
    e.preventDefault();
    if (draggedItem && words.some(w => w.id === draggedItem.id)) {
      setWords(prev => prev.filter(w => w.id !== draggedItem.id));
      setOrderedWords(prev => [...prev, draggedItem]);
    }
    setDraggedItem(null);
  }

  function handleDropToWords(e: React.DragEvent) {
    e.preventDefault();
    if (draggedItem && orderedWords.some(w => w.id === draggedItem.id)) {
      setOrderedWords(prev => prev.filter(w => w.id !== draggedItem.id));
      setWords(prev => [...prev, draggedItem]);
    }
    setDraggedItem(null);
  }

  function checkAnswer() {
    if (!currentVerse) return;

    const originalWords = currentVerse.text
      .replace(/[.,;:!?]/g, '')
      .split(' ')
      .filter(w => w.length > 0)
      .slice(0, difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10);

    const userOrder = orderedWords.map(w => w.word);
    const correct = JSON.stringify(userOrder) === JSON.stringify(originalWords);

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentIndex < gameVerses.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        const finalScore = correct ? score + 1 : score;
        setIsComplete(true);
        saveScore('verse-order', finalScore, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
      }
    }, 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Remets dans l'Ordre"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
        showDifficulty={false}
      >
        <GameComplete
          score={score}
          maxScore={maxScore}
          onRestart={initGame}
          onHome={onBack}
          darkMode={darkMode}
        />
      </GameWrapper>
    );
  }

  if (!currentVerse) {
    return (
      <GameWrapper
        title="Remets dans l'Ordre"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
      >
        <div className={`text-center py-12 ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
          Aucun verset disponible pour ce niveau.
        </div>
      </GameWrapper>
    );
  }

  return (
    <GameWrapper
      title="Remets dans l'Ordre"
      score={score}
      maxScore={maxScore}
      difficulty={difficulty}
      onDifficultyChange={(d) => { setDifficulty(d); }}
      onBack={onBack}
      onRestart={initGame}
      darkMode={darkMode}
    >
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              Verset {currentIndex + 1}/{gameVerses.length}
            </span>
            <span className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              {currentVerse.reference}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / gameVerses.length) * 100}%` }}
            />
          </div>
        </div>

        <p className={`text-center mb-6 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
          Remets les mots dans le bon ordre pour reconstituer le verset
        </p>

        <div
          className={`min-h-[100px] p-4 rounded-xl border-2 border-dashed mb-6 transition-colors ${
            showResult
              ? isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : darkMode
                ? 'border-gray-600 bg-gray-700/50'
                : 'border-gray-300 bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDropToOrdered}
        >
          <p className={`text-sm mb-3 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
            Ta réponse :
          </p>
          <div className="flex flex-wrap gap-2">
            {orderedWords.map((word, index) => (
              <div
                key={word.id}
                draggable={!showResult}
                onDragStart={() => handleDragStart(word)}
                onClick={() => handleWordClick(word, true)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  showResult
                    ? isCorrect
                      ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                      : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                    : 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/60'
                }`}
              >
                <GripVertical size={14} className="opacity-50" />
                <span className="font-medium">{word.word}</span>
                {index < orderedWords.length - 1 && (
                  <ArrowRight size={14} className="ml-1 opacity-50" />
                )}
              </div>
            ))}
            {orderedWords.length === 0 && (
              <span className={`text-sm italic ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
                Clique ou glisse les mots ici...
              </span>
            )}
          </div>
        </div>

        <div
          className={`min-h-[80px] p-4 rounded-xl ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}
          onDragOver={handleDragOver}
          onDrop={handleDropToWords}
        >
          <p className={`text-sm mb-3 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
            Mots disponibles :
          </p>
          <div className="flex flex-wrap gap-2">
            {words.map((word) => (
              <div
                key={word.id}
                draggable={!showResult}
                onDragStart={() => handleDragStart(word)}
                onClick={() => handleWordClick(word, false)}
                className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  darkMode
                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                    : 'bg-white text-gray-800 hover:bg-gray-200 shadow-sm'
                }`}
              >
                {word.word}
              </div>
            ))}
          </div>
        </div>

        {!showResult && words.length === 0 && orderedWords.length > 0 && (
          <button
            onClick={checkAnswer}
            className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Vérifier ma réponse
          </button>
        )}

        {showResult && (
          <div className={`mt-6 p-4 rounded-xl ${
            isCorrect
              ? darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              : darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          } border`}>
            <p className={`font-medium ${
              isCorrect
                ? darkMode ? 'text-green-300' : 'text-green-800'
                : darkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              {isCorrect ? 'Excellent !' : 'Pas tout à fait...'}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
