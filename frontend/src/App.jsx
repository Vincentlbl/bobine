import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';

// Toutes les pages de l'application, affichées à l'intérieur du Layout commun.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/connexion', element: <LoginPage /> },
      { path: '/inscription', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
