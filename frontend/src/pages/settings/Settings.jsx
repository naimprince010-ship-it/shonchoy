import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';

const Settings = () => {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSmsStatus();
  }, []);

  const fetchSmsStatus = async () => {
    try {
      const response = await axiosClient.get('/settings/sms-status');
      setSmsEnabled(response.data.enabled);
    } catch (error) {
      console.error('Failed to load SMS settings:', error);
      toast.error('Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSms = async () => {
    try {
      const newValue = !smsEnabled;
      const response = await axiosClient.put('/settings/sms-status', { enabled: newValue });
      setSmsEnabled(response.data.enabled);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Failed to update SMS settings:', error);
      toast.error('Failed to update SMS settings');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="w-8 h-8 text-primary-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-500">Manage global system configurations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-slate-500" />
            SMS Configuration
          </h2>
          
          <div className="flex items-center justify-between py-4 border-t border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Global SMS Status</p>
              <p className="text-sm text-slate-500 mt-1">
                Enable or disable all outgoing SMS (including disbursements, repayments, and reminders).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={smsEnabled}
                onChange={handleToggleSms}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
