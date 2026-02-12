import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './InstructionalCarousel.css';

const STORAGE_KEY = 'carbonx_carousel_seen';

function getSeen(pageId) {
  try {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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
const InstructionalCarousel = ({ pageId, slides = [], onComplete, newUserOnly = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    if (newUserOnly && getSeen(pageId)) return false;
    return true;
  });

  useEffect(() => {
    if (newUserOnly && getSeen(pageId)) setIsVisible(false);
  }, [pageId, newUserOnly]);

  const markSeen = useCallback(() => {
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      seen[pageId] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
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
