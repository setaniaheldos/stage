import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  PrinterIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  FunnelIcon,
  SunIcon,
  MoonIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

// Constantes
const PAGE_SIZE = 8;
const API_BASE_URL = 'http://localhost:3001';

export default function Consultations() {
  // --- États des données ---
  const [consultations, setConsultations] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [examens, setExamens] = useState([]);

  // --- États du formulaire et de l'interface ---
  const [form, setForm] = useState({
    idRdv: '',
    dateConsult: '',
    compteRendu: '',
    prix: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [pdfDate, setPdfDate] = useState('');
  const [expandedConsultations, setExpandedConsultations] = useState(new Set());

  // --- États de la recherche / filtre ---
  const [search, setSearch] = useState({
    patient: '',
    praticien: '',
    date: '',
    compteRendu: '',
    prixMin: '',
    prixMax: ''
  });

  // --- États du dark mode et de l'interface ---
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedConsultations, setSelectedConsultations] = useState(new Set());

  // --- États de la pagination ---
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(consultations.length / PAGE_SIZE);
  const paginated = consultations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Appliquer le dark mode ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // --- UTILS ---

  // Notification
  const showNotification = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3500);
  };

  // Utilitaires de données (Optimisation avec useMemo)
  const patientMap = useMemo(() => 
    new Map(patients.map(p => [p.cinPatient, p])), 
    [patients]
  );
  const praticienMap = useMemo(() => 
    new Map(praticiens.map(p => [p.cinPraticien, p])), 
    [praticiens]
  );
  const rdvMap = useMemo(() => 
    new Map(rendezvous.map(r => [r.idRdv, r])), 
    [rendezvous]
  );

  const getPatientName = (cin) => {
    const p = patientMap.get(cin);
    return p ? `${p.nom.toUpperCase()} ${p.prenom}` : 'Patient inconnu';
  };

  const getPraticienName = (cin) => {
    const pr = praticienMap.get(cin);
    return pr ? `Dr. ${pr.nom.toUpperCase()} ${pr.prenom}` : 'Praticien inconnu';
  };

  const getRdvDetails = (idRdv) => rdvMap.get(idRdv);

  // Formatage de la date pour l'affichage
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString.substring(0, 19).replace('T', ' ');
    }
  };

  // Toggle l'expansion d'une consultation
  const toggleExpansion = (id) => {
    const newExpanded = new Set(expandedConsultations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedConsultations(newExpanded);
  };

  // Sélection multiple
  const toggleSelectConsultation = (id) => {
    const newSelected = new Set(selectedConsultations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedConsultations(newSelected);
  };

  const selectAllConsultations = () => {
    if (selectedConsultations.size === paginated.length) {
      setSelectedConsultations(new Set());
    } else {
      setSelectedConsultations(new Set(paginated.map(c => c.idConsult)));
    }
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = consultations.length;
    const avecPrix = consultations.filter(c => c.prix).length;
    const totalRevenue = consultations.reduce((sum, c) => sum + (parseFloat(c.prix) || 0), 0);
    const moyennePrix = avecPrix > 0 ? totalRevenue / avecPrix : 0;
    
    // Consultations du mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const consultationsCeMois = consultations.filter(c => {
      const date = new Date(c.dateConsult);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    return {
      total,
      avecPrix,
      totalRevenue,
      moyennePrix,
      consultationsCeMois,
      gratuit: total - avecPrix
    };
  }, [consultations]);

  // --- CHARGEMENT DES DONNÉES ---
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [consultRes, rdvRes, patRes, pratRes, prescRes, examRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/consultations`),
        axios.get(`${API_BASE_URL}/rendezvous`),
        axios.get(`${API_BASE_URL}/patients`),
        axios.get(`${API_BASE_URL}/praticiens`),
        axios.get(`${API_BASE_URL}/prescriptions`),
        axios.get(`${API_BASE_URL}/examens`)
      ]);

      setConsultations(consultRes.data || []);
      setRendezvous(rdvRes.data || []);
      setPatients(patRes.data || []);
      setPraticiens(pratRes.data || []);
      setPrescriptions(prescRes.data || []);
      setExamens(examRes.data || []);
      setPage(1);
      setSelectedConsultations(new Set());
    } catch (err) {
      console.error("Erreur fetchAll:", err);
      showNotification('Impossible de charger les données. Vérifiez le serveur.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- RECHERCHE ET FILTRE ---
  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.patient) params.append('patient', search.patient);
      if (search.praticien) params.append('praticien', search.praticien);
      if (search.date) params.append('date', search.date);
      if (search.compteRendu) params.append('compteRendu', search.compteRendu);

      const url = params.toString()
        ? `${API_BASE_URL}/consultations/search?${params.toString()}`
        : `${API_BASE_URL}/consultations`;

      const res = await axios.get(url);
      
      // Filtrage supplémentaire par prix côté client
      let filteredData = res.data || [];
      if (search.prixMin) {
        filteredData = filteredData.filter(c => parseFloat(c.prix || 0) >= parseFloat(search.prixMin));
      }
      if (search.prixMax) {
        filteredData = filteredData.filter(c => parseFloat(c.prix || 0) <= parseFloat(search.prixMax));
      }
      
      setConsultations(filteredData);
      setPage(1);
      setSelectedConsultations(new Set());
    } catch (err) {
      console.error(err);
      showNotification('Erreur lors de la recherche. Vérifiez les paramètres du filtre.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch({
      patient: '',
      praticien: '',
      date: '',
      compteRendu: '',
      prixMin: '',
      prixMax: ''
    });
    fetchAll();
  };

  // --- GESTION PDF ---
  const handlePrintPdf = () => {
    if (!pdfDate) {
      showNotification('Veuillez sélectionner une date pour l\'impression PDF.', 'error');
      return;
    }
    
    const dateToFilter = new Date(pdfDate).toISOString().split('T')[0];
    const consultationsForPdf = consultations.filter(c => 
        c.dateConsult.startsWith(dateToFilter)
    );

    if (consultationsForPdf.length === 0) {
        showNotification(`Aucune consultation trouvée pour la date ${pdfDate}.`, 'error');
        return;
    }
    
    const count = consultationsForPdf.length;
    showNotification(`Génération d'un rapport PDF pour ${count} consultation(s) du ${pdfDate}...`, 'success');
    console.log(`Données pour le PDF du ${pdfDate}:`, consultationsForPdf);
  };

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = consultations.map(consult => {
      const rdv = getRdvDetails(consult.idRdv);
      return {
        'ID Consultation': consult.idConsult,
        'Patient': rdv ? getPatientName(rdv.cinPatient) : 'N/A',
        'Praticien': rdv ? getPraticienName(rdv.cinPraticien) : 'N/A',
        'Date Consultation': formatDateTime(consult.dateConsult),
        'Prix (DA)': consult.prix || 'Gratuit',
        'Compte Rendu': consult.compteRendu || ''
      };
    });

    showNotification(`Export Excel préparé pour ${consultations.length} consultations`, 'success');
    console.log('Données pour Excel:', dataToExport);
  };

  // --- CRUD (Create, Read, Update, Delete) ---
  const resetForm = () => {
    setForm({ idRdv: '', dateConsult: '', compteRendu: '', prix: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.idRdv || !form.dateConsult || !form.compteRendu.trim()) {
      showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    const dateTimeValue = form.dateConsult.length === 16 
      ? `${form.dateConsult}:00` 
      : form.dateConsult;

    const payload = {
      idRdv: parseInt(form.idRdv),
      dateConsult: dateTimeValue,
      compteRendu: form.compteRendu.trim(),
      prix: form.prix ? parseFloat(form.prix) : null
    };

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/consultations/${editingId}`, payload);
        showNotification('Consultation modifiée avec succès !');
      } else {
        await axios.post(`${API_BASE_URL}/consultations`, payload);
        showNotification('Consultation enregistrée avec succès !');
      }
      resetForm();
      fetchAll();
      setShowForm(false);
    } catch (err) {
      console.error("Erreur enregistrement:", err.response?.data || err);
      showNotification(err.response?.data?.error || 'Erreur serveur lors de l\'opération.', 'error');
    }
  };

  const handleEdit = (consult) => {
    const dateStr = consult.dateConsult || '';
    setForm({
      idRdv: consult.idRdv,
      dateConsult: dateStr.replace(' ', 'T').substring(0, 16),
      compteRendu: consult.compteRendu || '',
      prix: consult.prix || ''
    });
    setEditingId(consult.idConsult);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cette consultation ? Cette action est irréversible.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/consultations/${id}`);
      showNotification('Consultation supprimée avec succès.');
      fetchAll();
    } catch (err) {
      console.error("Erreur suppression:", err);
      showNotification('Erreur lors de la suppression.', 'error');
    }
  };

  const deleteSelectedConsultations = async () => {
    if (selectedConsultations.size === 0) {
      showNotification('Aucune consultation sélectionnée.', 'error');
      return;
    }

    if (!window.confirm(`Supprimer ${selectedConsultations.size} consultation(s) sélectionnée(s) ?`)) return;
    
    try {
      const deletePromises = Array.from(selectedConsultations).map(id =>
        axios.delete(`${API_BASE_URL}/consultations/${id}`)
      );
      await Promise.all(deletePromises);
      showNotification(`${selectedConsultations.size} consultation(s) supprimée(s) avec succès.`);
      fetchAll();
    } catch (err) {
      console.error("Erreur suppression multiple:", err);
      showNotification('Erreur lors de la suppression multiple.', 'error');
    }
  };

  // Classes CSS dynamiques pour le dark mode
  const containerClasses = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-white' 
      : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800'
  }`;

  const cardClasses = `rounded-2xl shadow-xl border transition-colors duration-300 ${
    darkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-blue-100'
  }`;

  const inputClasses = `px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors duration-300 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  const buttonPrimary = `px-6 py-3 rounded-xl transition-all font-medium shadow-md transform hover:scale-105 ${
    darkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
  }`;

  const tableHeaderClasses = `sticky top-0 ${
    darkMode
      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
  }`;

  return (
    <>
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        } transition-all duration-300 transform animate-fade-in`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}

      <div className={containerClasses}>

        {/* Header */}
        <div className={`backdrop-blur-sm border-b transition-colors duration-300 ${
          darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-white/20'
        }`}>
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3 text-center lg:text-left">
                  📋 Dossiers & Consultations Médicales
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg text-center lg:text-left">
                  Gestion complète des diagnostics, comptes rendus et facturations
                </p>
              </div>
              <div className="flex gap-3 mt-4 lg:mt-0 justify-center lg:justify-end">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    darkMode 
                      ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {showStats ? <ChartBarIcon className="h-5 w-5" /> : <DocumentChartBarIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="w-full px-8 py-6">

          {/* Cartes statistiques */}
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Consultations
                    </p>
                    <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {stats.consultationsCeMois} ce mois
                    </p>
                  </div>
                  <ClipboardDocumentListIcon className="w-12 h-12 text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl" />
                </div>
              </div>

              <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Revenu Total
                    </p>
                    <p className="text-3xl font-bold text-green-500">
                      {stats.totalRevenue.toLocaleString()} DA
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {stats.avecPrix} consultations payantes
                    </p>
                  </div>
                  <BanknotesIcon className="w-12 h-12 text-green-500 bg-green-100 dark:bg-green-900/30 p-2 rounded-xl" />
                </div>
              </div>

              <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Prix Moyen
                    </p>
                    <p className="text-3xl font-bold text-purple-500">
                      {stats.moyennePrix.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DA
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      Par consultation payante
                    </p>
                  </div>
                  <CurrencyDollarIcon className="w-12 h-12 text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl" />
                </div>
              </div>

              <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Consultations Gratuites
                    </p>
                    <p className="text-3xl font-bold text-orange-500">{stats.gratuit}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {Math.round((stats.gratuit / stats.total) * 100)}% du total
                    </p>
                  </div>
                  <DocumentTextIcon className="w-12 h-12 text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl" />
                </div>
              </div>
            </div>
          )}

          {/* Section Impression PDF */}
          <div className={`${cardClasses} p-6 mb-6 border-l-4 ${
            darkMode ? 'border-red-500' : 'border-red-400'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <PrinterIcon className="h-6 w-6" /> Rapport PDF par Date
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                  type="date"
                  value={pdfDate}
                  onChange={(e) => setPdfDate(e.target.value)}
                  className={inputClasses}
                />
                <button 
                  onClick={handlePrintPdf} 
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition flex items-center justify-center gap-2 font-medium shadow-md"
                >
                  <PrinterIcon className="h-5 w-5" /> Générer PDF
                </button>
              </div>
            </div>
          </div>

          {/* Barre de recherche et actions */}
          <div className={`${cardClasses} p-6 mb-6`}>
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              {/* Barre de recherche */}
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-6 w-6" /> Recherche Avancée
                  </h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <FunnelIcon className="h-4 w-4" />
                    {showFilters ? 'Masquer' : 'Filtres'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <input
                    type="text"
                    placeholder="Nom Patient..."
                    value={search.patient}
                    onChange={(e) => setSearch({ ...search, patient: e.target.value })}
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    placeholder="Nom Praticien..."
                    value={search.praticien}
                    onChange={(e) => setSearch({ ...search, praticien: e.target.value })}
                    className={inputClasses}
                  />
                  <input
                    type="date"
                    value={search.date}
                    onChange={(e) => setSearch({ ...search, date: e.target.value })}
                    className={inputClasses}
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSearch} 
                      className={buttonPrimary}
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" /> Chercher
                    </button>
                    <button 
                      onClick={clearFilters} 
                      className={`px-4 py-3 rounded-xl transition-all font-medium ${
                        darkMode
                          ? 'bg-gray-600 hover:bg-gray-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      Effacer
                    </button>
                  </div>
                </div>

                {/* Filtres avancés */}
                {showFilters && (
                  <div className={`mt-4 p-4 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">Filtres Avancés</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Mot-clé compte rendu..."
                        value={search.compteRendu}
                        onChange={(e) => setSearch({ ...search, compteRendu: e.target.value })}
                        className={inputClasses}
                      />
                      <input
                        type="number"
                        placeholder="Prix min (DA)"
                        value={search.prixMin}
                        onChange={(e) => setSearch({ ...search, prixMin: e.target.value })}
                        className={inputClasses}
                      />
                      <input
                        type="number"
                        placeholder="Prix max (DA)"
                        value={search.prixMax}
                        onChange={(e) => setSearch({ ...search, prixMax: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 flex-col sm:flex-row w-full lg:w-auto">
                <button 
                  onClick={fetchAll}
                  className={`px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white'
                  }`}
                >
                  <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button 
                  onClick={handleExportExcel}
                  className={`px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                  }`}
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Export Excel
                </button>
                <button 
                  onClick={() => { setShowForm(!showForm); resetForm(); }}
                  className={`px-6 py-3 rounded-xl transition flex items-center gap-2 font-medium shadow-md ${
                    showForm 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}
                >
                  {showForm ? (
                    <>
                      <XMarkIcon className="h-5 w-5" /> Fermer
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" /> Nouvelle consultation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sélection multiple */}
            {selectedConsultations.size > 0 && (
              <div className={`mt-4 p-3 rounded-lg border ${
                darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-100 border-blue-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {selectedConsultations.size} consultation(s) sélectionnée(s)
                  </span>
                  <button
                    onClick={deleteSelectedConsultations}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Supprimer la sélection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Formulaire */}
          <div className={`${cardClasses} p-8 mb-6 transition-all duration-500 overflow-hidden ${
            showForm ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 p-0 mb-0'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-3">
                {editingId ? <PencilSquareIcon className="h-8 w-8" /> : <PlusIcon className="h-8 w-8" />}
                {editingId ? `Modification: Consultation #${editingId}` : 'Nouvelle consultation'}
              </h2>
              {editingId && (
                <button 
                  onClick={() => {resetForm(); setShowForm(false);}} 
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <XMarkIcon className="h-8 w-8" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Rendez-vous (Select) */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <UserGroupIcon className="inline h-5 w-5 mr-1 text-blue-500" /> Rendez-vous lié *
                </label>
                <select
                  value={form.idRdv}
                  onChange={(e) => setForm({ ...form, idRdv: e.target.value })}
                  required
                  className={inputClasses}
                >
                  <option value="">Sélectionner un Rdv</option>
                  {rendezvous.map(rdv => (
                    <option key={rdv.idRdv} value={rdv.idRdv}>
                      Rdv #{rdv.idRdv} : {getPatientName(rdv.cinPatient)} / {getPraticienName(rdv.cinPraticien)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Heure */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <CalendarIcon className="inline h-5 w-5 mr-1 text-blue-500" /> Date et heure *
                </label>
                <input
                  type="datetime-local"
                  value={form.dateConsult}
                  onChange={(e) => setForm({ ...form, dateConsult: e.target.value })}
                  required
                  className={inputClasses}
                />
              </div>

              {/* Prix */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <CurrencyDollarIcon className="inline h-5 w-5 mr-1 text-green-500" /> Prix (DA)
                </label>
                <input
                  type="number"
                  step="100"
                  placeholder="Ex: 5000"
                  value={form.prix}
                  onChange={(e) => setForm({ ...form, prix: e.target.value })}
                  className={inputClasses}
                />
              </div>
              
              <div className="hidden lg:block"></div> 

              {/* Compte rendu */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <DocumentTextIcon className="inline h-5 w-5 mr-1 text-blue-500" /> Compte rendu médical *
                </label>
                <textarea
                  rows="4"
                  value={form.compteRendu}
                  onChange={(e) => setForm({ ...form, compteRendu: e.target.value })}
                  required
                  className={`${inputClasses} resize-none`}
                  placeholder="Diagnostic, détails de l'examen, traitements prescrits..."
                />
              </div>

              {/* Boutons */}
              <div className="lg:col-span-4 flex justify-end gap-4 mt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className={`px-8 py-3 rounded-xl transition font-medium ${
                    darkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Effacer les champs
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:shadow-xl transform hover:scale-[1.02] transition font-medium shadow-lg"
                >
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>

          {/* Tableau Desktop */}
          <div className={`hidden lg:block ${cardClasses} overflow-hidden`}>
            <table className="w-full">
              <thead className={tableHeaderClasses}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold w-12">
                    <input
                      type="checkbox"
                      checked={selectedConsultations.size === paginated.length && paginated.length > 0}
                      onChange={selectAllConsultations}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Patient / Praticien</th>
                  <th className="px-6 py-4 text-left font-semibold">Date & Heure</th>
                  <th className="px-6 py-4 text-left font-semibold">Prix</th>
                  <th className="px-6 py-4 text-left font-semibold">Compte rendu</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-gray-100'
              }`}>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-blue-500 dark:text-blue-400 text-xl font-medium animate-pulse">
                      <DocumentTextIcon className="h-6 w-6 inline mr-2" /> Chargement des dossiers médicaux...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-500 dark:text-gray-400 text-lg">
                      Aucune consultation trouvée.
                    </td>
                  </tr>
                ) : paginated.map(c => {
                  const rdv = getRdvDetails(c.idRdv);
                  const isExpanded = expandedConsultations.has(c.idConsult);
                  const isSelected = selectedConsultations.has(c.idConsult);
                  
                  return (
                    <React.Fragment key={c.idConsult}>
                      <tr className={`border-t transition ${
                        darkMode 
                          ? `border-gray-700 hover:bg-blue-900/20 ${isSelected ? 'bg-blue-900/30' : ''}` 
                          : `border-gray-100 hover:bg-blue-50/50 ${isSelected ? 'bg-blue-100' : ''}`
                      }`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectConsultation(c.idConsult)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">#{c.idConsult}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <UserGroupIcon className="h-5 w-5 text-blue-400"/> 
                            <span className="font-bold">{rdv ? getPatientName(rdv.cinPatient) : '—'}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <AcademicCapIcon className="h-4 w-4 text-green-400"/> 
                            <span>{rdv ? getPraticienName(rdv.cinPraticien) : '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm">
                          {formatDateTime(c.dateConsult)}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-lg">
                          {c.prix ? (
                            <span className="text-green-600 dark:text-green-400">
                              {Number(c.prix).toLocaleString()} DA
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Gratuit</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpansion(c.idConsult)}
                              className="text-blue-500 hover:text-blue-700 transition"
                            >
                              {isExpanded ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                            <span className={`text-sm ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            } ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>
                              {c.compteRendu || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center space-x-4">
                          <button 
                            onClick={() => handleEdit(c)} 
                            title="Modifier" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(c.idConsult)} 
                            title="Supprimer" 
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cartes Mobile */}
          <div className="lg:hidden grid gap-6">
            {loading ? (
              <div className="text-center py-10 text-blue-500 dark:text-blue-400 text-xl font-medium animate-pulse">
                Chargement...
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                Aucune consultation trouvée.
              </div>
            ) : paginated.map(c => {
              const rdv = getRdvDetails(c.idRdv);
              const isExpanded = expandedConsultations.has(c.idConsult);
              const isSelected = selectedConsultations.has(c.idConsult);
              
              return (
                <div key={c.idConsult} className={`${cardClasses} p-6 border-l-4 ${
                  isSelected ? 'border-blue-500' : 'border-blue-500'
                }`}>
                  <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectConsultation(c.idConsult)}
                        className="rounded border-gray-300"
                      />
                      <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">Dossier #{c.idConsult}</h3>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-bold shadow-sm ${
                      c.prix 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {c.prix ? `${Number(c.prix).toLocaleString()} DA` : 'Gratuit'}
                    </span>
                  </div>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300 mt-4">
                    <div className={`p-3 rounded-lg ${
                      darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>
                      <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <UserGroupIcon className="h-4 w-4 text-blue-500" /> Patient :
                      </p> 
                      <span className="font-semibold text-base block ml-6">
                        {rdv ? getPatientName(rdv.cinPatient) : '—'}
                      </span>
                      <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1">
                        <AcademicCapIcon className="h-4 w-4 text-green-500" /> Praticien :
                      </p> 
                      <span className="font-semibold text-base block ml-6">
                        {rdv ? getPraticienName(rdv.cinPraticien) : '—'}
                      </span>
                    </div>
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-500" /> 
                      <strong>Date :</strong> {formatDateTime(c.dateConsult)}
                    </p>
                    <div className="pt-3 border-t mt-3 border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleExpansion(c.idConsult)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          {isExpanded ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Compte rendu :</p>
                      </div>
                      <p className={`text-base italic ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      } ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {c.compteRendu || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6 border-t pt-4 border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => handleEdit(c)} 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition font-medium shadow-md"
                    >
                      <PencilSquareIcon className="h-5 w-5 inline mr-1" /> Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(c.idConsult)} 
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition font-medium shadow-md"
                    >
                      <TrashIcon className="h-5 w-5 inline mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-6 py-3 rounded-xl disabled:opacity-50 transition font-medium flex items-center gap-2 ${
                  darkMode
                    ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <ChevronDownIcon className="h-5 w-5 rotate-90"/> Précédent
              </button>
              <span className={`text-xl font-bold ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-6 py-3 rounded-xl disabled:opacity-50 transition font-medium flex items-center gap-2 ${
                  darkMode
                    ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Suivant <ChevronUpIcon className="h-5 w-5 rotate-90"/>
              </button>
            </div>
          )}

          {/* Pied de page informatif */}
          <div className={`mt-8 text-center text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>
              📊 {consultations.length} consultation(s) au total • 
              Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}