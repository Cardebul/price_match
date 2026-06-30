import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estimatesApi } from '../api';
import { X, Check } from 'lucide-react';

interface SetupStepProps {
  estimateId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelSetupModal({ estimateId, onClose, onSuccess }: SetupStepProps) {
  const [mapping, setMapping] = useState<Record<string, any>>({
    start_row: 2,
    extra: {}
  });

  const { data: preview, isLoading } = useQuery({
    queryKey: ['estimate-preview', estimateId],
    queryFn: () => estimatesApi.preview(estimateId).then((res: any) => res.data)
  });

  const handleSave = async () => {
    try {
      await estimatesApi.setup(estimateId, mapping);
      onSuccess();
    } catch (err) {
      alert('Ошибка при сохранении маппинга');
    }
  };

  const setColumn = (field: string, index: number) => {
    if (['name', 'article', 'unit', 'quantity'].includes(field)) {
      setMapping(prev => ({ ...prev, [field]: index }));
    } else {
      setMapping(prev => ({
        ...prev,
        extra: { ...prev.extra, [field]: index }
      }));
    }
  };

  const fields = [
    { id: 'name', label: 'Наименование' },
    { id: 'article', label: 'Артикул' },
    { id: 'unit', label: 'Ед. изм.' },
    { id: 'quantity', label: 'Количество' },
    { id: 'material_price', label: 'Цена материалов' },
    { id: 'work_price', label: 'Цена работ' },
  ];

  if (isLoading) return null;

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
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b text-xs font-bold text-gray-500 uppercase">
                  Превью данных (первые 10 строк)
                </div>
                <div className="overflow-auto">
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
