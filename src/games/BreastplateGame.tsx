import { useState, useEffect, useRef, useCallback } from 'react';
import { Info, Sparkles, Clock, Move, Trophy, X } from 'lucide-react';
import { GameWrapper } from '../components/shared/GameWrapper';
import { shuffleArray } from '../hooks/useGameData';
import { useScore } from '../hooks/useScore';
import type { Difficulty } from '../types/database';

interface BreastplateGameProps {
  onBack: () => void;
  darkMode: boolean;
}

// ---------------------------------------------------------------------
// Les 12 pierres du pectoral (Exode 28:17-20), dans leur ordre traditionnel
// (4 rangees de 3), chacune associee a l'une des douze tribus d'Israel
// selon l'ordre de naissance des fils de Jacob. C'est cet ordre-la (index
// 0 a 11, lecture ligne par ligne) que le joueur doit reconstituer.
// ---------------------------------------------------------------------
interface Stone {
  id: string;
  name: string;
  tribe: string;
  description: string;
  // Degrade CSS (effet gemme) + une couleur "a plat" utilisee pour
  // l'indice de couleur du niveau facile.
  from: string;
  to: string;
  flat: string;
}

const STONES: Stone[] = [
  { id: 'sardoine', name: 'Sardoine', tribe: 'Ruben', from: '#c85a3e', to: '#7a1f18', flat: '#b5342a',
    description: "Pierre rouge-orangee. Ruben etait le fils aine de Jacob et Lea." },
  { id: 'topaze', name: 'Topaze', tribe: 'Simeon', from: '#ffe38a', to: '#d9a520', flat: '#f0c33e',
    description: "Pierre jaune doree. Simeon etait le deuxieme fils de Jacob et Lea." },
  { id: 'emeraude', name: 'Emeraude', tribe: 'Levi', from: '#4fc27f', to: '#1f6b3f', flat: '#2f9d5c',
    description: "Pierre verte eclatante. Levi est l'ancetre de la tribu sacerdotale, celle des pretres." },
  { id: 'escarboucle', name: 'Escarboucle', tribe: 'Juda', from: '#a3243f', to: '#4a0714', flat: '#7a1029',
    description: "Pierre rouge fonce (grenat). Juda est l'ancetre du roi David et, selon la promesse biblique, du Messie." },
  { id: 'saphir', name: 'Saphir', tribe: 'Dan', from: '#3f72d6', to: '#0d2f7a', flat: '#2255c9',
    description: "Pierre bleue profonde. Dan etait fils de Jacob et de Bilha, servante de Rachel." },
  { id: 'diamant', name: 'Diamant', tribe: 'Nephtali', from: '#ffffff', to: '#bcd8f2', flat: '#e8f3ff',
    description: "Pierre blanche et brillante. Nephtali etait lui aussi fils de Bilha." },
  { id: 'opale', name: 'Opale', tribe: 'Gad', from: '#f6f1e8', to: '#d9c9e8', flat: '#e9dff0',
    description: "Pierre blanche irisee, aux reflets changeants. Gad etait fils de Jacob et de Zilpa, servante de Lea." },
  { id: 'agate', name: 'Agate', tribe: 'Aser', from: '#d8d2c6', to: '#8a8478', flat: '#b7b0a2',
    description: "Pierre grise et blanche veinee. Aser etait le deuxieme fils de Zilpa." },
  { id: 'amethyste', name: 'Amethyste', tribe: 'Issacar', from: '#b581e0', to: '#5b2d82', flat: '#8b4fc4',
    description: "Pierre violette. Issacar etait fils de Jacob et Lea." },
  { id: 'chrysolithe', name: 'Chrysolithe', tribe: 'Zabulon', from: '#dbe36a', to: '#8a9a1f', flat: '#b9c93f',
    description: "Pierre vert dore. Zabulon etait le dernier fils de Lea." },
  { id: 'onyx', name: 'Onyx', tribe: 'Joseph', from: '#4a4a4a', to: '#0a0a0a', flat: '#232323',
    description: "Pierre noire. Joseph, fils de Jacob et Rachel, fut vendu par ses freres puis devint gouverneur d'Egypte." },
  { id: 'jaspe', name: 'Jaspe', tribe: 'Benjamin', from: '#b06a44', to: '#5a2c18', flat: '#8a4a2a',
    description: "Pierre brun-rouge. Benjamin, le plus jeune fils de Jacob et Rachel, est ne en dernier." },
];

