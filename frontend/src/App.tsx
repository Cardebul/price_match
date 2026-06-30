import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './app/layout/Layout';
import SuppliersPage from './pages/SuppliersPage';
import CatalogPage from './pages/CatalogPage';
import ProjectsPage from './pages/ProjectsPage';
import EstimateDetailsPage from './pages/EstimateDetailsPage';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/suppliers" replace />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="estimates/:id" element={<EstimateDetailsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
