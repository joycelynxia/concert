// SimpleSlideshow.tsx
import { useState } from 'react';
import { ConcertMemory } from 'types/types';
import { API_BASE } from '../config/api';
import '../styling/Slideshow.css'
interface SlideshowProps {
  media: ConcertMemory[];
}

const SimpleSlideshow: React.FC<SlideshowProps> = ({ media }) => {
  const [current, setCurrent] = useState(0);

  const mediaItems = media.filter(mem => mem.type === 'photo' || mem.type === 'video');
  const total = mediaItems.length;

  const goPrev = () => setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
  const goNext = () => setCurrent((prev) => (prev === total - 1 ? 0 : prev + 1));

  if (total === 0) return <p>No media available.</p>;

  const currentItem = mediaItems[current];
  const src = currentItem.content.startsWith('http') ? currentItem.content : `${API_BASE}${currentItem.content}`;

  return (
    <div className="slideshow-container">
      <button type="button" onClick={goPrev} className="account-btn account-btn-outline account-btn-sm slideshow-btn">‹</button>
      
      <div className="media-wrapper">
        {currentItem.type === 'photo' ? (
          <img
            src={src}
            alt="Concert"
            className="slideshow-media"
            loading="lazy"
          />
        ) : (
          <video
            src={src}
            controls
            preload="metadata"
            className="slideshow-media"
          />
        )}
      </div>

      <button type="button" onClick={goNext} className="account-btn account-btn-outline account-btn-sm slideshow-btn">›</button>
    </div>
  );
};

export default SimpleSlideshow;
