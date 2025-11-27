import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/login', form);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur inconnue');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-600 to-purple-700">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-center text-gray-700">Connexion</h1>
        <input className="input" name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input className="input" name="password" type="password" placeholder="Mot de passe" onChange={handleChange} required />
        {error && <p className="text-red-500">{error}</p>}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition">Se connecter</button>
        <p className="text-sm text-center">Pas de compte ? <Link to="/register" className="text-blue-500 hover:underline">S’inscrire</Link></p>
      </form>
    </div>
  );
}
