import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi, priceListsApi } from '../shared/api';
import { Search, Plus, Building2, Trash2, Edit2, Wallet, FileSpreadsheet, Upload, History, Settings, ExternalLink } from 'lucide-react';
import { cn } from '../shared/utils/cn';
import type { Supplier, PriceList } from '../shared/types/api';
import ExcelSetupModal from '../shared/components/ExcelSetupModal';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => 
      data.id ? suppliersApi.update(data.id, data) : suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditingSupplier(null);
    },
  });

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.inn.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Поставщики</h2>
          <p className="text-gray-500">Управление базой поставщиков и их прайс-листами</p>
        </div>
        <button 
          onClick={() => setEditingSupplier({ name: '', inn: '', currency: 'RUB' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Добавить поставщика
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Поиск по названию или ИНН..."
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
           Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-white animate-pulse rounded-2xl border" />)
        ) : filteredSuppliers?.map(supplier => (
          <SupplierCard key={supplier.id} supplier={supplier} onDelete={() => deleteMutation.mutate(supplier.id)} onEdit={() => setEditingSupplier(supplier)} />
        ))}
      </div>

      {editingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">
              {editingSupplier.id ? 'Редактировать' : 'Новый'} поставщик
            </h3>
            <form onSubmit={e => {
              e.preventDefault();
              upsertMutation.mutate(editingSupplier);
            }} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Название</span>
                <input 
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={editingSupplier.name}
                  onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">ИНН</span>
                <input 
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={editingSupplier.inn}
                  onChange={e => setEditingSupplier({...editingSupplier, inn: e.target.value})}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Валюта</span>
                <select 
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={editingSupplier.currency}
                  onChange={e => setEditingSupplier({...editingSupplier, currency: e.target.value})}
                >
                  <option value="RUB">RUB (₽)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setEditingSupplier(null)} className="px-4 py-2 text-gray-600">Отмена</button>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierCard({ supplier, onEdit, onDelete }: { supplier: Supplier, onEdit: () => void, onDelete: () => void }) {
  const [showUpload, setShowUpload] = useState(false);
  const [setupPriceListId, setSetupPriceListId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => priceListsApi.upload(formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists', supplier.id] });
      setShowUpload(false);
      setFile(null);
      // Open setup modal for the new price list
      setSetupPriceListId(res.data.id);
    }
  });

  const { data: priceLists } = useQuery({
    queryKey: ['price-lists', supplier.id],
    queryFn: () => priceListsApi.list({ supplier: supplier.id }).then(res => res.data),
    refetchInterval: (query) => {
      const data = query.state.data as any[];
      return data?.some(pl => ['pending', 'processing'].includes(pl.status)) ? 2000 : false;
    }
  });

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplier', supplier.id);
    formData.append('name', file.name);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-md">
      <div className="p-6 border-b bg-gray-50/50 flex justify-between items-start">
        <div className="flex gap-4">
          <div className="p-3 bg-white rounded-xl border shadow-sm">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
            <div className="text-sm text-gray-500 mt-1">ИНН: {supplier.inn} • Валюта: {supplier.currency}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition text-gray-400">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => confirm('Удалить?') && onDelete()} className="p-2 hover:bg-white hover:text-red-600 rounded-lg transition text-gray-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Прайс-листы
          </h4>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Загрузить новый
          </button>
        </div>

        {showUpload && (
          <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
            <input 
              type="file" 
              accept=".xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {file && (
              <button 
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Загрузка...' : 'Начать импорт'}
              </button>
            )}
          </div>
        )}

        <div className="space-y-2">
          {priceLists?.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl text-gray-400 text-sm">
              Нет загруженных прайсов
            </div>
          ) : priceLists?.map(pl => (
            <div key={pl.id} className="group/pl flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => navigate(`/price-lists/${pl.id}`)}
              >
                <div className="p-2 bg-gray-100 rounded-lg group-hover/pl:bg-blue-600 transition">
                  <FileSpreadsheet className="w-4 h-4 text-gray-500 group-hover/pl:text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {pl.file?.split('/').pop() || 'Без названия'}
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover/pl:opacity-100" />
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    {new Date(pl.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    pl.status === 'done' ? "bg-green-100 text-green-700" :
                    pl.status === 'error' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {pl.status === 'processing' && pl.total_rows 
                      ? `Парсинг ${Math.round((pl.parsed_rows / pl.total_rows) * 100)}%`
                      : pl.status}
                  </span>
                  <button 
                  onClick={() => setSetupPriceListId(pl.id)}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition border border-transparent hover:border-blue-100"
                  title="Настроить колонки"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                {pl.status === 'processing' && (
                  <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${(pl.parsed_rows / (pl.total_rows || 1)) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {setupPriceListId && (
        <ExcelSetupModal
          id={setupPriceListId}
          type="price_list"
          onClose={() => setSetupPriceListId(null)}
          onSuccess={() => {
            setSetupPriceListId(null);
            queryClient.invalidateQueries({ queryKey: ['price-lists', supplier.id] });
          }}
        />
      )}
    </div>
  );
}
