import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, estimatesApi } from '../shared/api';
import { Link } from 'react-router-dom';
import { FilePlus, ExternalLink, Clock, CheckCircle2, AlertCircle, Settings, PlusCircle } from 'lucide-react';
import { cn } from '../shared/utils/cn';
import ExcelSetupModal from '../shared/components/ExcelSetupModal';

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
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [setupEstimateId, setSetupEstimateId] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(res => res.data)
  });

  const { data: estimates } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.list().then(res => res.data),
    refetchInterval: (query) => {
      const data = query.state.data as any[];
      return data?.some(e => ['pending', 'processing'].includes(e.status)) ? 2000 : false;
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: (name: string) => projectsApi.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateProject(false);
      setNewProjectName('');
    },
    onError: (error: any) => {
      alert(`Ошибка: ${error.response?.data?.detail || error.message}`);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!selectedProjectId) throw new Error("Выберите проект");
      formData.append('project', selectedProjectId);
      return estimatesApi.upload(formData);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setShowUpload(false);
      setFile(null);
      setName('');
      setSetupEstimateId(res.data.id);
    },
    onError: (error: any) => {
      alert(`Ошибка при загрузке: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !selectedProjectId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Проекты и сметы</h2>
          <p className="text-gray-500">Загрузка смет и отслеживание процесса сопоставления</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setShowCreateProject(!showCreateProject);
              setShowUpload(false);
            }}
            className="flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            {showCreateProject ? 'Отмена' : 'Создать проект'}
          </button>
          <button 
            onClick={() => {
              setShowUpload(!showUpload);
              setShowCreateProject(false);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
          >
            {showUpload ? <AlertCircle className="w-4 h-4" /> : <FilePlus className="w-4 h-4" />}
            {showUpload ? 'Отмена' : 'Загрузить смету'}
          </button>
        </div>
      </div>

      {showCreateProject && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createProjectMutation.mutate(newProjectName);
            }} 
            className="flex gap-4 items-end"
          >
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Название проекта</label>
              <input 
                required
                type="text" 
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Напр: ЖК Южный, Корпус 1"
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <button 
              disabled={createProjectMutation.isPending}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 h-[42px]"
            >
              {createProjectMutation.isPending ? 'Создание...' : 'Создать проект'}
            </button>
          </form>
        </div>
      )}

      {showUpload && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Выберите проект</label>
              <select 
                required
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition h-[42px] bg-white text-sm"
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
              >
                <option value="" disabled>--- Выберите проект ---</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Название сметы</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Напр: Смета на сантехнику"
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
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить смету'}
            </button>
          </form>
        </div>
      )}

      {setupEstimateId && (
        <ExcelSetupModal 
          id={setupEstimateId}
          type="estimate"
          onClose={() => setSetupEstimateId(null)}
          onSuccess={() => {
            setSetupEstimateId(null);
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
          }}
        />
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{estimate.name}</h3>
                    {estimate.status === 'new' && (
                      <button 
                        onClick={() => setSetupEstimateId(estimate.id)}
                        className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold hover:bg-orange-100 transition"
                      >
                        <Settings className="w-3 h-3" />
                        Настроить
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="font-medium text-blue-600">
                      Проект: {projects?.find(p => p.id === estimate.project)?.name || '...'}
                    </span>
                    <span>•</span>
                    <span>Загружена: {new Date(estimate.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={cn("font-medium", status.color)}>
                      {estimate.status === 'processing' && estimate.total_rows 
                        ? `Парсинг ${Math.round(((estimate.parsed_rows || 0) / estimate.total_rows) * 100)}%`
                        : status.label}
                    </span>
                  </div>
                  {estimate.status === 'processing' && (
                    <div className="mt-2 w-full max-w-sm h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${((estimate.parsed_rows || 0) / (estimate.total_rows || 1)) * 100}%` }}
                      />
                    </div>
                  )}
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
