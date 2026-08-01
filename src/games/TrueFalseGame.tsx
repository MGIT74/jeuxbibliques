import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useQuizQuestions, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty, QuizQuestion } from '../types/database';

interface TrueFalseGameProps {
  onBack: () => void;
  darkMode: boolean;
}

export function TrueFalseGame({ onBack, darkMode }: TrueFalseGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { questions, loading } = useQuizQuestions('true_false', difficulty);
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
        saveScore('true-false', finalScore, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Vrai ou Faux"
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
        title="Vrai ou Faux"
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
      title="Vrai ou Faux"
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
              Question {currentIndex + 1}/{gameQuestions.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / gameQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`text-center py-8 px-4 rounded-xl mb-6 ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            {currentQuestion.question}
          </h3>
        </div>

        <div className="flex gap-4 justify-center">
          {['Vrai', 'Faux'].map((answer) => {
            const isCorrect = answer === currentQuestion.correct_answer;
            const isSelected = answer === selectedAnswer;
            const isVrai = answer === 'Vrai';

            let buttonClass = `flex-1 max-w-[200px] p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 `;

            if (showResult) {
              if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
              } else if (isSelected) {
                buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20';
              } else {
                buttonClass += darkMode ? 'border-gold/10 bg-ink/40' : 'border-gold-dim/15 bg-parchment-dim';
              }
            } else {
              buttonClass += isVrai
                ? (darkMode ? 'border-green-700 hover:border-green-500 hover:bg-green-900/20' : 'border-green-200 hover:border-green-500 hover:bg-green-50')
                : (darkMode ? 'border-red-700 hover:border-red-500 hover:bg-red-900/20' : 'border-red-200 hover:border-red-500 hover:bg-red-50');
            }

            return (
              <button
                key={answer}
                onClick={() => handleAnswer(answer)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isVrai ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
                }`}>
                  {isVrai
                    ? <ThumbsUp className="text-green-500" size={32} />
                    : <ThumbsDown className="text-red-500" size={32} />
                  }
                </div>
                <span className={`text-xl font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  {answer}
                </span>
                {showResult && isCorrect && <Check className="text-green-500" size={24} />}
                {showResult && isSelected && !isCorrect && <X className="text-red-500" size={24} />}
              </button>
            );
          })}
        </div>

        {showResult && currentQuestion.explanation && (
          <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-200'} border`}>
            <p className={`text-sm ${darkMode ? 'text-teal-300' : 'text-teal-800'}`}>
              {currentQuestion.explanation}
            </p>
            {currentQuestion.verse_reference && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                {currentQuestion.verse_reference}
              </p>
            )}
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
