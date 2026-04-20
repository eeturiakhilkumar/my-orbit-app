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
  <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-2.5 rounded-lg ${color} shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{title}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Bills':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold mb-4">Upcoming Bills</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b last:border-0">
                  <div>
                    <p className="font-semibold">Electricity Bill</p>
                    <p className="text-sm text-gray-500">Due in {i*3} days</p>
                  </div>
                  <p className="font-bold text-red-600">${(i * 45.5).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Tickets':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold mb-4">Active Tickets</h3>
            <p className="text-gray-500 italic">No active support tickets.</p>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <OverviewCard title="Total Bills Due" value="$425.50" icon={Receipt} color="bg-red-500" />
            <OverviewCard title="Next Appointment" value="Tomorrow, 10 AM" icon={Calendar} color="bg-blue-500" />
            <OverviewCard title="Active Renewals" value="3 Pending" icon={RefreshCw} color="bg-green-500" />
            <OverviewCard title="Shopping Items" value="12 Items" icon={ShoppingCart} color="bg-purple-500" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900">My Orbit</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            active={activeTab === 'Overview'}
            onClick={() => { setActiveTab('Overview'); setSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Receipt}
            label="Bills"
            active={activeTab === 'Bills'}
            onClick={() => { setActiveTab('Bills'); setSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Calendar}
            label="Tickets"
            active={activeTab === 'Tickets'}
            onClick={() => { setActiveTab('Tickets'); setSidebarOpen(false); }}
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 lg:hidden">My Orbit</h1>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-sm font-medium text-gray-700">{auth.currentUser?.displayName || 'User'}</span>
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {auth.currentUser?.displayName?.[0] || 'U'}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome back, {auth.currentUser?.displayName?.split(' ')[0] || 'User'}!
            </h2>
            <p className="text-sm sm:text-base text-gray-500">Here's what's happening in your orbit today.</p>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
