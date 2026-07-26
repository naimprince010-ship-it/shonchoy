import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      let query = `/audit-logs?page=${page}&limit=20`;
      if (actionFilter) query += `&action=${actionFilter}`;
      if (entityFilter) query += `&entity_type=${entityFilter}`;

      const res = await axiosClient.get(query);
      setLogs(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter]);

  const handlePrevPage = () => {
    if (meta.page > 1) fetchLogs(meta.page - 1);
  };

  const handleNextPage = () => {
    if (meta.page < meta.totalPages) fetchLogs(meta.page + 1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Activity Log</h2>
          <p className="mt-1 text-sm text-slate-500">
            System audit trail for state-changing operations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50">
          <div className="flex items-center text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </div>
          <select 
            className="input-field text-sm py-1.5 px-3 rounded-md"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CLIENT_CREATED">CLIENT_CREATED</option>
            <option value="CLIENT_UPDATED">CLIENT_UPDATED</option>
            <option value="LOAN_APPROVED">LOAN_APPROVED</option>
            <option value="LOAN_DISBURSED">LOAN_DISBURSED</option>
            <option value="REPAYMENT_ADDED">REPAYMENT_ADDED</option>
            <option value="SAVINGS_DEPOSITED">SAVINGS_DEPOSITED</option>
            <option value="SAVINGS_WITHDRAWN">SAVINGS_WITHDRAWN</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
          </select>

          <select 
            className="input-field text-sm py-1.5 px-3 rounded-md"
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
          >
            <option value="">All Entities</option>
            <option value="Client">Client</option>
            <option value="Loan">Loan</option>
            <option value="SavingsAccount">SavingsAccount</option>
            <option value="User">User</option>
            <option value="Branch">Branch</option>
            <option value="Center">Center</option>
            <option value="Group">Group</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(log.created_at).toLocaleString('en-CA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {log.user_name || (log.user_id ? `User #${log.user_id}` : 'System/Anonymous')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {log.details ? (
                        <pre className="text-xs bg-slate-100 p-2 rounded max-w-xs overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="text-sm text-slate-700">
            Page <span className="font-medium">{meta.page}</span> of <span className="font-medium">{meta.totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={meta.page <= 1}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={meta.page >= meta.totalPages}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
