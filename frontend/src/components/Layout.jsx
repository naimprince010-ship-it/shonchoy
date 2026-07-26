import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Folders, FileText, PiggyBank, PieChart, Menu, X, LogOut, Settings } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
            <button
              onClick={handleLogout}
              className="btn-secondary py-1.5 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </header>

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
