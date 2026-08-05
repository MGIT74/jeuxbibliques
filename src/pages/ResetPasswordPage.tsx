import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Lock } from 'lucide-react';
import { api } from '../lib/api';

interface ResetPasswordPageProps {
  onBack: () => void;
  darkMode: boolean;
}

export function ResetPasswordPage({ onBack, darkMode }: ResetPasswordPageProps) {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    if (!t) {
      setStatus('error');
      setMessage('Lien de réinitialisation invalide.');
    } else {
      setToken(t);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await api.post<{ message: string }>('/reset-password', { token, new_password: password });
      setStatus('success');
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-tile p-8 max-w-md w-full shadow-tile text-center border border-gold/15`}>
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-seal bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-emerald-500" size={32} />
            </div>
            <h2 className={`font-display text-xl font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Mot de passe modifié !
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-parchment/70' : 'text-ink/60'}`}>{message}</p>
            <button onClick={onBack} className="btn-primary">Retour à l'accueil</button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-seal bg-coral/15 flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-coral" size={32} />
            </div>
            <h2 className={`font-display text-xl font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Lien invalide
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-parchment/70' : 'text-ink/60'}`}>{message}</p>
            <button onClick={onBack} className="btn-primary">Retour à l'accueil</button>
          </>
        )}

        {status === 'form' && token && (
          <>
            <div className="seal w-14 h-14 mx-auto mb-4">
              <Lock size={22} />
            </div>
            <h2 className={`font-display text-xl font-semibold mb-6 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Choisis un nouveau mot de passe
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gold-dim/30 bg-white rounded-full focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all text-ink"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-parchment/70' : 'text-ink/70'}`}>
                  Confirme le mot de passe
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 border border-gold-dim/30 bg-white rounded-full focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all text-ink"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>

              {message && (
                <p className="text-coral text-sm text-center bg-coral/10 p-3 rounded-full">{message}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
