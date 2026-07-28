import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Folders, FileText, PiggyBank, PieChart, Menu, X, LogOut, Settings, UserCog, History, Bell } from 'lucide-react';
import ChangePasswordModal from '../pages/users/ChangePasswordModal';
import axiosClient from '../api/axiosClient';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({ total: 0, overdue: [], pending_approvals: [] });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axiosClient.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { name: 'Clients', path: '/clients', icon: <Users className="w-5 h-5 mr-3" /> },
    { name: 'Groups & Centers', path: '/groups', icon: <Folders className="w-5 h-5 mr-3" /> },
    { name: 'Loans', path: '/loans', icon: <FileText className="w-5 h-5 mr-3" /> },
    { name: 'Savings', path: '/savings', icon: <PiggyBank className="w-5 h-5 mr-3" /> },
    { name: 'Reports', path: '/reports', icon: <PieChart className="w-5 h-5 mr-3" /> },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'User Management', path: '/users', icon: <UserCog className="w-5 h-5 mr-3" /> });
    navItems.push({ name: 'Activity Log', path: '/audit-logs', icon: <History className="w-5 h-5 mr-3" /> });
    navItems.push({ name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5 mr-3" /> });
  }

  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-800 px-4">
          <Folders className="w-8 h-8 mr-2 text-primary-500" />
          <span className="text-xl font-bold tracking-wider">MFI SYSTEM</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              end={item.path === '/'}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10 flex-shrink-0 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-full focus:outline-none transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.total > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
              
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {notifications.total} New
                    </span>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.total === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        No new notifications.
                      </div>
                    ) : (
                      <>
                        {notifications.overdue.length > 0 && (
                          <div className="py-2">
                            <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                              Overdue Installments
                            </div>
                            {notifications.overdue.map(notif => (
                              <Link 
                                key={notif.id}
                                to={`/loans/${notif.loan_id}`}
                                onClick={() => setIsNotificationOpen(false)}
                                className="block px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                              >
                                <p className="text-sm font-medium text-slate-800">{notif.message}</p>
                                <p className="text-xs text-red-600 font-semibold mt-1">Due: ৳{notif.amount}</p>
                              </Link>
                            ))}
                          </div>
                        )}
                        
                        {notifications.pending_approvals.length > 0 && (
                          <div className="py-2 border-t border-slate-100">
                            <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                              Pending Approvals
                            </div>
                            {notifications.pending_approvals.map(notif => (
                              <Link 
                                key={notif.id}
                                to={`/loans/${notif.loan_id}`}
                                onClick={() => setIsNotificationOpen(false)}
                                className="block px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                              >
                                <p className="text-sm font-medium text-slate-800">{notif.message}</p>
                                <p className="text-xs text-orange-600 font-semibold mt-1">Amount: ৳{notif.amount}</p>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary py-1.5 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </header>

        {isChangePasswordOpen && (
          <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
        )}

        {/* Scrollable Area */}
        <main key={location.pathname} className="flex-1 overflow-y-auto bg-slate-50 animate-fade-in">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
