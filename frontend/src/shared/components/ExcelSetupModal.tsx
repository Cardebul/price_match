import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estimatesApi, priceListsApi } from '../api';
import { X, Check, Plus, Trash2 } from 'lucide-react';

interface SetupStepProps {
  id: string;
  type: 'price_list' | 'estimate';
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelSetupModal({ id, type, onClose, onSuccess }: SetupStepProps) {
  const api = type === 'price_list' ? priceListsApi : estimatesApi;

  const [mapping, setMapping] = useState<Record<string, any>>({
    start_row: 2,
    extra: {}
  });

  const { data: preview, isLoading } = useQuery({
    queryKey: [`${type}-preview`, id],
    queryFn: () => api.preview(id).then((res: any) => res.data),
    enabled: !!id && id !== 'undefined'
  });

  const handleSave = async () => {
    try {
      await api.setup(id, mapping);
      onSuccess();
    } catch (err) {
      alert('Ошибка при сохранении мапинга');
    }
  };

  const setColumn = (field: string, index: number) => {
    const isMain = type === 'price_list' 
      ? ['name', 'article', 'unit', 'price'].includes(field)
      : ['name', 'article', 'unit', 'quantity'].includes(field);

    if (isMain) {
      setMapping(prev => ({ ...prev, [field]: index }));
    } else {
      setMapping(prev => ({
        ...prev,
        extra: { ...prev.extra, [field]: index }
      }));
    }
  };

  const addExtraField = () => {
    const fieldName = prompt('Введите название поля (напр: Цвет, Скидка):');
    if (fieldName && !mapping.extra[fieldName]) {
      setMapping(prev => ({
        ...prev,
        extra: { ...prev.extra, [fieldName]: '' }
      }));
    }
  };

  const removeExtraField = (field: string) => {
    setMapping(prev => {
      const newExtra = { ...prev.extra };
      delete newExtra[field];
      return { ...prev, extra: newExtra };
    });
  };

  const fields = type === 'price_list' 
    ? [
        { id: 'name', label: 'Наименование' },
        { id: 'article', label: 'Артикул' },
        { id: 'unit', label: 'Ед. изм.' },
        { id: 'price', label: 'Цена' },
      ]
    : [
        { id: 'name', label: 'Наименование' },
        { id: 'article', label: 'Артикул' },
        { id: 'unit', label: 'Ед. изм.' },
        { id: 'quantity', label: 'Количество' },
        { id: 'material_price', label: 'Цена материалов' },
        { id: 'work_price', label: 'Цена работ' },
      ];

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl flex items-center gap-3">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-bold text-gray-700">Загрузка превью...</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Настройка колонок Excel</h3>
            <p className="text-sm text-gray-500">Укажите соответствие полей данным из файла</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Начать со строки</span>
                  <input 
                    type="number" 
                    value={mapping.start_row}
                    onChange={e => setMapping(prev => ({ ...prev, start_row: parseInt(e.target.value) }))}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                </label>
                
                <div className="space-y-3">
                  <span className="text-sm font-semibold text-gray-700 block">Маппинг полей</span>
                  {fields.map(field => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">{field.label}</label>
                      <select 
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={field.id in mapping ? mapping[field.id] : (mapping.extra[field.id] ?? '')}
                        onChange={e => setColumn(field.id, parseInt(e.target.value))}
                      >
                        <option value="">Не выбрано</option>
                        {preview?.headers?.map((h: string, i: number) => (
                          <option key={i} value={i}>{h || `Колонка ${i + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Доп. колонки</span>
                      <button 
                        onClick={addExtraField}
                        className="p-1 hover:bg-blue-50 text-blue-600 rounded-md transition"
                        title="Добавить свое поле"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {Object.keys(mapping.extra).map(field => {
                      const isPreset = ['material_price', 'work_price'].includes(field);
                      return (
                        <div key={field} className="space-y-1 group">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-500 uppercase font-bold truncate">
                              {field === 'material_price' ? 'Цена материалов' : 
                               field === 'work_price' ? 'Цена работ' : field}
                            </label>
                            {!isPreset && (
                              <button 
                                onClick={() => removeExtraField(field)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <select 
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            value={mapping.extra[field] ?? ''}
                            onChange={e => setColumn(field, parseInt(e.target.value))}
                          >
                            <option value="">Не выбрано</option>
                            {preview?.headers?.map((h: string, i: number) => (
                              <option key={i} value={i}>{h || `Колонка ${i + 1}`}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {preview?.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                  <span className="font-bold">Ошибка чтения файла:</span> {preview.error}
                </div>
              )}
              
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b text-xs font-bold text-gray-500 uppercase">
                  Превью данных (первые 20 строк)
                </div>
                <div className="overflow-auto max-h-[500px]">
                  {!preview?.rows?.length && !isLoading && (
                    <div className="p-12 text-center text-gray-400">
                      Нет данных для отображения. Возможно, файл пустой.
                    </div>
                  )}
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        {preview?.headers?.map((h: string, i: number) => (
                          <th key={i} className="px-3 py-2 border font-bold text-gray-600 whitespace-nowrap">
                            {h || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview?.rows?.slice(0, 10).map((row: any[], ri: number) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 border text-gray-500 whitespace-nowrap max-w-[200px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-6 py-2 font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            <Check className="w-4 h-4" />
            Запустить парсинг
          </button>
        </div>
      </div>
    </div>
  );
}
