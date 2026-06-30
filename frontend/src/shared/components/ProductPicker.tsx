import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api';
import { Search, X, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface ProductPickerProps {
  onSelect: (productId: string | null) => void;
  onClose: () => void;
  currentProductId?: string;
}

export default function ProductPicker({ onSelect, onClose, currentProductId }: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-search', debouncedSearch],
    queryFn: () => catalogApi.products({ search: debouncedSearch }).then(res => res.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Выбор товара из каталога</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Поиск по названию или артикулу..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : products?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Товары не найдены</div>
          ) : (
            <div className="grid gap-1">
              {products?.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onSelect(product.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left group",
                    currentProductId === product.id && "bg-blue-50 hover:bg-blue-100 border-blue-200"
                  )}
                >
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">Артикул: {product.article}  {product.unit}</div>
                  </div>
                  {currentProductId === product.id ? (
                    <Check className="w-5 h-5 text-blue-600" />
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 text-blue-600 text-sm font-medium">Выбрать</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between gap-3">
          <button
            onClick={() => onSelect(null)}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            Сбросить соответствие
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
