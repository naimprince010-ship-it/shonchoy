import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/clients/${id}`);
        setClient(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch client details:', err);
        setError('Unable to load client details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchClientDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse p-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded col-span-1"></div>
          <div className="h-48 bg-slate-200 rounded col-span-2"></div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded">
          {error || 'Client not found.'}
        </div>
        <Link to="/clients" className="mt-4 inline-block text-blue-600 hover:underline">
          &larr; Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clients" className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Client Profile</h2>
        </div>
        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
          {client.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="bg-white shadow rounded-lg p-6 col-span-1">
          <div className="flex items-center justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold uppercase">
              {client.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-xl font-bold text-center text-slate-900 mb-6">{client.name}</h3>
          
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-slate-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-slate-900">{client.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">NID Number</dt>
              <dd className="mt-1 text-sm text-slate-900">{client.nid_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Guardian Name</dt>
              <dd className="mt-1 text-sm text-slate-900">{client.guardian_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Group</dt>
              <dd className="mt-1 text-sm text-slate-900">{client.group?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Address</dt>
              <dd className="mt-1 text-sm text-slate-900">{client.address}</dd>
            </div>
          </dl>
        </div>

        {/* Right side: Savings & Loans */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Savings Summary */}
          <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Savings Balance</h3>
              <p className="text-sm text-slate-500">Total compulsory savings</p>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              ৳{client.savings_account?.balance || '0.00'}
            </div>
          </div>

          {/* Loans History */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900">Loan History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Principal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {!client.loans || client.loans.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        No loans found for this client.
                      </td>
                    </tr>
                  ) : (
                    client.loans.map(loan => (
                      <tr key={loan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          Loan #{loan.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          ৳{loan.principal_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {loan.term_weeks} Weeks
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${loan.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : ''}
                            ${loan.status === 'DISBURSED' ? 'bg-indigo-100 text-indigo-800' : ''}
                            ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                            ${loan.status === 'CLOSED' ? 'bg-slate-100 text-slate-800' : ''}
                          `}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
