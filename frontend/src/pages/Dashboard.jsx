import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { AlertCircle, Users, CreditCard, Wallet, Banknote, AlertTriangle, Activity } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryRes, trendRes] = await Promise.all([
          axiosClient.get('/reports/portfolio-summary'),
          axiosClient.get('/reports/monthly-trend')
        ]);
        setSummary(summaryRes.data.data);
        setTrendData(trendRes.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Unable to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Portfolio Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Real-time snapshot of your microfinance operations.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 animate-pulse h-32">
              <div className="p-5 flex items-center">
                <div className="rounded-md bg-slate-200 h-12 w-12 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">
                {error}
              </p>
            </div>
          </div>
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Active Clients */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Active Clients</dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">{summary.active_clients.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Disbursed Loans */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Total Disbursed ({summary.disbursed_loans_count})</dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">৳{summary.disbursed_loans_amount.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Outstanding */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-100 rounded-lg p-3">
                  <Wallet className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Total Outstanding</dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">৳{summary.total_outstanding.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Collected */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-100 rounded-lg p-3">
                  <Banknote className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Total Collected</dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">৳{summary.total_collected.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Amount & Count */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Overdue ({summary.total_overdue_count})</dt>
                    <dd className="text-2xl font-bold text-red-600 mt-1">৳{summary.total_overdue_amount.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* PAR Percentage */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">PAR (Portfolio at Risk)</dt>
                    <dd className={`text-2xl font-bold mt-1 ${summary.par_percentage > 5 ? 'text-red-600' : 'text-slate-900'}`}>
                      {summary.par_percentage}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Written Off */}
          <div className="card hover:shadow-md transition-shadow relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-in-out"></div>
            <div className="card-body relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-slate-200 rounded-lg p-3">
                  <AlertCircle className="h-6 w-6 text-slate-700" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Total Written Off</dt>
                    <dd className="text-2xl font-bold text-slate-700 mt-1">৳{summary.total_written_off ? summary.total_written_off.toLocaleString() : '0'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {summary && trendData && trendData.length > 0 && (
        <div className="mt-8 mb-4">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Monthly Trend (Last 6 Months)</h3>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trendData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" 
                  tickFormatter={(value) => 
                    value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                  } 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 500 }}
                  formatter={(value) => `৳${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="Disbursed" barSize={32} fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
