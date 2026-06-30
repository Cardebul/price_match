import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import SuppliersPage from '../pages/SuppliersPage';
import CatalogPage from '../pages/CatalogPage';
import ProjectsPage from '../pages/ProjectsPage';
import EstimateDetailsPage from '../pages/EstimateDetailsPage';
import PriceListDetailsPage from '../pages/PriceListDetailsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/suppliers" replace />,
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'price-lists/:id',
        element: <PriceListDetailsPage />,
      },
      {
        path: 'estimates/:id',
        element: <EstimateDetailsPage />,
      },
    ],
  },
]);
