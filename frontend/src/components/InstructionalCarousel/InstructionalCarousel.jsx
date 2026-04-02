import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { normalizeUserIdKey } from '../../services/api';
import './InstructionalCarousel.css';

/** v2: per-user only. Do not merge legacy global key — that marked every page "seen" for all accounts. */
const CAROUSEL_KEY_PREFIX = 'carbonx_carousel_seen_v2';

function carouselStorageKey() {
  const uid = normalizeUserIdKey(localStorage.getItem('userId') || '').trim();
  return uid ? `${CAROUSEL_KEY_PREFIX}:${uid}` : `${CAROUSEL_KEY_PREFIX}:guest`;
}

function readSeenMap() {
  try {
    const raw = localStorage.getItem(carouselStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getSeen(pageId) {
  try {
    const seen = readSeenMap();
    return !!seen[pageId];
  } catch {
    return false;
  }
}

/**
 * Instructional carousel for first-time page visits.
 * @param {string} pageId - Unique id for this page (used for localStorage "seen" key when newUserOnly is true)
 * @param {Array<{ title: string, description: string, icon?: React.ReactNode }>} slides - Carousel steps
 * @param {function} onComplete - Called when user dismisses (Got it / Skip)
 * @param {boolean} newUserOnly - If true, only show when user hasn't seen it (localStorage). If false, always show (dev mode).
 */
const InstructionalCarousel = ({ pageId, slides = [], onComplete, newUserOnly = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    if (newUserOnly && getSeen(pageId)) return false;
    return true;
  });

  useEffect(() => {
    const applyVisibility = () => {
      if (!newUserOnly) {
        setIsVisible(true);
        return;
      }
      setIsVisible(!getSeen(pageId));
    };
    applyVisibility();
    const onStorage = (e) => {
      if (e.key === 'userId' || e.key === null) applyVisibility();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('carbonx-session-updated', applyVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('carbonx-session-updated', applyVisibility);
    };
  }, [pageId, newUserOnly]);

  const markSeen = useCallback(() => {
    try {
      const key = carouselStorageKey();
      const seen = readSeenMap();
      seen[pageId] = true;
      localStorage.setItem(key, JSON.stringify(seen));
    } catch (_) {}
  }, [pageId]);

  const handleDismiss = useCallback(() => {
    if (newUserOnly) markSeen();
    setIsVisible(false);
    onComplete?.();
  }, [newUserOnly, markSeen, onComplete]);

  const goNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleDismiss();
    }
  }, [currentIndex, slides.length, handleDismiss]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  // Guides are for signed-in users only: one dismissal per account per pageId ("first visit" for that user).
  if (newUserOnly && !normalizeUserIdKey(localStorage.getItem('userId') || '').trim()) {
    return null;
  }

  if (!isVisible || !slides.length) return null;

  const slide = slides[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;

  return (
    <div className="instructional-carousel-overlay" role="dialog" aria-label="Page guide">
      <div className="instructional-carousel-backdrop" onClick={handleDismiss} aria-hidden="true" />
      <div className="instructional-carousel-card">
        <button
          type="button"
          className="instructional-carousel-close"
          onClick={handleDismiss}
          aria-label="Close guide"
        >
          <X size={20} />
        </button>

        <div className="instructional-carousel-content">
          {slide.icon && <div className="instructional-carousel-icon">{slide.icon}</div>}
          <h3 className="instructional-carousel-title">{slide.title}</h3>
          <p className="instructional-carousel-description">{slide.description}</p>
        </div>

        <div className="instructional-carousel-footer">
          <div className="instructional-carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`instructional-carousel-dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === currentIndex}
              />
            ))}
          </div>
          <div className="instructional-carousel-actions">
            <button type="button" className="outline instructional-carousel-btn" onClick={goPrev} disabled={isFirst}>
              <ChevronLeft size={18} />
              Previous
            </button>
            <button type="button" className="default instructional-carousel-btn" onClick={goNext}>
              {isLast ? 'Got it' : 'Next'}
              {!isLast && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionalCarousel;
