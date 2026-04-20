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
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
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
  const [isSidebarOpen, setSidebarOpen] = useState(true);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center space-x-3">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          {isSidebarOpen && <span className="text-xl font-bold text-gray-900">My Orbit</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            label={isSidebarOpen ? "Overview" : ""}
            active={activeTab === 'Overview'}
            onClick={() => setActiveTab('Overview')}
          />
          <SidebarItem
            icon={Receipt}
            label={isSidebarOpen ? "Bills" : ""}
            active={activeTab === 'Bills'}
            onClick={() => setActiveTab('Bills')}
          />
          <SidebarItem
            icon={Calendar}
            label={isSidebarOpen ? "Tickets" : ""}
            active={activeTab === 'Tickets'}
            onClick={() => setActiveTab('Tickets')}
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">{auth.currentUser?.displayName || 'User'}</span>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
              {auth.currentUser?.displayName?.[0] || 'U'}
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {auth.currentUser?.displayName?.split(' ')[0] || 'User'}!</h2>
            <p className="text-gray-500">Here's what's happening in your orbit today.</p>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
