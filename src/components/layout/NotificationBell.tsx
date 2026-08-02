import { useState, useEffect, useRef } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { api } from '../../lib/api';
import type { AppNotification } from '../../types/database';

const LAST_SEEN_KEY = 'notifications_last_seen';

const typeConfig = {
  info: { icon: Info, color: 'text-lapis', bg: 'bg-lapis/10' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-gold-dim', bg: 'bg-gold/10' },
  urgent: { icon: AlertOctagon, color: 'text-coral', bg: 'bg-coral/10' },
};

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function NotificationBell({ darkMode }: { darkMode: boolean }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    return stored ? Number(stored) : 0;
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    }
    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPanel]);

  async function fetchNotifications() {
    try {
      const data = await api.get<AppNotification[]>('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  function handleOpen() {
    const opening = !showPanel;
    setShowPanel(opening);
    if (opening) {
      const now = Date.now();
      setLastSeen(now);
      localStorage.setItem(LAST_SEEN_KEY, String(now));
    }
  }

  const unreadCount = notifications.filter(
    (n) => new Date(n.created_at).getTime() > lastSeen
  ).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-full ${darkMode ? 'bg-ink-light text-parchment/80 hover:bg-ink-light/70' : 'bg-white text-ink/70 hover:bg-parchment-dim'} transition-colors border border-gold/15`}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-ink-light">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {showPanel && (
        <>
          {/* Fond assombri : mobile uniquement, pour un panneau centre type modale */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setShowPanel(false)}
          />
          <div
            className={`fixed inset-x-4 top-24 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-[70vh] overflow-y-auto ${
              darkMode ? 'bg-ink-light border-gold/10' : 'bg-white border-gold-dim/15'
            } rounded-tile border shadow-tile py-2`}
          >
            <div className={`px-4 py-2 font-display font-semibold border-b ${darkMode ? 'border-gold/10 text-parchment' : 'border-gold-dim/15 text-ink'}`}>
              Notifications
            </div>

            {notifications.length === 0 ? (
              <div className={`px-4 py-8 text-center text-sm ${darkMode ? 'text-parchment/50' : 'text-ink/40'}`}>
                Aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.info;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 border-b last:border-b-0 ${darkMode ? 'border-gold/5' : 'border-gold-dim/10'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${config.bg}`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                        {n.title}
                      </p>
                      <p className={`text-sm mt-0.5 ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
                        {n.message}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
