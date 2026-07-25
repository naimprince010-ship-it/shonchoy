import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Banknote } from 'lucide-react';

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' or 'daily'

  // Portfolio State
  const [portfolioData, setPortfolioData] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState(null);

  // Daily Collection State
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState(null);

  // Fetch Portfolio Summary
  const fetchPortfolio = async () => {
    try {
      setPortfolioLoading(true);
      const res = await axiosClient.get('/reports/portfolio-summary');
      setPortfolioData(res.data.data);
      setPortfolioError(null);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
      setPortfolioError('Failed to load portfolio summary.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Fetch Daily Collection
  const fetchDailyCollection = async () => {
    try {
      setDailyLoading(true);
      const res = await axiosClient.get(`/reports/daily-collection?date=${dailyDate}`);
      setDailyData(res.data.data);
      setDailyError(null);
    } catch (err) {
      console.error('Failed to fetch daily collection', err);
      setDailyError('Failed to load daily collection report.');
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'portfolio') {
      if (!portfolioData) fetchPortfolio();
    } else {
      fetchDailyCollection();
    }
  }, [activeTab, dailyDate]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 sm:mb-0">Reports Dashboard</h2>
        
        {activeTab === 'daily' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Date:</label>
            <input 
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>
        )}
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'portfolio'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Portfolio Summary
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'daily'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Daily Collection
          </button>
        </nav>
      </div>

      {/* Portfolio Summary Tab */}
      {activeTab === 'portfolio' && (
        <div>
          {portfolioError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 mb-6">
              {portfolioError}
            </div>
          )}

          {portfolioLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card card-body h-32 bg-slate-50 flex flex-col justify-center border border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : portfolioData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card card-body">
                <dt className="text-sm font-medium text-slate-500 truncate">Active Clients</dt>
                <dd className="mt-2 text-3xl font-semibold text-slate-900">{portfolioData.active_clients}</dd>
                <p className="mt-1 text-xs text-slate-400">Clients with disbursed loans</p>
              </div>
              <div className="card card-body">
                <dt className="text-sm font-medium text-slate-500 truncate">Disbursed Loans</dt>
                <dd className="mt-2 text-3xl font-semibold text-slate-900">{portfolioData.disbursed_loans_count}</dd>
                <p className="mt-1 text-xs text-slate-400">Total active loans</p>
              </div>
              <div className="card card-body border-b-4 border-primary-500">
                <dt className="text-sm font-medium text-slate-500 truncate">Total Disbursed Amount</dt>
                <dd className="mt-2 text-3xl font-semibold text-primary-600">৳{portfolioData.disbursed_loans_amount}</dd>
              </div>
              
              <div className="card card-body border-b-4 border-primary-500">
                <dt className="text-sm font-medium text-slate-500 truncate">Total Outstanding</dt>
                <dd className="mt-2 text-3xl font-semibold text-primary-600">৳{portfolioData.total_outstanding}</dd>
                <p className="mt-1 text-xs text-slate-400">Remaining to be collected</p>
              </div>
              <div className="card card-body border-b-4 border-emerald-500">
                <dt className="text-sm font-medium text-slate-500 truncate">Total Collected</dt>
                <dd className="mt-2 text-3xl font-semibold text-emerald-600">৳{portfolioData.total_collected}</dd>
                <p className="mt-1 text-xs text-slate-400">Total life-time collection</p>
              </div>
              <div className={`card card-body border-b-4 ${portfolioData.par_percentage > 5 ? 'border-red-500' : 'border-yellow-500'}`}>
                <dt className="text-sm font-medium text-slate-500 truncate">Portfolio at Risk (PAR)</dt>
                <dd className={`mt-2 text-3xl font-semibold ${portfolioData.par_percentage > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {portfolioData.par_percentage}%
                </dd>
                <p className="mt-1 text-xs text-slate-400">
                  Overdue Amount: ৳{portfolioData.total_overdue_amount}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Collection Tab */}
      {activeTab === 'daily' && (
        <div>
          {dailyError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 mb-6">
              {dailyError}
            </div>
          )}

          {dailyLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-24 bg-slate-100 rounded-lg w-full max-w-sm mb-6"></div>
              <div className="h-64 bg-slate-100 rounded-lg w-full"></div>
            </div>
          ) : dailyData && (
            <div className="space-y-6">
              {/* Daily Summary */}
              <div className="card card-body inline-block border-l-4 border-emerald-500">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Total Collection for {new Date(dailyData.date).toLocaleDateString()}</h3>
                <div className="text-4xl font-bold text-emerald-600">৳{dailyData.total_collection}</div>
              </div>

              {/* Transactions Table */}
              <div className="card">
                <div className="table-container overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Loan Reference</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {dailyData.repayments.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Banknote className="h-12 w-12 text-slate-300 mb-4" />
                              <h3 className="text-sm font-medium text-slate-900 mb-1">No collections found</h3>
                              <p className="text-sm text-slate-500">There are no recorded repayments for this date.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dailyData.repayments.map((rep) => (
                          <tr key={rep.repayment_id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {new Date(rep.payment_date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {rep.client_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600 hover:underline cursor-pointer">
                              <a href={`/loans/${rep.loan_id}`}>Loan #{rep.loan_id}</a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                              ৳{rep.amount_paid}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ReportsDashboard;
