export interface Supplier {
  id: string;
  name: string;
  inn: string;
  currency: string;
  created_at: string;
}

export interface PriceList {
  id: string;
  supplier: string;
  name: string;
  file: string;
  status: 'new' | 'pending' | 'processing' | 'done' | 'error';
  total_rows: number;
  parsed_rows: number;
  created_at: string;
  error_message?: string;
}

export interface Product {
  id: string;
  article: string;
  name: string;
  unit: string;
  group?: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  parent?: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Estimate {
  id: string;
  project: string;
  name: string;
  file: string;
  status: 'new' | 'pending' | 'processing' | 'done' | 'error';
  column_mapping: Record<string, any>;
  created_at: string;
  total_rows?: number;
  parsed_rows?: number;
  error_message?: string;
}

export interface EstimateItem {
  id: string;
  estimate: string;
  name: string;
  article: string;
  unit: string;
  quantity: number;
  product?: string;
  product_details?: Product;
  match_status: 'unmatched' | 'matched' | 'no_match';
  match_confidence?: number;
  match_comment?: string;
  row_number: number;
  prices?: Record<string, number>;
}
