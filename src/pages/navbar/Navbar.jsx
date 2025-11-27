import React, { useState, useEffect, useRef } from 'react';
import {
  Moon, Sun, Menu, X, Home, Users, UserPlus, Calendar, FileText, LogOut, ClipboardList, ChevronDown, ChevronUp, User, Settings
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function DropdownMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 transition-all gap-2"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <User size={20} />
        <span className="hidden md:inline font-semibold">Compte</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div
        className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded shadow-lg border border-blue-100 dark:border-gray-700 z-50 transition-all duration-300 origin-top-right
          ${open ? 'scale-100 opacity-100 pointer-events-auto animate-dropdown-in' : 'scale-95 opacity-0 pointer-events-none'}
        `}
        role="menu"
      >
        <button
          className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all gap-2"
          role="menuitem"
        >
          <Settings size={18} /> Paramètres
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-all gap-2"
          role="menuitem"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px);}
          to { opacity: 1; transform: scale(1) translateY(0);}
        }
        .animate-dropdown-in { animation: dropdownIn 0.25s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  );
}

export default function Navbar({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const theme = localStorage.getItem('theme');
      return theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleTheme = () => setDarkMode((prev) => !prev);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/admin-auth');
  };

  const navItems = [
    { to: '/accueil', label: 'Accueil', icon: <Home size={20} className="mr-2" /> },
    { to: '/patients', label: 'Patients', icon: <Users size={20} className="mr-2" /> },
    { to: '/praticiens', label: 'Praticiens', icon: <UserPlus size={20} className="mr-2" /> },
    { to: '/rendezvous', label: 'Rendez-vous', icon: <Calendar size={20} className="mr-2" /> },
    { to: '/consultation', label: 'Consultations', icon: <FileText size={20} className="mr-2" /> },
    { to: '/prescription', label: 'Prescription', icon: <ClipboardList size={20} className="mr-2" /> },
    { to: '/examen', label: 'Examen', icon: <FileText size={20} className="mr-2" /> },
  ];

  const navLink = (to) =>
    `flex items-center px-4 py-2 rounded transition-all duration-300 font-medium gap-2 group
      ${location.pathname === to
        ? 'bg-blue-600 bg-opacity-80 text-white shadow-lg'
        : 'hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:text-blue-800 dark:hover:text-blue-300'
      }`;

  return (
    <>
      {/* Barre supérieure */}
      <nav className="bg-white/80 dark:bg-gray-900/80 shadow-md sticky top-0 z-50 animate-fade-in-down backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 transition"
              aria-label="Ouvrir le menu"
            >
              {sidebarOpen ? <X size={28} className="animate-fade-in-up" /> : <Menu size={28} className="animate-fade-in-down" />}
            </button>
            <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2">
              <span className="animate-bounce font-extrabold">🏥</span>
              {/* Gestion patient */}
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-gray-800 dark:text-gray-200">
            {navItems.map(item => (
              <Link key={item.to} to={item.to} className={navLink(item.to)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Dropdown menu */}
            <DropdownMenu onLogout={handleLogout} />
            {/* Thème */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none animate-scale-rotate ml-2"
              aria-label="Changer le thème"
            >
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-700" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!sidebarOpen}>
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-500 backdrop-blur-sm ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={toggleSidebar}
        />
        {/* Sidebar */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white/90 dark:bg-gray-900/90 shadow-xl transform transition-transform duration-500 ease-in-out backdrop-blur-lg
            ${sidebarOpen ? 'translate-x-0 animate-slide-in' : '-translate-x-full animate-slide-out'}`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="animate-bounce font-extrabold">🏥</span>
              {/* Clinique */}
            </span>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 transition"
              aria-label="Fermer le menu"
            >
              <X size={28} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 mt-4 px-2 text-gray-800 dark:text-gray-200">
            {navItems.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={toggleSidebar}
                className={`${navLink(item.to)} animate-fade-in-stagger`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Bouton déconnexion mobile */}
            <button
              onClick={() => { setSidebarOpen(false); handleLogout(); }}
              className="flex items-center px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-all mt-4 animate-fade-in-up"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button>
            {/* Thème mobile */}
            <button
              onClick={toggleTheme}
              className="flex items-center px-4 py-2 rounded bg-blue-100 dark:bg-gray-800 text-blue-700 dark:text-yellow-400 font-bold hover:bg-blue-200 dark:hover:bg-gray-700 transition-all mt-2 animate-fade-in-up"
            >
              {darkMode ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />}
              {darkMode ? "Clair" : "Sombre"}
            </button>
          </nav>
        </aside>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInSidebar {
          from { opacity: 0; transform: translateX(-100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutSidebar {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-100%); }
        }
        @keyframes fadeInStagger {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleRotate {
          0% { transform: scale(0.9) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px);}
          to { opacity: 1; transform: scale(1) translateY(0);}
        }

        .animate-fade-in-down { animation: fadeInDown 0.7s; }
        .animate-fade-in-up { animation: fadeInUp 0.7s; }
        .animate-bounce { animation: bounce 1.2s infinite; }
        .animate-spin-slow { animation: spin 2.5s linear infinite; }
        .animate-slide-in { animation: slideInSidebar 0.5s forwards; }
        .animate-slide-out { animation: slideOutSidebar 0.5s forwards; }
        .animate-fade-in-stagger { animation: fadeInStagger 0.5s ease-out both; }
        .animate-scale-rotate { animation: scaleRotate 0.6s ease-in-out; }
        .animate-dropdown-in { animation: dropdownIn 0.25s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </>
  );
}