import React, { useState, useEffect } from 'react';
import {
  Menu, X, Home, Users, UserPlus, Calendar, FileText, ClipboardList, Stethoscope,
  Settings, LogOut, Sun, Moon, User, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function MedicalSidebar({ onLogout }) {
  // L'état 'sidebarCollapsed' gère l'état 'Masqué' (w-0) ou 'Déplié' (w-72)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  const handleLogout = () => {
    onLogout?.();
    navigate('/admin-auth');
  };

  const menuItems = [
    { to: '/accueil', label: 'Accueil', icon: <Home size={22} /> },
    { to: '/patients', label: 'Patients', icon: <Users size={22} /> },
    { to: '/praticiens', label: 'Praticiens', icon: <UserPlus size={22} /> },
    { to: '/rendezvous', label: 'Rendez-vous', icon: <Calendar size={22} /> },
    { to: '/consultation', label: 'Consultations', icon: <FileText size={22} /> },
    { to: '/prescription', label: 'Prescriptions', icon: <ClipboardList size={22} /> },
    { to: '/examen', label: 'Examens', icon: <Stethoscope size={22} /> },
  ];

  const isActive = (path) => location.pathname === path;

  // Définition des largeurs CSS pour la transition
  const SIDEBAR_WIDTH = 'w-72'; // 18rem
  const COLLAPSED_WIDTH = 'w-0'; // Masqué complètement
  const COLLAPSED_ML = 'ml-0'; // ml-0 pour le contenu principal
  const OPEN_ML = 'lg:ml-72'; // ml-72 (18rem) pour le contenu principal

  // Position du bouton de bascule lorsqu'il est fixé à la bordure de la sidebar
  const borderButtonPosition = sidebarCollapsed ? 'left-4' : 'left-[18rem]'; 
  
  return (
    <>
      {/* Bouton de bascule mobile (Hamburger) */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        // Le bouton mobile reste opaque pour la visibilité
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-blue-800 text-white shadow-xl hover:bg-blue-700 transition"
      >
        <Menu size={24} />
      </button>
      
      {/* Bouton de Bascule (Collapse) pour le mode Bureau */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        className={`fixed top-4 z-50 p-2 rounded-lg text-white shadow-xl transition-all duration-300 lg:block hidden 
          ${sidebarCollapsed 
            ? 'left-4 bg-blue-800 hover:bg-blue-700' // Opaque lorsque masqué
            : `${borderButtonPosition} bg-blue-600/80 hover:bg-blue-600 transform -translate-x-1/2 rounded-full` // Transparent lorsque déplié (accroché à la bordure)
          }`}
      >
        {sidebarCollapsed ? <Menu size={24} /> : <ChevronLeft size={20} />}
      </button>
      {/* Fin du Bouton de Bascule */}


      {/* Sidebar Desktop + Mobile */}
      <aside
        // CLASSE CLÉ MODIFIÉE ICI : utilisation de la couleur avec opacité (80%) et ajout de 'backdrop-blur-sm'
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-blue-900/80 dark:bg-gray-800/80 text-white transition-all duration-300 backdrop-blur-sm
          ${sidebarCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 shadow-2xl overflow-hidden`}
      >
        {/* Contenu interne de la Sidebar */}
        <div className={`flex flex-col w-72 h-full ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/20">
            <div className="flex items-center gap-3">
              {/* Le fond de l'icône reste semi-transparent pour le contraste */}
              <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm">
                <Activity size={28} className="text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Clinique Pro</h1>
                <p className="text-xs text-blue-200">Gestion médicale</p>
              </div>
            </div>

            {/* Bouton de fermeture mobile (X) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all lg:hidden"
            >
              <X size={22} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive(item.to)
                    ? 'bg-emerald-500/30 border border-emerald-400/50 shadow-2xl shadow-emerald-500/40 transform scale-[1.03] translate-x-1' // Effet accentué
                    : 'hover:bg-white/10 hover:translate-x-1'
                  }`}
              >
                <span 
                  className={`p-2 rounded-lg transition-all duration-300 
                    ${isActive(item.to) 
                      ? 'bg-emerald-500 text-white transform rotate-3 scale-105' // Animation de l'icône active
                      : 'bg-white/20 group-hover:bg-white/30'
                    }`}
                >
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-white/20 dark:border-white/20 space-y-3">
            {/* Logout */}
            <button
              onClick={handleLogout}
              // Rendu du bouton semi-transparent pour mieux s'intégrer
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/30 hover:bg-red-600 transition-all border border-red-500/50"
            >
              <div className="p-2 bg-red-600 rounded-lg">
                <LogOut size={20} />
              </div>
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile (le z-index est abaissé à z-40 pour être derrière la sidebar mobile) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content padding */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? COLLAPSED_ML : OPEN_ML} pt-16 lg:pt-0`}>
        {/* Ton contenu principal ici */}
      </div>
    </>
  );
}