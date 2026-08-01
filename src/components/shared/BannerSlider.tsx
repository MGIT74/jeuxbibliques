import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { Banner } from '../../types/database';

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      // Le backend (Banner::scopeCurrentlyActive) filtre déjà is_active
      // + la fenêtre start_date/end_date et trie par display_order.
      const data = await api.get<Banner[]>('/banners');
      setBanners(data);
    } catch (err) {
      console.error('Unexpected error fetching banners:', err);
    }
    setLoading(false);
  }

  const handleImageError = (bannerId: string, imageUrl: string) => {
    console.error('Failed to load banner image:', imageUrl);
    setImageErrors((prev) => new Set(prev).add(bannerId));
  };

  const validBanners = banners.filter((banner) => !imageErrors.has(banner.id));

  const extendedBanners = validBanners.length > 0
    ? [validBanners[validBanners.length - 1], ...validBanners, validBanners[0]]
    : [];

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isTransitioning]);

  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    setCurrentIndex((current) => {
      if (current === 0) {
        return validBanners.length;
      } else if (current === validBanners.length + 1) {
        return 1;
      }
      return current;
    });
  }, [validBanners.length]);

  useEffect(() => {
    if (validBanners.length <= 1) return;

    const realIndex = currentIndex === 0 ? validBanners.length - 1 :
                      currentIndex === validBanners.length + 1 ? 0 :
                      currentIndex - 1;
    const currentBanner = validBanners[realIndex];
    const duration = (currentBanner?.duration_seconds || 5) * 1000;

    const interval = setInterval(nextSlide, duration);
    return () => clearInterval(interval);
  }, [validBanners.length, currentIndex, nextSlide, validBanners]);

  if (loading || validBanners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full mb-8 rounded-2xl overflow-hidden shadow-lg">
      <div className="relative aspect-[3/1] bg-parchment-dim">
        <div
          className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedBanners.map((banner, index) => (
            <div
              key={`${banner.id}-${index}`}
              className="min-w-full h-full relative"
            >
              {banner.link_url ? (
                <a
                  href={banner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(banner.id, banner.image_url)}
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(banner.id, banner.image_url)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
