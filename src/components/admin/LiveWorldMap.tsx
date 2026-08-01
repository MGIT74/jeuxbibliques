import { Globe, Users, Wifi, Clock } from 'lucide-react';
import { useOnlineUsers, type OnlineUser } from '../../contexts/OnlineUsersContext';

interface LiveWorldMapProps {
  darkMode: boolean;
}

const countryData: Record<string, { flag: string; name: string }> = {
  'US': { flag: '\u{1F1FA}\u{1F1F8}', name: 'Etats-Unis' },
  'FR': { flag: '\u{1F1EB}\u{1F1F7}', name: 'France' },
  'CA': { flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada' },
  'GB': { flag: '\u{1F1EC}\u{1F1E7}', name: 'Royaume-Uni' },
  'DE': { flag: '\u{1F1E9}\u{1F1EA}', name: 'Allemagne' },
  'ES': { flag: '\u{1F1EA}\u{1F1F8}', name: 'Espagne' },
  'IT': { flag: '\u{1F1EE}\u{1F1F9}', name: 'Italie' },
  'BE': { flag: '\u{1F1E7}\u{1F1EA}', name: 'Belgique' },
  'CH': { flag: '\u{1F1E8}\u{1F1ED}', name: 'Suisse' },
  'LU': { flag: '\u{1F1F1}\u{1F1FA}', name: 'Luxembourg' },
  'NL': { flag: '\u{1F1F3}\u{1F1F1}', name: 'Pays-Bas' },
  'PT': { flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugal' },
  'BR': { flag: '\u{1F1E7}\u{1F1F7}', name: 'Bresil' },
  'MX': { flag: '\u{1F1F2}\u{1F1FD}', name: 'Mexique' },
  'AR': { flag: '\u{1F1E6}\u{1F1F7}', name: 'Argentine' },
  'CI': { flag: '\u{1F1E8}\u{1F1EE}', name: 'Cote d\'Ivoire' },
  'SN': { flag: '\u{1F1F8}\u{1F1F3}', name: 'Senegal' },
  'CM': { flag: '\u{1F1E8}\u{1F1F2}', name: 'Cameroun' },
  'CD': { flag: '\u{1F1E8}\u{1F1E9}', name: 'RD Congo' },
  'MA': { flag: '\u{1F1F2}\u{1F1E6}', name: 'Maroc' },
  'TN': { flag: '\u{1F1F9}\u{1F1F3}', name: 'Tunisie' },
  'DZ': { flag: '\u{1F1E9}\u{1F1FF}', name: 'Algerie' },
  'HT': { flag: '\u{1F1ED}\u{1F1F9}', name: 'Haiti' },
  'MG': { flag: '\u{1F1F2}\u{1F1EC}', name: 'Madagascar' },
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'A l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  return `Il y a ${diffHours}h`;
}

export function LiveWorldMap({ darkMode }: LiveWorldMapProps) {
  const { onlineUsers, onlineCount, usersByCountry } = useOnlineUsers();

  const sortedCountries = Array.from(usersByCountry.entries())
    .filter(([code]) => code !== 'UNKNOWN')
    .sort((a, b) => b[1].length - a[1].length);

  const unknownUsers = usersByCountry.get('UNKNOWN') || [];

  return (
    <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl relative">
            <Globe className="text-white" size={24} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-ink-light animate-pulse" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Utilisateurs en ligne
            </h3>
            <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
              En temps reel par pays
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
          <Wifi className="text-green-500 animate-pulse" size={18} />
          <span className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {onlineCount}
          </span>
          <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
            en ligne
          </span>
        </div>
      </div>

      {onlineUsers.length > 0 ? (
        <div className="space-y-4">
          {sortedCountries.map(([countryCode, users]) => {
            const country = countryData[countryCode] || { flag: '\u{1F30D}', name: countryCode };
            return (
              <div
                key={countryCode}
                className={`p-4 rounded-xl ${darkMode ? 'bg-ink/40' : 'bg-parchment-dim'} transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                      {country.name}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                      {users.length} utilisateur{users.length > 1 ? 's' : ''} en ligne
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {users.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${idx * 0.2}s` }}
                      />
                    ))}
                    {users.length > 5 && (
                      <span className={`text-xs ml-1 ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                        +{users.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {users.slice(0, 8).map((user: OnlineUser, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        darkMode ? 'bg-ink/50' : 'bg-white'
                      } border ${darkMode ? 'border-gold/15' : 'border-gold-dim/15'}`}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className={`text-sm ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                        {user.username || 'Visiteur'}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
                        <Clock size={10} />
                        {getTimeAgo(user.online_at)}
                      </span>
                    </div>
                  ))}
                  {users.length > 8 && (
                    <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-ink/30' : 'bg-parchment-dim'}`}>
                      <span className={`text-sm ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                        +{users.length - 8} autres
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {unknownUsers.length > 0 && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-ink/25' : 'bg-parchment-dim/60'} border ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'} border-dashed`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl opacity-50">{'\u{1F30D}'}</span>
                <div className="flex-1">
                  <h4 className={`font-medium ${darkMode ? 'text-parchment/60' : 'text-ink/70'}`}>
                    Pays non defini
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
                    {unknownUsers.length} utilisateur{unknownUsers.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {unknownUsers.slice(0, 3).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${idx * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`text-center py-12 rounded-xl ${darkMode ? 'bg-ink/25' : 'bg-parchment-dim'}`}>
          <Users className={`mx-auto mb-4 ${darkMode ? 'text-parchment/50' : 'text-ink/30'}`} size={48} />
          <p className={`font-medium ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
            Aucun utilisateur en ligne
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>
            Les utilisateurs apparaitront ici en temps reel
          </p>
        </div>
      )}

      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gold/10' : 'border-gold-dim/15'} flex items-center justify-between text-xs`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className={darkMode ? 'text-parchment/60' : 'text-ink/50'}>
            Mise a jour en temps reel
          </span>
        </div>
        <span className={darkMode ? 'text-parchment/40' : 'text-ink/40'}>
          {sortedCountries.length} pays represente{sortedCountries.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
