import { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { useCards } from '../../contexts/CardsContext';

const SPARKLE_POSITIONS = Array.from({ length: 14 }, (_, i) => ({
  left: `${10 + (i * 6.5) % 90}%`,
  top: `${15 + (i * 11) % 80}%`,
  delay: `${(i % 7) * 0.22}s`,
  sx: `${(Math.sin(i) * 70).toFixed(0)}px`,
  sy: `${(-40 - (i % 5) * 20).toFixed(0)}px`,
}));

export function CardRevealModal() {
  const { pendingReveal, dismissCurrentReveal } = useCards();
  const [flipped, setFlipped] = useState(false);

  const card = pendingReveal[0];

  useEffect(() => {
    if (!card) return;
    setFlipped(false);
    const t = setTimeout(() => setFlipped(true), 150);
    return () => clearTimeout(t);
  }, [card?.id]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex flex-col items-center max-w-sm w-full">
        {/* Lueur magique en fond */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-gold/30 blur-3xl animate-glow-pulse" />
        </div>

        {/* Particules */}
        {flipped && SPARKLE_POSITIONS.map((s, i) => (
          <span
            key={i}
            className="absolute text-gold animate-sparkle pointer-events-none"
            style={{ left: s.left, top: s.top, animationDelay: s.delay, ['--sx' as string]: s.sx, ['--sy' as string]: s.sy }}
          >
            <Sparkles size={14} />
          </span>
        ))}

        <p className="relative eyebrow text-gold mb-4 text-center">Nouvelle carte débloquée !</p>

        <div style={{ perspective: '1200px' }} className="relative w-56 h-72">
          <div
            className={`relative w-full h-full transition-transform ${flipped ? 'animate-card-reveal' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Dos de la carte (sceau mystère) */}
            <div
              className="absolute inset-0 rounded-tile bg-gradient-to-br from-lapis to-ink flex items-center justify-center shadow-tile ring-2 ring-gold/40"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="seal w-20 h-20">
                <Sparkles size={32} />
              </div>
            </div>

            {/* Face avant : la carte elle-meme */}
            <div
              className="absolute inset-0 rounded-tile bg-white overflow-hidden shadow-tile ring-2 ring-gold rotate-y-180 flex flex-col"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-lapis to-ink flex items-center justify-center">
                  <Sparkles className="text-gold" size={36} />
                </div>
              )}
              <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
                <h3 className="font-display font-semibold text-ink text-base">{card.name}</h3>
                {card.description && (
                  <p className="text-xs text-ink/60 mt-1 line-clamp-2">{card.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {flipped && (
          <>
            <div className="relative flex items-center gap-2 mt-6 text-gold font-semibold">
              <Heart size={20} className="fill-gold" />
              +{card.hearts_reward} cœur{card.hearts_reward > 1 ? 's' : ''}
            </div>

            <button onClick={dismissCurrentReveal} className="relative btn-primary mt-6">
              Continuer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
