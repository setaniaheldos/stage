// src/pages/ConsultationsManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function ConsultationsManagement() {
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  const [form, setForm] = useState({
    patient_id: "", praticien_id: "", date_consultation: "", diagnostic: "", observations: "", examens: "", prochaine_consultation: ""
  });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000";

  const fetchConsultations = async () => {
    const res = await axios.get(`${API}/consultations`);
    setConsultations(res.data);
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
    fetchConsultations();
    fetchPatients();
    fetchPraticiens();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/consultations/${editingId}`, form);
    } else {
      await axios.post(`${API}/consultations`, form);
    }
    resetForm();
    fetchConsultations();
  };

  const resetForm = () => {
    setForm({ patient_id: "", praticien_id: "", date_consultation: "", diagnostic: "", observations: "", examens: "", prochaine_consultation: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette consultation ? (Prescriptions associées seront supprimées via CASCADE)")) {
      await axios.delete(`${API}/consultations/${id}`);
      fetchConsultations();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Consultations</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})} required className="border p-2 rounded">
          <option value="">Sélectionner Patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
        </select>
        <select value={form.praticien_id} onChange={e => setForm({...form, praticien_id: e.target.value})} required className="border p-2 rounded">
          <option value="">Sélectionner Praticien</option>
          {praticiens.map(pr => <option key={pr.id} value={pr.id}>{pr.nom} {pr.prenom}</option>)}
        </select>
        <input type="date" placeholder="Date consultation" value={form.date_consultation} onChange={e => setForm({...form, date_consultation: e.target.value})} required className="border p-2 rounded" />
        <input type="date" placeholder="Prochaine consultation" value={form.prochaine_consultation} onChange={e => setForm({...form, prochaine_consultation: e.target.value})} className="border p-2 rounded" />
        <textarea placeholder="Diagnostic" value={form.diagnostic} onChange={e => setForm({...form, diagnostic: e.target.value})} className="border p-2 rounded md:col-span-2" rows="3" />
        <textarea placeholder="Observations" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} className="border p-2 rounded md:col-span-2" rows="3" />
        <textarea placeholder="Examens" value={form.examens} onChange={e => setForm({...form, examens: e.target.value})} className="border p-2 rounded md:col-span-2" rows="3" />
        <button type="submit" className="md:col-span-2 bg-orange-600 text-white py-3 rounded hover:bg-orange-700">
          {editingId ? "Modifier" : "Enregistrer"} Consultation
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Praticien</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Diagnostic (extrait)</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map(c => {
              const patient = patients.find(p => p.id === c.patient_id) || {};
              const praticien = praticiens.find(pr => pr.id === c.praticien_id) || {};
              return (
                <tr key={c.id}>
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3">{patient.nom} {patient.prenom}</td>
                  <td className="px-4 py-3">{praticien.nom} {praticien.prenom}</td>
                  <td className="px-4 py-3">{c.date_consultation}</td>
                  <td className="px-4 py-3">{c.diagnostic?.substring(0, 50)}...</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setForm(c); setEditingId(c.id); }} className="text-blue-600 mr-3">Éditer</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600">Supprimer</button>
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