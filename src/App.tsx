import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Ban, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnlineUsersProvider } from './contexts/OnlineUsersContext';
import { CardsProvider } from './contexts/CardsContext';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DonationPage } from './pages/DonationPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CollectionPage } from './pages/CollectionPage';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AuthModal } from './components/auth/AuthModal';
import { CardRevealModal } from './components/layout/CardRevealModal';
import { FreeTrialGate } from './components/shared/FreeTrialGate';
import { useGames } from './hooks/useGameData';
import { WordSearchGame } from './games/WordSearchGame';
import { GuessWordGame } from './games/GuessWordGame';
import { QuizGame } from './games/QuizGame';
import { WhoSaidGame } from './games/WhoSaidGame';
import { TrueFalseGame } from './games/TrueFalseGame';
import { VerseOrderGame } from './games/VerseOrderGame';
import { MemoryGame } from './games/MemoryGame';
import { CharacterMatchGame } from './games/CharacterMatchGame';
import { CompleteVerseGame } from './games/CompleteVerseGame';
import { BreastplateGame } from './games/BreastplateGame';
import type { Game } from './types/database';

type GameSlug =
  | 'word-search'
  | 'guess-word'
  | 'quiz'
  | 'who-said'
  | 'true-false'
  | 'verse-order'
  | 'memory'
  | 'character-match'
  | 'complete-verse'
  | 'pectoral';

function BlockedBanner({ darkMode, onDismiss }: { darkMode: boolean; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-tile p-8 max-w-md w-full shadow-tile text-center border border-gold/15`}>
        <div className="w-16 h-16 rounded-seal bg-coral/15 flex items-center justify-center mx-auto mb-4">
          <Ban className="text-coral" size={32} />
        </div>
        <h2 className={`font-display text-xl font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Compte bloque
        </h2>
        <p className={`mb-6 ${darkMode ? 'text-parchment/70' : 'text-ink/60'}`}>
          Votre compte a ete bloque par un administrateur. Vous ne pouvez plus acceder a l'application.
        </p>
        <button
          onClick={onDismiss}
          className={`px-6 py-2 rounded-full font-medium ${darkMode ? 'bg-ink hover:bg-ink/70 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'} transition-colors`}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// Page d'un jeu : /jeux/:slug — chaque jeu a maintenant sa propre URL
// partageable, et le bouton "precedent" du navigateur fonctionne normalement.
function GamePage({ darkMode, onRequestAuth }: { darkMode: boolean; onRequestAuth: () => void }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { games, loading } = useGames();

  const selectedGame: Game | undefined = games.find((g) => g.slug === slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  if (!selectedGame) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className={darkMode ? 'text-parchment/70' : 'text-ink/60'}>Jeu introuvable.</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const gameProps = {
    onBack: () => navigate('/'),
    darkMode,
  };

  const gameComponents: Record<GameSlug, JSX.Element> = {
    'word-search': <WordSearchGame {...gameProps} />,
    'guess-word': <GuessWordGame {...gameProps} />,
    'quiz': <QuizGame {...gameProps} />,
    'who-said': <WhoSaidGame {...gameProps} />,
    'true-false': <TrueFalseGame {...gameProps} />,
    'verse-order': <VerseOrderGame {...gameProps} />,
    'memory': <MemoryGame {...gameProps} />,
    'character-match': <CharacterMatchGame {...gameProps} />,
    'complete-verse': <CompleteVerseGame {...gameProps} />,
    'pectoral': <BreastplateGame {...gameProps} />,
  };

  const gameComponent = gameComponents[selectedGame.slug as GameSlug];

  return (
    <FreeTrialGate
      gameId={selectedGame.id}
      gameName={selectedGame.name}
      darkMode={darkMode}
      onBack={() => navigate('/')}
      onRequestAuth={onRequestAuth}
    >
      {gameComponent}
    </FreeTrialGate>
  );
}

function AppContent() {
  const { isBlocked } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showBlockedBanner, setShowBlockedBanner] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (isBlocked) {
      setShowBlockedBanner(true);
    }
  }, [isBlocked]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  function handleSelectGame(game: Game) {
    navigate(`/jeux/${game.slug}`);
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-ink-dark' : 'bg-parchment'}`}>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAdmin={() => navigate('/admin')}
        onOpenProfile={() => setShowProfileSettings(true)}
        onOpenDonation={() => navigate('/don')}
        onOpenCollection={() => navigate('/collection')}
      />

      <Routes>
        <Route path="/" element={<HomePage onSelectGame={handleSelectGame} darkMode={darkMode} />} />
        <Route
          path="/jeux/:slug"
          element={<GamePage darkMode={darkMode} onRequestAuth={() => setShowAuthModal(true)} />}
        />
        <Route path="/admin" element={<AdminDashboard onBack={() => navigate('/')} darkMode={darkMode} />} />
        <Route path="/don" element={<DonationPage onBack={() => navigate('/')} darkMode={darkMode} />} />
        <Route path="/collection" element={<CollectionPage onBack={() => navigate('/')} darkMode={darkMode} />} />
        <Route path="/verifier-email" element={<VerifyEmailPage onBack={() => navigate('/')} darkMode={darkMode} />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage onBack={() => navigate('/')} darkMode={darkMode} />} />
        <Route path="*" element={<HomePage onSelectGame={handleSelectGame} darkMode={darkMode} />} />
      </Routes>

      <CardRevealModal />

      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        darkMode={darkMode}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      {showBlockedBanner && (
        <BlockedBanner
          darkMode={darkMode}
          onDismiss={() => setShowBlockedBanner(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <OnlineUsersProvider>
        <CardsProvider>
          <AppContent />
        </CardsProvider>
      </OnlineUsersProvider>
    </AuthProvider>
  );
}

export default App;
