import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Plus, Search, Users } from 'lucide-react';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async (search = '') => {
    try {
      setLoading(true);
      const endpoint = search ? `/clients?search=${encodeURIComponent(search)}` : '/clients';
      const response = await axiosClient.get(endpoint);
      setClients(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Unable to load clients. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="card card-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="mt-1 text-sm text-slate-500">Manage all registered clients.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/clients/new"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Client
          </Link>
        </div>
      </div>

      <div className="mb-6 max-w-md">
        <label htmlFor="search" className="sr-only">Search</label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            className="input-field pl-10"
            placeholder="Search by Name or NID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Group</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-3/4"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-2/3"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-1/4 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Group</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-sm font-medium text-slate-900 mb-1">No clients found</h3>
                      <p className="text-sm text-slate-500 mb-4">Get started by adding a new client.</p>
                      <Link to="/clients/new" className="btn-secondary inline-flex items-center text-sm">
                        Add Client
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {client.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {client.nid_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {client.group?.name || 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${client.status === 'ACTIVE' ? 'badge-disbursed' : 'badge-closed'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/clients/${client.id}`} className="text-primary-600 hover:text-primary-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;