const SOLVED_ORDER = STONES.map((s) => s.id);
const STORAGE_KEY_PREFIX = 'pectoral_best_';

interface BestScore {
  moves: number;
  seconds: number;
}

// Petit generateur de son "cloche de reussite" via l'API Web Audio native
// (pas de fichier audio a charger : aucune dependance supplementaire).
function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Do-Mi-Sol-Do (arpege joyeux)
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Audio non disponible (navigateur restrictif) : on ignore silencieusement.
  }
}

function playClickTone() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // ignore
  }
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Petite pluie de confettis en CSS pur : un tas de rectangles colores qui
// tombent avec une rotation aleatoire. Aucune librairie externe requise.
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.4,
    color: ['#D4A537', '#3B5BA5', '#E8735C', '#F5F1E8', '#2f9d5c'][i % 5],
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[70]">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

// Une "pierre" individuelle : degrade + reflet lumineux. La lueur doree
// signale qu'elle est deja bien placee (elle devient alors verrouillee).
function StoneTile({
  stone,
  isCorrect,
  isSelected,
  showColorHint,
  spinning,
  onClick,
}: {
  stone: Stone;
  isCorrect: boolean;
  isSelected: boolean;
  showColorHint: boolean;
  spinning: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative aspect-square w-full rounded-2xl transition-transform duration-300 ${
        spinning ? 'animate-[spin_0.4s_ease-in-out]' : ''
      } ${isSelected ? 'scale-95 ring-4 ring-gold' : 'hover:scale-105'}`}
      style={{
        background: `linear-gradient(135deg, ${stone.from}, ${stone.to})`,
        boxShadow: isCorrect
          ? `0 0 0 3px #D4A537, 0 0 18px 4px rgba(212,165,55,0.65), inset 0 -6px 10px rgba(0,0,0,0.25), inset 0 6px 10px rgba(255,255,255,0.35)`
          : `0 6px 14px rgba(0,0,0,0.35), inset 0 -6px 10px rgba(0,0,0,0.25), inset 0 6px 10px rgba(255,255,255,0.35)`,
      }}
      title={stone.name}
    >
      {/* reflet brillant */}
      <span
        className="absolute top-1.5 left-1.5 w-1/3 h-1/4 rounded-full opacity-70"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.85), transparent 70%)' }}
      />
      {showColorHint && (
        <span className="absolute inset-0 rounded-2xl ring-2 ring-white/40" />
      )}
      {isCorrect && (
        <Sparkles size={16} className="absolute bottom-1.5 right-1.5 text-white drop-shadow" />
      )}
    </button>
  );
}

