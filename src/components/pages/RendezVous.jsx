import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, RefreshCw, Check, X, CalendarCheck, CalendarX, Clock4, Download, User, Stethoscope, Filter } from 'lucide-react';

export default function Rendezvous() {
  const [rdvs, setRdvs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);

  const [form, setForm] = useState({
    idRdv: null,
    cinPatient: '',
    cinPraticien: '',
    dateHeure: '',
    statut: 'en_attente',
    idRdvParent: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [search, setSearch] = useState({ patient: '', praticien: '', statut: '' });
  const [activeFilter, setActiveFilter] = useState('tous'); // 'tous', 'en_attente', 'confirme', 'annule'
  const [sortField, setSortField] = useState('dateHeure');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const perPage = 6;

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // === Notifications ===
  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 4000 : 2500);
  };

  // === Chargement des données ===
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rdvRes, patRes, pratRes] = await Promise.all([
        axios.get('http://localhost:3001/rendezvous'),
        axios.get('http://localhost:3001/patients'),
        axios.get('http://localhost:3001/praticiens')
      ]);
      setRdvs(rdvRes.data);
      setPatients(patRes.data);
      setPraticiens(pratRes.data);
    } catch (err) {
      notify("Erreur de connexion à l'API", 'error');
    } finally {
      setLoading(false);
    }
  };

  // === Réinitialisation propre du formulaire ===
  const resetForm = () => {
    setForm({
      idRdv: null,
      cinPatient: '',
      cinPraticien: '',
      dateHeure: '',
      statut: 'en_attente',
      idRdvParent: ''
    });
    setIsEditing(false);
  };

  // === Ouvrir/Fermer le formulaire proprement ===
  const toggleForm = () => {
    if (showAddForm) {
      setShowAddForm(false);
      resetForm();
    } else {
      resetForm();
      setShowAddForm(true);
    }
  };

  // === Gestion du formulaire ===
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isEditing
      ? `http://localhost:3001/rendezvous/${form.idRdv}`
      : 'http://localhost:3001/rendezvous';

    const method = isEditing ? 'put' : 'post';

    try {
      await axios[method](url, form);
      notify(isEditing ? "Rendez-vous modifié !" : "Rendez-vous ajouté !");
      fetchAllData();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      notify("Erreur lors de l'enregistrement", 'error');
    }
  };

  const handleEdit = (rdv) => {
    const formattedDate = rdv.dateHeure
      ? new Date(rdv.dateHeure).toISOString().slice(0, 16)
      : '';

    setForm({
      ...rdv,
      dateHeure: formattedDate
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;

    try {
      await axios.delete(`http://localhost:3001/rendezvous/${id}`);
      notify("Rendez-vous supprimé");
      fetchAllData();
    } catch (err) {
      notify("Erreur suppression", 'error');
    }
  };

  // === Recherche & Tri ===
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getPatientName = (cin) => {
    const p = patients.find(p => p.cinPatient === cin);
    return p ? `${p.nom} ${p.prenom}` : 'Inconnu';
  };

  const getPraticienName = (cin) => {
    const pr = praticiens.find(pr => pr.cinPraticien === cin);
    return pr ? `${pr.nom} ${pr.prenom}` : 'Inconnu';
  };

  // Filtrage combiné (recherche + filtres par statut)
  const filteredRdvs = rdvs
    .filter(r => {
      const patientMatch = getPatientName(r.cinPatient).toLowerCase().includes(search.patient.toLowerCase());
      const praticienMatch = getPraticienName(r.cinPraticien).toLowerCase().includes(search.praticien.toLowerCase());
      const statutMatch = search.statut === '' || r.statut === search.statut;
      const filterMatch = activeFilter === 'tous' || r.statut === activeFilter;
      
      return patientMatch && praticienMatch && statutMatch && filterMatch;
    })
    .sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      if (sortField === 'dateHeure') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredRdvs.length / perPage);
  const paginatedRdvs = filteredRdvs.slice((page - 1) * perPage, page * perPage);

  // Compteurs par statut
  const stats = {
    tous: rdvs.length,
    en_attente: rdvs.filter(r => r.statut === 'en_attente').length,
    confirme: rdvs.filter(r => r.statut === 'confirme').length,
    annule: rdvs.filter(r => r.statut === 'annule').length
  };

  // === Export Excel ===
  const handleExportExcel = () => {
    const data = filteredRdvs.map(r => ({
      'ID': r.idRdv,
      'Patient': getPatientName(r.cinPatient),
      'Praticien': getPraticienName(r.cinPraticien),
      'Date': new Date(r.dateHeure).toLocaleString('fr-FR'),
      'Statut': r.statut === 'confirme' ? 'Confirmé' : r.statut === 'annule' ? 'Annulé' : 'En attente',
      'Parent': r.idRdvParent || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rendez-vous");
    XLSX.writeFile(wb, "rendezvous.xlsx");
    notify("Export Excel réussi !");
  };

  // === Styles utilitaires (compatibles mode sombre/clair) ===
  const statutStyle = (s) => {
    const baseStyles = "px-3 py-2 rounded-full text-sm font-semibold border flex items-center gap-2 w-fit transition-colors";
    
    if (s === 'confirme') 
      return `${baseStyles} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800`;
    if (s === 'annule') 
      return `${baseStyles} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800`;
    return `${baseStyles} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800`;
  };

  const filterButtonStyle = (filter) => {
    const baseStyles = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2";
    
    if (activeFilter === filter) {
      switch(filter) {
        case 'en_attente':
          return `${baseStyles} bg-amber-500 text-white shadow-lg`;
        case 'confirme':
          return `${baseStyles} bg-emerald-500 text-white shadow-lg`;
        case 'annule':
          return `${baseStyles} bg-red-500 text-white shadow-lg`;
        default:
          return `${baseStyles} bg-blue-500 text-white shadow-lg`;
      }
    }
    
    return `${baseStyles} bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600`;
  };

  const StatutIcon = ({ s }) => {
    if (s === 'confirme') return <CalendarCheck className="w-4 h-4" />;
    if (s === 'annule') return <CalendarX className="w-4 h-4" />;
    return <Clock4 className="w-4 h-4" />;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-blue-900 transition-colors w-full">

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-bold flex items-center gap-3 transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
        <div className="px-8 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3 text-center">
            Gestion des Rendez-vous
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg text-center">
            Gérez efficacement les rendez-vous de votre cabinet médical
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full px-8 py-6">

        {/* Statistiques et Filtres rapides */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Filtres rapides
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setActiveFilter('tous')}
              className={filterButtonStyle('tous')}
            >
              <span>Tous les RDV</span>
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                {stats.tous}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('en_attente')}
              className={filterButtonStyle('en_attente')}
            >
              <Clock4 className="w-4 h-4" />
              <span>En attente</span>
              <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 px-2 py-1 rounded-full text-xs">
                {stats.en_attente}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('confirme')}
              className={filterButtonStyle('confirme')}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Confirmés</span>
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 px-2 py-1 rounded-full text-xs">
                {stats.confirme}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('annule')}
              className={filterButtonStyle('annule')}
            >
              <CalendarX className="w-4 h-4" />
              <span>Annulés</span>
              <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                {stats.annule}
              </span>
            </button>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-3 flex-wrap flex-1 min-w-[300px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  value={search.patient}
                  onChange={(e) => setSearch({ ...search, patient: e.target.value })}
                />
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un praticien..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  value={search.praticien}
                  onChange={(e) => setSearch({ ...search, praticien: e.target.value })}
                />
              </div>
              <select
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                value={search.statut}
                onChange={(e) => setSearch({ ...search, statut: e.target.value })}
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirmé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleExportExcel} 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button 
                onClick={toggleForm} 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddForm ? 'Fermer' : 'Nouveau RDV'}
              </button>
              <button 
                onClick={fetchAllData} 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white p-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        {showAddForm && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Patient *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select 
                    name="cinPatient" 
                    value={form.cinPatient} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="" disabled>Choisir un patient...</option>
                    {patients.map(p => (
                      <option key={p.cinPatient} value={p.cinPatient}>
                        {p.nom} {p.prenom} ({p.cinPatient})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Praticien *</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select 
                    name="cinPraticien" 
                    value={form.cinPraticien} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="" disabled>Choisir un praticien...</option>
                    {praticiens.map(pr => (
                      <option key={pr.cinPraticien} value={pr.cinPraticien}>
                        Dr {pr.nom} {pr.prenom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Date et heure *</label>
                <input
                  type="datetime-local"
                  name="dateHeure"
                  value={form.dateHeure}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Statut</label>
                <select 
                  name="statut" 
                  value={form.statut} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="en_attente">En attente</option>
                  <option value="confirme">Confirmé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">ID Parent (facultatif)</label>
                <input
                  type="number"
                  name="idRdvParent"
                  value={form.idRdvParent}
                  onChange={handleChange}
                  placeholder="Ex: 12"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-4 col-span-full justify-end pt-4">
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-200 hover:shadow-xl"
                >
                  {isEditing ? 'Mettre à jour' : 'Créer le rendez-vous'}
                </button>
                <button 
                  type="button" 
                  onClick={toggleForm} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 dark:border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <tr>
                  <th 
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => handleSort('dateHeure')}
                  >
                    <div className="flex items-center gap-2">
                      Date & Heure
                      <SortIcon field="dateHeure" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">Patient</th>
                  <th className="px-6 py-4 text-left font-semibold">Praticien</th>
                  <th 
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => handleSort('statut')}
                  >
                    <div className="flex items-center gap-2">
                      Statut
                      <SortIcon field="statut" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex justify-center items-center gap-3 text-gray-500 dark:text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Chargement des rendez-vous...
                      </div>
                    </td>
                  </tr>
                ) : paginatedRdvs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400 dark:text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarCheck className="w-12 h-12 opacity-50" />
                        <p className="text-lg">Aucun rendez-vous trouvé</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeFilter !== 'tous' ? `Aucun rendez-vous "${activeFilter}"` : 'Aucun rendez-vous correspond à vos critères'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRdvs.map(r => (
                    <tr key={r.idRdv} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {new Date(r.dateHeure).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(r.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {getPatientName(r.cinPatient)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {getPraticienName(r.cinPraticien)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${statutStyle(r.statut)}`}>
                          <StatutIcon s={r.statut} />
                          {r.statut === 'confirme' ? 'Confirmé' : r.statut === 'annule' ? 'Annulé' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(r)} 
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group-hover:bg-white dark:group-hover:bg-gray-700"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(r.idRdv)} 
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group-hover:bg-white dark:group-hover:bg-gray-700"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedRdvs.length > 0 && (
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredRdvs.length} rendez-vous trouvés
                {activeFilter !== 'tous' && ` (${activeFilter === 'en_attente' ? 'En attente' : activeFilter === 'confirme' ? 'Confirmés' : 'Annulés'})`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                >
                  <ChevronUp className="w-4 h-4 rotate-90" />
                  Précédent
                </button>
                <span className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-300 font-medium">
                  Page {page} sur {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                >
                  Suivant
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}