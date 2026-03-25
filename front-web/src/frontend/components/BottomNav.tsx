import React from 'react';
import { Zap, LayoutGrid, User as UserIcon, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { User } from '../../types';

interface BottomNavProps {
  view: string;
  setView: (view: any) => void;
  user: User | null;
  setIsSidebarOpen: (open: boolean) => void;
  setSelectedCategory: (id: number | null) => void;
  cartCount?: number;
  openCart?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  view, setView, user, setIsSidebarOpen, setSelectedCategory, cartCount = 0, openCart
}) => {
  const handleCategoriesClick = () => {
    setView('categories');
    setSelectedCategory(null);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-around z-40">
      <button 
        onClick={() => { setView('home'); setSelectedCategory(null); window.scrollTo({top: 0, behavior: 'smooth'}); }}
        className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <Zap size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
      </button>
      <button 
        onClick={handleCategoriesClick}
        className={`flex flex-col items-center gap-1 transition-colors ${view === 'categories' ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <LayoutGrid size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Categories</span>
      </button>
      
      <button 
        onClick={openCart}
        className={`flex flex-col items-center gap-1 relative text-slate-400 active:scale-95 transition-all`}
      >
        <div className="relative">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
      </button>

      {user?.role === 'admin' ? (
        <button 
          onClick={() => setView('admin')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
        </button>
      ) : (
        <button 
          onClick={() => user ? setView('profile') : setView('auth')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'profile' || view === 'auth' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <UserIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
        </button>
      )}
    </div>
  );
};
