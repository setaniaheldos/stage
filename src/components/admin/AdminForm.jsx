import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminForm = ({ adminToEdit, onAdminUpdated, onAdminAdded, adminsCount }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (adminToEdit) {
      setFormData({
        email: adminToEdit.email,
        password: '',
      });
      setConfirmPassword('');
    } else {
      setFormData({
        email: '',
        password: '',
      });
      setConfirmPassword('');
    }
    setError('');
    setSuccess('');
  }, [adminToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!adminToEdit && adminsCount >= 3) {
      setError("Nombre maximum d'administrateurs atteint (3).");
      return;
    }
    if (!adminToEdit && formData.password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      if (adminToEdit) {
        await axios.put(`http://localhost:3001/admins/${adminToEdit.id}`, formData);
        setSuccess("Administrateur modifié avec succès !");
        onAdminUpdated();
      } else {
        await axios.post('http://localhost:3001/admins', formData);
        setSuccess("Administrateur ajouté avec succès !");
        onAdminAdded();
      }
      setFormData({ email: '', password: '' });
      setConfirmPassword('');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError("   ");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-blue-100 max-w-md mx-auto animate-fade-in-up transition-all duration-500"
    >
      <div className="mb-2 text-center text-xs font-bold text-blue-700 dark:text-blue-300 animate-fade-in-down">
        3 administrateurs maximum peuvent être créés.
      </div>
      <h2 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-300 animate-fade-in-down">
        {adminToEdit ? 'Modifier un admin' : 'Ajouter un admin'}
      </h2>
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-100 text-red-700 rounded animate-bounce">{error}</div>
      )}
      {success && (
        <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded animate-fade-in-up">{success}</div>
      )}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-blue-300 rounded-xl p-2 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 transition-all"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mot de passe</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={!adminToEdit}
          className="mt-1 block w-full border border-blue-300 rounded-xl p-2 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 transition-all"
        />
      </div>
      {!adminToEdit && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirmer le mot de passe</label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-blue-300 rounded-xl p-2 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 transition-all"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={!adminToEdit && adminsCount >= 3}
        className={`w-full py-2 rounded-xl font-bold transition-all duration-300 ${
          !adminToEdit && adminsCount >= 3
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
        } animate-fade-in-up`}
      >
        {adminToEdit ? 'Mettre à jour' : 'Ajouter'}
      </button>
      <div className="mt-4 text-center">
        <Link
          to="/admin-auth"
          className="text-blue-600 dark:text-blue-300 underline hover:text-blue-800 transition-all animate-fade-in-up"
        >
          Accéder à l’authentification admin
        </Link>
      </div>
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.7s;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.7s;
        }
        .animate-bounce {
          animation: bounce 1s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-8px);}
        }
      `}</style>
    </form>
  );
};

export default AdminForm;