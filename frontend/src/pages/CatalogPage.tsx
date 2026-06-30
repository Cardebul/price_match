import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../shared/api';
import { Search, Hash, Package } from 'lucide-react';

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => catalogApi.products({ search: searchTerm }).then(res => res.data)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по артикулу или названию..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-gray-400">Загрузка каталога...</div>
        ) : products?.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                ID: {product.id.split('-')[0]}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 capitalize">
              <Hash className="w-4 h-4" />
              <span>Арт: {product.article}</span>
              <span className="mx-1">•</span>
              <span>{product.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
