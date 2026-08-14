import { useState } from 'react';
import { X, Bug, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

interface ReportBugModalProps {
  darkMode: boolean;
  onClose: () => void;
}

export function ReportBugModal({ darkMode, onClose }: ReportBugModalProps) {
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (capture d\'écran).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      setFileName(file.name);
    };
    reader.onerror = () => setError('Erreur lors de la lecture de l\'image.');
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Les deux champs sont obligatoires, verifie aussi cote serveur.
    if (!description.trim()) {
      setError('Merci de décrire le problème rencontré.');
      return;
    }
    if (!screenshot) {
      setError('Merci de joindre une capture d\'écran.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bug-reports', {
        description: description.trim(),
        screenshot_url: screenshot,
        page_url: window.location.href,
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.');
    }
    setLoading(false);
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border transition-all ${
    darkMode
      ? 'bg-ink border-gold/20 text-parchment placeholder-parchment/40 focus:ring-gold focus:border-gold'
      : 'bg-white border-gold-dim/25 text-ink placeholder-ink/40 focus:ring-lapis focus:border-lapis'
  } focus:ring-2`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-ink-light' : 'bg-white'} rounded-2xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-parchment/50 hover:text-parchment' : 'text-ink/40 hover:text-ink/70'}`}
        >
          <X size={22} />
        </button>

        <div className="seal w-12 h-12 mx-auto mb-4">
          <Bug size={20} />
        </div>
        <h3 className={`text-lg font-bold text-center mb-1 ${darkMode ? 'text-parchment' : 'text-ink'}`}>
          Signaler un bug
        </h3>
        <p className={`text-xs text-center mb-5 ${darkMode ? 'text-parchment/50' : 'text-ink/50'}`}>
          Décris le problème et joins une capture d'écran, ça nous aide énormément.
        </p>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={40} />
            <p className={darkMode ? 'text-parchment' : 'text-ink'}>Merci pour ton signalement !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                Description du bug <span className="text-coral">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qu'est-ce qui ne fonctionne pas ? Que faisais-tu quand c'est arrivé ?"
                rows={4}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-parchment/80' : 'text-ink/80'}`}>
                Capture d'écran <span className="text-coral">*</span>
              </label>

              {screenshot ? (
                <div className="relative">
                  <img src={screenshot} alt="Capture d'écran" className="w-full max-h-48 object-contain rounded-xl border border-gold/15" />
                  <button
                    type="button"
                    onClick={() => { setScreenshot(''); setFileName(''); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-ink-dark/80 text-coral hover:bg-ink-dark transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    darkMode ? 'border-gold/25 hover:border-gold/50 text-parchment/60' : 'border-gold-dim/40 hover:border-gold-dim text-ink/50'
                  }`}
                >
                  <Camera size={24} />
                  <span className="text-sm">Choisir une image</span>
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileChange} className="hidden" required />
                </label>
              )}
              {fileName && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-parchment/40' : 'text-ink/40'}`}>{fileName}</p>
              )}
            </div>

            {error && (
              <p className="text-coral text-sm text-center bg-coral/10 p-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Envoyer le signalement'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
