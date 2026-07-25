import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const GroupManagement = () => {
  const [activeTab, setActiveTab] = useState('branches');
  const [branches, setBranches] = useState([]);
  const [centers, setCenters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Forms states
  const [branchForm, setBranchForm] = useState({ name: '', address: '' });
  const [centerForm, setCenterForm] = useState({ name: '', branch_id: '', meeting_day: 'MONDAY', field_officer_id: '' });
  const [groupForm, setGroupForm] = useState({ name: '', center_id: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchesRes, centersRes, groupsRes, officersRes] = await Promise.all([
        axiosClient.get('/branches'),
        axiosClient.get('/centers'),
        axiosClient.get('/groups'),
        axiosClient.get('/users?role=FIELD_OFFICER').catch(() => ({ data: [] }))
      ]);
      setBranches(branchesRes.data);
      setCenters(centersRes.data);
      setGroups(groupsRes.data);
      setFieldOfficers(officersRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Failed to load hierarchy data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.address) return;
    try {
      setSubmitting(true);
      await axiosClient.post('/branches', branchForm);
      setBranchForm({ name: '', address: '' });
      fetchData(); // Refresh all
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCenterSubmit = async (e) => {
    e.preventDefault();
    if (!centerForm.name || !centerForm.branch_id || !centerForm.meeting_day) return;
    try {
      setSubmitting(true);
      await axiosClient.post('/centers', centerForm);
      setCenterForm({ name: '', branch_id: '', meeting_day: 'MONDAY', field_officer_id: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupForm.name || !groupForm.center_id) return;
    try {
      setSubmitting(true);
      await axiosClient.post('/groups', groupForm);
      setGroupForm({ name: '', center_id: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {['branches', 'centers', 'groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="m-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        ) : (
          <>
            {activeTab === 'branches' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add Branch</h3>
                <form onSubmit={handleBranchSubmit} className="flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <input
                      type="text"
                      required
                      value={branchForm.name}
                      onChange={e => setBranchForm({...branchForm, name: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g. Dhaka Main"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">Address</label>
                    <input
                      type="text"
                      required
                      value={branchForm.address}
                      onChange={e => setBranchForm({...branchForm, address: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium h-[38px]"
                  >
                    Save
                  </button>
                </form>

                <h3 className="text-lg font-medium text-slate-900 mb-4">Branch List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Centers Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {branches.map(b => (
                        <tr key={b.id}>
                          <td className="px-6 py-4 text-sm text-slate-900">{b.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{b.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{b.address}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{b.centers?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'centers' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add Center</h3>
                <form onSubmit={handleCenterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <input
                      type="text"
                      required
                      value={centerForm.name}
                      onChange={e => setCenterForm({...centerForm, name: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Branch</label>
                    <select
                      required
                      value={centerForm.branch_id}
                      onChange={e => setCenterForm({...centerForm, branch_id: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    >
                      <option value="">Select...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Field Officer (Optional)</label>
                    <select
                      value={centerForm.field_officer_id}
                      onChange={e => setCenterForm({...centerForm, field_officer_id: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    >
                      <option value="">None</option>
                      {fieldOfficers.map(fo => <option key={fo.id} value={fo.id}>{fo.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700">Meeting</label>
                      <select
                        required
                        value={centerForm.meeting_day}
                        onChange={e => setCenterForm({...centerForm, meeting_day: e.target.value})}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                      >
                        {['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium h-[38px] mt-6"
                    >
                      Save
                    </button>
                  </div>
                </form>

                <h3 className="text-lg font-medium text-slate-900 mb-4">Center List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Field Officer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Meeting Day</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {centers.map(c => (
                        <tr key={c.id}>
                          <td className="px-6 py-4 text-sm text-slate-900">{c.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{c.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{c.branch?.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{c.field_officer?.name || 'Unassigned'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{c.meeting_day}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add Group</h3>
                <form onSubmit={handleGroupSubmit} className="flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-lg max-w-2xl">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">Group Name</label>
                    <input
                      type="text"
                      required
                      value={groupForm.name}
                      onChange={e => setGroupForm({...groupForm, name: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">Center</label>
                    <select
                      required
                      value={groupForm.center_id}
                      onChange={e => setGroupForm({...groupForm, center_id: e.target.value})}
                      className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    >
                      <option value="">Select...</option>
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium h-[38px]"
                  >
                    Save
                  </button>
                </form>

                <h3 className="text-lg font-medium text-slate-900 mb-4">Group List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Group Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Center</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Clients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {groups.map(g => (
                        <tr key={g.id}>
                          <td className="px-6 py-4 text-sm text-slate-900">{g.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{g.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{g.center?.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                              {g.clients?.length || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupManagement;
