import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users,
  Calendar,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalPraticiens: 0,
    consultationsMensuelles: 0,
    patientsHommes: 0,
    patientsFemmes: 0
  });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les données
      const [patientsRes, consultationsRes, praticiensRes] = await Promise.all([
        axios.get('http://localhost:3001/patients'),
        axios.get('http://localhost:3001/consultations'),
        axios.get('http://localhost:3001/praticiens')
      ]);

      const patients = patientsRes.data;
      const consultations = consultationsRes.data;
      const praticiens = praticiensRes.data;

      // Calculer les statistiques
      const totalPatients = patients.length;
      const totalConsultations = consultations.length;
      const totalPraticiens = praticiens.length;
      
      // Patients par sexe
      const patientsHommes = patients.filter(p => p.sexe === 'Homme').length;
      const patientsFemmes = patients.filter(p => p.sexe === 'Femme').length;

      // Consultations du mois en cours
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const consultationsMensuelles = consultations.filter(consult => {
        const consultDate = new Date(consult.dateConsult);
        return consultDate.getMonth() === currentMonth && consultDate.getFullYear() === currentYear;
      }).length;

      setStats({
        totalPatients,
        totalConsultations,
        totalPraticiens,
        consultationsMensuelles,
        patientsHommes,
        patientsFemmes
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Données pour le graphique circulaire (Patients par sexe)
  const doughnutData = {
    labels: ['Hommes', 'Femmes'],
    datasets: [
      {
        data: [stats.patientsHommes, stats.patientsFemmes],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Données pour le graphique linéaire (Consultations des 6 derniers mois)
  const lineData = {
    labels: getLast6Months(),
    datasets: [
      {
        label: 'Consultations',
        data: generateMonthlyConsultationData(), // Données simulées pour l'exemple
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Données pour le graphique en barres (Spécialités des praticiens)
  const barData = {
    labels: ['Généralistes', 'Spécialistes', 'Chirurgiens', 'Pédiatres', 'Cardiologues'],
    datasets: [
      {
        label: 'Nombre de praticiens',
        data: [12, 8, 5, 3, 4], // Données simulées
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options communes pour les graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#fff' : '#333',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        color: darkMode ? '#fff' : '#333',
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Évolution des consultations (6 derniers mois)'
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#333',
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#333',
        },
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Répartition des patients par sexe'
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Répartition des praticiens par spécialité'
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#333',
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#333',
        },
        beginAtZero: true
      }
    }
  };

  // Fonctions utilitaires
  function getLast6Months() {
    const months = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(monthNames[date.getMonth()] + ' ' + date.getFullYear());
    }
    
    return months;
  }

  function generateMonthlyConsultationData() {
    // Données simulées - dans un vrai projet, vous récupéreriez ces données de l'API
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 50) + 20);
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const containerClasses = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
      : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800'
  }`;

  const cardClasses = `rounded-2xl shadow-xl border transition-colors duration-300 ${
    darkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-blue-100'
  }`;

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Chargement des données...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Tableau de Bord Médical 🏥
            </h1>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Vue d'ensemble de votre activité médicale
            </p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {showCharts ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
              {showCharts ? 'Masquer graphiques' : 'Afficher graphiques'}
            </button>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Patients
                </p>
                <p className="text-3xl font-bold text-blue-500">{stats.totalPatients}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Dont {stats.patientsHommes} hommes et {stats.patientsFemmes} femmes
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500 bg-blue-100 p-2 rounded-xl" />
            </div>
          </div>

          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Consultations Total
                </p>
                <p className="text-3xl font-bold text-green-500">{stats.totalConsultations}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {stats.consultationsMensuelles} ce mois-ci
                </p>
              </div>
              <Calendar className="w-12 h-12 text-green-500 bg-green-100 p-2 rounded-xl" />
            </div>
          </div>

          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Praticiens
                </p>
                <p className="text-3xl font-bold text-purple-500">{stats.totalPraticiens}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Médecins actifs
                </p>
              </div>
              <UserCheck className="w-12 h-12 text-purple-500 bg-purple-100 p-2 rounded-xl" />
            </div>
          </div>

          <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Taux de Remplissage
                </p>
                <p className="text-3xl font-bold text-orange-500">78%</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  +12% vs mois dernier
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-500 bg-orange-100 p-2 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Graphiques */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Graphique linéaire */}
            <div className={`${cardClasses} p-6`}>
              <div className="h-80">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>

            {/* Graphique circulaire */}
            <div className={`${cardClasses} p-6`}>
              <div className="h-80">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            {/* Graphique en barres */}
            <div className={`${cardClasses} p-6 lg:col-span-2`}>
              <div className="h-80">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Résumé rapide */}
        <div className={`${cardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Résumé de l'activité
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-semibold">Consultations du jour</p>
                  <p className="text-2xl font-bold text-blue-500">12</p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-semibold">Nouveaux patients</p>
                  <p className="text-2xl font-bold text-green-500">8</p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="font-semibold">RDV à venir</p>
                  <p className="text-2xl font-bold text-purple-500">24</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page informatif */}
        <div className={`mt-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-sm">
            📊 Données mises à jour le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </p>
          <p className="text-xs mt-1">
            Système de gestion médicale - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}