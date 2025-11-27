// src/pages/PatientsManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function PatientsManagement() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    nom: "", prenom: "", sexe: "M", date_naissance: "", adresse: "", telephone: "", email: "", groupe_sanguin: "", numero_dossier: ""
  });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchPatients = async () => {
    const res = await axios.get(`${API}/patients`);
    setPatients(res.data);
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/patients/${editingId}`, form);
    } else {
      await axios.post(`${API}/patients`, form);
    }
    resetForm();
    fetchPatients();
  };

  const resetForm = () => {
    setForm({ nom: "", prenom: "", sexe: "M", date_naissance: "", adresse: "", telephone: "", email: "", groupe_sanguin: "", numero_dossier: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce patient ?")) {
      await axios.delete(`${API}/patients/${id}`);
      fetchPatients();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Patients</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input placeholder="Nom *" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required className="border p-2 rounded" />
        <input placeholder="Prénom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className="border p-2 rounded" />
        <select value={form.sexe} onChange={e => setForm({...form, sexe: e.target.value})} className="border p-2 rounded">
          <option value="M">Masculin</option>
          <option value="F">Féminin</option>
        </select>
        <input type="date" placeholder="Date naissance" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Adresse" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Téléphone" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className="border p-2 rounded" />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Groupe sanguin" value={form.groupe_sanguin} onChange={e => setForm({...form, groupe_sanguin: e.target.value})} className="border p-2 rounded" />
        <input placeholder="N° dossier (unique)" value={form.numero_dossier} onChange={e => setForm({...form, numero_dossier: e.target.value})} className="border p-2 rounded" />
        <button type="submit" className="md:col-span-3 bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700">
          {editingId ? "Modifier" : "Ajouter"} Patient
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">N° Dossier</th>
              <th className="px-4 py-3">Nom Prénom</th>
              <th className="px-4 py-3">Sexe</th>
              <th className="px-4 py-3">Âge</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => {
              const age = p.date_naissance ? new Date().getFullYear() - new Date(p.date_naissance).getFullYear() : "-";
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.numero_dossier || "-"}</td>
                  <td className="px-4 py-3">{p.nom} {p.prenom}</td>
                  <td className="px-4 py-3">{p.sexe}</td>
                  <td className="px-4 py-3">{age}</td>
                  <td className="px-4 py-3">{p.telephone}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setForm(p); setEditingId(p.id); }} className="text-blue-600 mr-3">Éditer</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600">Supprimer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}