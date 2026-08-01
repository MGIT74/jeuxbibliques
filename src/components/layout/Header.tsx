import { useState, useRef, useEffect } from 'react';
import { BookOpen, User, LogOut, Trophy, Moon, Sun, Settings, Heart, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineUsers } from '../../contexts/OnlineUsersContext';
import { AuthModal } from '../auth/AuthModal';
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
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-white" size={20} />
              </div>
              <div className="min-w-0">
                <h1 className={`text-base sm:text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Jeux Bibliques
                </h1>
                <p className={`text-xs hidden sm:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Apprends en t'amusant
                </p>
              </div>
            </a>

            <div className="flex items-center gap-2 sm:gap-4">
              {showUserCounter && (
                <div
                  className={`hidden sm:flex relative items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  } ${countAnimating ? 'scale-110 ring-2 ring-green-400/50' : 'scale-100'}`}
                  title="Utilisateurs en ligne"
                >
                  <div className="relative">
                    <Users
                      size={18}
                      className={`transition-all duration-300 ${countAnimating ? 'text-green-500 rotate-12' : ''}`}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-700" />
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums transition-all duration-300 ${
                      countAnimating ? 'text-green-500 scale-125' : ''
                    }`}
                  >
                    {onlineCount}
                  </span>
                  {countAnimating && onlineCount > prevOnlineCount && (
                    <>
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                    </>
                  )}
                </div>
              )}

              {profile?.is_admin && (
                <button
                  onClick={toggleUserCounter}
                  className={`hidden sm:block p-2 rounded-lg ${
                    showUserCounter
                      ? darkMode
                        ? 'bg-green-700 text-green-300 hover:bg-green-600'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                      : darkMode
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } transition-colors`}
                  title={showUserCounter ? 'Masquer le compteur en ligne' : 'Afficher le compteur en ligne'}
                >
                  <Users size={20} />
                </button>
              )}

              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {user && profile ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-white" size={16} />
                    </div>
                    <span className={`hidden sm:inline font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {profile.username || 'Joueur'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Trophy size={16} />
                      <span className="text-sm font-semibold">{profile.total_points}</span>
                    </div>
                  </button>

                  {showMenu && (
                    <div className={`absolute right-0 top-full mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-lg py-2`}>
                      {onOpenProfile && (
                        <button
                          onClick={() => {
                            onOpenProfile();
                            setShowMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
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
                          className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-amber-400 hover:bg-gray-700' : 'text-amber-600 hover:bg-gray-100'} transition-colors`}
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
                          className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-pink-400 hover:bg-gray-700' : 'text-pink-600 hover:bg-gray-100'} transition-colors`}
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
                        className={`w-full flex items-center gap-2 px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
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
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 sm:px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-teal-600 transition-all text-sm sm:text-base"
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
