import { useEffect } from 'react';
import { Lock } from 'lucide-react';
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
        <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-8 max-w-md w-full shadow-2xl text-center`}>
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-lapis" size={32} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            Essai gratuit terminé
          </h2>
          <p className={`mb-6 ${darkMode ? 'text-parchment/80' : 'text-ink/70'}`}>
            Vous avez déjà utilisé votre essai gratuit pour <strong>{gameName}</strong>.
            Connectez-vous pour continuer à jouer gratuitement et sauvegarder votre progression !
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRequestAuth}
              className="w-full px-6 py-3 bg-lapis-bright hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Se connecter
            </button>
            <button
              onClick={onBack}
              className={`w-full px-6 py-3 rounded-xl font-medium ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
