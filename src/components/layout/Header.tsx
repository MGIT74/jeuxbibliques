import { useState, useRef, useEffect } from 'react';
import { BookOpen, User, LogOut, Trophy, Moon, Sun, Settings, Heart, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineUsers } from '../../contexts/OnlineUsersContext';
import { AuthModal } from '../auth/AuthModal';
import { NotificationBell } from './NotificationBell';
import { api } from '../../lib/api';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAdmin?: () => void;
  onOpenProfile?: () => void;
  onOpenDonation?: () => void;
}

export function Header({ darkMode, onToggleDarkMode, onOpenAdmin, onOpenProfile, onOpenDonation }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { onlineCount } = useOnlineUsers();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [prevOnlineCount, setPrevOnlineCount] = useState(0);
  const [showUserCounter, setShowUserCounter] = useState(false);
  const [countAnimating, setCountAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  useEffect(() => {
    fetchUserCounterSettings();
    const settingsInterval = setInterval(fetchUserCounterSettings, 5000);

    return () => {
      clearInterval(settingsInterval);
    };
  }, []);

  useEffect(() => {
    if (onlineCount !== prevOnlineCount) {
      setPrevOnlineCount(onlineCount);
      setCountAnimating(true);
      const timer = setTimeout(() => setCountAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [onlineCount, prevOnlineCount]);

  async function fetchUserCounterSettings() {
    try {
      const data = await api.get<{ show_user_counter: boolean }>('/donation-settings/user-counter');
      setShowUserCounter(data.show_user_counter);
    } catch (err) {
      console.error('Error fetching user counter setting:', err);
    }
  }

  async function toggleUserCounter() {
    const newValue = !showUserCounter;
    setShowUserCounter(newValue);

    try {
      // Admin\DonationSettingController::update crée la ligne si elle
      // n'existe pas encore, comme le faisait le insert/update Supabase.
      await api.put('/admin/donation-settings', { show_user_counter: newValue });
    } catch (err) {
      console.error('Error toggling user counter:', err);
      setShowUserCounter(!newValue); // rollback optimiste en cas d'échec
    }
  }

  return (
    <>
      <header
        className={`${darkMode ? 'bg-ink border-gold/10' : 'bg-parchment border-gold-dim/20'} border-b sticky top-0 z-40 backdrop-blur transition-colors`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="seal w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <h1 className={`font-display text-base sm:text-xl font-semibold truncate ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  Jeux Bibliques
                </h1>
                <p className={`eyebrow hidden sm:block normal-case tracking-normal text-[11px] font-medium ${darkMode ? 'text-parchment/50' : 'text-ink/50'}`}>
                  Apprends en t'amusant
                </p>
              </div>
            </a>

            <div className="flex items-center gap-2 sm:gap-4">
              {showUserCounter && (
                <div
                  className={`hidden sm:flex relative items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
                    darkMode ? 'bg-ink-light text-parchment/70' : 'bg-white text-ink/70'
                  } ${countAnimating ? 'scale-110 ring-2 ring-gold/50' : 'scale-100'}`}
                  title="Utilisateurs en ligne"
                >
                  <div className="relative">
                    <Users
                      size={18}
                      className={`transition-all duration-300 ${countAnimating ? 'text-gold rotate-12' : ''}`}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gold rounded-full border border-white dark:border-ink-light" />
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums transition-all duration-300 ${
                      countAnimating ? 'text-gold scale-125' : ''
                    }`}
                  >
                    {onlineCount}
                  </span>
                  {countAnimating && onlineCount > prevOnlineCount && (
                    <>
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full" />
                    </>
                  )}
                </div>
              )}

              {profile?.is_admin && (
                <button
                  onClick={toggleUserCounter}
                  className={`hidden sm:block p-2 rounded-full ${
                    showUserCounter
                      ? darkMode
                        ? 'bg-lapis/30 text-lapis-bright hover:bg-lapis/40'
                        : 'bg-lapis/10 text-lapis hover:bg-lapis/20'
                      : darkMode
                      ? 'bg-ink-light text-parchment/40 hover:bg-ink-light/70'
                      : 'bg-parchment-dim text-ink/40 hover:bg-parchment-dim/70'
                  } transition-colors`}
                  title={showUserCounter ? 'Masquer le compteur en ligne' : 'Afficher le compteur en ligne'}
                >
                  <Users size={20} />
                </button>
              )}

              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-full ${darkMode ? 'bg-ink-light text-gold hover:bg-ink-light/70' : 'bg-parchment-dim text-ink/60 hover:bg-parchment-dim/70'} transition-colors`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {user && <NotificationBell darkMode={darkMode} />}

              {user && profile ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-full ${darkMode ? 'bg-ink-light hover:bg-ink-light/70' : 'bg-white hover:bg-parchment-dim'} transition-colors border border-gold/15`}
                  >
                    <div className="seal w-8 h-8 flex-shrink-0">
                      <User size={14} />
                    </div>
                    <span className={`hidden sm:inline font-medium ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                      {profile.username || 'Joueur'}
                    </span>
                    <div className="flex items-center gap-1 text-gold">
                      <Trophy size={16} />
                      <span className="text-sm font-semibold">{profile.total_points}</span>
                    </div>
                  </button>

                  {showMenu && (
                    <div className={`absolute right-0 top-full mt-2 w-48 ${darkMode ? 'bg-ink-light border-gold/10' : 'bg-white border-gold-dim/15'} rounded-tile border shadow-tile py-2`}>
                      {onOpenProfile && (
                        <button
                          onClick={() => {
                            onOpenProfile();
                            setShowMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-parchment/80 hover:bg-ink/40' : 'text-ink/80 hover:bg-parchment-dim'} transition-colors`}
                        >
                          <User size={18} />
                          Mon profil
                        </button>
                      )}
                      {profile?.is_admin && onOpenAdmin && (
                        <button
                          onClick={() => {
                            onOpenAdmin();
                            setShowMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-gold hover:bg-ink/40' : 'text-gold-dim hover:bg-parchment-dim'} transition-colors`}
                        >
                          <Settings size={18} />
                          Paramètres
                        </button>
                      )}
                      {onOpenDonation && (
                        <button
                          onClick={() => {
                            onOpenDonation();
                            setShowMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-coral hover:bg-ink/40' : 'text-coral-dim hover:bg-parchment-dim'} transition-colors`}
                        >
                          <Heart size={18} />
                          Faire un don
                        </button>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setShowMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-parchment/80 hover:bg-ink/40' : 'text-ink/80 hover:bg-parchment-dim'} transition-colors`}
                      >
                        <LogOut size={18} />
                        Deconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2"
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
