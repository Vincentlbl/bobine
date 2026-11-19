import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page empty-state">
      <h1>Cette page n’existe pas</h1>
      <p className="muted">L’adresse est peut-être incomplète, ou la page a été déplacée.</p>
      <Link to="/" className="button button--primary">
        Retour au catalogue
      </Link>
    </div>
  );
}
