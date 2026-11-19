import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';

// Toutes les pages de l'application, affichées à l'intérieur du Layout commun.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
