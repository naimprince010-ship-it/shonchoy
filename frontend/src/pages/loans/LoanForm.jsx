import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const LoanForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledClientId = location.state?.client_id || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Client search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    client_id: prefilledClientId,
    loan_product_id: '',
    principal_amount: '',
  });

  // Fetch initial dependencies
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [productsRes, clientsRes] = await Promise.all([
          axiosClient.get('/loan-products'),
          prefilledClientId ? axiosClient.get(`/clients/${prefilledClientId}`) : Promise.resolve({ data: null })
        ]);
        
        setProducts(productsRes.data);
        if (clientsRes.data) {
          setSelectedClient(clientsRes.data);
        }
      } catch (err) {
        console.error('Failed to load dependencies', err);
        setError('Failed to load required data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [prefilledClientId]);

  // Handle client search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axiosClient.get(`/clients?search=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setSearchQuery('');
    setSearchResults([]);
    if (fieldErrors.client_id) setFieldErrors(prev => ({ ...prev, client_id: null }));
    setError(null);
  };

  const handleRemoveClient = () => {
    setSelectedClient(null);
    setFormData(prev => ({ ...prev, client_id: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    setError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.client_id) errors.client_id = 'Please select a client.';
    if (!formData.loan_product_id) errors.loan_product_id = 'Please select a loan product.';
    
    if (!formData.principal_amount) {
      errors.principal_amount = 'Principal amount is required.';
    } else {
      const amount = parseFloat(formData.principal_amount);
      if (isNaN(amount) || amount <= 0) {
        errors.principal_amount = 'Amount must be a positive number greater than 0.';
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
      await axiosClient.post('/loans', formData);
      toast.success('Loan application submitted successfully');
      navigate('/loans');
    } catch (err) {
      console.error('Submission failed', err);
      const backendError = err.response?.data?.error || 'Failed to submit loan application.';
      
      const lowerError = backendError.toLowerCase();
      if (lowerError.includes('client')) {
        setFieldErrors({ client_id: backendError });
      } else if (lowerError.includes('amount')) {
        setFieldErrors({ principal_amount: backendError });
      } else if (lowerError.includes('product')) {
        setFieldErrors({ loan_product_id: backendError });
      } else {
        setError(backendError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto card card-body">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">New Loan Application</h2>
        <Link to="/loans" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Client Selection Section */}
        <div className={`bg-slate-50 p-4 rounded-lg border ${fieldErrors.client_id ? 'border-red-300' : 'border-slate-200'}`}>
          <label className="label-text mb-2">Select Client</label>
          
          {selectedClient ? (
            <div className="flex items-center justify-between bg-white p-3 border border-blue-200 rounded-md shadow-sm">
              <div>
                <div className="font-medium text-slate-900">{selectedClient.name}</div>
                <div className="text-xs text-slate-500">NID: {selectedClient.nid_number} | Phone: {selectedClient.phone}</div>
              </div>
              <button 
                type="button" 
                onClick={handleRemoveClient}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Name or NID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`input-field ${fieldErrors.client_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {isSearching && <div className="absolute right-3 top-2.5 text-slate-400 text-sm">Searching...</div>}
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-slate-200 max-h-60 overflow-y-auto">
                  {searchResults.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <div className="font-medium text-sm text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">NID: {client.nid_number} | Phone: {client.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {fieldErrors.client_id && <p className="mt-1 text-sm text-red-600">{fieldErrors.client_id}</p>}
        </div>

        {/* Loan Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label-text">Loan Product</label>
            <select
              name="loan_product_id"
              value={formData.loan_product_id}
              onChange={handleChange}
              className={`input-field mt-1 ${fieldErrors.loan_product_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.interest_rate * 100}% {p.interest_method})</option>
              ))}
            </select>
            {fieldErrors.loan_product_id && <p className="mt-1 text-sm text-red-600">{fieldErrors.loan_product_id}</p>}
          </div>

          <div>
            <label className="label-text">Principal Amount (৳)</label>
            <input
              type="number"
              name="principal_amount"
              value={formData.principal_amount}
              onChange={handleChange}
              className={`input-field mt-1 ${fieldErrors.principal_amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g. 15000"
            />
            {fieldErrors.principal_amount && <p className="mt-1 text-sm text-red-600">{fieldErrors.principal_amount}</p>}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link
            to="/loans"
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !selectedClient}
            className="btn-primary inline-flex justify-center items-center"
          >
            {submitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
