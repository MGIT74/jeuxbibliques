import { useState, useEffect } from 'react';
import { X, User, Mail, Save, Loader2, Bell, Megaphone, MapPin, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export function ProfileSettings({ isOpen, onClose, darkMode }: ProfileSettingsProps) {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'child' | 'teen' | 'adult'>('adult');
  const [country, setCountry] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Changement d'email
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      await api.post('/change-email', { new_email: newEmail.trim(), current_password: emailPassword });
      await refreshProfile();
      setEmailMessage({ type: 'success', text: 'Email modifié avec succès.' });
      setNewEmail('');
      setEmailPassword('');
      setTimeout(() => setShowEmailForm(false), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setEmailMessage({ type: 'error', text: message });
    }
    setEmailLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      await api.post('/change-password', { current_password: currentPassword, new_password: newPassword });
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordForm(false), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setPasswordMessage({ type: 'error', text: message });
    }
    setPasswordLoading(false);
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
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`} size={20} />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </div>
            <button
              type="button"
              onClick={() => { setShowEmailForm(!showEmailForm); setEmailMessage(null); }}
              className={`text-xs mt-1.5 underline ${darkMode ? 'text-gold' : 'text-lapis'}`}
            >
              {showEmailForm ? 'Annuler' : "Changer d'adresse email"}
            </button>

            {showEmailForm && (
              <div className={`mt-3 p-4 rounded-xl space-y-3 ${darkMode ? 'bg-ink/40' : 'bg-parchment-dim'}`}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Nouvelle adresse email"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'}`}
                  required
                />
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Mot de passe actuel (confirmation)"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'}`}
                  required
                />
                {emailMessage && (
                  <p className={`text-xs ${emailMessage.type === 'success' ? 'text-emerald-500' : 'text-coral'}`}>
                    {emailMessage.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  disabled={emailLoading}
                  className="btn-primary w-full text-sm py-2 disabled:opacity-50"
                >
                  {emailLoading ? 'Enregistrement...' : "Confirmer l'email"}
                </button>
              </div>
            )}
          </div>

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

          <div className={`p-4 rounded-xl ${darkMode ? 'bg-ink/40' : 'bg-parchment-dim'}`}>
            <button
              type="button"
              onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordMessage(null); }}
              className={`flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-parchment' : 'text-ink'}`}
            >
              <KeyRound size={16} />
              Changer le mot de passe
            </button>

            {showPasswordForm && (
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'}`}
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe (8 caractères min.)"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'}`}
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme le nouveau mot de passe"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-ink border-gold/20 text-parchment' : 'bg-white border-gold-dim/25 text-ink'}`}
                  required
                  minLength={8}
                />
                {passwordMessage && (
                  <p className={`text-xs ${passwordMessage.type === 'success' ? 'text-emerald-500' : 'text-coral'}`}>
                    {passwordMessage.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="btn-primary w-full text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  {passwordLoading ? 'Enregistrement...' : 'Confirmer le mot de passe'}
                </button>
              </div>
            )}
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
      </div>
    </div>
  );
}
