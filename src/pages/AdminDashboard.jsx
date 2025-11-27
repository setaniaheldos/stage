// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ email: "", mot_de_passe: "" });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchAdmins = async () => {
    const res = await axios.get(`${API}/admins`);
    setAdmins(res.data);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/admins/${editingId}`, form);
    } else {
      await axios.post(`${API}/admins`, form);
    }
    setForm({ email: "", mot_de_passe: "" });
    setEditingId(null);
    fetchAdmins();
  };

  const handleEdit = (admin) => {
    setForm({ email: admin.email, mot_de_passe: "" });
    setEditingId(admin.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cet admin ?")) {
      await axios.delete(`${API}/admins/${id}`);
      fetchAdmins();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gestion des Admins</h1>

      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded shadow">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe (laisser vide pour ne pas changer)"
            value={form.mot_de_passe}
            onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
            className="border p-2 rounded"
          />
        </div>
        <button type="submit" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {editingId ? "Modifier" : "Ajouter"} Admin
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ email: "", mot_de_passe: "" });
            }}
            className="ml-4 text-red-600"
          >
            Annuler
          </button>
        )}
      </form>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4">{admin.id}</td>
                <td className="px-6 py-4">{admin.email}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleEdit(admin)} className="text-indigo-600 hover:underline mr-4">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(admin.id)} className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}