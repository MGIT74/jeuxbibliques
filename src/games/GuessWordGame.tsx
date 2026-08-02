import { useState, useEffect, useCallback } from 'react';
import { Loader2, HelpCircle, Heart, Check, Sparkles } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useBibleWords, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import { useCards } from '../contexts/CardsContext';
import type { Difficulty, BibleWord } from '../types/database';

interface GuessWordGameProps {
  onBack: () => void;
  darkMode: boolean;
}

export function GuessWordGame({ onBack, darkMode }: GuessWordGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { words, loading } = useBibleWords(difficulty);
  const { saveScore } = useScore();
  const { hearts, useHeart } = useCards();
  const [usingHeart, setUsingHeart] = useState(false);

  const [gameWords, setGameWords] = useState<BibleWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [wordComplete, setWordComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const maxWrongGuesses = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 6 : 4;
  const wordCount = 5;
  const maxScore = wordCount;

  const initGame = useCallback(() => {
    if (words.length > 0) {
      setGameWords(shuffleArray(words).slice(0, wordCount));
      setCurrentIndex(0);
      setGuessedLetters(new Set());
      setWrongGuesses(0);
      setScore(0);
      setShowHint(false);
      setIsComplete(false);
      setWordComplete(false);
    }
  }, [words]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const currentWord = gameWords[currentIndex];

  const isWordGuessed = useCallback(() => {
    if (!currentWord) return false;
    const word = currentWord.word.toUpperCase();
    return [...word].every(letter =>
      letter === ' ' || letter === '-' || letter === '\'' || guessedLetters.has(letter)
    );
  }, [currentWord, guessedLetters]);

  useEffect(() => {
    if (isWordGuessed() && currentWord && !wordComplete) {
      setWordComplete(true);
      setScore(s => s + 1);

      setTimeout(() => {
        if (currentIndex < gameWords.length - 1) {
          setCurrentIndex(i => i + 1);
          setGuessedLetters(new Set());
          setWrongGuesses(0);
          setShowHint(false);
          setWordComplete(false);
        } else {
          setIsComplete(true);
          saveScore('guess-word', score + 1, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1500);
    }
  }, [isWordGuessed, currentWord, wordComplete, currentIndex, gameWords.length, score, maxScore, difficulty, startTime, saveScore]);

  useEffect(() => {
    if (wrongGuesses >= maxWrongGuesses && !wordComplete) {
      setTimeout(() => {
        if (currentIndex < gameWords.length - 1) {
          setCurrentIndex(i => i + 1);
          setGuessedLetters(new Set());
          setWrongGuesses(0);
          setShowHint(false);
          setWordComplete(false);
        } else {
          setIsComplete(true);
          saveScore('guess-word', score, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1500);
    }
  }, [wrongGuesses, maxWrongGuesses, wordComplete, currentIndex, gameWords.length, score, maxScore, difficulty, startTime, saveScore]);

  function handleLetterClick(letter: string) {
    if (guessedLetters.has(letter) || wrongGuesses >= maxWrongGuesses || wordComplete) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (currentWord && !currentWord.word.toUpperCase().includes(letter)) {
      setWrongGuesses(w => w + 1);
    }
  }

  // Utilise un coeur bonus (gagne via la collection de cartes, distinct des
  // essais restants) pour reveler gratuitement une lettre non encore trouvee.
  async function handleUseHeart() {
    if (!currentWord || usingHeart || hearts <= 0 || wordComplete || wrongGuesses >= maxWrongGuesses) return;

    const word = currentWord.word.toUpperCase();
    const remaining = [...new Set([...word])].filter(
      (l) => l !== ' ' && l !== '-' && l !== '\'' && !guessedLetters.has(l)
    );
    if (remaining.length === 0) return;

    setUsingHeart(true);
    const success = await useHeart();
    if (success) {
      const letter = remaining[Math.floor(Math.random() * remaining.length)];
      setGuessedLetters((prev) => new Set(prev).add(letter));
    }
    setUsingHeart(false);
  }

  function renderWord() {
    if (!currentWord) return null;
    const word = currentWord.word.toUpperCase();

    return (
      <div className="flex flex-wrap justify-center gap-2">
        {[...word].map((letter, index) => {
          const isSpecial = letter === ' ' || letter === '-' || letter === '\'';
          const isRevealed = isSpecial || guessedLetters.has(letter) || wrongGuesses >= maxWrongGuesses;

          return (
            <div
              key={index}
              className={`w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg transition-all ${
                isSpecial
                  ? ''
                  : isRevealed
                    ? guessedLetters.has(letter)
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : darkMode
                      ? 'bg-gray-700 border-2 border-gray-600'
                      : 'bg-gray-100 border-2 border-gray-300'
              }`}
            >
              {isRevealed ? letter : ''}
            </div>
          );
        })}
      </div>
    );
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-lapis" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Devine le Mot"
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

  if (!currentWord) {
    return (
      <GameWrapper
        title="Devine le Mot"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
      >
        <div className={`text-center py-12 ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
          Aucun mot disponible pour ce niveau.
        </div>
      </GameWrapper>
    );
  }

  return (
    <GameWrapper
      title="Devine le Mot"
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
              Mot {currentIndex + 1}/{gameWords.length}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: maxWrongGuesses }).map((_, i) => (
                <Heart
                  key={i}
                  size={20}
                  className={i < maxWrongGuesses - wrongGuesses
                    ? 'text-red-500 fill-red-500'
                    : 'text-gray-300 dark:text-gray-600'
                  }
                />
              ))}
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / gameWords.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`text-center py-6 px-4 rounded-xl mb-6 ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}>
          {currentWord.category && (
            <span className={`text-xs px-3 py-1 rounded-full mb-4 inline-block ${darkMode ? 'bg-blue-900/40 text-lapis-bright' : 'bg-blue-100 text-lapis-dim'}`}>
              {currentWord.category}
            </span>
          )}
          <div className="mt-4">
            {renderWord()}
          </div>
        </div>

        {wordComplete && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <Check className="text-green-500" size={24} />
            <span className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              Bravo !
            </span>
          </div>
        )}

        {wrongGuesses >= maxWrongGuesses && !wordComplete && (
          <div className={`mb-6 p-4 rounded-xl text-center ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <span className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              Le mot etait : {currentWord.word}
            </span>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setShowHint(!showHint)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <HelpCircle size={18} />
            {showHint ? 'Masquer l\'indice' : 'Voir l\'indice'}
          </button>

          <button
            onClick={handleUseHeart}
            disabled={usingHeart || hearts <= 0 || wordComplete || wrongGuesses >= maxWrongGuesses}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors bg-coral/10 hover:bg-coral/20 text-coral disabled:opacity-40 disabled:cursor-not-allowed"
            title={hearts <= 0 ? 'Gagne des cœurs bonus en débloquant des cartes dans ta collection' : 'Révèle une lettre au hasard'}
          >
            <Sparkles size={18} />
            Révéler une lettre
            <span className="flex items-center gap-1 font-semibold">
              <Heart size={14} className="fill-coral" />
              {hearts}
            </span>
          </button>
        </div>
        {showHint && currentWord.hint && (
          <p className={`text-center -mt-3 mb-6 text-sm italic ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
            Indice : {currentWord.hint}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {alphabet.map((letter) => {
            const isGuessed = guessedLetters.has(letter);
            const isInWord = currentWord.word.toUpperCase().includes(letter);
            const isDisabled = isGuessed || wrongGuesses >= maxWrongGuesses || wordComplete;

            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                disabled={isDisabled}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-sm sm:text-base transition-all ${
                  isGuessed
                    ? isInWord
                      ? 'bg-green-500 text-white'
                      : 'bg-red-400 text-white opacity-50'
                    : darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-30'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </GameWrapper>
  );
}
