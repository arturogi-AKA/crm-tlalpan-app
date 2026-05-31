import React from 'react';
import { Home, Menu } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="px-4 md:px-8 py-6 flex justify-between items-center bg-transparent relative z-0">
      <div className="flex items-center space-x-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden w-10 h-10 rounded-xl bg-white text-crm-sidebar flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-xl md:text-[28px] font-bold text-crm-sidebar tracking-tight leading-tight">¡Hola, Bienvenido!</h2>
          <p className="text-crm-textGray text-xs md:text-sm mt-0.5">Inicia el camino para crecer tu patrimonio</p>
        </div>
      </div>

      <div className="flex items-center">
        <button className="w-10 h-10 rounded-full bg-white text-gray-400 flex items-center justify-center shadow-sm hover:text-crm-sidebar hover:shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer">
          <Home size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
