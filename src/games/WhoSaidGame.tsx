import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Check, X, Quote } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useQuizQuestions, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty, QuizQuestion } from '../types/database';

interface WhoSaidGameProps {
  onBack: () => void;
  darkMode: boolean;
}

export function WhoSaidGame({ onBack, darkMode }: WhoSaidGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { questions, loading } = useQuizQuestions('who_said', difficulty);
  const { saveScore } = useScore();

  const [gameQuestions, setGameQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const initGame = useCallback(() => {
    if (questions.length > 0) {
      setGameQuestions(shuffleArray(questions).slice(0, 10));
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsComplete(false);
    }
  }, [questions]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const currentQuestion = gameQuestions[currentIndex];
  const maxScore = gameQuestions.length;

  function handleAnswer(answer: string) {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === currentQuestion.correct_answer) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentIndex < gameQuestions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        const finalScore = answer === currentQuestion.correct_answer ? score + 1 : score;
        setIsComplete(true);
        saveScore('who-said', finalScore, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
      }
    }, 2000);
  }

  function getShuffledAnswers() {
    return shuffledAnswers;
  }

  // Les reponses melangees sont figees pour la question courante :
  // recalculees uniquement quand la question change (par son id), jamais
  // a chaque re-rendu. Ca evite tout risque de decalage entre la citation
  // affichee et les options proposees.
  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion) return [];
    return shuffleArray([currentQuestion.correct_answer, ...currentQuestion.wrong_answers]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id ?? currentIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-rose-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Qui a Dit ?"
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

  if (!currentQuestion) {
    return (
      <GameWrapper
        title="Qui a Dit ?"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
      >
        <div className={`text-center py-12 ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
          Aucune question disponible pour ce niveau.
        </div>
      </GameWrapper>
    );
  }

  return (
    <GameWrapper
      title="Qui a Dit ?"
      score={score}
      maxScore={maxScore}
      difficulty={difficulty}
      onDifficultyChange={(d) => { setDifficulty(d); }}
      onBack={onBack}
      onRestart={initGame}
      darkMode={darkMode}
    >
      <div key={currentQuestion.id ?? currentIndex} className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              Citation {currentIndex + 1}/{gameQuestions.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / gameQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`relative py-8 px-6 rounded-xl mb-6 ${darkMode ? 'bg-gradient-to-br from-rose-900/20 to-pink-900/20' : 'bg-gradient-to-br from-rose-50 to-pink-50'}`}>
          <Quote className={`absolute top-4 left-4 ${darkMode ? 'text-rose-700' : 'text-rose-200'}`} size={40} />
          <Quote className={`absolute bottom-4 right-4 rotate-180 ${darkMode ? 'text-rose-700' : 'text-rose-200'}`} size={40} />
          <p className={`text-lg italic text-center relative z-10 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            "{currentQuestion.question}"
          </p>
        </div>

        <p className={`text-center mb-4 font-medium ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
          Qui a prononcé ces paroles ?
        </p>

        <div className="grid grid-cols-2 gap-3">
          {getShuffledAnswers().map((answer, index) => {
            const isCorrect = answer === currentQuestion.correct_answer;
            const isSelected = answer === selectedAnswer;

            let buttonClass = `p-4 rounded-xl border-2 transition-all text-center font-medium `;

            if (showResult) {
              if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
              } else if (isSelected) {
                buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
              } else {
                buttonClass += darkMode ? 'border-gold/10 bg-ink/40 text-parchment/50' : 'border-gold-dim/15 bg-parchment-dim text-ink/40';
              }
            } else {
              buttonClass += darkMode
                ? 'border-gray-700 hover:border-rose-500 hover:bg-rose-900/20 text-white'
                : 'border-gray-200 hover:border-rose-500 hover:bg-rose-50 text-gray-800';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(answer)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{answer}</span>
                  {showResult && isCorrect && <Check className="text-green-500" size={20} />}
                  {showResult && isSelected && !isCorrect && <X className="text-red-500" size={20} />}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200'} border`}>
            <p className={`text-sm ${darkMode ? 'text-rose-300' : 'text-rose-800'}`}>
              {currentQuestion.explanation}
            </p>
            {currentQuestion.verse_reference && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                {currentQuestion.verse_reference}
              </p>
            )}
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
