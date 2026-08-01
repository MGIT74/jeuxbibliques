import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ApiError, getToken, setToken } from '../lib/api';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null; // conservé pour compat avec le reste du code existant
  loading: boolean;
  isBlocked: boolean;
  signUp: (email: string, password: string, username: string, churchName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.get<Profile>('/me');
        setUser(me);
      } catch (err) {
        // token invalide ou expiré, ou compte bloqué -> déjà nettoyé par le client API
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function signUp(email: string, password: string, username: string, churchName?: string) {
    try {
      const { user, token } = await api.post<{ user: Profile; token: string }>('/register', {
        email,
        password,
        username,
        church_name: churchName,
      });

      setToken(token);
      setUser(user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Erreur inattendue lors de l\'inscription') };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { user, token } = await api.post<{ user: Profile; token: string }>('/login', {
        email,
        password,
      });

      setToken(token);
      setUser(user);
      setIsBlocked(false);
      return { error: null };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setIsBlocked(true);
      }
      return { error: err instanceof Error ? err : new Error('Erreur de connexion') };
    }
  }

  async function signOut() {
    try {
      await api.post('/logout');
    } finally {
      setToken(null);
      setUser(null);
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      const updated = await api.put<Profile>('/me', updates);
      setUser(updated);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Erreur de mise à jour du profil') };
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile: user, // alias pour ne pas casser tout le code existant qui utilise `profile`
      loading,
      isBlocked,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
