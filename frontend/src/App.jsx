import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RegistrationDashboard from './pages/RegistrationDashboard';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-crm-bg font-sans overflow-hidden text-crm-textDark relative">
      {/* Sidebar overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto w-full">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8 pt-6">
          <RegistrationDashboard />
        </main>
      </div>
    </div>
  );
}

export default App;
