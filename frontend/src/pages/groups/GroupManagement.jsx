import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

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

  const [branchErrors, setBranchErrors] = useState({});
  const [centerErrors, setCenterErrors] = useState({});
  const [groupErrors, setGroupErrors] = useState({});

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
    const errors = {};
    if (!branchForm.name.trim()) errors.name = 'Name is required';
    if (!branchForm.address.trim()) errors.address = 'Address is required';
    if (Object.keys(errors).length > 0) {
      setBranchErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axiosClient.post('/branches', branchForm);
      setBranchForm({ name: '', address: '' });
      setBranchErrors({});
      toast.success('Branch created successfully');
      fetchData(); // Refresh all
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCenterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!centerForm.name.trim()) errors.name = 'Name is required';
    if (!centerForm.branch_id) errors.branch_id = 'Branch is required';
    if (!centerForm.meeting_day) errors.meeting_day = 'Meeting day is required';
    if (Object.keys(errors).length > 0) {
      setCenterErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axiosClient.post('/centers', centerForm);
      setCenterForm({ name: '', branch_id: '', meeting_day: 'MONDAY', field_officer_id: '' });
      setCenterErrors({});
      toast.success('Center created successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!groupForm.name.trim()) errors.name = 'Name is required';
    if (!groupForm.center_id) errors.center_id = 'Center is required';
    if (Object.keys(errors).length > 0) {
      setGroupErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axiosClient.post('/groups', groupForm);
      setGroupForm({ name: '', center_id: '' });
      setGroupErrors({});
      toast.success('Group created successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {['branches', 'centers', 'groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
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
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-slate-100 rounded-lg w-full"></div>
            <div className="h-64 bg-slate-100 rounded-lg w-full"></div>
          </div>
        ) : (
          <>
            {activeTab === 'branches' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add Branch</h3>
                <form onSubmit={handleBranchSubmit} className="flex flex-col md:flex-row gap-4 md:items-start mb-8 bg-slate-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <label className="label-text">Name</label>
                    <input
                      type="text"
                      value={branchForm.name}
                      onChange={e => {
                        setBranchForm({...branchForm, name: e.target.value});
                        if (branchErrors.name) setBranchErrors(p => ({...p, name: null}));
                      }}
                      className={`input-field mt-1 ${branchErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g. Dhaka Main"
                    />
                    {branchErrors.name && <p className="mt-1 text-sm text-red-600">{branchErrors.name}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="label-text">Address</label>
                    <input
                      type="text"
                      value={branchForm.address}
                      onChange={e => {
                        setBranchForm({...branchForm, address: e.target.value});
                        if (branchErrors.address) setBranchErrors(p => ({...p, address: null}));
                      }}
                      className={`input-field mt-1 ${branchErrors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {branchErrors.address && <p className="mt-1 text-sm text-red-600">{branchErrors.address}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary h-[38px] mt-6 flex items-center"
                  >
                    {submitting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {submitting ? 'Saving' : 'Save'}
                  </button>
                </form>

                <h3 className="text-lg font-medium text-slate-900 mb-4">Branch List</h3>
                <div className="table-container overflow-x-auto">
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
                      {branches.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <h3 className="text-sm font-medium text-slate-900 mb-1">No branches found</h3>
                              <p className="text-sm text-slate-500">Create your first branch using the form above.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        branches.map(b => (
                          <tr key={b.id}>
                            <td className="px-6 py-4 text-sm text-slate-900">{b.id}</td>
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{b.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{b.address}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{b.centers?.length || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'centers' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add Center</h3>
                <form onSubmit={handleCenterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-8 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <label className="label-text">Name</label>
                    <input
                      type="text"
                      value={centerForm.name}
                      onChange={e => {
                        setCenterForm({...centerForm, name: e.target.value});
                        if (centerErrors.name) setCenterErrors(p => ({...p, name: null}));
                      }}
                      className={`input-field mt-1 ${centerErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {centerErrors.name && <p className="mt-1 text-sm text-red-600">{centerErrors.name}</p>}
                  </div>
                  <div>
                    <label className="label-text">Branch</label>
                    <select
                      value={centerForm.branch_id}
                      onChange={e => {
                        setCenterForm({...centerForm, branch_id: e.target.value});
                        if (centerErrors.branch_id) setCenterErrors(p => ({...p, branch_id: null}));
                      }}
                      className={`input-field mt-1 ${centerErrors.branch_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="">Select...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {centerErrors.branch_id && <p className="mt-1 text-sm text-red-600">{centerErrors.branch_id}</p>}
                  </div>
                  <div>
                    <label className="label-text">Field Officer (Optional)</label>
                    <select
                      value={centerForm.field_officer_id}
                      onChange={e => setCenterForm({...centerForm, field_officer_id: e.target.value})}
                      className="input-field mt-1"
                    >
                      <option value="">None</option>
                      {fieldOfficers.map(fo => <option key={fo.id} value={fo.id}>{fo.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="label-text">Meeting</label>
                      <select
                        value={centerForm.meeting_day}
                        onChange={e => {
                          setCenterForm({...centerForm, meeting_day: e.target.value});
                          if (centerErrors.meeting_day) setCenterErrors(p => ({...p, meeting_day: null}));
                        }}
                        className={`input-field mt-1 ${centerErrors.meeting_day ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      >
                        {['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      {centerErrors.meeting_day && <p className="mt-1 text-sm text-red-600">{centerErrors.meeting_day}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary h-[38px] mt-6 flex items-center"
                    >
                      {submitting && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {submitting ? 'Saving' : 'Save'}
                    </button>
                  </div>
                </form>

                <h3 className="text-lg font-medium text-slate-900 mb-4">Center List</h3>
                <div className="table-container overflow-x-auto">
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
                      {centers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <h3 className="text-sm font-medium text-slate-900 mb-1">No centers found</h3>
                              <p className="text-sm text-slate-500">Create your first center using the form above.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        centers.map(c => (
                          <tr key={c.id}>
                            <td className="px-6 py-4 text-sm text-slate-900">{c.id}</td>
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{c.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{c.branch?.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{c.field_officer?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{c.meeting_day}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add Group</h3>
                <form onSubmit={handleGroupSubmit} className="flex flex-col md:flex-row gap-4 md:items-start mb-8 bg-slate-50 p-4 rounded-lg max-w-2xl">
                  <div className="flex-1">
                    <label className="label-text">Group Name</label>
                    <input
                      type="text"
                      value={groupForm.name}
                      onChange={e => {
                        setGroupForm({...groupForm, name: e.target.value});
                        if (groupErrors.name) setGroupErrors(p => ({...p, name: null}));
                      }}
                      className={`input-field mt-1 ${groupErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {groupErrors.name && <p className="mt-1 text-sm text-red-600">{groupErrors.name}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="label-text">Center</label>
                    <select
                      value={groupForm.center_id}
                      onChange={e => {
                        setGroupForm({...groupForm, center_id: e.target.value});
                        if (groupErrors.center_id) setGroupErrors(p => ({...p, center_id: null}));
                      }}
                      className={`input-field mt-1 ${groupErrors.center_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="">Select...</option>
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {groupErrors.center_id && <p className="mt-1 text-sm text-red-600">{groupErrors.center_id}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary h-[38px] mt-6 flex items-center"
                  >
                    {submitting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {submitting ? 'Saving' : 'Save'}
                  </button>
                </form>

                <h3 className="text-lg font-medium text-slate-900 mb-4">Group List</h3>
                <div className="table-container overflow-x-auto">
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
                      {groups.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <h3 className="text-sm font-medium text-slate-900 mb-1">No groups found</h3>
                              <p className="text-sm text-slate-500">Create your first group using the form above.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        groups.map(g => (
                          <tr key={g.id}>
                            <td className="px-6 py-4 text-sm text-slate-900">{g.id}</td>
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{g.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{g.center?.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              <span className="badge badge-disbursed">
                                {g.clients?.length || 0}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
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
