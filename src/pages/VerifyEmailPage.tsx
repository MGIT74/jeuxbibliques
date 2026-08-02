import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface VerifyEmailPageProps {
  onBack: () => void;
  darkMode: boolean;
}

export function VerifyEmailPage({ onBack, darkMode }: VerifyEmailPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }

    api.get<{ message: string }>(`/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
      });
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-tile p-8 max-w-md w-full shadow-tile text-center border border-gold/15`}>
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-gold mx-auto mb-4" size={48} />
            <p className={darkMode ? 'text-parchment/70' : 'text-ink/60'}>Vérification en cours...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-seal bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-emerald-500" size={32} />
            </div>
            <h2 className={`font-display text-xl font-semibold mb-2 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
              Email vérifié !
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-parchment/70' : 'text-ink/60'}`}>{message}</p>
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
          </>
        )}

        <button onClick={onBack} className="btn-primary">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
