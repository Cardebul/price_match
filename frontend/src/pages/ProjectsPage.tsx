import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, estimatesApi } from '../shared/api';
import { Link } from 'react-router-dom';
import { FilePlus, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../shared/utils/cn';

const statusMap: Record<string, any> = {
  new: { icon: Clock, color: 'text-gray-400', label: 'Черновик' },
  pending: { icon: Clock, color: 'text-blue-500', label: 'В очереди' },
  processing: { icon: Clock, color: 'text-yellow-500', label: 'Парсинг...' },
  done: { icon: CheckCircle2, color: 'text-green-500', label: 'Готово' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Ошибка' },
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');

  const { data: estimates } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.list().then(res => res.data)
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => estimatesApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setShowUpload(false);
      setFile(null);
      setName('');
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    // Для упрощения привязываем к тестовому проекту, если проект не выбран
    // В реальном ТЗ сметы внутри проектов.
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Проекты и сметы</h2>
          <p className="text-gray-500">Загрузка смет и отслеживание процесса сопоставления</p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
        >
          {showUpload ? <AlertCircle className="w-4 h-4" /> : <FilePlus className="w-4 h-4" />}
          {showUpload ? 'Отмена' : 'Новая смета'}
        </button>
      </div>

      {showUpload && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Название проекта/сметы</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Напр: ЖК Горизонт - Корпус 1"
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Файл Excel (.xlsx)</label>
              <input 
                required
                type="file" 
                accept=".xlsx"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
            <button 
              disabled={uploadMutation.isPending}
              className="bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 h-[42px]"
            >
              {uploadMutation.isPending ? 'Загрузка...' : 'Создать и загрузить'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {estimates?.map((estimate) => {
          const status = statusMap[estimate.status];
          return (
            <div key={estimate.id} className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between hover:border-blue-300 transition">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full bg-gray-50", status.color)}>
                  <status.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{estimate.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>Загружена: {new Date(estimate.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={cn("font-medium", status.color)}>{status.label}</span>
                  </div>
                </div>
              </div>
              
              <Link 
                to={`/estimates/${estimate.id}`}
                className="flex items-center gap-2 text-blue-600 font-semibold hover:underline"
              >
                Открыть
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
