import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Page réservée aux utilisateurs connectés. Sinon : direction la connexion,
// en retenant la page demandée pour y revenir ensuite.
// Rappel : ce n'est qu'un confort d'interface. La vraie protection est
// dans l'API, qui refuse toute requête sans jeton valide.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname + location.search }} replace />;
  }
  return children;
}
