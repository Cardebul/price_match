import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { estimatesApi } from '../shared/api';
import { CheckCircle2, AlertCircle, HelpCircle, ArrowLeft, Settings2 } from 'lucide-react';
import { cn } from '../shared/utils/cn';
import ExcelSetupModal from '../shared/components/ExcelSetupModal';

export default function EstimateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);

  const { data: estimate } = useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimatesApi.get(id!).then(res => res.data),
    enabled: !!id,
    refetchInterval: (query) => 
      query.state.data?.status === 'processing' || query.state.data?.status === 'pending' ? 2000 : false,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['estimate-items', id],
    queryFn: () => estimatesApi.items(id!).then(res => res.data),
    enabled: !!id && estimate?.status === 'done',
  });

  if (!estimate) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{estimate.name}</h2>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            estimate.status === 'done' ? "bg-green-100 text-green-700" : 
            estimate.status === 'error' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          )}>
            {estimate.status}
          </span>
        </div>
        
        <button 
          onClick={() => setShowSetup(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Settings2 className="w-4 h-4" />
          Настроить колонки
        </button>
      </div>

      {showSetup && id && (
         <ExcelSetupModal 
           estimateId={id} 
           onClose={() => setShowSetup(false)} 
           onSuccess={() => {
             setShowSetup(false);
             queryClient.invalidateQueries({ queryKey: ['estimate', id] });
           }}
         />
      )}

      {estimate.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          <span className="text-blue-700 font-medium">
            Парсинг в процессе: {estimate.parsed_rows} / {estimate.total_rows} строк...
          </span>
        </div>
      )}

      {estimate.status === 'done' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">#</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Наименование</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Артикул</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Кол-во</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Сопоставление (ИИ)</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Уверенность</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itemsLoading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Загрузка позиций...</td></tr>
              ) : items?.map((item) => {
                const isMatched = item.match_status === 'matched';
                const confidence = (item.match_confidence || 0) * 100;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">{item.row_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.article || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.quantity}</td>
                    <td className="px-6 py-4">
                      {isMatched ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_details?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.product_details?.article}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <HelpCircle className="w-4 h-4" />
                          <span className="text-sm">Нет соответствия</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.match_confidence != null && (
                         <div className="flex flex-col items-end gap-1">
                           <span className={cn(
                             "text-xs font-bold px-2 py-0.5 rounded",
                             confidence > 80 ? "bg-green-100 text-green-700" : 
                             confidence > 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                           )}>
                             {confidence.toFixed(1)}%
                           </span>
                           <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                             <div 
                               className={cn(
                                 "h-full rounded-full",
                                 confidence > 80 ? "bg-green-500" : 
                                 confidence > 50 ? "bg-yellow-500" : "bg-red-500"
                               )} 
                               style={{ width: `${confidence}%` }} 
                             />
                           </div>
                         </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {estimate.status === 'error' && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 text-red-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold">Ошибка парсинга</h3>
          </div>
          <p className="text-red-600">{estimate.error_message}</p>
        </div>
      )}
    </div>
  );
}
