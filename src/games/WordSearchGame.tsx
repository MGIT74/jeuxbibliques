import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { GameComplete } from '../components/shared/GameComplete';
import { useBibleWords, shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty } from '../types/database';

interface WordSearchGameProps {
  onBack: () => void;
  darkMode: boolean;
}

interface Cell {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  isFound: boolean;
  wordIndex: number | null;
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

const wordColors = [
  'bg-emerald-200 dark:bg-emerald-800',
  'bg-blue-200 dark:bg-blue-800',
  'bg-amber-200 dark:bg-amber-800',
  'bg-rose-200 dark:bg-rose-800',
  'bg-cyan-200 dark:bg-cyan-800',
  'bg-orange-200 dark:bg-orange-800',
  'bg-teal-200 dark:bg-teal-800',
  'bg-pink-200 dark:bg-pink-800',
];

export function WordSearchGame({ onBack, darkMode }: WordSearchGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { words, loading } = useBibleWords(difficulty);
  const { saveScore } = useScore();

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<{ word: string; found: boolean }[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const gridSize = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : 12;
  const wordCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const maxScore = wordCount;

  const generateGrid = useCallback(() => {
    if (words.length === 0) return;

    const selectedWords = shuffleArray(words)
      .filter(w => w.word.length <= gridSize)
      .slice(0, wordCount)
      .map(w => w.word.toUpperCase());

    const newGrid: Cell[][] = Array(gridSize).fill(null).map((_, row) =>
      Array(gridSize).fill(null).map((_, col) => ({
        letter: '',
        row,
        col,
        isSelected: false,
        isFound: false,
        wordIndex: null,
      }))
    );

    function canPlaceWord(word: string, startRow: number, startCol: number, direction: number[]): boolean {
      const [dr, dc] = direction;
      for (let i = 0; i < word.length; i++) {
        const newRow = startRow + dr * i;
        const newCol = startCol + dc * i;
        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) return false;
        const cell = newGrid[newRow][newCol];
        if (cell.letter !== '' && cell.letter !== word[i]) return false;
      }
      return true;
    }

    function placeWord(word: string, startRow: number, startCol: number, direction: number[], wordIdx: number): void {
      const [dr, dc] = direction;
      for (let i = 0; i < word.length; i++) {
        const newRow = startRow + dr * i;
        const newCol = startCol + dc * i;
        newGrid[newRow][newCol].letter = word[i];
        newGrid[newRow][newCol].wordIndex = wordIdx;
      }
    }

    selectedWords.forEach((word, wordIdx) => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startRow = Math.floor(Math.random() * gridSize);
        const startCol = Math.floor(Math.random() * gridSize);
        if (canPlaceWord(word, startRow, startCol, direction)) {
          placeWord(word, startRow, startCol, direction, wordIdx);
          placed = true;
        }
        attempts++;
      }
    });

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (newGrid[row][col].letter === '') {
          newGrid[row][col].letter = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(newGrid);
    setWordsToFind(selectedWords.map(word => ({ word, found: false })));
    setScore(0);
    setIsComplete(false);
    setSelectedCells([]);
  }, [words, gridSize, wordCount]);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  function handleCellMouseDown(row: number, col: number) {
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
    setGrid(prev => prev.map((r, ri) =>
      r.map((c, ci) => ({
        ...c,
        isSelected: ri === row && ci === col,
      }))
    ));
  }

  function handleCellMouseEnter(row: number, col: number) {
    if (!isSelecting) return;

    const start = selectedCells[0];
    if (!start) return;

    const dr = Math.sign(row - start.row);
    const dc = Math.sign(col - start.col);

    if (dr === 0 && dc === 0) return;

    const isDiagonal = dr !== 0 && dc !== 0;
    const isHorizontal = dr === 0;
    const isVertical = dc === 0;

    if (!isDiagonal && !isHorizontal && !isVertical) return;

    const newSelected: { row: number; col: number }[] = [];
    let currentRow = start.row;
    let currentCol = start.col;

    while (
      currentRow >= 0 && currentRow < gridSize &&
      currentCol >= 0 && currentCol < gridSize
    ) {
      newSelected.push({ row: currentRow, col: currentCol });
      if (currentRow === row && currentCol === col) break;
      currentRow += dr;
      currentCol += dc;
    }

    setSelectedCells(newSelected);
    setGrid(prev => prev.map((r, ri) =>
      r.map((c, ci) => ({
        ...c,
        isSelected: newSelected.some(s => s.row === ri && s.col === ci),
      }))
    ));
  }

