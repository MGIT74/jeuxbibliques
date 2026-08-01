import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useVerses, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty, Verse } from '../types/database';

interface CompleteVerseGameProps {
  onBack: () => void;
  darkMode: boolean;
}

interface BlankWord {
  index: number;
  word: string;
  userAnswer: string;
}

export function CompleteVerseGame({ onBack, darkMode }: CompleteVerseGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { verses, loading } = useVerses(difficulty);
  const { saveScore } = useScore();

  const [gameVerses, setGameVerses] = useState<Verse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blanks, setBlanks] = useState<BlankWord[]>([]);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const blankCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

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
      const words = gameVerses[currentIndex].text
        .replace(/[.,;:!?]/g, '')
        .split(' ')
        .filter(w => w.length >= 3);

      const selectedIndices: number[] = [];
      const fullWords = gameVerses[currentIndex].text.split(' ');

      while (selectedIndices.length < Math.min(blankCount, words.length)) {
        const wordIndex = Math.floor(Math.random() * fullWords.length);
        const word = fullWords[wordIndex].replace(/[.,;:!?]/g, '');
        if (word.length >= 3 && !selectedIndices.includes(wordIndex)) {
          selectedIndices.push(wordIndex);
        }
      }

      const newBlanks = selectedIndices.sort((a, b) => a - b).map(idx => ({
        index: idx,
        word: fullWords[idx].replace(/[.,;:!?]/g, ''),
        userAnswer: '',
      }));

      setBlanks(newBlanks);

      const correctWords = newBlanks.map(b => b.word);
      const distractors = words
        .filter(w => !correctWords.includes(w))
        .slice(0, blankCount);
      setWordOptions(shuffleArray([...correctWords, ...distractors]));
      setShowResult(false);
    }
  }, [currentIndex, gameVerses, blankCount]);

  const currentVerse = gameVerses[currentIndex];
  const maxScore = gameVerses.length;

  function handleWordSelect(word: string, blankIndex: number) {
    if (showResult) return;

    const previousWord = blanks[blankIndex].userAnswer;

    setBlanks(prev => prev.map((blank, idx) =>
      idx === blankIndex ? { ...blank, userAnswer: word } : blank
    ));

    if (previousWord) {
      setWordOptions(prev => [...prev, previousWord]);
    }
    setWordOptions(prev => prev.filter(w => w !== word));
  }

  function clearBlank(blankIndex: number) {
    if (showResult) return;

    const word = blanks[blankIndex].userAnswer;
    if (word) {
      setBlanks(prev => prev.map((blank, idx) =>
        idx === blankIndex ? { ...blank, userAnswer: '' } : blank
      ));
      setWordOptions(prev => [...prev, word]);
    }
  }

  function checkAnswer() {
    const allCorrect = blanks.every(blank =>
      blank.userAnswer.toLowerCase() === blank.word.toLowerCase()
    );

    setShowResult(true);

    if (allCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentIndex < gameVerses.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        const finalScore = allCorrect ? score + 1 : score;
        setIsComplete(true);
        saveScore('complete-verse', finalScore, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
      }
    }, 2000);
  }

  function renderVerse() {
    if (!currentVerse) return null;

    const words = currentVerse.text.split(' ');
    let blankCounter = 0;

    return (
      <div className="flex flex-wrap gap-2 justify-center items-center leading-loose">
        {words.map((word, idx) => {
          const blankIndex = blanks.findIndex(b => b.index === idx);

          if (blankIndex !== -1) {
            const blank = blanks[blankIndex];
            const isCorrect = showResult && blank.userAnswer.toLowerCase() === blank.word.toLowerCase();
            const isWrong = showResult && blank.userAnswer && blank.userAnswer.toLowerCase() !== blank.word.toLowerCase();
            blankCounter++;

            return (
              <div key={idx} className="relative">
                <button
                  onClick={() => blank.userAnswer && clearBlank(blankIndex)}
                  className={`min-w-[80px] px-3 py-2 rounded-lg border-2 border-dashed transition-all ${
                    showResult
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : isWrong
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      : blank.userAnswer
                        ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-lime-400'
                  }`}
                >
                  {blank.userAnswer ? (
                    <span className={`font-medium ${
                      showResult
                        ? isCorrect
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                        : 'text-lime-700 dark:text-lime-300'
                    }`}>
                      {blank.userAnswer}
                    </span>
                  ) : (
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      _{blankCounter}_
                    </span>
                  )}
                  {showResult && isCorrect && (
                    <Check className="absolute -top-2 -right-2 w-5 h-5 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                  )}
                  {showResult && isWrong && (
                    <X className="absolute -top-2 -right-2 w-5 h-5 text-red-500 bg-white dark:bg-gray-800 rounded-full" />
                  )}
                </button>
                {showResult && isWrong && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                    {blank.word}
                  </div>
                )}
              </div>
            );
          }

          return (
            <span key={idx} className={darkMode ? 'text-white' : 'text-gray-800'}>
              {word}
            </span>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-lime-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Complete le Verset"
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
        title="Complete le Verset"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
      >
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Aucun verset disponible pour ce niveau.
        </div>
      </GameWrapper>
    );
  }

  const allFilled = blanks.every(b => b.userAnswer !== '');

  return (
    <GameWrapper
      title="Complete le Verset"
      score={score}
      maxScore={maxScore}
      difficulty={difficulty}
      onDifficultyChange={(d) => { setDifficulty(d); }}
      onBack={onBack}
      onRestart={initGame}
      darkMode={darkMode}
    >
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Verset {currentIndex + 1}/{gameVerses.length}
            </span>
            <span className={`text-sm font-medium ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
              {currentVerse.reference}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-500 to-green-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / gameVerses.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`py-8 px-4 rounded-xl mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          {renderVerse()}
        </div>

        <div className="mb-6">
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Mots disponibles :
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {wordOptions.map((word, idx) => {
              const targetBlank = blanks.findIndex(b => b.userAnswer === '');

              return (
                <button
                  key={`${word}-${idx}`}
                  onClick={() => targetBlank !== -1 && handleWordSelect(word, targetBlank)}
                  disabled={showResult || targetBlank === -1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    darkMode
                      ? 'bg-gray-600 text-white hover:bg-lime-600 disabled:opacity-50'
                      : 'bg-gray-200 text-gray-800 hover:bg-lime-200 disabled:opacity-50'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        {!showResult && allFilled && (
          <button
            onClick={checkAnswer}
            className="w-full py-3 bg-gradient-to-r from-lime-500 to-green-500 text-white rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Verifier ma reponse
          </button>
        )}

        {showResult && (
          <div className={`p-4 rounded-xl ${
            blanks.every(b => b.userAnswer.toLowerCase() === b.word.toLowerCase())
              ? darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              : darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          } border text-center`}>
            <p className={`font-medium ${
              blanks.every(b => b.userAnswer.toLowerCase() === b.word.toLowerCase())
                ? darkMode ? 'text-green-300' : 'text-green-800'
                : darkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              {blanks.every(b => b.userAnswer.toLowerCase() === b.word.toLowerCase())
                ? 'Parfait !'
                : 'Pas tout a fait...'}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
