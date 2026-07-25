import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ClientForm = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nid_number: '',
    phone: '',
    address: '',
    guardian_name: '',
    group_id: ''
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axiosClient.get('/groups');
        setGroups(response.data);
      } catch (err) {
        console.error('Failed to fetch groups', err);
        setError('Failed to load groups. Please try again.');
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.nid_number || !formData.phone || !formData.address || !formData.guardian_name || !formData.group_id) {
      return 'All fields are required.';
    }
    
    // NID: Only digits, between 10 and 17 characters
    const nidRegex = /^[0-9]{10,17}$/;
    if (!nidRegex.test(formData.nid_number)) {
      return 'NID must contain only numbers and be between 10 and 17 digits.';
    }

    // Phone: Basic 11 digits validation (Bangladesh format)
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      return 'Phone number must be a valid 11-digit Bangladeshi number starting with 01.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axiosClient.post('/clients', formData);
      // Success redirect
      navigate('/clients', { replace: true });
    } catch (err) {
      console.error('Failed to create client', err);
      setError(err.response?.data?.error || 'Failed to create client. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Add New Client</h2>
        <Link to="/clients" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. Rahim Uddin"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <label htmlFor="nid_number" className="block text-sm font-medium text-slate-700">NID Number</label>
            <input
              type="text"
              name="nid_number"
              id="nid_number"
              value={formData.nid_number}
              onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="10, 13, or 17 digits"
            />
          </div>

          <div>
            <label htmlFor="guardian_name" className="block text-sm font-medium text-slate-700">Guardian/Father's Name</label>
            <input
              type="text"
              name="guardian_name"
              id="guardian_name"
              value={formData.guardian_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
          <textarea
            name="address"
            id="address"
            rows="3"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
        </div>

        <div>
          <label htmlFor="group_id" className="block text-sm font-medium text-slate-700">Group</label>
          <select
            name="group_id"
            id="group_id"
            value={formData.group_id}
            onChange={handleChange}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
          >
            <option value="">Select a Group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {groups.length === 0 && !error && (
            <p className="mt-2 text-xs text-slate-500">Loading groups or no groups available. Please create a group first.</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link
            to="/clients"
            className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {submitting ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
