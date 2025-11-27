import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  PlusCircle, Search, Edit2, Trash2, FileText, FileSpreadsheet, 
  ChevronUp, ChevronDown, RefreshCw, X, Check, Clock, 
  Filter, Users, User, UserCheck, Calendar 
} from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    idPatient: null,
    cinPatient: '', 
    prenom: '',
    nom: '',
    age: '',
    adresse: '',
    email: '',
    sexe: 'Homme',
    telephone: '',
    dateCreation: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '',
    sexe: '',
    dateDebut: '',
    dateFin: ''
  });
  const [sortField, setSortField] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ total: 0, hommes: 0, femmes: 0 });

  // Gestion des notifications
  const handleNotification = (msg, type) => {
    setNotification({ show: true, message: msg, type: type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 3000 : 2000);
  };
  
  const handleError = (msg) => handleNotification(msg, 'error');
  const handleSuccess = (msg) => handleNotification(msg, 'success');

  // Fetch data
  const fetchPatients = () => {
    setLoading(true);
    axios.get('http://localhost:3001/patients')
      .then(res => {
        setPatients(res.data);
        calculateStats(res.data);
      })
      .catch(() => handleError("Erreur lors du chargement des patients."))
      .finally(() => setLoading(false));
  };

  // Calcul des statistiques
  const calculateStats = (patientsData) => {
    const total = patientsData.length;
    const hommes = patientsData.filter(p => p.sexe === 'Homme').length;
    const femmes = patientsData.filter(p => p.sexe === 'Femme').length;
    setStats({ total, hommes, femmes });
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Gestion du formulaire
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const url = `http://localhost:3001/patients${isEditing ? '/' + formData.idPatient : ''}`;
    const method = isEditing ? 'put' : 'post';
    
    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 120)) {
      handleError("L'âge doit être un nombre valide entre 0 et 120.");
      return;
    }
    
    const dataToSend = {
      cinPatient: formData.cinPatient,
      prenom: formData.prenom,
      nom: formData.nom,
      age: formData.age,
      adresse: formData.adresse,
      email: formData.email,
      sexe: formData.sexe,
      telephone: formData.telephone,
      dateCreation: isEditing ? formData.dateCreation : new Date().toISOString().split('T')[0]
    };

    axios[method](url, dataToSend)
      .then(() => {
        fetchPatients();
        setFormData({ 
          idPatient: null, 
          cinPatient: '', 
          prenom: '', 
          nom: '', 
          age: '', 
          adresse: '', 
          email: '', 
          sexe: 'Homme', 
          telephone: '',
          dateCreation: '' 
        });
        setIsEditing(false);
        setShowForm(false);
        handleSuccess(isEditing ? "Dossier patient modifié avec succès." : "Nouveau patient ajouté avec succès.");
      })
      .catch((error) => {
        console.error(error);
        handleError(`Erreur lors de l'enregistrement du patient. Veuillez vérifier les données.`);
      });
  };

  const handleEdit = (patient) => {
    if (window.confirm("⚠️ Confirmer la modification du dossier patient ?")) {
      setFormData(patient);
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleAdd = () => {
    setFormData({ 
      idPatient: null, 
      cinPatient: '', 
      prenom: '', 
      nom: '', 
      age: '', 
      adresse: '', 
      email: '', 
      sexe: 'Homme', 
      telephone: '',
      dateCreation: '' 
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setFormData({ 
      idPatient: null, 
      cinPatient: '', 
      prenom: '', 
      nom: '', 
      age: '', 
      adresse: '', 
      email: '', 
      sexe: 'Homme', 
      telephone: '',
      dateCreation: '' 
    });
  };

  const handleDelete = (idPatient) => {
    if (window.confirm("⚠️ ATTENTION : La suppression est définitive. Voulez-vous vraiment continuer ?")) {
      axios.delete(`http://localhost:3001/patients/${idPatient}`)
        .then(() => {
          fetchPatients();
          handleSuccess("Patient supprimé avec succès.");
        })
        .catch(() => handleError("Erreur lors de la suppression du patient."));
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
      email: '', 
      telephone: '',
      sexe: '',
      dateDebut: '',
      dateFin: ''
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

  // Filtrage des patients
  const filteredPatients = patients
    .filter(p => {
      const matchesSearch = 
        p.nom.toLowerCase().includes(search.nom.toLowerCase()) &&
        p.prenom.toLowerCase().includes(search.prenom.toLowerCase()) &&
        (p.email || '').toLowerCase().includes(search.email.toLowerCase()) &&
        (p.telephone || '').toLowerCase().includes(search.telephone.toLowerCase());
      
      const matchesSexe = !search.sexe || p.sexe === search.sexe;
      
      const matchesDate = !search.dateDebut || !search.dateFin || 
        (p.dateCreation && p.dateCreation >= search.dateDebut && p.dateCreation <= search.dateFin);
      
      return matchesSearch && matchesSexe && matchesDate;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      
      if (sortField === 'age' || sortField === 'idPatient') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (sortField === 'dateCreation') {
        return sortOrder === 'asc' 
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }
      
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  const totalPages = Math.ceil(filteredPatients.length / perPage);
  const paginatedPatients = filteredPatients.slice((page - 1) * perPage, page * perPage);

  // Export functions
  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text("Liste des Patients", 14, 15);
    doc.autoTable({
      head: [[
        "ID", "CIN", "Nom", "Prénom", "Sexe", "Âge", "Adresse", "Email", "Téléphone", "Date Création"
      ]],
      body: filteredPatients.map(p => [
        p.idPatient, p.cinPatient, p.nom, p.prenom, p.sexe, p.age, p.adresse, p.email, p.telephone, p.dateCreation
      ]),
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [66, 165, 245], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save("liste_patients.pdf");
    handleSuccess("Fichier PDF généré avec succès.");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredPatients.map(p => ({
      ID: p.idPatient,
      CIN: p.cinPatient,
      Nom: p.nom,
      Prénom: p.prenom,
      Sexe: p.sexe,
      Âge: p.age,
      Adresse: p.adresse,
      Email: p.email,
      Téléphone: p.telephone,
      'Date Création': p.dateCreation
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, "liste_patients.xlsx");
    handleSuccess("Fichier Excel généré avec succès.");
  };

  // Icone de tri
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline-block ml-1" /> 
      : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  // Classes de styles
  const actionButtonClasses = "flex items-center justify-center p-2 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen max-w-[1800px] mx-auto">
      
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-semibold text-white flex items-center gap-2 transform transition-all duration-300 ease-in-out ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* En-tête avec statistiques */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2 text-sky-800 text-center">
          Dossiers des Patients 🧑‍⚕️
        </h2>
        <p className="text-gray-600 text-center mb-6">Gestion complète des dossiers patients</p>
        
        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-sky-700">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-sky-500 bg-sky-100 p-2 rounded-xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patients Hommes</p>
                <p className="text-3xl font-bold text-blue-700">{stats.hommes}</p>
              </div>
              <User className="w-12 h-12 text-blue-500 bg-blue-100 p-2 rounded-xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patients Femmes</p>
                <p className="text-3xl font-bold text-pink-700">{stats.femmes}</p>
              </div>
              <UserCheck className="w-12 h-12 text-pink-500 bg-pink-100 p-2 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Zone de Recherche et Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-6 border border-sky-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-500" />
            <p className='text-gray-600 font-semibold'>Rechercher un patient:</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Nom"
              className="w-full sm:w-36 px-4 py-2 rounded-xl border border-gray-300 text-gray-800 focus:ring-2 focus:ring-sky-300 transition-all shadow-sm outline-none"
              value={search.nom}
              name="nom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Prénom"
              className="w-full sm:w-36 px-4 py-2 rounded-xl border border-gray-300 text-gray-800 focus:ring-2 focus:ring-sky-300 transition-all shadow-sm outline-none"
              value={search.prenom}
              name="prenom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Email"
              className="w-full sm:w-36 px-4 py-2 rounded-xl border border-gray-300 text-gray-800 focus:ring-2 focus:ring-sky-300 transition-all shadow-sm outline-none"
              value={search.email}
              name="email"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Téléphone"
              className="w-full sm:w-36 px-4 py-2 rounded-xl border border-gray-300 text-gray-800 focus:ring-2 focus:ring-sky-300 transition-all shadow-sm outline-none"
              value={search.telephone}
              name="telephone"
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Filtres avancés */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sky-600 font-medium mb-4 hover:text-sky-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtres avancés
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-300 transition-all"
                  value={search.sexe}
                  name="sexe"
                  onChange={handleSearchChange}
                >
                  <option value="">Tous les sexes</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-300 transition-all"
                  value={search.dateDebut}
                  name="dateDebut"
                  onChange={handleSearchChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-300 transition-all"
                  value={search.dateFin}
                  name="dateFin"
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2"
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
              onClick={handleAdd}
              className="flex items-center bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Nouveau Patient
            </button>
            
            <button
              onClick={fetchPatients}
              className="flex items-center bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-lg transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Actualiser
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePrintPDF}
              className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg transform hover:scale-105"
            >
              <FileText className="w-5 h-5 mr-2" /> Exporter PDF
            </button>
            
            <button
              onClick={handleExportExcel}
              className="flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg transform hover:scale-105"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" /> Exporter Excel
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'Ajout/Modification */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl mb-8 space-y-6 border border-sky-200">
          <h3 className="text-2xl font-bold text-sky-700">{isEditing ? 'Modifier le Dossier Patient' : 'Ajouter un Nouveau Patient'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                CIN <span className="text-red-500 font-bold">*</span>
              </label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="cinPatient" placeholder="CIN" value={formData.cinPatient} onChange={handleChange} required />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Prénom <span className="text-red-500 font-bold">*</span>
              </label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Nom <span className="text-red-500 font-bold">*</span>
              </label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Âge <span className="text-red-500 font-bold">*</span>
              </label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="age" type="number" placeholder="Âge" value={formData.age} onChange={handleChange} required min="0" max="120" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Adresse</label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="adresse" placeholder="Adresse complète" value={formData.adresse} onChange={handleChange} />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Email</label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Sexe <span className="text-red-500 font-bold">*</span>
              </label>
              <select className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="sexe" value={formData.sexe} onChange={handleChange} required>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Téléphone</label>
              <input className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-sky-400 focus:border-sky-400 transition" name="telephone" placeholder="Téléphone" value={formData.telephone} onChange={handleChange} />
            </div>

            {isEditing && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Date de création</label>
                <input className="border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100" name="dateCreation" value={formData.dateCreation} readOnly />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="submit" className="flex items-center bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold px-6 py-2 rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-md transform hover:scale-105">
              {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
              {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button type="button" onClick={handleCancel} className="flex items-center bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold px-6 py-2 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all shadow-md">
              <X className="w-5 h-5 mr-2" /> Annuler
            </button>
          </div>
        </form>
      )}

      {/* Tableau des Patients */}
      <div className="mt-8 hidden md:block">
        <div className="overflow-x-auto bg-white rounded-2xl shadow-xl border border-sky-100">
          <table className="min-w-[1400px] w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-sky-500 to-blue-500 text-white uppercase text-left font-semibold">
                {['idPatient', 'cinPatient', 'nom', 'prenom', 'sexe', 'age', 'dateCreation'].map(field => (
                  <th key={field} className="px-4 py-3 cursor-pointer hover:bg-sky-600 transition-all" onClick={() => handleSort(field)}>
                    <div className="flex items-center">
                      {field === 'cinPatient' ? 'CIN' : 
                       field === 'idPatient' ? 'ID' : 
                       field === 'dateCreation' ? 'Date Création' :
                       field.charAt(0).toUpperCase() + field.slice(1)}
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-sky-500 font-semibold flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" /> Chargement des données...
                  </td>
                </tr>
              ) : paginatedPatients.length > 0 ? (
                paginatedPatients.map((p, index) => (
                  <tr key={p.idPatient} className={`border-t border-gray-100 hover:bg-sky-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-bold text-sky-600">{p.idPatient}</td>
                    <td className="px-4 py-3 font-medium">{p.cinPatient}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{p.nom}</td>
                    <td className="px-4 py-3">{p.prenom}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.sexe === 'Homme' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {p.sexe}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.age} ans</td>
                    <td className="px-4 py-3 text-gray-500">{p.dateCreation}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={p.adresse}>{p.adresse}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate" title={p.email}>{p.email}</td>
                    <td className="px-4 py-3">{p.telephone}</td>
                    <td className="px-4 py-3 space-x-2 flex justify-center">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="flex items-center bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-2 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md transform hover:scale-105"
                      >
                        <Edit2 className="w-4 h-4 mr-1" /> Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(p.idPatient)} 
                        className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md transform hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    <X className="w-5 h-5 inline-block mr-2 text-red-400" /> Aucun patient ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Affichage de {paginatedPatients.length} patient(s) sur {filteredPatients.length}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg transform hover:scale-105"
          >Précédent</button>
          <span className="font-bold text-sky-800 bg-white px-4 py-2 rounded-xl shadow-lg border border-sky-200">
            Page {page} sur {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg transform hover:scale-105"
          >Suivant</button>
        </div>
      </div>

      {/* Cartes Patients (Mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-6">
        {loading ? (
          <div className="text-center py-8 text-sky-500 font-semibold flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 animate-spin" /> Chargement des dossiers...
          </div>
        ) : paginatedPatients.length > 0 ? (
          paginatedPatients.map((p) => (
            <div key={p.idPatient} className="bg-white p-5 rounded-2xl shadow-lg border border-sky-200 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-sky-100">
                <div>
                  <span className="font-extrabold text-lg text-sky-700 block">{p.nom} {p.prenom}</span>
                  <span className="text-sm text-gray-500">ID: {p.idPatient} • CIN: {p.cinPatient}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  p.sexe === 'Homme' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                }`}>
                  {p.sexe}, {p.age} ans
                </span>
              </div>
              <div className="text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{p.email || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Téléphone:</span>
                  <span>{p.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date création:</span>
                  <span>{p.dateCreation}</span>
                </div>
                <div>
                  <span className="font-medium block mb-1">Adresse:</span>
                  <span className="text-sm">{p.adresse || 'Non renseignée'}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button 
                  onClick={() => handleEdit(p)} 
                  className="flex items-center bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md transform hover:scale-105"
                >
                  <Edit2 className="w-4 h-4 mr-1" /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(p.idPatient)} 
                  className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md transform hover:scale-105"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white rounded-2xl shadow-lg border border-sky-200">
            <X className="w-6 h-6 inline-block mr-2 text-red-400" /> Aucun patient trouvé.
          </div>
        )}
      </div>
    </div>
  );
}