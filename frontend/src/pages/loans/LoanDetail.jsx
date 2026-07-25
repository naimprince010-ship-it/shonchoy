import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const LoanDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentError, setRepaymentError] = useState(null);

  const fetchLoanDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/loans/${id}`);
      setLoan(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch loan details:', err);
      setError('Unable to load loan details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanDetail();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await axiosClient.put(`/loans/${id}/approve`);
      fetchLoanDetail();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburse = async () => {
    try {
      setActionLoading(true);
      await axiosClient.put(`/loans/${id}/disburse`, { disbursement_date: new Date().toISOString() });
      setShowDisburseDialog(false);
      fetchLoanDetail();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disburse loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRepaymentModal = (schedule) => {
    setSelectedSchedule(schedule);
    const paidSoFar = schedule.repayments?.reduce((sum, r) => sum + parseFloat(r.amount_paid), 0) || 0;
    const remaining = (parseFloat(schedule.total_due) - paidSoFar).toFixed(2);
    setRepaymentAmount(remaining);
    setRepaymentError(null);
    setShowRepaymentModal(true);
  };

  const handleRepaymentSubmit = async (e) => {
    e.preventDefault();
    setRepaymentError(null);
    
    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      setRepaymentError('Please enter a valid positive amount.');
      return;
    }

    try {
      setActionLoading(true);
      await axiosClient.post(`/loans/${id}/repayment`, {
        installment_schedule_id: selectedSchedule.id,
        amount_paid: repaymentAmount
      });
      setShowRepaymentModal(false);
      fetchLoanDetail(); // Refresh data
    } catch (err) {
      setRepaymentError(err.response?.data?.error || 'Failed to process repayment.');
    } finally {
      setActionLoading(false);
    }
  };

  const canApproveOrDisburse = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';

  if (loading) {
    return <div className="p-6 animate-pulse">Loading loan details...</div>;
  }

  if (error || !loan) {
    return <div className="p-6 text-red-600">{error || 'Loan not found'}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/loans" className="text-slate-400 hover:text-slate-600">
            &larr; Back
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Loan #{loan.id}</h2>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
            ${loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${loan.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : ''}
            ${loan.status === 'DISBURSED' ? 'bg-indigo-100 text-indigo-800' : ''}
            ${loan.status === 'CLOSED' ? 'bg-slate-100 text-slate-800' : ''}
          `}>
            {loan.status}
          </span>
        </div>
        
        <div className="flex space-x-3">
          {loan.status === 'PENDING' && canApproveOrDisburse && (
            <button 
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Approve Loan'}
            </button>
          )}
          
          {loan.status === 'APPROVED' && canApproveOrDisburse && (
            <button 
              onClick={() => setShowDisburseDialog(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
            >
              Disburse Funds
            </button>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">Client Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-slate-500">Name</dt>
              <dd className="mt-1 text-sm text-slate-900 font-semibold">{loan.client?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">NID</dt>
              <dd className="mt-1 text-sm text-slate-900">{loan.client?.nid_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Phone</dt>
              <dd className="mt-1 text-sm text-slate-900">{loan.client?.phone}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">Loan Specifications</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-slate-500">Product</dt>
              <dd className="mt-1 text-sm text-slate-900">{loan.loan_product?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Principal Amount</dt>
              <dd className="mt-1 text-sm text-slate-900 font-bold text-emerald-600">৳{loan.principal_amount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Interest Rate</dt>
              <dd className="mt-1 text-sm text-slate-900">{loan.interest_rate * 100}% ({loan.interest_method})</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Term</dt>
              <dd className="mt-1 text-sm text-slate-900">{loan.term_weeks} Weeks</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Schedule Table */}
      {loan.status === 'DISBURSED' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Installment Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Wk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loan.schedules?.map((schedule) => {
                  const paidSoFar = schedule.repayments?.reduce((sum, r) => sum + parseFloat(r.amount_paid), 0) || 0;
                  const isOverdue = schedule.status === 'PENDING' && new Date(schedule.due_date) < new Date();
                  
                  return (
                    <tr key={schedule.id} className={schedule.status === 'PAID' ? 'bg-emerald-50' : isOverdue ? 'bg-red-50' : 'hover:bg-slate-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{schedule.installment_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(schedule.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">৳{schedule.total_due}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">৳{paidSoFar.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${schedule.status === 'PAID' ? 'bg-green-100 text-green-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                        `}>
                          {isOverdue ? 'OVERDUE' : schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {schedule.status !== 'PAID' && (
                          <button 
                            onClick={() => openRepaymentModal(schedule)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Collect Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disburse Confirmation Dialog */}
      {showDisburseDialog && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Disbursement</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to disburse this loan? This action releases real funds (৳{loan.principal_amount}) and cannot be undone. The installment schedule will be generated automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  onClick={handleDisburse} 
                  disabled={actionLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Disburse'}
                </button>
                <button 
                  onClick={() => setShowDisburseDialog(false)} 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {showRepaymentModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <form onSubmit={handleRepaymentSubmit} className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Collect Payment (Week {selectedSchedule?.installment_number})</h3>
                
                {repaymentError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">
                    {repaymentError}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Paid (৳)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Total Due: ৳{selectedSchedule?.total_due}. Overpayments must be handled manually.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {actionLoading ? 'Processing...' : 'Submit Payment'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowRepaymentModal(false)} 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default LoanDetail;
