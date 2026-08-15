import { useEffect } from 'react';
import { Sparkles, Heart, Trophy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFreeTrial } from '../../hooks/useFreeTrial';

interface FreeTrialGateProps {
  gameId: string;
  gameName: string;
  darkMode: boolean;
  onBack: () => void;
  onRequestAuth: () => void;
  children: React.ReactNode;
}

export function FreeTrialGate({
  gameId,
  gameName,
  darkMode,
  onBack,
  onRequestAuth,
  children,
}: FreeTrialGateProps) {
  const { user } = useAuth();
  const { canPlay, hasUsedTrial, markTrialUsed } = useFreeTrial(gameId, !!user);

  useEffect(() => {
    if (!user && canPlay) {
      markTrialUsed();
    }
  }, [user, canPlay, markTrialUsed]);

  if (user || canPlay) {
    return <>{children}</>;
  }

  if (hasUsedTrial) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-tile p-8 max-w-md w-full shadow-tile text-center border border-gold/15`}>
          <div className="seal w-16 h-16 mx-auto mb-4">
            <Sparkles size={28} />
          </div>
          <h2 className={`font-display text-2xl font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            Continue l'aventure gratuitement !
          </h2>
          <p className={`mb-5 ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
            Tu as adoré <strong>{gameName}</strong> ? Crée ton compte en quelques secondes
            pour jouer à <strong>tous les jeux, gratuitement à vie</strong>.
          </p>

          <div className={`rounded-xl p-4 mb-6 text-left space-y-2.5 ${darkMode ? 'bg-ink/40' : 'bg-parchment-dim'}`}>
            <div className="flex items-center gap-2.5">
              <Check size={18} className="text-emerald-500 flex-shrink-0" />
              <span className={`text-sm ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>Accès illimité aux 10 jeux, pour toujours</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Trophy size={18} className="text-gold flex-shrink-0" />
              <span className={`text-sm ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>Ta progression et tes points sauvegardés</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Heart size={18} className="text-coral flex-shrink-0 fill-coral" />
              <span className={`text-sm ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>Cartes à collectionner et cœurs bonus à débloquer</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onRequestAuth}
              className="btn-primary w-full"
            >
              Créer mon compte gratuit
            </button>
            <button
              onClick={onBack}
              className={`w-full px-6 py-3 rounded-full font-medium ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
            >
              Retour
            </button>
          </div>

          <p className={`text-xs mt-4 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
            Gratuit, sans engagement, en moins d'une minute.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
