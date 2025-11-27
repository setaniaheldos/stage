import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = 'http://localhost:3001';

// --- Hook Toast Personnalisé ---
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-6 right-6 z-[1000] space-y-3">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`min-w-[320px] p-4 rounded-xl shadow-2xl text-white font-semibold flex items-center gap-3 transition-all duration-300 transform animate-fade-in ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
              : toast.type === 'error' 
              ? 'bg-gradient-to-r from-red-500 to-red-600'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}
        >
          {toast.type === 'success' && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === 'info' && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};

// --- Fonctions API ---
const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) throw new Error(`Erreur HTTP! Statut: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors du chargement de ${endpoint}:`, error);
    return [];
  }
};

// --- Composant Principal ---
const App = () => {
  const { showToast, ToastContainer } = useToast();
  
  // États des données
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  const [loading, setLoading] = useState(true);

  // États UI
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteIdToConfirm, setDeleteIdToConfirm] = useState(null);
  
  // États de Filtrage/Tri/Pagination
  const [search, setSearch] = useState({ 
    type: '', 
    posologie: '', 
    patient: '', 
    praticien: '',
    dateDebut: '',
    dateFin: ''
  });
  const [sort, setSort] = useState({ key: 'idPrescrire', asc: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState(new Set());

  const itemsPerPage = 8;

  // Appliquer le dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // --- Mappage des Données ---
  const { patientMap, praticienMap, rdvMap, consultMap } = useMemo(() => {
    return {
      patientMap: new Map(patients.map(p => [p.cinPatient, p])),
      praticienMap: new Map(praticiens.map(p => [p.cinPraticien, p])),
      rdvMap: new Map(rendezvous.map(r => [r.idRdv, r])),
      consultMap: new Map(consultations.map(c => [c.idConsult, c])),
    };
  }, [patients, praticiens, rendezvous, consultations]);

  // --- Fonctions d'Aide ---
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNames = useCallback((idConsult) => {
    const consult = consultMap.get(idConsult);
    if (!consult) return { patient: 'Inconnu', praticien: 'Inconnu', rdv: null, dateConsult: 'N/A' };
    
    const rdv = rdvMap.get(consult.idRdv);
    if (!rdv) return { patient: 'Inconnu', praticien: 'Inconnu', rdv: null, dateConsult: formatDateTime(consult.dateConsult) };

    const patient = patientMap.get(rdv.cinPatient);
    const praticien = praticienMap.get(rdv.cinPraticien);

    return {
        patient: patient ? `${patient.nom.toUpperCase()} ${patient.prenom}` : 'Patient inconnu',
        praticien: praticien ? `Dr. ${praticien.nom.toUpperCase()} ${praticien.prenom}` : 'Praticien inconnu',
        rdv,
        dateConsult: formatDateTime(consult.dateConsult),
        compteRendu: consult.compteRendu
    };
  }, [consultMap, rdvMap, patientMap, praticienMap]);

  // --- Chargement des Données ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        prescriptionsData, 
        consultationsData, 
        rendezvousData, 
        patientsData, 
        praticiensData
      ] = await Promise.all([
        fetchData('prescriptions'),
        fetchData('consultations'),
        fetchData('rendezvous'),
        fetchData('patients'),
        fetchData('praticiens')
      ]);

      setPrescriptions(prescriptionsData);
      setConsultations(consultationsData);
      setRendezvous(rendezvousData);
      setPatients(patientsData);
      setPraticiens(praticiensData);
    } catch (error) {
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- Statistiques ---
  const stats = useMemo(() => {
    const total = prescriptions.length;
    const thisMonth = prescriptions.filter(p => {
      const date = new Date(p.datePrescrire);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const typesCount = prescriptions.reduce((acc, p) => {
      acc[p.typePrescrire] = (acc[p.typePrescrire] || 0) + 1;
      return acc;
    }, {});

    const mostCommonType = Object.keys(typesCount).reduce((a, b) => 
      typesCount[a] > typesCount[b] ? a : b, ''
    );

    return {
      total,
      thisMonth,
      typesCount,
      mostCommonType,
      types: Object.keys(typesCount).length
    };
  }, [prescriptions]);

  // --- Filtrage et Tri ---
  const filteredAndSortedPrescriptions = useMemo(() => {
    let filtered = prescriptions.filter(presc => {
      const names = getNames(presc.idConsult);
      const matchesSearch = (
        presc.typePrescrire.toLowerCase().includes(search.type.toLowerCase()) &&
        presc.posologie.toLowerCase().includes(search.posologie.toLowerCase()) &&
        names.patient.toLowerCase().includes(search.patient.toLowerCase()) &&
        names.praticien.toLowerCase().includes(search.praticien.toLowerCase())
      );

      // Filtrage par date
      if (search.dateDebut && new Date(presc.datePrescrire) < new Date(search.dateDebut)) {
        return false;
      }
      if (search.dateFin && new Date(presc.datePrescrire) > new Date(search.dateFin)) {
        return false;
      }

      return matchesSearch;
    });

    if (sort.key) {
        filtered.sort((a, b) => {
            let valueA = a[sort.key];
            let valueB = b[sort.key];

            if (['patient', 'praticien', 'dateConsult'].includes(sort.key)) {
                valueA = getNames(a.idConsult)[sort.key];
                valueB = getNames(b.idConsult)[sort.key];
            }

            if (sort.key === 'datePrescrire') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            if (valueA < valueB) return sort.asc ? -1 : 1;
            if (valueA > valueB) return sort.asc ? 1 : -1;
            return 0;
        });
    }

    return filtered;
  }, [prescriptions, search, sort, getNames]);

  const paginatedPrescriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPrescriptions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPrescriptions, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredAndSortedPrescriptions.length / itemsPerPage);

  // --- Gestion des Actions ---
  const handleSearch = (e) => {
    setSearch(prev => ({ ...prev, [e.target.id.replace('search-', '')]: e.target.value }));
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    const isAsc = sort.key === key ? !sort.asc : true;
    setSort({ key, asc: isAsc });
    setCurrentPage(1);
  };

  const showForm = (presc = null) => {
    setEditingPrescription(presc);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setEditingPrescription(null);
    setIsFormVisible(false);
  };

  const showDetailModal = (presc) => {
    setSelectedDetail({ ...presc, ...getNames(presc.idConsult) });
    setIsDetailModalOpen(true);
  };

  const confirmDelete = (id) => {
    setDeleteIdToConfirm(id);
    setIsDeleteModalOpen(true);
  };
  
  const closeModal = (modalSetter) => {
    modalSetter(false);
    if (modalSetter === setIsDeleteModalOpen) setDeleteIdToConfirm(null);
    if (modalSetter === setIsDetailModalOpen) setSelectedDetail(null);
  };

  // Sélection multiple
  const toggleSelectPrescription = (id) => {
    const newSelected = new Set(selectedPrescriptions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPrescriptions(newSelected);
  };

  const selectAllPrescriptions = () => {
    if (selectedPrescriptions.size === paginatedPrescriptions.length) {
      setSelectedPrescriptions(new Set());
    } else {
      setSelectedPrescriptions(new Set(paginatedPrescriptions.map(p => p.idPrescrire)));
    }
  };

  const deleteSelectedPrescriptions = async () => {
    if (selectedPrescriptions.size === 0) {
      showToast('Aucune prescription sélectionnée', 'error');
      return;
    }

    if (!window.confirm(`Supprimer ${selectedPrescriptions.size} prescription(s) sélectionnée(s) ?`)) return;
    
    try {
      const deletePromises = Array.from(selectedPrescriptions).map(id =>
        fetch(`${API_BASE_URL}/prescriptions/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      showToast(`${selectedPrescriptions.size} prescription(s) supprimée(s) avec succès`, 'success');
      setSelectedPrescriptions(new Set());
      await fetchAllData();
    } catch (error) {
      console.error("Erreur suppression multiple:", error);
      showToast("Erreur lors de la suppression multiple", 'error');
    }
  };

  const clearFilters = () => {
    setSearch({ 
      type: '', 
      posologie: '', 
      patient: '', 
      praticien: '',
      dateDebut: '',
      dateFin: ''
    });
    setCurrentPage(1);
  };

  // --- CRUD Operations ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('#submit-btn');
    submitBtn.disabled = true;

    const payload = {
      idConsult: parseInt(form.idConsult.value),
      typePrescrire: form.typePrescrire.value,
      posologie: form.posologie.value,
      datePrescrire: form.datePrescrire.value,
    };

    if (new Date(payload.datePrescrire) > new Date()) {
      showToast("La date de prescription ne peut pas être dans le futur.", 'error');
      submitBtn.disabled = false;
      return;
    }

    try {
      let response;
      if (editingPrescription) {
        response = await fetch(`${API_BASE_URL}/prescriptions/${editingPrescription.idPrescrire}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Erreur lors de la modification.");
        showToast("Prescription modifiée avec succès !", 'success');
      } else {
        response = await fetch(`${API_BASE_URL}/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Erreur lors de l'ajout.");
        showToast("Prescription ajoutée avec succès !", 'success');
      }
      
      handleCancel();
      await fetchAllData();
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      showToast(error.message || "Erreur lors de l'enregistrement.", 'error');
    } finally {
      submitBtn.disabled = false;
    }
  };

  const handleDelete = async () => {
    closeModal(setIsDeleteModalOpen);
    const id = deleteIdToConfirm;
    if (!id) return;
    
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression.");
      showToast("Prescription supprimée avec succès !", 'success');
      await fetchAllData();
    } catch (error) {
      console.error("Erreur de suppression:", error);
      showToast("Erreur lors de la suppression.", 'error');
    } finally {
      setLoading(false);
      setDeleteIdToConfirm(null);
    }
  };

  // --- Export Excel ---
  const handleExportExcel = () => {
    if (typeof window.XLSX === 'undefined') {
        showToast("La librairie d'export Excel n'est pas chargée.", 'error');
        return;
    }

    const data = filteredAndSortedPrescriptions.map(presc => {
        const names = getNames(presc.idConsult);
        return {
            'ID': presc.idPrescrire,
            'Consultation ID': presc.idConsult,
            'Patient': names.patient,
            'Praticien': names.praticien,
            'Compte rendu': names.compteRendu || '',
            'Date consultation': names.dateConsult,
            'Type': presc.typePrescrire,
            'Posologie': presc.posologie,
            'Date prescription': presc.datePrescrire
        };
    });
    
    if (data.length === 0) {
        showToast("Aucune donnée à exporter.", 'info');
        return;
    }

    const worksheet = window.XLSX.utils.json_to_sheet(data);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Prescriptions");
    window.XLSX.writeFile(workbook, `prescriptions_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Export Excel réussi !", 'success');
  };

  // Classes CSS pour le dark mode
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

  const inputClasses = `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-300 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  const buttonPrimary = `px-6 py-3 rounded-xl transition-all font-semibold shadow-lg transform hover:scale-105 ${
    darkMode
      ? 'bg-teal-600 hover:bg-teal-700 text-white'
      : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white'
  }`;

  // --- Composants de Rendu ---
  const TableRow = ({ presc }) => {
    const { patient, praticien } = getNames(presc.idConsult);
    const isSelected = selectedPrescriptions.has(presc.idPrescrire);

    return (
      <tr className={`border-b transition-all duration-200 text-sm ${
        darkMode 
          ? `border-gray-700 hover:bg-teal-900/20 ${isSelected ? 'bg-teal-900/30' : ''}` 
          : `border-gray-100 hover:bg-teal-50/50 ${isSelected ? 'bg-teal-50' : ''}`
      }`}>
        <td className="p-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectPrescription(presc.idPrescrire)}
            className="rounded border-gray-300"
          />
        </td>
        <td className="p-4 font-semibold text-teal-700 dark:text-teal-300">{presc.idPrescrire}</td>
        <td className="p-4">
            <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {patient}
            </div>
        </td>
        <td className="p-4">
            <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {praticien}
            </div>
        </td>
        <td className="p-4">{presc.typePrescrire}</td>
        <td className="p-4 max-w-xs truncate">{presc.posologie}</td>
        <td className="p-4 text-gray-500 dark:text-gray-400">{formatDateTime(presc.datePrescrire)}</td>
        <td className="p-4 text-center">
            <button 
              onClick={() => showDetailModal(presc)} 
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all text-xs shadow-md"
            >
              Détails
            </button>
        </td>
        <td className="p-4 flex gap-2 justify-center">
            <button 
              onClick={() => showForm(presc)} 
              className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 transition-all text-xs shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={() => confirmDelete(presc.idPrescrire)} 
              className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all text-xs shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
        </td>
      </tr>
    );
  };

  const MobileCard = ({ presc }) => {
    const { patient, praticien, dateConsult } = getNames(presc.idConsult);
    const isSelected = selectedPrescriptions.has(presc.idPrescrire);
    
    return (
        <div className={`${cardClasses} p-4 border-l-4 border-teal-500 flex flex-col gap-3 text-sm ${
          isSelected ? 'ring-2 ring-teal-500' : ''
        }`}>
            <div className="flex justify-between items-center border-b pb-2 mb-2 border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelectPrescription(presc.idPrescrire)}
                  className="rounded border-gray-300"
                />
                <span className="font-extrabold text-teal-700 dark:text-teal-300 text-lg">Prescription #{presc.idPrescrire}</span>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Consultation: {presc.idConsult}</span>
            </div>
            
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold">Patient:</span> {patient}
              </p>
              
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-semibold">Praticien:</span> {praticien}
              </p>
              
              <p className="text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Date consultation:</span> {dateConsult}
              </p>
              
              <p><span className="font-semibold">Type:</span> {presc.typePrescrire}</p>
              <p><span className="font-semibold">Posologie:</span> {presc.posologie}</p>
              <p className="text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Date:</span> {formatDateTime(presc.datePrescrire)}
              </p>
            </div>
            
            <div className="flex gap-2 justify-end mt-3 border-t pt-3 border-gray-100 dark:border-gray-700">
                <button onClick={() => showDetailModal(presc)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all text-xs shadow-md">
                  Détails
                </button>
                <button onClick={() => showForm(presc)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold hover:from-yellow-600 hover:to-amber-600 transition-all text-xs shadow-md">
                  Modifier
                </button>
                <button onClick={() => confirmDelete(presc.idPrescrire)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all text-xs shadow-md">
                  Supprimer
                </button>
            </div>
        </div>
    );
  };

  // --- Rendu Principal ---
  return (
    <div className={containerClasses}>
      <ToastContainer />
      
      {/* Header */}
      <div className={`backdrop-blur-sm border-b transition-colors duration-300 ${
        darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-white/20'
      }`}>
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3 text-center lg:text-left">
                💊 Gestion des Prescriptions Médicales
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg text-center lg:text-left">
                Prescriptions, traitements et ordonnances médicales
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
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {showStats ? '📊' : '📈'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="w-full px-8 py-6">

        {/* Cartes statistiques */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Prescriptions
                  </p>
                  <p className="text-3xl font-bold text-teal-500">{stats.total}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {stats.thisMonth} ce mois
                  </p>
                </div>
                <div className="w-12 h-12 text-teal-500 bg-teal-100 dark:bg-teal-900/30 p-2 rounded-xl flex items-center justify-center">
                  💊
                </div>
              </div>
            </div>

            <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Types Différents
                  </p>
                  <p className="text-3xl font-bold text-emerald-500">{stats.types}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {stats.mostCommonType}
                  </p>
                </div>
                <div className="w-12 h-12 text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl flex items-center justify-center">
                  📋
                </div>
              </div>
            </div>

            <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Ce Mois
                  </p>
                  <p className="text-3xl font-bold text-purple-500">{stats.thisMonth}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Prescriptions actuelles
                  </p>
                </div>
                <div className="w-12 h-12 text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl flex items-center justify-center">
                  📅
                </div>
              </div>
            </div>

            <div className={`${cardClasses} p-6 transform hover:scale-105 transition-transform duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Résultats Filtre
                  </p>
                  <p className="text-3xl font-bold text-orange-500">{filteredAndSortedPrescriptions.length}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Sur {prescriptions.length} total
                  </p>
                </div>
                <div className="w-12 h-12 text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl flex items-center justify-center">
                  🔍
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barre d'Actions Principale */}
        <div className={`${cardClasses} p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => showForm()} 
                className={buttonPrimary}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle Prescription
              </button>
              
              {selectedPrescriptions.size > 0 && (
                <button 
                  onClick={deleteSelectedPrescriptions}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer ({selectedPrescriptions.size})
                </button>
              )}

              <button 
                onClick={handleExportExcel} 
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg flex items-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3" />
                </svg>
                Exporter Excel
              </button>

              <button 
                onClick={fetchAllData}
                className={`px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 font-semibold ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white'
                }`}
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>

            {/* Statistiques */}
            <div className={`rounded-xl p-4 border ${
              darkMode ? 'bg-teal-900/20 border-teal-800 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              <div className="text-sm font-semibold">
                {filteredAndSortedPrescriptions.length} prescription(s) trouvée(s)
                {selectedPrescriptions.size > 0 && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    darkMode ? 'bg-teal-800 text-teal-200' : 'bg-teal-200 text-teal-800'
                  }`}>
                    {selectedPrescriptions.size} sélectionnée(s)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className={`${cardClasses} p-8 mb-6 transition-all duration-500 overflow-hidden ${
          isFormVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 p-0 mb-0'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-3">
              {editingPrescription ? (
                <>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier la Prescription
                </>
              ) : (
                <>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle Prescription
                </>
              )}
            </h2>
            {editingPrescription && (
              <button 
                onClick={handleCancel} 
                className="text-red-500 hover:text-red-700 transition p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Consultation *
              </label>
              <select 
                id="idConsult" 
                name="idConsult" 
                required 
                defaultValue={editingPrescription?.idConsult || ''}
                className={inputClasses}
              >
                <option value="">Sélectionner une consultation</option>
                {consultations.map(consult => {
                    const { patient, praticien, dateConsult } = getNames(consult.idConsult);
                    return (
                        <option key={consult.idConsult} value={consult.idConsult}>
                            {`${dateConsult} - ${patient.split(' ')[0]} - ${praticien.split(' ')[1]}`}
                        </option>
                    );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Type *
              </label>
              <input 
                id="typePrescrire" 
                type="text" 
                name="typePrescrire" 
                placeholder="Type de prescription" 
                required 
                defaultValue={editingPrescription?.typePrescrire || ''}
                className={inputClasses}
              />
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Posologie *
              </label>
              <input 
                id="posologie" 
                type="text" 
                name="posologie" 
                placeholder="Posologie" 
                required 
                defaultValue={editingPrescription?.posologie || ''}
                className={inputClasses}
              />
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Date *
              </label>
              <input 
                id="datePrescrire" 
                type="date" 
                name="datePrescrire" 
                required 
                defaultValue={editingPrescription?.datePrescrire?.slice(0, 10) || ''}
                className={inputClasses}
              />
            </div>

            <div className="lg:col-span-4 flex justify-end gap-4 mt-4">
              <button 
                type="button" 
                onClick={handleCancel} 
                className={`px-8 py-3 rounded-xl transition font-semibold shadow-lg ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Annuler
              </button>
              <button 
                id="submit-btn" 
                type="submit" 
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg font-semibold"
              >
                {editingPrescription ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>

        {/* Filtres de Recherche */}
        <div className={`${cardClasses} p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Recherche et Filtres
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showFilters ? 'Masquer' : 'Filtres'}
              </button>
              <button
                onClick={clearFilters}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Effacer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              id="search-type"
              placeholder="Type de prescription..."
              value={search.type}
              onChange={handleSearch}
              className={inputClasses}
            />
            <input
              type="text"
              id="search-posologie"
              placeholder="Posologie..."
              value={search.posologie}
              onChange={handleSearch}
              className={inputClasses}
            />
            <input
              type="text"
              id="search-patient"
              placeholder="Patient..."
              value={search.patient}
              onChange={handleSearch}
              className={inputClasses}
            />
            <input
              type="text"
              id="search-praticien"
              placeholder="Praticien..."
              value={search.praticien}
              onChange={handleSearch}
              className={inputClasses}
            />
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-xl border ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-50 border-teal-200'
            }`}>
              <h4 className="font-semibold mb-3 text-teal-600 dark:text-teal-400">Filtres par Date</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  id="search-dateDebut"
                  placeholder="Date début..."
                  value={search.dateDebut}
                  onChange={handleSearch}
                  className={inputClasses}
                />
                <input
                  type="date"
                  id="search-dateFin"
                  placeholder="Date fin..."
                  value={search.dateFin}
                  onChange={handleSearch}
                  className={inputClasses}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tableau Desktop */}
        <div className={`hidden lg:block ${cardClasses} overflow-hidden`}>
          <table className="w-full">
            <thead className={`sticky top-0 ${
              darkMode
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
            }`}>
              <tr>
                <th className="px-6 py-4 text-left font-semibold w-12">
                  <input
                    type="checkbox"
                    checked={selectedPrescriptions.size === paginatedPrescriptions.length && paginatedPrescriptions.length > 0}
                    onChange={selectAllPrescriptions}
                    className="rounded border-gray-300"
                  />
                </th>
                {[
                  { key: 'idPrescrire', label: 'ID' },
                  { key: 'patient', label: 'Patient' },
                  { key: 'praticien', label: 'Praticien' },
                  { key: 'typePrescrire', label: 'Type' },
                  { key: 'posologie', label: 'Posologie' },
                  { key: 'datePrescrire', label: 'Date' },
                ].map(({ key, label }) => (
                  <th 
                    key={key}
                    className="px-6 py-4 text-left font-semibold cursor-pointer hover:opacity-80 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      <span>
                        {sort.key === key && (
                          sort.asc 
                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-center font-semibold">Détails</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkMode ? 'divide-gray-700' : 'divide-gray-100'
            }`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex justify-center items-center gap-3 text-teal-600 dark:text-teal-400 text-xl font-medium animate-pulse">
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Chargement des prescriptions...
                    </div>
                  </td>
                </tr>
              ) : paginatedPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-500 dark:text-gray-400 text-lg">
                    Aucune prescription trouvée.
                  </td>
                </tr>
              ) : (
                paginatedPrescriptions.map(presc => (
                  <TableRow key={presc.idPrescrire} presc={presc} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cartes Mobile */}
        <div className="lg:hidden grid gap-6">
          {loading ? (
            <div className="text-center py-10 text-teal-600 dark:text-teal-400 text-xl font-medium animate-pulse">
              Chargement des prescriptions...
            </div>
          ) : paginatedPrescriptions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
              Aucune prescription trouvée.
            </div>
          ) : (
            paginatedPrescriptions.map(presc => (
              <MobileCard key={presc.idPrescrire} presc={presc} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-6 py-3 rounded-xl disabled:opacity-50 transition font-semibold flex items-center gap-2 shadow-lg ${
                darkMode
                  ? 'bg-teal-900/30 text-teal-300 hover:bg-teal-800/50'
                  : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
            
            <span className={`text-xl font-bold ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Page {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-6 py-3 rounded-xl disabled:opacity-50 transition font-semibold flex items-center gap-2 shadow-lg ${
                darkMode
                  ? 'bg-teal-900/30 text-teal-300 hover:bg-teal-800/50'
                  : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
              }`}
            >
              Suivant
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Pied de page informatif */}
        <div className={`mt-8 text-center text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>
            📊 {prescriptions.length} prescription(s) au total • 
            Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Modales */}
      {/* Modale de Détails */}
      {isDetailModalOpen && selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClasses} w-full max-w-2xl border-t-4 border-teal-500`}>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                Détails de la Prescription
              </h3>
              
              <div className={`space-y-4 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-teal-600 dark:text-teal-400">ID Prescription</p>
                    <p>{selectedDetail.idPrescrire}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-teal-600 dark:text-teal-400">Consultation ID</p>
                    <p>{selectedDetail.idConsult}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-semibold text-teal-600 dark:text-teal-400">Type</p>
                  <p>{selectedDetail.typePrescrire}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-teal-600 dark:text-teal-400">Posologie</p>
                  <p className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>{selectedDetail.posologie}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-teal-600 dark:text-teal-400">Date de Prescription</p>
                  <p>{selectedDetail.datePrescrire}</p>
                </div>
                
                <div className="border-t pt-4 border-gray-200 dark:border-gray-600">
                  <p className="font-semibold text-teal-600 dark:text-teal-400 mb-2">Informations de la Consultation</p>
                  <div className={`p-4 rounded-lg space-y-2 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p><span className="font-semibold">Patient:</span> {selectedDetail.patient}</p>
                    <p><span className="font-semibold">Praticien:</span> {selectedDetail.praticien}</p>
                    <p><span className="font-semibold">Date Consultation:</span> {selectedDetail.dateConsult}</p>
                    <p><span className="font-semibold">Compte Rendu:</span> {selectedDetail.compteRendu || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => closeModal(setIsDetailModalOpen)} 
                className="mt-6 px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition font-semibold shadow-lg flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de Suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClasses} w-full max-w-md border-t-4 border-red-500 text-center p-6`}>
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Confirmation de suppression
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette prescription ? Cette action est irréversible.
            </p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => closeModal(setIsDeleteModalOpen)} 
                className={`px-6 py-3 rounded-xl transition font-semibold shadow-lg ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Annuler
              </button>
              
              <button 
                onClick={handleDelete} 
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition font-semibold shadow-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;