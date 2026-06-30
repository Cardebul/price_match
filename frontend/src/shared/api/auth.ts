import api from './base';

export const authApi = {
  login: (data: any) => api.post('/token/', data),
  refresh: (refresh: string) => api.post('/token/refresh/', { refresh }),
};