export function BreastplateGame({ onBack, darkMode }: BreastplateGameProps) {
  const { saveScore } = useScore();

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [spinningIndex, setSpinningIndex] = useState<number | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [infoStone, setInfoStone] = useState<Stone | null>(null);
  const [bestScore, setBestScore] = useState<BestScore | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const initGame = useCallback(() => {
    // On melange jusqu'a obtenir un ordre different de la solution (pour
    // ne jamais tomber sur une grille deja resolue par hasard).
    let shuffled = shuffleArray(SOLVED_ORDER);
    while (shuffled.every((id, i) => id === SOLVED_ORDER[i])) {
      shuffled = shuffleArray(SOLVED_ORDER);
    }
    setBoard(shuffled);
    setSelectedIndex(null);
    setMoves(0);
    setSeconds(0);
    setIsWon(false);
    setScoreSaved(false);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${difficulty}`);
    setBestScore(stored ? JSON.parse(stored) : null);
  }, [difficulty]);

  // Chronometre : tourne tant que la partie n'est pas gagnee.
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon, board]);

  function handleRestart() {
    setAttempts((a) => a + 1);
    initGame();
  }

  function handleStoneClick(index: number) {
    if (isWon) return;

    // Mode decouverte : on affiche juste la fiche de la pierre, sans
    // toucher a la grille.
    if (discoveryMode) {
      const stone = STONES.find((s) => s.id === board[index]);
      if (stone) setInfoStone(stone);
      return;
    }

    // Une pierre deja bien placee reste verrouillee (non deplacable),
    // pour eviter au joueur de defaire ses bons placements par erreur.
    if (board[index] === SOLVED_ORDER[index]) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }

    // Echange des deux pierres selectionnees.
    const next = [...board];
    [next[selectedIndex], next[index]] = [next[index], next[selectedIndex]];
    setBoard(next);
    setSelectedIndex(null);
    setMoves((m) => m + 1);
    playClickTone();

    if (difficulty === 'hard') {
      setSpinningIndex(index);
      setTimeout(() => setSpinningIndex(null), 400);
    }

    if (next.every((id, i) => id === SOLVED_ORDER[i])) {
      finishGame(moves + 1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }

  function finishGame(finalMoves: number, finalSeconds: number) {
    setIsWon(true);
    playSuccessChime();

    const key = `${STORAGE_KEY_PREFIX}${difficulty}`;
    const previous: BestScore | null = JSON.parse(localStorage.getItem(key) || 'null');
    const isNewBest =
      !previous || finalMoves < previous.moves || (finalMoves === previous.moves && finalSeconds < previous.seconds);
    if (isNewBest) {
      const next = { moves: finalMoves, seconds: finalSeconds };
      localStorage.setItem(key, JSON.stringify(next));
      setBestScore(next);
    }

    if (!scoreSaved) {
      // Score sur 12 (une pierre = un point), integre au systeme de points/
      // coeurs/cartes global de l'app comme les autres jeux.
      saveScore('pectoral', 12, 12, difficulty, finalSeconds);
      setScoreSaved(true);
    }
  }

  return (
    <GameWrapper
      title="Le Pectoral du Grand Prêtre"
      score={isWon ? 12 : SOLVED_ORDER.filter((id, i) => board[i] === id).length}
      maxScore={12}
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      onBack={onBack}
      onRestart={handleRestart}
      darkMode={darkMode}
    >
      {/* Bandeau d'intro */}
      <div className={`rounded-tile p-4 mb-6 border ${darkMode ? 'bg-ink-light border-gold/15' : 'bg-white border-gold-dim/20'}`}>
        <p className={`text-sm ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
          <strong>Exode 28:17-20</strong> — Reconstitue le pectoral du grand pretre en replacant
          les 12 pierres precieuses, chacune representant l'une des douze tribus d'Israel.
        </p>
      </div>

      {/* Barre de stats + mode decouverte */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatChip icon={<Clock size={16} />} label={formatTime(seconds)} darkMode={darkMode} />
          <StatChip icon={<Move size={16} />} label={`${moves} déplacements`} darkMode={darkMode} />
          <StatChip icon={<Trophy size={16} />} label={`Essai n°${attempts}`} darkMode={darkMode} />
          {bestScore && (
            <StatChip
              icon={<Sparkles size={16} />}
              label={`Meilleur : ${bestScore.moves} coups en ${formatTime(bestScore.seconds)}`}
              darkMode={darkMode}
            />
          )}
        </div>

        <button
          onClick={() => setDiscoveryMode((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            discoveryMode
              ? 'bg-lapis text-white'
              : darkMode
                ? 'bg-ink text-parchment/70 hover:bg-ink/70'
                : 'bg-parchment-dim text-ink/70 hover:bg-parchment-dim/70'
          }`}
        >
          <Info size={16} />
          Mode Découverte {discoveryMode ? '(actif)' : ''}
        </button>
      </div>

      {/* Plateau 4x3 */}
      <div className={`max-w-md mx-auto rounded-tile p-5 border-2 ${darkMode ? 'bg-ink-light border-gold/25' : 'bg-parchment-dim border-gold-dim/30'}`}>
        <div className="grid grid-cols-3 gap-3">
          {board.map((stoneId, index) => {
            const stone = STONES.find((s) => s.id === stoneId)!;
            const correctStoneForSlot = STONES[index];
            const isCorrect = stoneId === SOLVED_ORDER[index];
            return (
              <div key={index} className="relative">
                {difficulty === 'easy' && !isCorrect && (
                  <span
                    className="absolute -inset-1 rounded-2xl opacity-30"
                    style={{ backgroundColor: correctStoneForSlot.flat }}
                  />
                )}
                <StoneTile
                  stone={stone}
                  isCorrect={isCorrect}
                  isSelected={selectedIndex === index}
                  showColorHint={difficulty === 'easy'}
                  spinning={spinningIndex === index}
                  onClick={() => handleStoneClick(index)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className={`text-center text-sm mt-4 ${darkMode ? 'text-parchment/50' : 'text-ink/50'}`}>
        {discoveryMode
          ? 'Touche une pierre pour en apprendre plus sur sa tribu.'
          : "Touche une pierre puis une deuxieme pour les echanger."}
      </p>

      {/* Fiche "Decouverte" */}
      {infoStone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4" onClick={() => setInfoStone(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-w-sm w-full rounded-tile p-6 relative ${darkMode ? 'bg-ink-light' : 'bg-white'} shadow-tile`}
          >
            <button
              onClick={() => setInfoStone(null)}
              className={darkMode ? 'absolute top-4 right-4 text-parchment/50' : 'absolute top-4 right-4 text-ink/40'}
            >
              <X size={22} />
            </button>
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-4"
              style={{ background: `linear-gradient(135deg, ${infoStone.from}, ${infoStone.to})`, boxShadow: '0 6px 14px rgba(0,0,0,0.35)' }}
            />
            <h3 className={`font-display text-xl font-semibold text-center mb-1 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              {infoStone.name}
            </h3>
            <p className="text-center text-gold font-medium mb-3">Tribu : {infoStone.tribe}</p>
            <p className={`text-sm text-center ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
              {infoStone.description}
            </p>
          </div>
        </div>
      )}

      {/* Ecran de victoire */}
      {isWon && (
        <>
          <Confetti />
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4">
            <div className={`max-w-sm w-full rounded-tile p-8 text-center ${darkMode ? 'bg-ink-light' : 'bg-white'} shadow-tile`}>
              <div className="seal w-16 h-16 mx-auto mb-4">
                <Trophy size={28} />
              </div>
              <h3 className={`font-display text-2xl font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                Félicitations !
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
                Tu as reconstitué le pectoral du Grand Prêtre.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <div className={`rounded-xl p-3 ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}>
                  <p className={darkMode ? 'text-parchment/50' : 'text-ink/50'}>Temps</p>
                  <p className={`font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{formatTime(seconds)}</p>
                </div>
                <div className={`rounded-xl p-3 ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}>
                  <p className={darkMode ? 'text-parchment/50' : 'text-ink/50'}>Déplacements</p>
                  <p className={`font-bold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{moves}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
                >
                  Rejouer
                </button>
                <button onClick={onBack} className="flex-1 btn-primary">
                  Accueil
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </GameWrapper>
  );
}

function StatChip({ icon, label, darkMode }: { icon: React.ReactNode; label: string; darkMode: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${darkMode ? 'bg-ink text-parchment/70' : 'bg-parchment-dim text-ink/70'}`}>
      {icon}
      {label}
    </div>
  );
}
