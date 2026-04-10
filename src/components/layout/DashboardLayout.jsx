import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import InsightsPanel from './InsightsPanel';
import GlobalFloatingAssistant from './GlobalFloatingAssistant';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            SmartBank AI
          </h1>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <InsightsPanel score={78} />
      <GlobalFloatingAssistant />
    </div>
  );
};

export default DashboardLayout;
