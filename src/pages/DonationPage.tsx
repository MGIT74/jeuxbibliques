import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { DonationSettings } from '../types/database';

interface DonationPageProps {
  onBack: () => void;
  darkMode: boolean;
}

export function DonationPage({ onBack, darkMode }: DonationPageProps) {
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await api.get<DonationSettings | null>('/donation-settings');
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching donation settings:', err);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-xl ${
          darkMode
            ? 'bg-gray-800 hover:bg-gray-700 text-white'
            : 'bg-white hover:bg-gray-50 text-gray-800'
        } transition-colors shadow-sm border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      <div
        className={`${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } rounded-2xl shadow-lg border p-8`}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-white" size={32} />
          </div>
          <h1
            className={`text-3xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}
          >
            Faire un don
          </h1>
          <p
            className={`text-lg ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            } max-w-2xl mx-auto`}
          >
            Votre soutien nous aide à maintenir et améliorer cette plateforme
            éducative gratuite. Merci de votre générosité !
          </p>
        </div>

        <div
          className={`${
            darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
          } rounded-xl p-6 min-h-[500px] flex items-center justify-center`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2
                className={`animate-spin ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
                size={48}
              />
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Chargement...
              </p>
            </div>
          ) : settings && settings.iframe_code ? (
            <div
              className="w-full min-h-[500px]"
              dangerouslySetInnerHTML={{ __html: settings.iframe_code }}
            />
          ) : (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Le formulaire de don n'est pas encore configuré.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
