import { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Church } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [churchName, setChurchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou mot de passe incorrect');
          }
          throw error;
        }
      } else {
        if (!username.trim()) {
          throw new Error('Le nom d\'utilisateur est requis');
        }
        if (password.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        const { error } = await signUp(email, password, username, churchName.trim() || undefined);
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Cet email est déjà utilisé');
          }
          throw error;
        }
      }

      setEmail('');
      setPassword('');
      setUsername('');
      setChurchName('');
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment rounded-tile shadow-tile max-w-md w-full p-8 relative border border-gold/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors"
        >
          <X size={24} />
        </button>

        <div className="seal w-12 h-12 mx-auto mb-4">
          <User size={20} />
        </div>

        <h2 className="font-display text-2xl font-semibold text-ink mb-6 text-center">
          {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim" size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gold-dim/30 bg-white rounded-full focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all text-ink"
                    placeholder="Ton pseudo"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">
                  Eglise / Association
                </label>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim" size={20} />
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gold-dim/30 bg-white rounded-full focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all text-ink"
                    placeholder="Nom de ton eglise ou association (optionnel)"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gold-dim/30 bg-white rounded-full focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all text-ink"
                placeholder="ton@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gold-dim/30 bg-white rounded-full focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all text-ink"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-coral text-sm text-center bg-coral/10 p-3 rounded-full">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Chargement...
              </>
            ) : mode === 'signin' ? (
              'Se connecter'
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-ink/60">
            {mode === 'signin' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-lapis hover:text-lapis-bright font-semibold underline decoration-gold/40"
                >
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-lapis hover:text-lapis-bright font-semibold underline decoration-gold/40"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
