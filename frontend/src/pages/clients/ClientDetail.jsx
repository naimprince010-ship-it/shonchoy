import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Savings Modal State
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsAction, setSavingsAction] = useState('DEPOSIT'); // DEPOSIT or WITHDRAWAL
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsError, setSavingsError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, txRes] = await Promise.all([
        axiosClient.get(`/clients/${id}`),
        axiosClient.get(`/savings/${id}/transactions`).catch(() => ({ data: { transactions: [] } })) // Fallback if no savings account yet
      ]);
      setClient(clientRes.data);
      setTransactions(txRes.data.transactions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Unable to load client details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const openSavingsModal = (action) => {
    setSavingsAction(action);
    setSavingsAmount('');
    setSavingsError(null);
    setShowSavingsModal(true);
  };

  const handleSavingsSubmit = async (e) => {
    e.preventDefault();
    setSavingsError(null);

    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount <= 0) {
      setSavingsError('Amount must be a positive number greater than 0.');
      return;
    }

    try {
      setActionLoading(true);
      const endpoint = savingsAction === 'DEPOSIT' ? '/savings/deposit' : '/savings/withdraw';
      await axiosClient.post(endpoint, {
        savings_account_id: client.savings_account?.id,
        amount: amount
      });
      setShowSavingsModal(false);
      toast.success(`Savings ${savingsAction.toLowerCase()} successful`);
      fetchClientData(); // Refresh balance and transactions
    } catch (err) {
      setSavingsError(err.response?.data?.error || `Failed to process ${savingsAction.toLowerCase()}.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-8 bg-slate-200 rounded w-8"></div>
          <div className="h-8 bg-slate-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card card-body col-span-1 h-96 bg-slate-50 border-slate-100 border"></div>
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="card card-body h-32 bg-slate-50 border-slate-100 border"></div>
            <div className="card h-64 bg-slate-50 border-slate-100 border"></div>
          </div>
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clients" className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Client Profile</h2>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`badge ${client.status === 'ACTIVE' ? 'badge-disbursed' : 'badge-closed'}`}>
            {client.status}
          </span>
          <Link 
            to="/loans/new" 
            state={{ client_id: client.id }}
            className="btn-primary"
          >
            Apply for Loan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="card card-body col-span-1 h-fit">
          <div className="flex items-center justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold uppercase">
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
          
          {/* Savings Summary & Actions */}
          <div className="card card-body">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-slate-900">Savings Balance</h3>
                <p className="text-sm text-slate-500">Total compulsory savings</p>
              </div>
              <div className="mt-4 sm:mt-0 text-3xl font-bold text-emerald-600">
                ৳{client.savings_account?.balance || '0.00'}
              </div>
            </div>
            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => openSavingsModal('DEPOSIT')}
                className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium py-2 px-4 rounded transition-colors"
              >
                Deposit
              </button>
              <button 
                onClick={() => openSavingsModal('WITHDRAWAL')}
                className="flex-1 bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium py-2 px-4 rounded transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Savings Transaction History */}
          <div className="card">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Savings Transactions</h3>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-medium text-slate-500">No transactions yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(tx.transaction_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}
                          `}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}৳{tx.amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loans History */}
          <div className="card">
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
                      <td colSpan="4" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="text-sm font-medium text-slate-900 mb-1">No loans found</h3>
                          <p className="text-sm text-slate-500">This client has no loan history.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    client.loans.map(loan => (
                      <tr key={loan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          <Link to={`/loans/${loan.id}`} className="hover:text-blue-600">Loan #{loan.id}</Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          ৳{loan.principal_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {loan.term_weeks} Weeks
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Savings Action Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <form onSubmit={handleSavingsSubmit} className="card relative inline-block text-left transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 text-center">
                  {savingsAction === 'DEPOSIT' ? 'Deposit Savings' : 'Withdraw Savings'}
                </h3>
                
                {savingsError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">
                    {savingsError}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (৳)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={savingsAmount}
                    onChange={(e) => {
                      setSavingsAmount(e.target.value);
                      if (savingsError) setSavingsError(null);
                    }}
                    className={`input-field mt-1 ${savingsError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {savingsAction === 'WITHDRAWAL' && (
                    <p className="mt-2 text-xs text-gray-500">
                      Current Balance: ৳{client.savings_account?.balance || '0.00'}
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:ml-3 sm:w-auto ${
                    savingsAction === 'DEPOSIT' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                >
                  {actionLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {actionLoading ? 'Processing...' : `Confirm ${savingsAction === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}`}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSavingsModal(false)} 
                  className="btn-secondary mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDetail;
