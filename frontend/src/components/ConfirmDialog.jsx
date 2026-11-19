import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

// Fenêtre de confirmation avant une action irréversible (suppression).
// On utilise la balise native <dialog> : elle gère d'elle-même le fond
// assombri, la touche Échap et le maintien du focus dans la fenêtre.
export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="confirm" onClose={onCancel} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <p className="muted">{message}</p>
      <div className="confirm__actions">
        <button type="button" className="button" onClick={onCancel}>
          Annuler
        </button>
        <button type="button" className="button button--primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
