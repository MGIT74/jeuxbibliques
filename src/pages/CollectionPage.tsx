import { ArrowLeft, Heart, Lock, Loader2 } from 'lucide-react';
import { useCards } from '../contexts/CardsContext';

interface CollectionPageProps {
  onBack: () => void;
  darkMode: boolean;
}

export function CollectionPage({ onBack, darkMode }: CollectionPageProps) {
  const { allCards, myCards, hearts, loading } = useCards();

  const ownedIds = new Set(myCards.map((c) => c.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-ink-light hover:bg-ink-light/70 text-parchment' : 'bg-white hover:bg-parchment-dim text-ink'} transition-colors border border-gold/15`}
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-ink-light' : 'bg-white'} border border-gold/15`}>
          <Heart size={18} className="fill-coral text-coral" />
          <span className={`font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>{hearts}</span>
          <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>cœur{hearts !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="text-center mb-10">
        <p className="eyebrow mb-2">Ma collection</p>
        <h1 className={`font-display text-3xl font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Cartes bibliques
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-parchment/60' : 'text-ink/60'}`}>
          Gagne des points en jouant pour débloquer de nouvelles cartes et des cœurs.
        </p>
      </div>

      {allCards.length === 0 ? (
        <div className={`text-center py-16 ${darkMode ? 'text-parchment/50' : 'text-ink/40'}`}>
          Aucune carte disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {allCards.map((card) => {
            const owned = ownedIds.has(card.id);
            return (
              <div
                key={card.id}
                className={`card overflow-hidden !p-0 ${owned ? '' : 'opacity-60'}`}
              >
                <div className="relative w-full aspect-[4/5]">
                  {owned && card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-ink' : 'bg-parchment-dim'}`}>
                      <Lock className={darkMode ? 'text-parchment/30' : 'text-ink/20'} size={32} />
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute inset-0 bg-ink-dark/50 backdrop-blur-[1px] flex items-center justify-center">
                      <Lock className="text-parchment/70" size={28} />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className={`font-display text-sm font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                    {owned ? card.name : '???'}
                  </h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-parchment/50' : 'text-ink/40'}`}>
                    {owned ? `+${card.hearts_reward} cœur${card.hearts_reward > 1 ? 's' : ''}` : `${card.points_threshold} points`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
