import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useQuizQuestions, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty, QuizQuestion } from '../types/database';

interface QuizGameProps {
  onBack: () => void;
  darkMode: boolean;
}

export function QuizGame({ onBack, darkMode }: QuizGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { questions, loading } = useQuizQuestions('quiz', difficulty);
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
        saveScore('quiz', finalScore, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1500);
  }

  function getShuffledAnswers() {
    if (!currentQuestion) return [];
    const answers = [currentQuestion.correct_answer, ...currentQuestion.wrong_answers];
    return shuffleArray(answers);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Quiz Biblique"
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
        title="Quiz Biblique"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={initGame}
        darkMode={darkMode}
      >
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Aucune question disponible pour ce niveau.
        </div>
      </GameWrapper>
    );
  }

  return (
    <GameWrapper
      title="Quiz Biblique"
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
              Question {currentIndex + 1}/{gameQuestions.length}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {currentQuestion.category}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / gameQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {getShuffledAnswers().map((answer, index) => {
            const isCorrect = answer === currentQuestion.correct_answer;
            const isSelected = answer === selectedAnswer;

            let buttonClass = `w-full text-left p-4 rounded-xl border-2 transition-all `;

            if (showResult) {
              if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
              } else if (isSelected) {
                buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20';
              } else {
                buttonClass += darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50';
              }
            } else {
              buttonClass += darkMode
                ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-700'
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(answer)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>{answer}</span>
                  {showResult && isCorrect && <Check className="text-green-500" size={24} />}
                  {showResult && isSelected && !isCorrect && <X className="text-red-500" size={24} />}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && currentQuestion.explanation && (
          <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
            <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              {currentQuestion.explanation}
            </p>
            {currentQuestion.verse_reference && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {currentQuestion.verse_reference}
              </p>
            )}
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
