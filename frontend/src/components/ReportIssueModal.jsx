import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function ReportIssueModal({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/feedback`, { message }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Issue reported successfully. Thank you!');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Submit issue error:', error);
      toast.error('Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Report an Issue</h2>
          <p className="text-sm text-gray-600 mb-4">
            Describe the problem or issue you are facing. This will be sent directly to the system administrators.
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
              placeholder="e.g. I couldn't save the cash transaction for client X..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            ></textarea>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