  function handleCellMouseUp() {
    if (!isSelecting) return;
    setIsSelecting(false);

    const selectedWord = selectedCells
      .map(({ row, col }) => grid[row][col].letter)
      .join('');

    const wordIndex = wordsToFind.findIndex(
      w => !w.found && (w.word === selectedWord || w.word === selectedWord.split('').reverse().join(''))
    );

    if (wordIndex !== -1) {
      setWordsToFind(prev => prev.map((w, i) =>
        i === wordIndex ? { ...w, found: true } : w
      ));

      setGrid(prev => prev.map((r, ri) =>
        r.map((c, ci) => ({
          ...c,
          isFound: c.isFound || selectedCells.some(s => s.row === ri && s.col === ci),
          isSelected: false,
          wordIndex: selectedCells.some(s => s.row === ri && s.col === ci) ? wordIndex : c.wordIndex,
        }))
      ));

      const newScore = score + 1;
      setScore(newScore);

      if (newScore === wordCount) {
        setIsComplete(true);
        saveScore('word-search', newScore, maxScore, difficulty, Math.floor((Date.now() - startTime) / 1000));
      }
    } else {
      setGrid(prev => prev.map(r =>
        r.map(c => ({ ...c, isSelected: false }))
      ));
    }

    setSelectedCells([]);
  }

  // --- Support tactile (mobile / tablette) ---
  // Sur mobile, "touchmove" ne se declenche que sur l'element ou le doigt
  // a pose (pas sur celui survole), contrairement a "mouseenter" sur
  // desktop. On retrouve donc la cellule sous le doigt via elementFromPoint
  // a chaque mouvement, en s'appuyant sur les attributs data-row/data-col.
  function getCellFromTouch(touch: React.Touch): { row: number; col: number } | null {
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const cellEl = el?.closest('[data-row]') as HTMLElement | null;
    if (!cellEl) return null;
    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
  }

  function handleGridTouchStart(e: React.TouchEvent) {
    const cell = getCellFromTouch(e.touches[0]);
    if (cell) handleCellMouseDown(cell.row, cell.col);
  }

  function handleGridTouchMove(e: React.TouchEvent) {
    const cell = getCellFromTouch(e.touches[0]);
    if (cell) handleCellMouseEnter(cell.row, cell.col);
  }

  function handleGridTouchEnd() {
    handleCellMouseUp();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <GameWrapper
        title="Mots Meles Bibliques"
        score={score}
        maxScore={maxScore}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onBack={onBack}
        onRestart={generateGrid}
        darkMode={darkMode}
        showDifficulty={false}
      >
        <GameComplete
          score={score}
          maxScore={maxScore}
          onRestart={generateGrid}
          onHome={onBack}
          darkMode={darkMode}
        />
      </GameWrapper>
    );
  }

  return (
    <GameWrapper
      title="Mots Meles Bibliques"
      score={score}
      maxScore={maxScore}
      difficulty={difficulty}
      onDifficultyChange={(d) => { setDifficulty(d); }}
      onBack={onBack}
      onRestart={generateGrid}
      darkMode={darkMode}
    >
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <p className={`text-center mb-6 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
          Trouve tous les mots caches dans la grille
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {wordsToFind.map((w, idx) => (
            <span
              key={w.word}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                w.found
                  ? `${wordColors[idx % wordColors.length]} line-through opacity-75`
                  : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {w.word}
              {w.found && <Check className="inline ml-1" size={14} />}
            </span>
          ))}
        </div>

        <div
          className="inline-block mx-auto select-none touch-none"
          style={{ touchAction: 'none' }}
          onMouseLeave={() => {
            if (isSelecting) {
              handleCellMouseUp();
            }
          }}
          onTouchStart={handleGridTouchStart}
          onTouchMove={handleGridTouchMove}
          onTouchEnd={handleGridTouchEnd}
          onTouchCancel={handleGridTouchEnd}
        >
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {grid.map((row, ri) =>
              row.map((cell, ci) => (
                  <button
                    key={`${ri}-${ci}`}
                    data-row={ri}
                    data-col={ci}
                    onMouseDown={() => handleCellMouseDown(ri, ci)}
                    onMouseEnter={() => handleCellMouseEnter(ri, ci)}
                    onMouseUp={handleCellMouseUp}
                    className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center font-bold text-sm sm:text-base rounded transition-all ${
                      cell.isSelected
                        ? 'bg-emerald-400 text-white scale-110'
                        : cell.isFound
                          ? `${wordColors[cell.wordIndex !== null ? cell.wordIndex % wordColors.length : 0]} ${darkMode ? 'text-parchment' : 'text-ink'}`
                          : darkMode
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {cell.letter}
                  </button>
              ))
            )}
          </div>
        </div>

        <p className={`text-center mt-6 text-sm ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
          Clique (ou touche) et glisse pour sélectionner un mot
        </p>
      </div>
    </GameWrapper>
  );
}
