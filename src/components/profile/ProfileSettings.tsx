import { useState, useEffect } from 'react';
import { X, User, Mail, Save, Loader2, Bell, Megaphone, MapPin, Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

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

  const [activeSecurityModal, setActiveSecurityModal] = useState<'email' | 'password' | null>(null);

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
      ? 'bg-ink border-gold/20 text-parchment placeholder-parchment/40 focus:ring-gold focus:border-gold'
      : 'bg-white border-gold-dim/25 text-ink placeholder-ink/40 focus:ring-lapis focus:border-lapis'
  } focus:ring-2`;

  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-parchment/50 hover:text-parchment' : 'text-ink/40 hover:text-ink/70'} transition-colors`}
        >
          <X size={24} />
        </button>

        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Mon profil
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nom d'utilisateur</label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={20} />
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
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={20} />
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
                  ? 'bg-ink border-gold/20 text-parchment focus:ring-gold focus:border-gold'
                  : 'bg-white border-gold-dim/25 text-ink focus:ring-lapis focus:border-lapis'
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
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={20} />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                  darkMode
                    ? 'bg-ink border-gold/20 text-parchment focus:ring-gold focus:border-gold'
                    : 'bg-white border-gold-dim/25 text-ink focus:ring-lapis focus:border-lapis'
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

          <div className={`p-4 rounded-xl ${darkMode ? 'bg-ink/40' : 'bg-parchment-dim'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Preferences de communication
            </h3>

            <label className={`flex items-start gap-3 cursor-pointer mb-3`}>
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={(e) => setNewsletterConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gold-dim/40 text-lapis focus:ring-lapis"
              />
              <div>
                <div className={`flex items-center gap-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  <Bell size={16} />
                  <span className="font-medium">Newsletter</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
                  Recevoir des nouvelles et mises a jour sur les jeux bibliques
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 cursor-pointer`}>
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gold-dim/40 text-lapis focus:ring-lapis"
              />
              <div>
                <div className={`flex items-center gap-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
                  <Megaphone size={16} />
                  <span className="font-medium">Offres et promotions</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-parchment/60' : 'text-ink/50'}`}>
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
            className="w-full bg-gradient-to-r from-lapis to-gold text-white py-3 rounded-xl font-semibold hover:from-lapis-bright hover:to-gold-bright transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

        {/* Securite : email et mot de passe, volontairement en dehors du
            formulaire principal (des <form> imbriquees + touche Entree
            auraient pu declencher le mauvais enregistrement). */}
        <div className="mt-6 pt-5 border-t border-gold/10">
          <h3 className={`flex items-center gap-2 text-sm font-semibold mb-3 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
            <ShieldCheck size={16} />
            Sécurité
          </h3>

          <button
            type="button"
            onClick={() => setActiveSecurityModal('email')}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              darkMode ? 'bg-ink/40 hover:bg-ink/60 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'
            }`}
          >
            <span className="flex items-center gap-2 text-sm">
              <Mail size={16} />
              <span className="text-left">
                Adresse email
                <span className={`block text-xs ${darkMode ? 'text-parchment/50' : 'text-ink/50'}`}>{user?.email}</span>
              </span>
            </span>
            <ChevronRight size={16} className={darkMode ? 'text-parchment/40' : 'text-ink/30'} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSecurityModal('password')}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors ${
              darkMode ? 'bg-ink/40 hover:bg-ink/60 text-parchment' : 'bg-parchment-dim hover:bg-parchment-dim/70 text-ink'
            }`}
          >
            <span className="flex items-center gap-2 text-sm">
              <Lock size={16} />
              Mot de passe
            </span>
            <ChevronRight size={16} className={darkMode ? 'text-parchment/40' : 'text-ink/30'} />
          </button>
        </div>
      </div>

      {activeSecurityModal === 'email' && (
        <ChangeEmailModal darkMode={darkMode} onClose={() => setActiveSecurityModal(null)} />
      )}
      {activeSecurityModal === 'password' && (
        <ChangePasswordModal darkMode={darkMode} onClose={() => setActiveSecurityModal(null)} />
      )}
    </div>
  );
}

function ChangeEmailModal({ darkMode, onClose }: { darkMode: boolean; onClose: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/change-email', { new_email: newEmail.trim(), current_password: currentPassword });
      await refreshProfile();
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
    setLoading(false);
  }

  const inputClass = `w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
    darkMode
      ? 'bg-ink border-gold/20 text-parchment placeholder-parchment/40 focus:ring-gold focus:border-gold'
      : 'bg-white border-gold-dim/25 text-ink placeholder-ink/40 focus:ring-lapis focus:border-lapis'
  } focus:ring-2`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-xl max-w-sm w-full p-6 relative`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-parchment/50 hover:text-parchment' : 'text-ink/40 hover:text-ink/70'}`}
        >
          <X size={22} />
        </button>

        <div className="seal w-12 h-12 mx-auto mb-4">
          <Mail size={20} />
        </div>
        <h3 className={`text-lg font-bold text-center mb-1 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Changer l'adresse email
        </h3>
        <p className={`text-xs text-center mb-5 ${darkMode ? 'text-parchment/50' : 'text-ink/50'}`}>
          Actuellement : {user?.email}
        </p>

        {success ? (
          <p className="text-center text-emerald-500 text-sm bg-emerald-500/10 p-3 rounded-lg">
            Email modifié ! Vérifie ta nouvelle boîte mail pour confirmer.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={18} />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nouvelle adresse email"
                className={inputClass}
                required
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={18} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                className={inputClass}
                required
              />
            </div>

            {error && (
              <p className="text-coral text-sm text-center bg-coral/10 p-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirmer le nouvel email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ChangePasswordModal({ darkMode, onClose }: { darkMode: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/change-password', { current_password: currentPassword, new_password: newPassword });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
    setLoading(false);
  }

  const inputClass = `w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
    darkMode
      ? 'bg-ink border-gold/20 text-parchment placeholder-parchment/40 focus:ring-gold focus:border-gold'
      : 'bg-white border-gold-dim/25 text-ink placeholder-ink/40 focus:ring-lapis focus:border-lapis'
  } focus:ring-2`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-xl max-w-sm w-full p-6 relative`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-parchment/50 hover:text-parchment' : 'text-ink/40 hover:text-ink/70'}`}
        >
          <X size={22} />
        </button>

        <div className="seal w-12 h-12 mx-auto mb-4">
          <Lock size={20} />
        </div>
        <h3 className={`text-lg font-bold text-center mb-5 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Changer le mot de passe
        </h3>

        {success ? (
          <p className="text-center text-emerald-500 text-sm bg-emerald-500/10 p-3 rounded-lg">
            Mot de passe modifié avec succès !
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={18} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                className={inputClass}
                required
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (8 car. min.)"
                className={inputClass}
                required
                minLength={8}
              />
            </div>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme le nouveau mot de passe"
                className={inputClass}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-coral text-sm text-center bg-coral/10 p-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
