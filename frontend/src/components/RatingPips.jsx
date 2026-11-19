import { useState } from 'react';
import './RatingPips.css';

const MAX_RATING = 10;

// Note sur 10 : le chiffre en grand, puis dix pastilles numérotées.
// Cliquer sur une pastille donne la note ; recliquer sur la note actuelle
// l'efface (value = null).
export default function RatingPips({ value, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(null);
  const shown = hovered ?? value ?? 0;

  return (
    <div className="rating">
      <div className="rating__head">
        <span className="field__label">Ta note</span>
        <span className="field__hint">Reclique sur ta note pour l’effacer</span>
      </div>

      <div className="rating__body">
        <p className="rating__value" aria-hidden="true">
          <span className="rating__number">{shown > 0 ? shown : '–'}</span>
          <span className="rating__max">/10</span>
        </p>

        <div
          className="rating__pips"
          role="group"
          aria-label="Ta note sur 10"
          onMouseLeave={() => setHovered(null)}
        >
          {Array.from({ length: MAX_RATING }, (_, index) => {
            const pip = index + 1;
            return (
              <button
                key={pip}
                type="button"
                className={`rating__pip ${pip <= shown ? 'rating__pip--on' : ''}`}
                aria-label={`${pip} sur ${MAX_RATING}`}
                aria-pressed={value === pip}
                disabled={disabled}
                onMouseEnter={() => setHovered(pip)}
                onClick={() => onChange(value === pip ? null : pip)}
              >
                {pip}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
