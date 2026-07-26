import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoanDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showWriteOffDialog, setShowWriteOffDialog] = useState(false);
  
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentError, setRepaymentError] = useState(null);
  const [writeOffReason, setWriteOffReason] = useState('');

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
      toast.success('Loan approved successfully');
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
      toast.success('Loan disbursed successfully');
      fetchLoanDetail();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disburse loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWriteOff = async () => {
    if (!writeOffReason || writeOffReason.trim().length < 5) {
      toast.error('Please provide a valid reason (at least 5 characters).');
      return;
    }
    
    try {
      setActionLoading(true);
      await axiosClient.put(`/loans/${id}/writeoff`, { reason: writeOffReason });
      setShowWriteOffDialog(false);
      toast.success('Loan written off successfully');
      fetchLoanDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to write off loan.');
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
    
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setRepaymentError('Amount must be a positive number greater than 0.');
      return;
    }

    try {
      setActionLoading(true);
      await axiosClient.post(`/loans/${id}/repayment`, {
        installment_schedule_id: selectedSchedule.id,
        amount_paid: amount
      });
      setShowRepaymentModal(false);
      toast.success('Payment collected successfully');
      fetchLoanDetail(); // Refresh data
    } catch (err) {
      setRepaymentError(err.response?.data?.error || 'Failed to process repayment.');
    } finally {
      setActionLoading(false);
    }
  };

  const canApproveOrDisburse = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-6 bg-slate-200 rounded w-16"></div>
            <div className="h-8 bg-slate-200 rounded w-32"></div>
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card card-body h-48 bg-slate-50 border border-slate-100"></div>
          <div className="card card-body h-48 bg-slate-50 border border-slate-100"></div>
        </div>
        <div className="card h-64 bg-slate-50 border border-slate-100"></div>
      </div>
    );
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
          <span className={`badge 
            ${loan.status === 'PENDING' ? 'badge-pending' : ''}
            ${loan.status === 'APPROVED' ? 'badge-approved' : ''}
            ${loan.status === 'DISBURSED' ? 'badge-disbursed' : ''}
            ${loan.status === 'CLOSED' ? 'badge-closed' : ''}
            ${loan.status === 'DEFAULTED' ? 'bg-black text-white px-2.5 py-0.5 rounded-full text-xs font-semibold' : ''}
          `}>
            {loan.status}
          </span>
        </div>
        
        <div className="flex space-x-3">
          {loan.status === 'PENDING' && canApproveOrDisburse && (
            <button 
              onClick={handleApprove}
              disabled={actionLoading}
              className="btn-primary flex items-center"
            >
              {actionLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {actionLoading ? 'Processing...' : 'Approve Loan'}
            </button>
          )}
          
          {loan.status === 'APPROVED' && canApproveOrDisburse && (
            <button 
              onClick={() => setShowDisburseDialog(true)}
              className="btn-primary"
            >
              Disburse Funds
            </button>
          )}

          {loan.status === 'DISBURSED' && user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowWriteOffDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
            >
              Write Off Loan
            </button>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card card-body">
          <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">Client Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="card card-body">
          <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">Loan Specifications</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Write-Off Details (If Defaulted) */}
      {loan.status === 'DEFAULTED' && (
        <div className="card card-body border border-red-200 bg-red-50">
          <h3 className="text-lg font-medium text-red-900 mb-4 border-b border-red-200 pb-2">Write-Off Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-red-700">Written Off On</dt>
              <dd className="mt-1 text-sm text-red-900 font-medium">
                {loan.writeoff_date ? new Date(loan.writeoff_date).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-red-700">Reason</dt>
              <dd className="mt-1 text-sm text-red-900 font-medium">{loan.writeoff_reason || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Schedule Table */}
      {(loan.status === 'DISBURSED' || loan.status === 'DEFAULTED') && (
        <div className="card">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">Installment Schedule</h3>
          </div>
          <div className="table-container overflow-x-auto">
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
                        <span className={`badge 
                          ${schedule.status === 'PAID' ? 'badge-disbursed' : isOverdue ? 'bg-red-100 text-red-800' : 'badge-pending'}
                        `}>
                          {isOverdue ? 'OVERDUE' : schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {schedule.status !== 'PAID' && loan.status !== 'DEFAULTED' && (
                          <button 
                            onClick={() => openRepaymentModal(schedule)}
                            className="text-primary-600 hover:text-primary-900 font-medium"
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
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="card relative inline-block text-left transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
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
                  className="btn-primary flex items-center justify-center w-full sm:w-auto sm:text-sm sm:ml-3"
                >
                  {actionLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {actionLoading ? 'Processing...' : 'Confirm Disburse'}
                </button>
                <button 
                  onClick={() => setShowDisburseDialog(false)} 
                  className="btn-secondary w-full sm:w-auto sm:text-sm mt-3 sm:mt-0 sm:ml-3"
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
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <form onSubmit={handleRepaymentSubmit} className="card relative inline-block text-left transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 text-center">Collect Payment (Week {selectedSchedule?.installment_number})</h3>
                
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
                    onChange={(e) => {
                      setRepaymentAmount(e.target.value);
                      if (repaymentError) setRepaymentError(null);
                    }}
                    className={`input-field mt-1 ${repaymentError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
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
                  className="btn-primary flex items-center justify-center w-full sm:w-auto sm:text-sm sm:ml-3"
                >
                  {actionLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {actionLoading ? 'Processing...' : 'Submit Payment'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowRepaymentModal(false)} 
                  className="btn-secondary w-full sm:w-auto sm:text-sm mt-3 sm:mt-0 sm:ml-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write Off Confirmation Dialog */}
      {showWriteOffDialog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="card relative inline-block text-left transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Write Off Loan</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        <strong className="text-red-600">Warning:</strong> এই loan-টি অবলোপন (write-off) করা হলে এটি আর সক্রিয় portfolio-তে গণনা হবে না। এই কাজটি বাতিলযোগ্য নয়।
                      </p>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for write-off *</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        rows="3"
                        placeholder="Enter explanation here..."
                        value={writeOffReason}
                        onChange={(e) => setWriteOffReason(e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  onClick={handleWriteOff} 
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center w-full sm:w-auto sm:ml-3"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Write-Off'}
                </button>
                <button 
                  onClick={() => setShowWriteOffDialog(false)} 
                  className="btn-secondary w-full sm:w-auto sm:text-sm mt-3 sm:mt-0 sm:ml-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoanDetail;
