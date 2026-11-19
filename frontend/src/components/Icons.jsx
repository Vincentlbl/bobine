// Petites icônes SVG dessinées à la main : pas de bibliothèque à installer.
// Elles prennent la couleur du texte (currentColor) et sont cachées des
// lecteurs d'écran : le texte du bouton porte le sens.

function Icon({ children, size = 20, filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function StarIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />
    </Icon>
  );
}

export function HeartIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </Icon>
  );
}

export function SearchIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Icon>
  );
}

export function BookmarkIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7 4h10v16l-5-3.5L7 20z" />
    </Icon>
  );
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function TrashIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7" />
    </Icon>
  );
}

// La bobine du logo : un disque percé de cinq trous.
export function ReelIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="reel">
      <circle cx="16" cy="16" r="14" fill="currentColor" />
      <g fill="var(--night)">
        <circle cx="16" cy="16" r="2.2" />
        <circle cx="16" cy="7.8" r="3.2" />
        <circle cx="23.8" cy="13.5" r="3.2" />
        <circle cx="20.8" cy="22.6" r="3.2" />
        <circle cx="11.2" cy="22.6" r="3.2" />
        <circle cx="8.2" cy="13.5" r="3.2" />
      </g>
    </svg>
  );
}
