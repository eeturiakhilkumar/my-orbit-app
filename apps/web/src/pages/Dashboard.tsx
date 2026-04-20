import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  RefreshCw,
  ShoppingCart,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import logo from '../assets/logo.png';

const OverviewCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
    <div className={`p-2.5 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm">{label}</span>
  </button>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Bills':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-lg font-bold mb-3">Upcoming Bills</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Electricity Bill</p>
                    <p className="text-[11px] text-gray-500">Due in {i*3} days</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">${(i * 45.5).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Tickets':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-lg font-bold mb-3">Active Tickets</h3>
            <p className="text-sm text-gray-500 italic">No active support tickets.</p>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard title="Total Bills Due" value="$425.50" icon={Receipt} color="bg-red-500" />
            <OverviewCard title="Next Appointment" value="Tomorrow, 10 AM" icon={Calendar} color="bg-blue-500" />
            <OverviewCard title="Active Renewals" value="3 Pending" icon={RefreshCw} color="bg-green-500" />
            <OverviewCard title="Shopping Items" value="12 Items" icon={ShoppingCart} color="bg-purple-500" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:flex
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarOpen ? 'w-56' : 'w-20'}
        bg-white border-r border-gray-200 transition-all duration-300 flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <img src={logo} alt="Logo" className="w-7 h-7" />
          {isSidebarOpen && <span className="ml-3 text-lg font-bold text-gray-900 tracking-tight">My Orbit</span>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label={isSidebarOpen ? "Overview" : ""}
            active={activeTab === 'Overview'}
            onClick={() => { setActiveTab('Overview'); setMobileMenuOpen(false); }}
          />
          <SidebarItem
            icon={Receipt}
            label={isSidebarOpen ? "Bills" : ""}
            active={activeTab === 'Bills'}
            onClick={() => { setActiveTab('Bills'); setMobileMenuOpen(false); }}
          />
          <SidebarItem
            icon={Calendar}
            label={isSidebarOpen ? "Tickets" : ""}
            active={activeTab === 'Tickets'}
            onClick={() => { setActiveTab('Tickets'); setMobileMenuOpen(false); }}
          />
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden lg:block"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-900 leading-none">{auth.currentUser?.displayName || 'User'}</span>
              <span className="text-[10px] text-gray-500 mt-1">{auth.currentUser?.email || auth.currentUser?.phoneNumber}</span>
            </div>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-100">
              {auth.currentUser?.displayName?.[0] || auth.currentUser?.email?.[0] || 'U'}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back, {auth.currentUser?.displayName?.split(' ')[0] || 'User'}!</h2>
            <p className="text-xs sm:text-sm text-gray-500">Here's what's happening in your orbit today.</p>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
