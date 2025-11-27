import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');

  // Charger admins et utilisateurs
  useEffect(() => {
    axios.get('http://localhost:3001/admins')
      .then(res => setAdmins(res.data))
      .catch(() => setAdmins([]))
      .finally(() => setLoadingAdmins(false));

    axios.get('http://localhost:3001/users')
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Supprimer un admin (sauf le premier)
  const handleDeleteAdmin = async (id, idx) => {
    if (idx === 0) return; // Ne pas supprimer le premier admin
    if (!window.confirm("Voulez-vous vraiment supprimer cet admin ?")) return;
    try {
      await axios.delete(`http://localhost:3001/admins/${id}`);
      setAdmins(admins.filter(a => a.id !== id));
      setMessage("Admin supprimé !");
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage("Erreur lors de la suppression de l'admin.");
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`http://localhost:3001/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setMessage("Utilisateur supprimé !");
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-blue-100">
      <h2 className="text-3xl font-bold mb-8 text-blue-700 dark:text-blue-300 text-center">Tableau de bord Admin</h2>
      {message && (
        <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded text-center">{message}</div>
      )}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tableau des admins */}
        <div>
          <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-200 text-center">Administrateurs</h3>
          {loadingAdmins ? (
            <div className="text-blue-600 text-center">Chargement...</div>
          ) : admins.length === 0 ? (
            <div className="text-gray-500 text-center">Aucun administrateur trouvé.</div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-100 dark:bg-gray-800">
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, idx) => (
                  <tr key={admin.id} className="border-b border-blue-50 dark:border-gray-800">
                    <td className="p-2">{admin.email}</td>
                    <td className="p-2 text-center">
                      {idx === 0 ? (
                        <span className="text-gray-400 italic">Non supprimable</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, idx)}
                          className="px-3 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tableau des utilisateurs */}
        <div>
          <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-200 text-center">Utilisateurs</h3>
          {loadingUsers ? (
            <div className="text-blue-600 text-center">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500 text-center">Aucun utilisateur trouvé.</div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-100 dark:bg-gray-800">
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-center">Statut</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-blue-50 dark:border-gray-800">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2 text-center">
                      {user.isApproved ? (
                        <span className="text-green-600 font-semibold">Validé</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">En attente</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Link
          to="/accueil"
          className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
        >
          Aller à l'accueil
        </Link>
        <Link
          to="/authen"
          className="px-6 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition-all"
        >
          Ajouter un admin
        </Link>
        <Link
          to="/action"
          className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-green-700 transition-all"
        >
          Aprover un utilisateur
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;