import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Banknote } from 'lucide-react';

const LoanList = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(''); // Empty = All

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/loans?status=${statusFilter}` : '/loans';
      const response = await axiosClient.get(url);
      setLoans(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
      setError('Failed to load loans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Disbursed', value: 'DISBURSED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  return (
    <div className="card">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold text-slate-900 mb-4 sm:mb-0">Loan Management</h2>
        <Link
          to="/loans/new"
          className="btn-primary inline-flex items-center justify-center"
        >
          New Application
        </Link>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                statusFilter === tab.value
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="table-container overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-32 mb-2"></div><div className="h-3 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Banknote className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-sm font-medium text-slate-900 mb-1">No loans found</h3>
                        <p className="text-sm text-slate-500 mb-4">There are no loan applications matching this status.</p>
                        {statusFilter === '' && (
                          <Link to="/loans/new" className="btn-secondary inline-flex items-center text-sm">
                            New Application
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        #{loan.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{loan.client?.name}</div>
                        <div className="text-sm text-slate-500">NID: {loan.client?.nid_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {loan.loan_product?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        ৳{loan.principal_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`badge 
                          ${loan.status === 'PENDING' ? 'badge-pending' : ''}
                          ${loan.status === 'APPROVED' ? 'badge-approved' : ''}
                          ${loan.status === 'DISBURSED' ? 'badge-disbursed' : ''}
                          ${loan.status === 'ACTIVE' ? 'badge-disbursed' : ''}
                          ${loan.status === 'CLOSED' ? 'badge-closed' : ''}
                        `}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/loans/${loan.id}`} className="text-primary-600 hover:text-primary-900">
                          View Details
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
    </div>
  );
};

export default LoanList;
