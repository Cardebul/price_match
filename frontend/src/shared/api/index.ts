import api from './base';
import type { Supplier, PriceList, Product, ProductGroup, Project, Estimate, EstimateItem } from '../types/api';

export const suppliersApi = {
  list: (params?: any) => api.get<Supplier[]>('/suppliers/', { params }),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers/', data),
  update: (id: string, data: Partial<Supplier>) => api.patch<Supplier>(`/suppliers/${id}/`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}/`),
};

export const priceListsApi = {
  list: (params?: any) => api.get<PriceList[]>('/price-lists/', { params }),
  upload: (data: FormData) => api.post<PriceList>('/price-lists/', data),
  preview: (id: string) => api.get<any>(`/price-lists/${id}/preview/`),
  setup: (id: string, mapping: any) => api.post(`/price-lists/${id}/setup/`, { column_mapping: mapping }),
  get: (id: string) => api.get<PriceList>(`/price-lists/${id}/`),
  items: (id: string) => api.get<any[]>(`/price-lists/${id}/items/`),
  matchItem: (id: string, itemId: string, productId: string | null) => 
    api.post(`/price-lists/${id}/match_item/`, { item_id: itemId, product_id: productId }),
};

export const catalogApi = {
  products: (params?: any) => api.get<Product[]>('/products/', { params }),
  createProduct: (data: Partial<Product>) => api.post<Product>('/products/', data),
  groups: () => api.get<ProductGroup[]>('/product-groups/'),
  createGroup: (data: Partial<ProductGroup>) => api.post<ProductGroup>('/product-groups/', data),
  syncEmbeddings: () => api.post('/products/sync_embeddings/'),
};

export const projectsApi = {
  list: () => api.get<Project[]>('/projects/'),
  create: (data: Partial<Project>) => api.post<Project>('/projects/', data),
};

export const estimatesApi = {
  list: (params?: any) => api.get<Estimate[]>('/estimate/', { params }),
  upload: (data: FormData) => api.post<Estimate>('/estimate/', data),
  preview: (id: string) => api.get<any>(`/estimate/${id}/preview/`),
  setup: (id: string, mapping: any) => api.post(`/estimate/${id}/setup/`, { column_mapping: mapping }),
  get: (id: string) => api.get<Estimate>(`/estimate/${id}/`),
  items: (estimateId: string) => api.get<EstimateItem[]>(`/estimate/${estimateId}/items/`),
  matchItem: (id: string, itemId: string, productId: string | null) => 
    api.post(`/estimate/${id}/match_item/`, { item_id: itemId, product_id: productId }),
};
