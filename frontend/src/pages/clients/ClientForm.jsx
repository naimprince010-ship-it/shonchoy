import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const ClientForm = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
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
    // Clear field error on typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    // Also clear general error if any
    setError(null);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.guardian_name.trim()) errors.guardian_name = 'Guardian name is required';
    if (!formData.group_id) errors.group_id = 'Group is required';
    
    // NID: Only digits, between 10 and 17 characters
    if (!formData.nid_number) {
      errors.nid_number = 'NID number is required';
    } else {
      const nidRegex = /^[0-9]{10,17}$/;
      if (!nidRegex.test(formData.nid_number)) {
        errors.nid_number = 'NID must be 10 to 17 digits';
      }
    }

    // Phone: Basic 11 digits validation (Bangladesh format)
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Must be a valid 11-digit BD number (e.g. 017...)';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});
      await axiosClient.post('/clients', formData);
      toast.success('Client created successfully');
      navigate('/clients', { replace: true });
    } catch (err) {
      console.error('Failed to create client', err);
      const backendError = err.response?.data?.error || 'Failed to create client. Please try again.';
      
      // Robust mapping of backend errors to fields
      const lowerError = backendError.toLowerCase();
      if (lowerError.includes('nid')) {
        setFieldErrors({ nid_number: backendError });
      } else if (lowerError.includes('phone')) {
        setFieldErrors({ phone: backendError });
      } else {
        setError(backendError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto card card-body">
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
            <label htmlFor="name" className="label-text">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field mt-1 ${fieldErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g. Rahim Uddin"
            />
            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="label-text">Phone Number</label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`input-field mt-1 ${fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="01XXXXXXXXX"
            />
            {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="nid_number" className="label-text">NID Number</label>
            <input
              type="text"
              name="nid_number"
              id="nid_number"
              value={formData.nid_number}
              onChange={handleChange}
              className={`input-field mt-1 ${fieldErrors.nid_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="10, 13, or 17 digits"
            />
            {fieldErrors.nid_number && <p className="mt-1 text-sm text-red-600">{fieldErrors.nid_number}</p>}
          </div>

          <div>
            <label htmlFor="guardian_name" className="label-text">Guardian/Father's Name</label>
            <input
              type="text"
              name="guardian_name"
              id="guardian_name"
              value={formData.guardian_name}
              onChange={handleChange}
              className={`input-field mt-1 ${fieldErrors.guardian_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldErrors.guardian_name && <p className="mt-1 text-sm text-red-600">{fieldErrors.guardian_name}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="label-text">Address</label>
          <textarea
            name="address"
            id="address"
            rows="3"
            value={formData.address}
            onChange={handleChange}
            className={`input-field mt-1 ${fieldErrors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          ></textarea>
          {fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
        </div>

        <div>
          <label htmlFor="group_id" className="label-text">Group</label>
          <select
            name="group_id"
            id="group_id"
            value={formData.group_id}
            onChange={handleChange}
            className={`input-field mt-1 ${fieldErrors.group_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          >
            <option value="">Select a Group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {fieldErrors.group_id && <p className="mt-1 text-sm text-red-600">{fieldErrors.group_id}</p>}
          {groups.length === 0 && !error && (
            <p className="mt-2 text-xs text-slate-500">Loading groups or no groups available. Please create a group first.</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link
            to="/clients"
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex justify-center items-center"
          >
            {submitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitting ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
