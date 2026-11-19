import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CatalogPage from './pages/CatalogPage';
import JournalPage from './pages/JournalPage';
import LoginPage from './pages/LoginPage';
import MoviePage from './pages/MoviePage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';

// Toutes les pages de l'application, affichées à l'intérieur du Layout commun.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/films/:id', element: <MoviePage /> },
      {
        path: '/journal',
        element: (
          <ProtectedRoute>
            <JournalPage />
          </ProtectedRoute>
        ),
      },
      { path: '/connexion', element: <LoginPage /> },
      { path: '/inscription', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
