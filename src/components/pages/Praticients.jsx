import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import { 
  UserPlus, Search, Edit2, Trash2, FileSpreadsheet, ChevronUp, 
  ChevronDown, RefreshCw, X, Check, Clock, Filter, Users, 
  Star, Download, Upload, Mail, Phone, IdCard, Calendar,
  BarChart3, Eye, EyeOff
} from 'lucide-react';

export default function Praticiens() {
  const [praticiens, setPraticiens] = useState([]);
  const [formData, setFormData] = useState({
    cinPraticien: '',
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    specialite: '',
    dateInscription: new Date().toISOString().split('T')[0]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState({ 
    nom: '', 
    prenom: '', 
    specialite: '', 
    email: '',
    telephone: ''
  });
  const [sortField, setSortField] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, generalistes: 0, specialistes: 0 });
  const [selectedPraticiens, setSelectedPraticiens] = useState([]);
  const [showStats, setShowStats] = useState(true);

  // Gestion du dark mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Gestion des notifications
  const handleNotification = (msg, type) => {
    setNotification({ show: true, message: msg, type: type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 3000 : 2000);
  };
  
  const handleError = (msg) => handleNotification(msg, 'error');
  const handleSuccess = (msg) => handleNotification(msg, 'success');

  // Fetch data
  const fetchPraticiens = () => {
    setLoading(true);
    axios.get('http://localhost:3001/praticiens')
      .then(res => {
        setPraticiens(res.data);
        calculateStats(res.data);
      })
      .catch(() => handleError("Erreur lors du chargement des praticiens."))
      .finally(() => setLoading(false));
  };

  // Calcul des statistiques
  const calculateStats = (praticiensData) => {
    const total = praticiensData.length;
    const generalistes = praticiensData.filter(p => p.specialite === 'Generaliste').length;
    const specialistes = praticiensData.filter(p => p.specialite === 'Specialiste').length;
    setStats({ total, generalistes, specialistes });
  };

  useEffect(() => {
    fetchPraticiens();
  }, []);

  // Gestion du formulaire
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddClick = () => {
    setFormData({ 
      cinPraticien: '', 
      nom: '', 
      prenom: '', 
      telephone: '', 
      email: '', 
      specialite: '',
      dateInscription: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setShowForm(!showForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = isEditing ? 'put' : 'post';
    const url = `http://localhost:3001/praticiens${isEditing ? '/' + formData.cinPraticien : ''}`;

    axios[method](url, formData)
      .then(() => {
        fetchPraticiens();
        setFormData({ 
          cinPraticien: '', 
          nom: '', 
          prenom: '', 
          telephone: '', 
          email: '', 
          specialite: '',
          dateInscription: new Date().toISOString().split('T')[0]
        });
        setIsEditing(false);
        setShowForm(false);
        handleSuccess(isEditing ? "Praticien modifié avec succès." : "Praticien ajouté avec succès.");
      })
      .catch(() => handleError("Erreur lors de l'enregistrement. Vérifiez le CIN unique."));
  };

  const handleEdit = (p) => {
    if (window.confirm("⚠️ Confirmer la modification du dossier praticien ?")) {
      setFormData(p);
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setFormData({ 
      cinPraticien: '', 
      nom: '', 
      prenom: '', 
      telephone: '', 
      email: '', 
      specialite: '',
      dateInscription: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = (cinPraticien) => {
    if (window.confirm("⚠️ ATTENTION : La suppression est définitive. Voulez-vous vraiment continuer ?")) {
      axios.delete(`http://localhost:3001/praticiens/${cinPraticien}`)
        .then(() => {
          fetchPraticiens();
          handleSuccess("Praticien supprimé avec succès.");
        })
        .catch(() => handleError("Erreur lors de la suppression."));
    }
  };

  // Sélection multiple
  const toggleSelectPraticien = (cinPraticien) => {
    setSelectedPraticiens(prev =>
      prev.includes(cinPraticien)
        ? prev.filter(id => id !== cinPraticien)
        : [...prev, cinPraticien]
    );
  };

  const selectAllPraticiens = () => {
    if (selectedPraticiens.length === filteredPraticiens.length) {
      setSelectedPraticiens([]);
    } else {
      setSelectedPraticiens(filteredPraticiens.map(p => p.cinPraticien));
    }
  };

  const deleteSelected = () => {
    if (selectedPraticiens.length === 0) {
      handleError("Aucun praticien sélectionné.");
      return;
    }

    if (window.confirm(`⚠️ Supprimer ${selectedPraticiens.length} praticien(s) sélectionné(s) ?`)) {
      const deletePromises = selectedPraticiens.map(cin => 
        axios.delete(`http://localhost:3001/praticiens/${cin}`)
      );

      Promise.all(deletePromises)
        .then(() => {
          fetchPraticiens();
          setSelectedPraticiens([]);
          handleSuccess(`${selectedPraticiens.length} praticien(s) supprimé(s) avec succès.`);
        })
        .catch(() => handleError("Erreur lors de la suppression multiple."));
    }
  };

  // Recherche et filtres
  const handleSearchChange = (e) => {
    setSearch(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch({ 
      nom: '', 
      prenom: '', 
      specialite: '', 
      email: '',
      telephone: ''
    });
    setPage(1);
  };

  // Tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtrage des praticiens
  const filteredPraticiens = praticiens
    .filter(p =>
      p.nom.toLowerCase().includes(search.nom.toLowerCase()) &&
      p.prenom.toLowerCase().includes(search.prenom.toLowerCase()) &&
      p.specialite.toLowerCase().includes(search.specialite.toLowerCase()) &&
      p.email.toLowerCase().includes(search.email.toLowerCase()) &&
      (p.telephone || '').toLowerCase().includes(search.telephone.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';

      if (sortField === 'dateInscription') {
        return sortOrder === 'asc' 
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  const totalPages = Math.ceil(filteredPraticiens.length / perPage);
  const paginatedPraticiens = filteredPraticiens.slice((page - 1) * perPage, page * perPage);

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filteredPraticiens.map(({ cinPraticien, nom, prenom, telephone, email, specialite, dateInscription }) => ({
        CIN: cinPraticien,
        Nom: nom,
        Prénom: prenom,
        Téléphone: telephone,
        Email: email,
        Spécialité: specialite,
        'Date Inscription': dateInscription
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Praticiens");
    XLSX.writeFile(wb, `liste_praticiens_${new Date().toISOString().split('T')[0]}.xlsx`);
    handleSuccess("Fichier Excel généré avec succès.");
  };

  // Icone de tri
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4 inline-block ml-1" />
      : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  // Classes CSS pour le dark mode
  const containerClasses = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
      : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800'
  }`;

  const cardClasses = `rounded-2xl shadow-xl border transition-colors duration-300 ${
    darkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-sky-100'
  }`;

  const inputClasses = `rounded-xl px-4 py-2.5 focus:ring-2 transition-all shadow-sm outline-none transition-colors duration-300 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-sky-300 focus:border-sky-300'
  }`;

  const buttonPrimary = `flex items-center font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg transform hover:scale-105 ${
    darkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white'
  }`;

  const tableHeaderClasses = `uppercase text-left font-semibold border-b transition-colors duration-300 ${
    darkMode
      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500'
      : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white border-sky-200'
  }`;

  return (
    <div className={`p-4 min-h-screen max-w-[1800px] mx-auto ${containerClasses}`}>
      
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-semibold text-white flex items-center gap-2 transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* En-tête avec bouton dark mode */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 text-center lg:text-left">
            Gestion des Praticiens 👨‍⚕️
          </h1>
          <p className={`text-center lg:text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Administration complète des professionnels de santé
          </p>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`mt-4 lg:mt-0 px-4 py-2 rounded-xl transition-all ${
            darkMode 
              ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
        </button>
      </div>

      {/* Cartes statistiques */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${cardClasses} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Praticiens</p>
                <p className="text-3xl font-bold text-sky-500">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-sky-500 bg-sky-100 p-2 rounded-xl" />
            </div>
          </div>
          
          <div className={`${cardClasses} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Généralistes</p>
                <p className="text-3xl font-bold text-emerald-500">{stats.generalistes}</p>
              </div>
              <UserPlus className="w-12 h-12 text-emerald-500 bg-emerald-100 p-2 rounded-xl" />
            </div>
          </div>
          
          <div className={`${cardClasses} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Spécialistes</p>
                <p className="text-3xl font-bold text-purple-500">{stats.specialistes}</p>
              </div>
              <Star className="w-12 h-12 text-purple-500 bg-purple-100 p-2 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Zone de Recherche et Actions */}
      <div className={`${cardClasses} p-6 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <Search className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-sky-500'}`} />
            <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Recherche Avancée:</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Nom"
              className={`${inputClasses} w-full sm:w-36`}
              value={search.nom}
              name="nom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Prénom"
              className={`${inputClasses} w-full sm:w-36`}
              value={search.prenom}
              name="prenom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Spécialité"
              className={`${inputClasses} w-full sm:w-36`}
              value={search.specialite}
              name="specialite"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Email"
              className={`${inputClasses} w-full sm:w-36`}
              value={search.email}
              name="email"
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Filtres avancés */}
        <div className="border-t pt-4 mb-4 transition-colors duration-300" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 font-medium transition-colors ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-sky-600 hover:text-sky-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres avancés
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showFilters && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl mt-4 transition-colors duration-300 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Téléphone</label>
                <input
                  type="text"
                  placeholder="Rechercher par téléphone"
                  className={inputClasses}
                  value={search.telephone}
                  name="telephone"
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Effacer les filtres
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAddClick}
              className={buttonPrimary}
            >
              {showForm ? <X className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
              {showForm ? 'Fermer' : 'Nouveau Praticien'}
            </button>
            
            {selectedPraticiens.length > 0 && (
              <button
                onClick={deleteSelected}
                className={`flex items-center font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg transform hover:scale-105 ${
                  darkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                }`}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Supprimer ({selectedPraticiens.length})
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {showStats ? <EyeOff className="w-5 h-5 mr-2" /> : <BarChart3 className="w-5 h-5 mr-2" />}
              {showStats ? 'Masquer stats' : 'Afficher stats'}
            </button>
            
            <button
              onClick={handleExportExcel}
              className={`flex items-center font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg transform hover:scale-105 ${
                darkMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white'
              }`}
            >
              <Download className="w-5 h-5 mr-2" /> Export Excel
            </button>
            
            <button
              onClick={fetchPraticiens}
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${
                darkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'Ajout/Modification */}
      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClasses} p-8 mb-8 space-y-6`}>
          <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-sky-700'}`}>
            {isEditing ? 'Modifier le Praticien' : 'Ajouter un Nouveau Praticien'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <IdCard className="w-4 h-4 inline-block mr-1" />
                CIN*
              </label>
              <input 
                className={inputClasses} 
                name="cinPraticien" 
                placeholder="CIN" 
                value={formData.cinPraticien} 
                onChange={handleChange} 
                required 
                disabled={isEditing} 
              />
            </div>

            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nom*</label>
              <input 
                className={inputClasses} 
                name="nom" 
                placeholder="Nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Prénom*</label>
              <input 
                className={inputClasses} 
                name="prenom" 
                placeholder="Prénom" 
                value={formData.prenom} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Phone className="w-4 h-4 inline-block mr-1" />
                Téléphone
              </label>
              <input 
                className={inputClasses} 
                name="telephone" 
                placeholder="Téléphone" 
                value={formData.telephone} 
                onChange={handleChange} 
              />
            </div>

            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Mail className="w-4 h-4 inline-block mr-1" />
                Email
              </label>
              <input 
                className={inputClasses} 
                name="email" 
                type="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Star className="w-4 h-4 inline-block mr-1" />
                Spécialité*
              </label>
              <select
                className={inputClasses}
                name="specialite"
                value={formData.specialite}
                onChange={handleChange}
                required
              >
                <option value="" disabled className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
                  Sélectionner la spécialité
                </option>
                <option value="Generaliste">Généraliste</option>
                <option value="Specialiste">Spécialiste</option>
                <option value="Chirurgien">Chirurgien</option>
                <option value="Pédiatre">Pédiatre</option>
                <option value="Cardiologue">Cardiologue</option>
              </select>
            </div>

            {isEditing && (
              <div className="flex flex-col">
                <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Date d'inscription
                </label>
                <input 
                  className={`${inputClasses} bg-gray-100`} 
                  name="dateInscription" 
                  value={formData.dateInscription} 
                  readOnly 
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="submit" className={buttonPrimary}>
                {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              className={`flex items-center font-semibold px-6 py-2 rounded-xl transition-all shadow-md ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-gray-400 hover:bg-gray-500 text-white'
              }`}
            >
                <X className="w-5 h-5 mr-2" /> Annuler
            </button>
          </div>
        </form>
      )}

      {/* Tableau des Praticiens */}
      <div className="hidden md:block mt-8">
        <div className={`${cardClasses} overflow-x-auto`}>
          <table className="min-w-[1200px] w-full text-sm">
            <thead>
              <tr className={tableHeaderClasses}>
                <th className="px-4 py-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={selectedPraticiens.length === filteredPraticiens.length && filteredPraticiens.length > 0}
                    onChange={selectAllPraticiens}
                    className="rounded border-gray-300"
                  />
                </th>
                {['cinPraticien', 'nom', 'prenom', 'telephone', 'email', 'specialite', 'dateInscription'].map(field => (
                  <th key={field} className="px-4 py-3 cursor-pointer hover:opacity-80 transition-all" onClick={() => handleSort(field)}>
                    <div className="flex items-center">
                      {field === 'cinPraticien' ? 'CIN' : 
                       field === 'telephone' ? 'Téléphone' :
                       field === 'dateInscription' ? 'Date Inscription' :
                       field.charAt(0).toUpperCase() + field.slice(1)}
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 font-semibold flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" /> Chargement des données...
                  </td>
                </tr>
              ) : paginatedPraticiens.length > 0 ? (
                paginatedPraticiens.map((p, index) => (
                  <tr key={p.cinPraticien} className={`border-t transition-all duration-200 hover:bg-opacity-50 ${
                    darkMode 
                      ? `border-gray-700 hover:bg-blue-900 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}` 
                      : `border-gray-100 hover:bg-sky-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
                  }`}>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPraticiens.includes(p.cinPraticien)}
                        onChange={() => toggleSelectPraticien(p.cinPraticien)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-sky-500">{p.cinPraticien}</td>
                    <td className="px-4 py-3 font-semibold">{p.nom}</td>
                    <td className="px-4 py-3">{p.prenom}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {p.telephone || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {p.email || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        p.specialite === 'Generaliste'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : p.specialite === 'Specialiste'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {p.specialite}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.dateInscription}</td>
                    <td className="px-4 py-3 space-x-2 flex justify-center">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className={`flex items-center px-3 py-2 rounded-lg transition-all shadow-md transform hover:scale-105 ${
                          darkMode
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white'
                        }`}
                      >
                        <Edit2 className="w-4 h-4 mr-1" /> Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(p.cinPraticien)} 
                        className={`flex items-center px-3 py-2 rounded-lg transition-all shadow-md transform hover:scale-105 ${
                          darkMode
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                        }`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <X className="w-5 h-5 inline-block mr-2 text-red-400" /> Aucun praticien ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Informations en bas du tableau */}
        <div className={`mt-4 p-4 rounded-xl text-sm transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-gray-300' : 'bg-blue-50 text-blue-700'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-4">
              <span>📊 <strong>{filteredPraticiens.length}</strong> praticien(s) trouvé(s)</span>
              {selectedPraticiens.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedPraticiens.length} sélectionné(s)
                </span>
              )}
            </div>
            <div className="text-xs opacity-75">
              Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Affichage de <strong>{paginatedPraticiens.length}</strong> praticien(s) sur <strong>{filteredPraticiens.length}</strong>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-xl transition-all font-medium shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white'
            }`}
          >Précédent</button>
          <span className={`font-bold px-4 py-2 rounded-xl shadow-lg border ${
            darkMode
              ? 'bg-gray-800 text-white border-gray-700'
              : 'bg-white text-sky-800 border-sky-200'
          }`}>
            Page {page} sur {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className={`px-4 py-2 rounded-xl transition-all font-medium shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white'
            }`}
          >Suivant</button>
        </div>
      </div>

      {/* Cartes Praticiens (Mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-6">
        {loading ? (
          <div className={`text-center py-8 font-semibold flex items-center justify-center gap-2 ${
            darkMode ? 'text-blue-400' : 'text-sky-500'
          }`}>
            <Clock className="w-5 h-5 animate-spin" /> Chargement des dossiers...
          </div>
        ) : paginatedPraticiens.length > 0 ? (
          paginatedPraticiens.map((p) => (
            <div key={p.cinPraticien} className={`${cardClasses} p-5 hover:shadow-xl transition-all duration-200`}>
              <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
                <div>
                  <span className="font-extrabold text-lg text-sky-500 block">{p.nom} {p.prenom}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    CIN: {p.cinPraticien}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  p.specialite === 'Generaliste'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : p.specialite === 'Specialiste'
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {p.specialite}
                </span>
              </div>
              <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Téléphone:
                  </span>
                  <span>{p.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email:
                  </span>
                  <span className="text-sm">{p.email || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date inscription:
                  </span>
                  <span className="text-sm">{p.dateInscription}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button 
                  onClick={() => handleEdit(p)} 
                  className={`flex items-center px-4 py-2 rounded-lg transition-all shadow-md transform hover:scale-105 ${
                    darkMode
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white'
                  }`}
                >
                  <Edit2 className="w-4 h-4 mr-1" /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(p.cinPraticien)} 
                  className={`flex items-center px-4 py-2 rounded-lg transition-all shadow-md transform hover:scale-105 ${
                    darkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={`${cardClasses} text-center py-8`}>
            <X className="w-6 h-6 inline-block mr-2 text-red-400" /> Aucun praticien trouvé.
          </div>
        )}
      </div>
    </div>
  );
}