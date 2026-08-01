import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X, Link2 } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useBibleCharacters, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty, BibleCharacter } from '../types/database';

interface CharacterMatchGameProps {
  onBack: () => void;
  darkMode: boolean;
}

interface MatchItem {
  character: BibleCharacter;
  selectedStory: string | null;
  isCorrect: boolean | null;
}

export function CharacterMatchGame({ onBack, darkMode }: CharacterMatchGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { characters, loading } = useBibleCharacters(difficulty);
  const { saveScore } = useScore();

  const [matchItems, setMatchItems] = useState<MatchItem[]>([]);
  const [availableStories, setAvailableStories] = useState<string[]>([]);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const itemCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const maxScore = itemCount;

  const initGame = useCallback(() => {
    if (characters.length > 0) {
      const selected = shuffleArray(characters).slice(0, itemCount);
      setMatchItems(selected.map(char => ({
        character: char,
        selectedStory: null,
        isCorrect: null,
      })));
      setAvailableStories(shuffleArray(selected.map(char => char.story_title)));
      setSelectedCharacterIndex(null);
      setScore(0);
      setShowResults(false);
      setIsComplete(false);
    }
  }, [characters, itemCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  function handleCharacterClick(index: number) {
    if (showResults || matchItems[index].selectedStory) return;
    setSelectedCharacterIndex(index);
  }

  function handleStoryClick(story: string) {
    if (showResults || selectedCharacterIndex === null) return;

    setMatchItems(prev => prev.map((item, idx) =>
      idx === selectedCharacterIndex ? { ...item, selectedStory: story } : item
    ));
    setAvailableStories(prev => prev.filter(s => s !== story));
    setSelectedCharacterIndex(null);
  }

  function checkAnswers() {
    let correctCount = 0;
    const results = matchItems.map(item => {
      const isCorrect = item.selectedStory === item.character.story_title;
      if (isCorrect) correctCount++;
      return { ...item, isCorrect };
    });

    setMatchItems(results);
    setScore(correctCount);
    setShowResults(true);

    setTimeout(() => {
      setIsComplete(true);
      saveScore('character-match', correctCount, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
    }, 2000);
  }

  function removeMatch(index: number) {
    if (showResults) return;

    const story = matchItems[index].selectedStory;
    if (story) {
      setMatchItems(prev => prev.map((item, idx) =>
        idx === index ? { ...item, selectedStory: null } : item
      ));
      setAvailableStories(prev => [...prev, story]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-cyan-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Associe le Personnage"
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

  const allMatched = matchItems.every(item => item.selectedStory !== null);

  return (
    <GameWrapper
      title="Associe le Personnage"
      score={score}
      maxScore={maxScore}
      difficulty={difficulty}
      onDifficultyChange={(d) => { setDifficulty(d); }}
      onBack={onBack}
      onRestart={initGame}
      darkMode={darkMode}
    >
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Relie chaque personnage biblique a son histoire
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Personnages
            </h3>
            <div className="space-y-3">
              {matchItems.map((item, index) => (
                <button
                  key={item.character.id}
                  onClick={() => handleCharacterClick(index)}
                  disabled={showResults || item.selectedStory !== null}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    showResults
                      ? item.isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : selectedCharacterIndex === index
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : item.selectedStory
                          ? darkMode
                            ? 'border-gray-600 bg-gray-700'
                            : 'border-gray-300 bg-gray-100'
                          : darkMode
                            ? 'border-gray-600 hover:border-cyan-500 hover:bg-cyan-900/20'
                            : 'border-gray-200 hover:border-cyan-500 hover:bg-cyan-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {item.character.name}
                      </span>
                      {item.character.book && (
                        <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({item.character.book})
                        </span>
                      )}
                    </div>
                    {showResults && (
                      item.isCorrect
                        ? <Check className="text-green-500" size={20} />
                        : <X className="text-red-500" size={20} />
                    )}
                  </div>
                  {item.selectedStory && (
                    <div className="mt-2 flex items-center gap-2">
                      <Link2 size={14} className="text-cyan-500" />
                      <span className={`text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {item.selectedStory}
                      </span>
                      {!showResults && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMatch(index); }}
                          className="ml-auto text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Histoires
            </h3>
            <div className="space-y-3">
              {availableStories.map((story) => (
                <button
                  key={story}
                  onClick={() => handleStoryClick(story)}
                  disabled={showResults || selectedCharacterIndex === null}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedCharacterIndex !== null
                      ? darkMode
                        ? 'border-cyan-600 bg-cyan-900/20 hover:bg-cyan-900/40'
                        : 'border-cyan-300 bg-cyan-50 hover:bg-cyan-100'
                      : darkMode
                        ? 'border-gray-600 bg-gray-700'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                    {story}
                  </span>
                </button>
              ))}
              {availableStories.length === 0 && !showResults && (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Toutes les histoires ont ete associees
                </p>
              )}
            </div>
          </div>
        </div>

        {!showResults && allMatched && (
          <button
            onClick={checkAnswers}
            className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Verifier mes reponses
          </button>
        )}

        {showResults && (
          <div className={`mt-6 p-4 rounded-xl ${
            score === maxScore
              ? darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              : darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'
          } border text-center`}>
            <p className={`font-medium ${
              score === maxScore
                ? darkMode ? 'text-green-300' : 'text-green-800'
                : darkMode ? 'text-amber-300' : 'text-amber-800'
            }`}>
              {score === maxScore ? 'Parfait !' : `${score}/${maxScore} bonnes reponses`}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
