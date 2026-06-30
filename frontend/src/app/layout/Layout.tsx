import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, FileText, ClipboardList } from 'lucide-react';
import { cn } from '../../shared/utils/cn';

const navigation = [
  { name: 'Поставщики', href: '/suppliers', icon: Users },
  { name: 'Каталог товаров', href: '/catalog', icon: LayoutGrid },
  { name: 'Проекты и сметы', href: '/projects', icon: FileText },
];

export default function Layout() {
  const location = useLocation();

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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-lg font-semibold text-gray-800">
            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Панель управления'}
          </h1>
        </header>
        
        <main className="p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
