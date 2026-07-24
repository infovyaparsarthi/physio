import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarCheck, Users, CreditCard, BarChart2, MessageSquare, Building2, Plus } from 'lucide-react';
import { useAppStore } from '../store/AppContext';

export default function BottomNavigation() {
  const { user } = useAppStore();
  const isAdmin = user?.isAdmin === 1;
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Primary Items
  const leftItem = { path: '/dashboard', label: 'Home', Icon: Home };
  const rightItem = { path: '/reports', label: 'Reports', Icon: BarChart2 };

  // Menu Items
  const menuItems = useMemo(() => {
    const items = [
      { path: '/attendance', label: 'Attend', Icon: CalendarCheck },
      { path: '/patients', label: 'Patients', Icon: Users },
      { path: '/enquiries', label: 'Enquiry', Icon: MessageSquare },
    ];
    if (isAdmin) {
      items.push({ path: '/payments', label: 'Payments', Icon: CreditCard });
      items.push({ path: '/companies', label: 'Companies', Icon: Building2 });
    }
    return items;
  }, [isAdmin]);

  // Calculate arc positions
  const radius = 110; // px
  const startAngle = menuItems.length > 2 ? 165 : 135;
  const endAngle = menuItems.length > 2 ? 15 : 45;
  
  const getTransform = (index) => {
    const total = menuItems.length;
    const angleRange = startAngle - endAngle;
    const step = total > 1 ? angleRange / (total - 1) : 0;
    const angleDeg = startAngle - (index * step);
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // x = r * cos(theta), y = -r * sin(theta)
    const x = radius * Math.cos(angleRad);
    const y = -radius * Math.sin(angleRad);
    return `translate(${x}px, ${y}px) scale(1)`;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-white/70 backdrop-blur-[2px] z-40"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Main Nav Container */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-50 pointer-events-none">
        
        {/* Semi-circle menu items */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex justify-center items-end pointer-events-none">
          {menuItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`absolute w-[60px] h-[60px] rounded-full shadow-card-hover flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              style={({ isActive }) => ({
                transform: isOpen ? getTransform(index) : 'translate(0px, 20px) scale(0.3)',
                transitionDelay: isOpen ? `${index * 0.04}s` : '0s',
                backgroundColor: isActive ? '#0f766e' : '#ffffff',
                color: isActive ? '#ffffff' : '#4b5563',
                border: isActive ? 'none' : '1px solid #f3f4f6'
              })}
            >
              {({ isActive }) => (
                <>
                  <item.Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5" />
                  <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Bar Background */}
        <div className="bg-white border-t border-gray-100 px-8 py-2 pb-4 flex items-center justify-between pointer-events-auto rounded-t-3xl" style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.05)' }}>
          
          {/* Left Item */}
          <NavLink to={leftItem.path} className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1 transition-colors w-16 ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {({ isActive }) => (
              <>
                <leftItem.Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{leftItem.label}</span>
              </>
            )}
          </NavLink>

          {/* Center FAB Button */}
          <div className="relative -top-8">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-16 h-16 rounded-full shadow-card-hover flex items-center justify-center text-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-4 border-white ${isOpen ? 'bg-danger-500 rotate-[135deg]' : 'bg-primary-600 hover:bg-primary-700 hover:scale-105'}`}
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>
          </div>

          {/* Right Item */}
          <NavLink to={rightItem.path} className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1 transition-colors w-16 ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {({ isActive }) => (
              <>
                <rightItem.Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{rightItem.label}</span>
              </>
            )}
          </NavLink>

        </div>
      </nav>
    </>
  );
}
