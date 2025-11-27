// src/pages/RendezVousManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function RendezVousManagement() {
  const [rendezvous, setRendezvous] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  const [form, setForm] = useState({
    patient_id: "", praticien_id: "", date_rendezvous: "", heure: "", statut: "programmé", notes: ""
  });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchRendezVous = async () => {
    const res = await axios.get(`${API}/rendezvous`);
    setRendezvous(res.data);
  };

  const fetchPatients = async () => {
    const res = await axios.get(`${API}/patients`);
    setPatients(res.data);
  };

  const fetchPraticiens = async () => {
    const res = await axios.get(`${API}/praticiens`);
    setPraticiens(res.data);
  };

  useEffect(() => {
    fetchRendezVous();
    fetchPatients();
    fetchPraticiens();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/rendezvous/${editingId}`, form);
    } else {
      await axios.post(`${API}/rendezvous`, form);
    }
    resetForm();
    fetchRendezVous();
  };

  const resetForm = () => {
    setForm({ patient_id: "", praticien_id: "", date_rendezvous: "", heure: "", statut: "programmé", notes: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce rendez-vous ?")) {
      await axios.delete(`${API}/rendezvous/${id}`);
      fetchRendezVous();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Rendez-vous</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})} required className="border p-2 rounded">
          <option value="">Sélectionner Patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom} ({p.numero_dossier})</option>)}
        </select>
        <select value={form.praticien_id} onChange={e => setForm({...form, praticien_id: e.target.value})} required className="border p-2 rounded">
          <option value="">Sélectionner Praticien</option>
          {praticiens.map(pr => <option key={pr.id} value={pr.id}>{pr.nom} {pr.prenom} ({pr.specialite})</option>)}
        </select>
        <input type="date" value={form.date_rendezvous} onChange={e => setForm({...form, date_rendezvous: e.target.value})} required className="border p-2 rounded" />
        <input type="time" value={form.heure} onChange={e => setForm({...form, heure: e.target.value})} required className="border p-2 rounded" />
        <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})} className="border p-2 rounded">
          <option value="programmé">Programmé</option>
          <option value="annulé">Annulé</option>
          <option value="terminé">Terminé</option>
        </select>
        <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border p-2 rounded md:col-span-3" rows="3" />
        <button type="submit" className="md:col-span-3 bg-teal-600 text-white py-3 rounded hover:bg-teal-700">
          {editingId ? "Modifier" : "Planifier"} Rendez-vous
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Praticien</th>
              <th className="px-4 py-3">Date/Heure</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rendezvous.map(r => {
              const patient = patients.find(p => p.id === r.patient_id) || {};
              const praticien = praticiens.find(pr => pr.id === r.praticien_id) || {};
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{patient.nom} {patient.prenom}</td>
                  <td className="px-4 py-3">{praticien.nom} {praticien.prenom}</td>
                  <td className="px-4 py-3">{r.date_rendezvous} {r.heure}</td>
                  <td className="px-4 py-3">{r.statut}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setForm(r); setEditingId(r.id); }} className="text-blue-600 mr-3">Éditer</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600">Supprimer</button>
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