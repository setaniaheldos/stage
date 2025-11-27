import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/navbar/Navbar';
import NavbarAdmin from './components/navbar/NavbarAdmin';
import Accueil from './components/pages/Accueil';
import Patients from './components/pages/Patients';
import Praticiens from './components/pages/Praticients';
import RendezVous from './components/pages/RendezVous';
import Adminaction from './components/admin/AdminAction';
import Authen from './components/admin/AdminForm';
import AdminList from './components/admin/AdminList';
import Utilisateur from './components/Utlisateur/ResisterUtil';
import UtilisateurLogin from './components/Utlisateur/utilisateurLogin';
import AdminAuth from './components/admin/AdminAuth';
import AdminDAs from './components/admin/AdminDashboard';
import Consultations from './components/pages/Consultations';
import Prescription from './components/pages/Prescription';
import Examen from './components/pages/Examen';
// import Consultation from './components/pages/Consultations';

export default function App() {
  const [showAdminNavbar, setShowAdminNavbar] = useState(true);

  // Fonction à passer à UtilisateurLogin pour basculer le navbar
  const handleUserLogin = () => setShowAdminNavbar(false);
  // Fonction à passer à Navbar pour revenir au NavbarAdmin lors de la déconnexion
  const handleUserLogout = () => setShowAdminNavbar(true);

  return (
    <Router>
      <div className="bg-gray-50 dark:bg-gray-100 min-h-screen text-gray-900 dark:text-white transition">
        {showAdminNavbar ? <NavbarAdmin /> : <Navbar onLogout={handleUserLogout} />}
        <Routes>
          <Route path="/accueil" element={<Accueil />} />
          <Route path="/examen" element={<Examen />} />
          <Route path="/consultation" element={<Consultations />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/praticiens" element={<Praticiens />} />
          <Route path="/admindas" element={<AdminDAs />} />
          <Route path="/rendezvous" element={<RendezVous />} />
          <Route path="/authen" element={<Authen />} />
          <Route path="/admin" element={<AdminList />} />
          <Route path="/action" element={<Adminaction />} />
          <Route path="/utilisateur" element={<Utilisateur />} />
          <Route path="/admin-auth" element={<AdminAuth />} />
          <Route path="/prescription" element={<Prescription />} />
          <Route
            path="/utilisateur-login"
            element={<UtilisateurLogin onLogin={handleUserLogin} />}
          />
        </Routes>
      </div>
    </Router>
  );
}