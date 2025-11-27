// src/pages/PrescriptionsManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function PrescriptionsManagement() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [form, setForm] = useState({
    consultation_id: "", medicament: "", dosage: "", frequence: "", duree: ""
  });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchPrescriptions = async () => {
    const res = await axios.get(`${API}/prescriptions`);
    setPrescriptions(res.data);
  };

  const fetchConsultations = async () => {
    const res = await axios.get(`${API}/consultations`);
    setConsultations(res.data);
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchConsultations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/prescriptions/${editingId}`, form);
    } else {
      await axios.post(`${API}/prescriptions`, form);
    }
    resetForm();
    fetchPrescriptions();
  };

  const resetForm = () => {
    setForm({ consultation_id: "", medicament: "", dosage: "", frequence: "", duree: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette prescription ?")) {
      await axios.delete(`${API}/prescriptions/${id}`);
      fetchPrescriptions();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Prescriptions</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={form.consultation_id} onChange={e => setForm({...form, consultation_id: e.target.value})} required className="border p-2 rounded">
          <option value="">Sélectionner Consultation</option>
          {consultations.map(c => <option key={c.id} value={c.id}>ID {c.id} - {c.date_consultation} (Patient ID: {c.patient_id})</option>)}
        </select>
        <input placeholder="Médicament" value={form.medicament} onChange={e => setForm({...form, medicament: e.target.value})} required className="border p-2 rounded" />
        <input placeholder="Dosage" value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Fréquence" value={form.frequence} onChange={e => setForm({...form, frequence: e.target.value})} className="border p-2 rounded" />
        <input placeholder="Durée" value={form.duree} onChange={e => setForm({...form, duree: e.target.value})} className="border p-2 rounded" />
        <button type="submit" className="md:col-span-3 bg-red-600 text-white py-3 rounded hover:bg-red-700">
          {editingId ? "Modifier" : "Ajouter"} Prescription
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Consultation ID</th>
              <th className="px-4 py-3">Médicament</th>
              <th className="px-4 py-3">Dosage</th>
              <th className="px-4 py-3">Fréquence</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map(pr => (
              <tr key={pr.id}>
                <td className="px-4 py-3">{pr.id}</td>
                <td className="px-4 py-3">{pr.consultation_id}</td>
                <td className="px-4 py-3">{pr.medicament}</td>
                <td className="px-4 py-3">{pr.dosage}</td>
                <td className="px-4 py-3">{pr.frequence}</td>
                <td className="px-4 py-3">{pr.duree}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setForm(pr); setEditingId(pr.id); }} className="text-blue-600 mr-3">Éditer</button>
                  <button onClick={() => handleDelete(pr.id)} className="text-red-600">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}