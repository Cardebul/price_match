import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '../shared/api';
import { Search, Hash, Package, Folder, ChevronRight, RefreshCw, Layers, Plus, X } from 'lucide-react';
import { cn } from '../shared/utils/cn';

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const { data: groups } = useQuery({
    queryKey: ['product-groups'],
    queryFn: () => catalogApi.groups().then(res => res.data)
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedGroupId],
    queryFn: () => catalogApi.products({ 
      search: searchTerm, 
      group: selectedGroupId 
    }).then(res => res.data)
  });

  const syncMutation = useMutation({
    mutationFn: () => catalogApi.syncEmbeddings(),
  });

  const createGroupMutation = useMutation({
    mutationFn: (name: string) => catalogApi.createGroup({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-groups'] });
      setIsGroupModalOpen(false);
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => catalogApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductModalOpen(false);
    }
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] relative">
      {/* Sidebar: Categories */}
      <div className="w-64 bg-white rounded-2xl border shadow-sm flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Категории
          </h3>
          <button 
            onClick={() => setIsGroupModalOpen(true)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedGroupId(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
              !selectedGroupId ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Folder className="w-4 h-4" />
            Все товары
          </button>
          
          <div className="mt-2 space-y-1">
            {groups?.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition",
                  selectedGroupId === group.id ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <ChevronRight className={cn("w-3 h-3 transition", selectedGroupId === group.id && "rotate-90")} />
                  <span className="truncate">{group.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Product Table */}
      <div className="flex-1 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по артикулу или названию..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsProductModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить товар
            </button>
          </div>
          
          <button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4 text-blue-600", syncMutation.isPending && "animate-spin")} />
            {syncMutation.isPending ? 'Синхронизация...' : 'Обновить ИИ-индекс'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
              Загрузка каталога...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 sticky top-0 border-b backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Артикул</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Наименование</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Ед. изм.</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Группа</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                      Товары не найдены
                    </td>
                  </tr>
                ) : products?.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{product.article}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.unit}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        <Folder className="w-3 h-3" />
                        {groups?.find(g => g.id === product.group)?.name || 'Без группы'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    {/* Modal for Group */}
    {isGroupModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createGroupMutation.mutate(formData.get('name') as string);
          }}
          className="bg-white rounded-2xl shadow-xl w-96 p-6 space-y-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Новая категория</h2>
            <button type="button" onClick={() => setIsGroupModalOpen(false)}><X className="w-5 h-5"/></button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Название группы</label>
            <input name="name" required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Например: Электроинструмент"/>
          </div>
          <button 
            disabled={createGroupMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {createGroupMutation.isPending ? 'Создание...' : 'Создать категорию'}
          </button>
        </form>
      </div>
    )}

    {/* Modal for Product */}
    {isProductModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createProductMutation.mutate({
              name: formData.get('name'),
              article: formData.get('article'),
              unit: formData.get('unit'),
              group: formData.get('group') || null,
            });
          }}
          className="bg-white rounded-2xl shadow-xl w-[500px] p-6 space-y-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Новый товар</h2>
            <button type="button" onClick={() => setIsProductModalOpen(false)}><X className="w-5 h-5"/></button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Наименование</label>
              <input name="name" required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Артикул</label>
              <input name="article" required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ед. изм.</label>
              <input name="unit" defaultValue="шт." required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Категория</label>
              <select name="group" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Без категории</option>
                {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <button 
            disabled={createProductMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {createProductMutation.isPending ? 'Создание...' : 'Добавить в каталог'}
          </button>
        </form>
      </div>
    )}
    </div>
  );
}
