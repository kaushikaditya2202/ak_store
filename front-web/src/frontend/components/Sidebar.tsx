import React from 'react';
import { X, Zap, LayoutGrid, ChevronRight, Sparkles, LogOut } from 'lucide-react';
import { Category, User } from '../../types';

interface SidebarProps {
  categories: Category[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  user: User | null;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories, selectedCategory, setSelectedCategory, isSidebarOpen, setIsSidebarOpen, user, handleLogout
}) => {
  const rootCategories = categories.filter(c => !c.parent_id);
  const selectedCatObj = categories.find(c => c.id === selectedCategory);
  const parentCat = selectedCatObj?.parent_id ? categories.find(c => c.id === selectedCatObj.parent_id) : selectedCatObj;
  const orderedRootCategories = parentCat
    ? [
        ...rootCategories.filter(c => c.id === parentCat.id),
        ...rootCategories.filter(c => c.id !== parentCat.id),
      ]
    : rootCategories;

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 lg:bg-transparent lg:relative lg:z-0 lg:w-64
        transform transition-all duration-500 ease-out
        ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100'}
        border-r lg:border-none border-slate-100 dark:border-slate-800
      `}>
        <div className="h-full flex flex-col p-6 lg:p-0">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white">
              AK <span className="text-emerald-600">STORE</span>
            </h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto scrollbar-hide flex-1">
            <div className="space-y-4 pt-2">
              <p className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Explore Categories</p>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-x-2 gap-y-4 lg:gap-y-2 px-2">
                <button
                  onClick={() => { setSelectedCategory(0); setIsSidebarOpen(false); window.dispatchEvent(new CustomEvent('navTo', { detail: 'categories' })); }}
                  className={`flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 p-1 lg:p-2 lg:px-4 rounded-2xl transition-all ${selectedCategory === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-100 dark:ring-emerald-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="w-14 h-14 lg:w-10 lg:h-10 rounded-2xl lg:rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <Zap size={20} className={selectedCategory === 0 ? 'text-emerald-600' : 'text-slate-400'} fill={selectedCategory === 0 ? "currentColor" : "none"} />
                  </div>
                  <span className={`text-[7px] lg:text-sm font-black lg:font-bold text-center lg:text-left leading-[1.1] uppercase lg:normal-case tracking-tighter lg:tracking-tight line-clamp-2 px-0.5 ${selectedCategory === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 lg:text-slate-600 dark:lg:text-slate-400'}`}>
                    All Products
                  </span>
                </button>
                {orderedRootCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setIsSidebarOpen(false); }}
                    className={`flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 p-1 lg:p-2 lg:px-4 rounded-2xl transition-all ${selectedCategory === cat.id ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-100 dark:ring-emerald-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="w-14 h-14 lg:w-10 lg:h-10 rounded-2xl lg:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                      {cat.image_url ? (
                        <img src={cat.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                          <LayoutGrid size={20} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <span className={`text-[7px] lg:text-sm font-black lg:font-bold text-center lg:text-left leading-[1.1] uppercase lg:normal-case tracking-tighter lg:tracking-tight line-clamp-2 px-0.5 ${selectedCategory === cat.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 lg:text-slate-600 dark:lg:text-slate-400'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 lg:hidden">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Support</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Need help with your order?</p>
              <button className="mt-3 w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 rounded-xl text-xs font-black shadow-sm mb-2">Contact Us</button>

              {user && (
                <button
                  onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/10 text-rose-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/20 transition-all active:scale-95"
                >
                  <LogOut size={14} /> Logout Account
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
