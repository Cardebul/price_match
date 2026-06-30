import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, FileText, ClipboardList, LogOut, Loader2 } from 'lucide-react';
import { cn } from '../../shared/utils/cn';
import { useState, useEffect } from 'react';
import AuthModal from '../../shared/components/AuthModal';
import { authApi } from '../../shared/api/auth';

const navigation = [
  { name: 'Поставщики', href: '/suppliers', icon: Users },
  { name: 'Каталог товаров', href: '/catalog', icon: LayoutGrid },
  { name: 'Проекты и сметы', href: '/projects', icon: FileText },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  const verifyToken = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      setIsVerifying(false);
      return;
    }

    try {
      await authApi.verify(token);
      setIsAuthenticated(true);
    } catch (err) {
      // Если версификация не прошла, пробуем рефреш или просто разлогиниваем
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <ClipboardList className="w-8 h-8" />
            <span>Price Match</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-gray-800">
            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Панель управления'}
          </h1>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </header>
        
        <main className="p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
