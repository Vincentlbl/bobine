import { useState } from 'react';
import { StarIcon } from './Icons';
import './StarRating.css';

const MAX_RATING = 10;

// Note sur 10, sous forme de dix étoiles cliquables.
// Recliquer sur la note actuelle l'efface (value = null).
export default function StarRating({ value, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(null);
  const shown = hovered ?? value ?? 0;

  return (
    <div className="stars" role="group" aria-label="Ta note sur 10" onMouseLeave={() => setHovered(null)}>
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const star = index + 1;
        return (
          <button
            key={star}
            type="button"
            className={`stars__star ${star <= shown ? 'stars__star--on' : ''}`}
            aria-label={`${star} sur ${MAX_RATING}`}
            aria-pressed={value === star}
            disabled={disabled}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(value === star ? null : star)}
          >
            <StarIcon size={22} filled={star <= shown} />
          </button>
        );
      })}
      <span className="stars__value" aria-hidden="true">
        {shown > 0 ? `${shown}/10` : 'Pas encore noté'}
      </span>
    </div>
  );
}
