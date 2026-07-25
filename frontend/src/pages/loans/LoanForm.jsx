import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const LoanForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledClientId = location.state?.client_id || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
  };

  const handleRemoveClient = () => {
    setSelectedClient(null);
    setFormData(prev => ({ ...prev, client_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.loan_product_id || !formData.principal_amount) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axiosClient.post('/loans', formData);
      navigate('/loans');
    } catch (err) {
      console.error('Submission failed', err);
      setError(err.response?.data?.error || 'Failed to submit loan application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
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
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Client</label>
          
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
                className="w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
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
        </div>

        {/* Loan Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Loan Product</label>
            <select
              required
              value={formData.loan_product_id}
              onChange={e => setFormData({...formData, loan_product_id: e.target.value})}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.interest_rate * 100}% {p.interest_method})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Principal Amount (৳)</label>
            <input
              type="number"
              required
              min="1000"
              value={formData.principal_amount}
              onChange={e => setFormData({...formData, principal_amount: e.target.value})}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. 15000"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link
            to="/loans"
            className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !selectedClient}
            className={`inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              (submitting || !selectedClient) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
