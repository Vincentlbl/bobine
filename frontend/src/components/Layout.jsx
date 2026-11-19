import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ReelIcon } from './Icons';
import './Layout.css';

// Cadre commun à toutes les pages : barre de navigation, contenu, pied de page.
export default function Layout() {
  const { user, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Page courante, transmise aux pages de connexion pour y revenir ensuite.
  const isAuthPage = ['/connexion', '/inscription'].includes(location.pathname);
  const from = isAuthPage ? location.state?.from : location.pathname + location.search;

  function handleLogout() {
    logout();
    showToast('Tu es déconnecté.');
    navigate('/');
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo" aria-label="Bobine, accueil">
            <ReelIcon />
            <span>Bobine</span>
          </Link>

          <nav className="navbar__links" aria-label="Navigation principale">
            <NavLink to="/" end>
              Films
            </NavLink>
          </nav>

          <div className="navbar__account">
            {user ? (
              <>
                <span className="navbar__email muted">{user.email}</span>
                <button type="button" className="button button--small" onClick={handleLogout}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion" state={{ from }} className="button button--small button--quiet">
                  Se connecter
                </Link>
                <Link to="/inscription" state={{ from }} className="button button--small button--primary">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer muted">
        Catalogue : jeu de données public sample_mflix de MongoDB. Projet étudiant Full Stack JS.
      </footer>

      {/* Au retour arrière, on retrouve la grille là où on l'avait laissée */}
      <ScrollRestoration />
    </>
  );
}
