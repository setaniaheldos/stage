import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/register', form);
      setMessage(res.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-green-600 to-teal-700">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-center text-gray-700">Inscription</h1>
        <input className="input" name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input className="input" name="password" type="password" placeholder="Mot de passe" onChange={handleChange} required />
        {message && <p className="text-green-500">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition">S’inscrire</button>
        <p className="text-sm text-center">Déjà inscrit ? <Link to="/" className="text-green-500 hover:underline">Se connecter</Link></p>
      </form>
    </div>
  );
}
