// src/pages/UsersManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", mot_de_passe: "", nom: "", valide: 0 });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`);
    setUsers(res.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/users/${editingId}`, form);
    } else {
      await axios.post(`${API}/users`, form);
    }
    resetForm();
    fetchUsers();
  };

  const resetForm = () => {
    setForm({ email: "", mot_de_passe: "", nom: "", valide: 0 });
    setEditingId(null);
  };

  const toggleValide = async (id, current) => {
    await axios.patch(`${API}/users/${id}/valide`, { valide: current ? 0 : 1 });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      await axios.delete(`${API}/users/${id}`);
      fetchUsers();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gestion des Utilisateurs / Assistants</h1>

      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="border p-2 rounded" />
        <input type="password" placeholder="Mot de passe" value={form.mot_de_passe} onChange={e => setForm({...form, mot_de_passe: e.target.value})} className="border p-2 rounded" />
        <input type="text" placeholder="Nom complet" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="border p-2 rounded" />
        <div className="flex items-center">
          <input type="checkbox" checked={form.valide} onChange={e => setForm({...form, valide: e.target.checked ? 1 : 0})} className="mr-2" />
          <label>Validé</label>
        </div>
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 col-span-full md:col-span-1">
          {editingId ? "Modifier" : "Créer"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Validé</th>
              <th className="px-4 py-2">Date création</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.id}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.nom}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleValide(u.id, u.valide)}
                    className={`px-3 py-1 rounded ${u.valide ? "bg-green-500" : "bg-red-500"} text-white`}
                  >
                    {u.valide ? "Oui" : "Non"}
                  </button>
                </td>
                <td className="px-4 py-2">{new Date(u.date_creation).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <button onClick={() => { setForm({email: u.email, mot_de_passe: "", nom: u.nom || "", valide: u.valide}); setEditingId(u.id); }} className="text-blue-600 mr-3">Éditer</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}