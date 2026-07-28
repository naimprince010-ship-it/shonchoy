import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Search, PiggyBank, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SavingsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/savings');
      setSavingsAccounts(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch savings:', err);
      setError('Unable to load savings data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  // Calculate total balance
  const totalBalance = savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  // Filter accounts based on search
  const filteredAccounts = savingsAccounts.filter(acc => {
    const term = searchTerm.toLowerCase();
    return (
      acc.client?.name?.toLowerCase().includes(term) ||
      acc.client?.phone?.includes(term)
    );
  });

  const handleExportExcel = () => {
    const dataToExport = filteredAccounts.map(acc => ({
      'Client Name': acc.client?.name,
      'Phone': acc.client?.phone,
      'Balance (BDT)': parseFloat(acc.balance).toFixed(2),
      'Last Transaction': acc.transactions?.[0]?.transaction_date ? formatDate(acc.transactions[0].transaction_date) : 'N/A'
    }));
    exportToExcel(dataToExport, 'Savings_Overview');
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Savings Balance</p>
              <h3 className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <PiggyBank className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-green-100 text-xs mt-4">For active clients</p>
        </div>
      </div>

      <div className="card card-body">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Savings Overview</h2>
            <p className="mt-1 text-sm text-slate-500">View and manage all client savings accounts.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleExportExcel}
              className="btn-secondary inline-flex items-center"
              disabled={filteredAccounts.length === 0}
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              Export
            </button>
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
              placeholder="Search by client name or phone..."
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Last Transaction</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-3/4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-full ml-auto"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-3/4 ml-auto"></div></td>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Last Transaction</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      No savings accounts found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr 
                      key={acc.id} 
                      onClick={() => navigate(`/clients/${acc.client?.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{acc.client?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {acc.client?.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold text-right">
                        {formatCurrency(acc.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                        {acc.transactions?.[0]?.transaction_date 
                          ? formatDate(acc.transactions[0].transaction_date) 
                          : 'No transactions'}
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

export default SavingsList;
