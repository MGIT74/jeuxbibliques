import { useState, useEffect } from 'react';
import { X, User, Mail, Save, Loader2, Bell, Megaphone, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export function ProfileSettings({ isOpen, onClose, darkMode }: ProfileSettingsProps) {
  const { profile, user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'child' | 'teen' | 'adult'>('adult');
  const [country, setCountry] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
      setAgeGroup(profile.age_group || 'adult');
      setCountry(profile.country || '');
      setNewsletterConsent(profile.newsletter_consent || false);
      setMarketingConsent(profile.marketing_consent || false);
    }
  }, [profile]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const consentChanged =
      newsletterConsent !== profile?.newsletter_consent ||
      marketingConsent !== profile?.marketing_consent;

    const updates: Record<string, unknown> = {
      username: username.trim(),
      full_name: fullName.trim() || null,
      age_group: ageGroup,
      country: country || null,
      newsletter_consent: newsletterConsent,
      marketing_consent: marketingConsent,
    };

    if (consentChanged && (newsletterConsent || marketingConsent)) {
      updates.consent_date = new Date().toISOString();
    }

    const { error: updateError } = await updateProfile(updates);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  }

  const inputClass = `w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
  } focus:ring-2`;

  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
        >
          <X size={24} />
        </button>

        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Mon profil
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              L'email ne peut pas etre modifie
            </p>
          </div>

          <div>
            <label className={labelClass}>Nom d'utilisateur</label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="Ton pseudo"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nom complet</label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Ton nom complet (optionnel)"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tranche d'age</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as 'child' | 'teen' | 'adult')}
              className={`w-full px-4 py-3 border rounded-xl transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-amber-500 focus:border-amber-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              } focus:ring-2`}
            >
              <option value="child">Enfant (moins de 12 ans)</option>
              <option value="teen">Adolescent (12-17 ans)</option>
              <option value="adult">Adulte (18 ans et plus)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Pays</label>
            <div className="relative">
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-amber-500 focus:border-amber-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                } focus:ring-2`}
              >
                <option value="">Selectionne ton pays</option>
                <option value="FR">France</option>
                <option value="CA">Canada</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="CI">Cote d'Ivoire</option>
                <option value="SN">Senegal</option>
                <option value="CM">Cameroun</option>
                <option value="CD">RD Congo</option>
                <option value="MA">Maroc</option>
                <option value="TN">Tunisie</option>
                <option value="DZ">Algerie</option>
                <option value="US">Etats-Unis</option>
                <option value="GB">Royaume-Uni</option>
                <option value="BR">Bresil</option>
                <option value="MX">Mexique</option>
                <option value="AR">Argentine</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Preferences de communication
            </h3>

            <label className={`flex items-start gap-3 cursor-pointer mb-3`}>
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={(e) => setNewsletterConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <div className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Bell size={16} />
                  <span className="font-medium">Newsletter</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recevoir des nouvelles et mises a jour sur les jeux bibliques
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 cursor-pointer`}>
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <div className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Megaphone size={16} />
                  <span className="font-medium">Offres et promotions</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recevoir des offres speciales et recommandations personnalisees
                </p>
              </div>
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-500 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              Profil mis a jour avec succes !
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={20} />
                Enregistrer
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
