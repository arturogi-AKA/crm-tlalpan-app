import { 
  LayoutGrid, 
  ClipboardList, 
  BarChart2, 
  Users, 
  Clock, 
  Star, 
  Share2, 
  HelpCircle, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: 'Programar Mi Cita', icon: <LayoutGrid size={20} />, active: true },
    { name: 'Si Estoy Animado', icon: <ClipboardList size={20} /> },
    { name: 'Mi Expediente', icon: <Users size={20} /> },
    { name: 'Apartado ¡Casi Nulo!', icon: <Clock size={20} /> },
    { name: '¡Por Fin, Lo Logré!', icon: <Star size={20} /> },
  ];



  return (
    <div className={`fixed inset-y-0 left-0 z-30 md:relative md:flex w-[280px] bg-crm-sidebar text-white flex flex-col h-full rounded-tr-[40px] rounded-br-[40px] shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-8 pt-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">Mi Espacio de Compra</h1>
        <button 
          onClick={toggleSidebar} 
          className="md:hidden text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4 custom-scrollbar">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href="#"
            className={`flex items-center space-x-4 px-6 py-3.5 rounded-xl transition-all duration-300 font-medium text-sm ${
              item.active 
                ? 'bg-crm-sidebarActive/20 text-white shadow-sm' 
                : 'text-gray-400 hover:text-white hover:bg-crm-sidebarHover'
            }`}
          >
            <span className={item.active ? 'text-crm-sidebarActive' : ''}>
              {item.icon}
            </span>
            <span>{item.name}</span>
          </a>
        ))}


      </nav>

      {/* Tarjeta Promocional Inferior */}
      <div className="p-6 pb-8">
        <div className="bg-gradient-to-br from-[#6A5AF9] to-[#D087E3] rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
          <h3 className="text-[15px] font-bold text-white mb-4 relative z-10 leading-snug">¿Tienes alguna duda o inquietud?</h3>
          <button className="bg-white text-crm-sidebar w-full py-3.5 rounded-xl text-xs font-extrabold shadow-md hover:bg-gray-50 transition-all duration-300 transform active:scale-95 relative z-10">
            Quiero Consultar Algo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
