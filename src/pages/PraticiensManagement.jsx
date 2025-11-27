// src/pages/PraticiensManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function PraticiensManagement() {
  const [praticiens, setPraticiens] = useState([]);
  const [form, setForm] = useState({
    nom: "", prenom: "", specialite: "", telephone: "", email: ""
  });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchPraticiens = async () => {
    const res = await axios.get(`${API}/praticiens`);
    setPraticiens(res.data);
  };

  useEffect(() => { fetchPraticiens(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/praticiens/${editingId}`, form);
    } else {
      await axios.post(`${API}/praticiens`, form);
    }
    resetForm();
    fetchPraticiens();
  };

  const resetForm = () => {
    setForm({ nom: "", prenom: "", specialite: "", telephone: "", email: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce praticien ?")) {
      await axios.delete(`${API}/praticiens/${id}`);
      fetchPraticiens();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Praticiens</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input placeholder="Nom *" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required className="border p-2 rounded" />
        <input placeholder="Prénom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Spécialité" value={form.specialite} onChange={e => setForm({...form, specialite: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className="border p-2 rounded" />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded" />
        <button type="submit" className="md:col-span-3 bg-purple-600 text-white py-3 rounded hover:bg-purple-700">
          {editingId ? "Modifier" : "Ajouter"} Praticien
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nom Prénom</th>
              <th className="px-4 py-3">Spécialité</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {praticiens.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3">{p.id}</td>
                <td className="px-4 py-3">{p.nom} {p.prenom}</td>
                <td className="px-4 py-3">{p.specialite}</td>
                <td className="px-4 py-3">{p.telephone}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setForm(p); setEditingId(p.id); }} className="text-blue-600 mr-3">Éditer</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}