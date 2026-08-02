import { useState, useEffect } from 'react';
import { Ban } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnlineUsersProvider } from './contexts/OnlineUsersContext';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DonationPage } from './pages/DonationPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AuthModal } from './components/auth/AuthModal';
import { FreeTrialGate } from './components/shared/FreeTrialGate';
import { WordSearchGame } from './games/WordSearchGame';
import { GuessWordGame } from './games/GuessWordGame';
import { QuizGame } from './games/QuizGame';
import { WhoSaidGame } from './games/WhoSaidGame';
import { TrueFalseGame } from './games/TrueFalseGame';
import { VerseOrderGame } from './games/VerseOrderGame';
import { MemoryGame } from './games/MemoryGame';
import { CharacterMatchGame } from './games/CharacterMatchGame';
import { CompleteVerseGame } from './games/CompleteVerseGame';
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
  | 'complete-verse';

type View = 'home' | 'game' | 'admin' | 'donation' | 'verify-email';

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

function AppContent() {
  const { isBlocked } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/verifier-email') {
      return 'verify-email';
    }
    return 'home';
  });
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
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
    setSelectedGame(game);
    setCurrentView('game');
  }

  function handleBackToHome() {
    setSelectedGame(null);
    setCurrentView('home');
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  }

  function handleOpenAdmin() {
    setCurrentView('admin');
  }

  function handleOpenDonation() {
    setCurrentView('donation');
  }

  function renderGame() {
    if (!selectedGame) return null;

    const gameProps = {
      onBack: handleBackToHome,
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
    };

    const gameComponent = gameComponents[selectedGame.slug as GameSlug];

    return (
      <FreeTrialGate
        gameId={selectedGame.id}
        gameName={selectedGame.name}
        darkMode={darkMode}
        onBack={handleBackToHome}
        onRequestAuth={() => setShowAuthModal(true)}
      >
        {gameComponent}
      </FreeTrialGate>
    );
  }

  function renderContent() {
    switch (currentView) {
      case 'admin':
        return <AdminDashboard onBack={handleBackToHome} darkMode={darkMode} />;
      case 'donation':
        return <DonationPage onBack={handleBackToHome} darkMode={darkMode} />;
      case 'verify-email':
        return <VerifyEmailPage onBack={handleBackToHome} darkMode={darkMode} />;
      case 'game':
        return renderGame();
      default:
        return <HomePage onSelectGame={handleSelectGame} darkMode={darkMode} />;
    }
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-ink-dark' : 'bg-parchment'}`}>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAdmin={handleOpenAdmin}
        onOpenProfile={() => setShowProfileSettings(true)}
        onOpenDonation={handleOpenDonation}
      />
      {renderContent()}
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
        <AppContent />
      </OnlineUsersProvider>
    </AuthProvider>
  );
}

export default App;
