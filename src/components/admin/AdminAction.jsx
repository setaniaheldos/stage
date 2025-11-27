import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminAction = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Charger les utilisateurs en attente
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/users/pending');
      setPendingUsers(res.data);
    } catch (err) {
      setMessage("Erreur lors du chargement des utilisateurs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Valider un utilisateur
  const approveUser = async (id) => {
    try {
      await axios.put(`http://localhost:3001/users/${id}/approve`);
      setMessage("Utilisateur validé avec succès !");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage("Erreur lors de la validation.");
    }
  };

  // Refuser/supprimer un utilisateur
  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/users/${id}`);
      setMessage("Utilisateur supprimé.");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-blue-100">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300 text-center">Validation des utilisateurs</h2>
      <div className="mb-6 flex justify-end">
        <Link
          to="/admindas"
          className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
        >
          Voir le tableau de bord admin
        </Link>
      </div>
      {message && (
        <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded animate-fade-in-up text-center">{message}</div>
      )}
      {loading ? (
        <div className="text-center text-blue-600">Chargement...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="text-center text-gray-500">Aucun utilisateur en attente.</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 dark:bg-gray-800">
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.id} className="border-b border-blue-50 dark:border-gray-800">
                <td className="p-2">{user.email}</td>
                <td className="p-2 flex justify-center gap-2">
                  <button
                    onClick={() => approveUser(user.id)}
                    className="px-3 py-1 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition-all"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                  >
                    Refuser
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.7s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
};

export default AdminAction;