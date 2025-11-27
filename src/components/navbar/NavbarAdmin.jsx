import React, { useState } from 'react';
import { Menu, X, Users, UserPlus, LogOut, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function NavbarAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin-auth', label: 'Admin', icon: <Shield size={20} className="mr-2" /> },
    { to: '/utilisateur-login', label: 'utilisateurs', icon: <Users size={20} className="mr-2" /> },
    { to: '/utilisateur', label: 'Instacription des utilisateurs', icon: <UserPlus size={20} className="mr-2" /> },
  ];

  const navLink = (to) =>
    `flex items-center px-4 py-2 rounded transition-all duration-200 font-medium ${
      location.pathname === to
        ? 'bg-blue-600 bg-opacity-80 text-white shadow'
        : 'hover:bg-blue-100 dark:hover:bg-gray-800 hover:text-blue-700 dark:hover:text-blue-300'
    }`;

  const handleLogout = () => {
    // localStorage.removeItem('adminToken'); // décommente si tu utilises un token
    navigate('/admin-auth');
  };

  return (
    <>
      <nav className="bg-white/80 dark:bg-gray-900/80 shadow-md sticky top-0 z-50 animate-fade-in-down backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 transition"
              aria-label="Ouvrir le menu"
            >
              {sidebarOpen ? <X size={28} className="animate-fade-in-up" /> : <Menu size={28} className="animate-fade-in-down" />}
            </button>
            <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2">
              <Shield size={28} className="animate-bounce" />
              Admin Panel
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-gray-800 dark:text-gray-200">
            {navItems.map(item => (
              <Link key={item.to} to={item.to} className={navLink(item.to)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-all ml-2 animate-fade-in-up"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar responsive */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!sidebarOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-500 backdrop-blur-sm ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white/90 dark:bg-gray-900/90 shadow-xl transform transition-transform duration-500
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} animate-slide-in backdrop-blur-lg`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Shield size={24} className="animate-bounce" />
              Admin
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 transition"
              aria-label="Fermer le menu"
            >
              <X size={28} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 mt-4 px-2 text-gray-800 dark:text-gray-200">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={navLink(item.to)}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-all mt-4 animate-fade-in-up"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button>
          </nav>
        </aside>
      </div>

      {/* Animations CSS */}
      <style>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.7s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s;
        }
        .animate-bounce {
          animation: bounce 1.2s infinite;
        }
        .animate-slide-in {
          animation: slideInSidebar 0.5s;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-8px);}
        }
        @keyframes slideInSidebar {
          from { opacity: 0; transform: translateX(-100%);}
          to { opacity: 1; transform: translateX(0);}
        }
      `}</style>
    </>
  );
}