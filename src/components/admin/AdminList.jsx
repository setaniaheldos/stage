import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get('http://localhost:3001/admins');
        setAdmins(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des administrateurs');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Chargement...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="mt-6">
      {admins.length > 0 ? (
        <table className="min-w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 text-sm">
          <thead>
            <tr className="bg-blue-100 text-blue-900">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-t hover:bg-gray-100 transition-all duration-200">
                <td className="px-4 py-2">{admin.id}</td>
                <td className="px-4 py-2">{admin.email}</td>
                <td className="px-4 py-2">
                  {/* Add action buttons here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-4 text-gray-500">Aucun administrateur trouvé.</div>
      )}
    </div>
  );
};

export default AdminList;