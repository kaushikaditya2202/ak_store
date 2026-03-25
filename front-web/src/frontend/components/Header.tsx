import React from 'react';
import { Search, ShoppingCart, User as UserIcon, Clock, MapPin, Menu, ChevronRight, LayoutDashboard, Sun, Moon, LayoutGrid, MoreVertical, LogOut, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

interface HeaderProps {
  user: User | null;
  cartCount: number;
  cartTotal: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsCartOpen: (open: boolean) => void;
  setView: (view: any) => void;
  setAuthMode: (mode: any) => void;
  userAddresses: any[];
  selectedLocationId: number | null;
  setSelectedLocationId: (id: number | null) => void;
  setSelectedCategory: (id: number | null) => void;
  handleLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user, cartCount, cartTotal, searchQuery, setSearchQuery, handleSearch, setIsSidebarOpen, setIsCartOpen, setView, setAuthMode, userAddresses, selectedLocationId, setSelectedLocationId, setSelectedCategory, handleLogout
}) => {
  const [isAddrOpen, setIsAddrOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const selectedAddr = userAddresses.find(a => a.id === selectedLocationId);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAddrOpen(false);
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Suggestions logic with Ranking
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            const q = searchQuery.toLowerCase();
            const sorted = data.sort((a: any, b: any) => {
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();
              const aStarts = aName.startsWith(q);
              const bStarts = bName.startsWith(q);
              if (aStarts && !bStarts) return -1;
              if (!aStarts && bStarts) return 1;
              return aName.localeCompare(bName);
            });
            setSuggestions(sorted.slice(0, 10)); // Top 10 results
          }
        } catch (e) {
          console.error("Search error:", e);
        }
      } else {
        setSuggestions([]);
      }
    };

    const delayDebounceFn = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <>
      {/* Background Dimming Overlay */}
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
            onClick={() => setIsSearchFocused(false)}
          />
        )}
      </AnimatePresence>

      <header className={`sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${isSearchFocused ? 'shadow-2xl' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-8">

          {/* Logo & Location */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="flex flex-col">
              <div
                onClick={() => { setView('home'); setSelectedCategory(null); setSearchQuery(''); }}
                className="cursor-pointer group"
              >
                <h1 className="text-xl sm:text-2xl font-[1000] tracking-tighter italic leading-none flex items-center gap-1">
                  <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-lg border border-emerald-500/20">AK</span>
                  <span className="text-slate-900 dark:text-white">STORE</span>
                </h1>
              </div>

              {/* Delivery info like Zepto/Blinkit */}
              <div
                onClick={() => {
                  if (!user) setView('auth');
                  else if (userAddresses.length === 0) setView('profile');
                  else setIsAddrOpen(!isAddrOpen);
                }}
                className="flex items-center gap-1.5 mt-1 cursor-pointer group/loc"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-none flex items-center gap-1">
                    {user && selectedAddr ? (
                      <>
                        <span className="text-emerald-600">Delivering to {selectedAddr.name}</span>
                        <ChevronRight size={10} className={`transition-transform duration-300 ${isAddrOpen ? 'rotate-90' : 'rotate-0'}`} />
                      </>
                    ) : (
                      <span className="text-emerald-600">Superfast Delivery</span>
                    )}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[120px] sm:max-w-[180px]">
                    {user && selectedAddr ? selectedAddr.street_address : 'Super fast delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Dropdown */}
            <AnimatePresence>
              {isAddrOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-4 left-4 w-72 bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-2 z-[100] overflow-hidden"
                  ref={dropdownRef}
                >
                  <div className="p-4 border-b border-slate-50 dark:border-slate-800 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Select Delivery Location
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-hide py-1">
                    {userAddresses.map(addr => (
                      <button
                        key={addr.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocationId(addr.id);
                          setIsAddrOpen(false);
                        }}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group/item mb-1 ${selectedLocationId === addr.id
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                          }`}
                      >
                        <div className={`p-2.5 rounded-xl transition-all ${selectedLocationId === addr.id ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-950/40'}`}>
                          <MapPin size={16} fill={selectedLocationId === addr.id ? "currentColor" : "none"} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black truncate uppercase tracking-tight">{addr.name}</span>
                          <span className="text-[10px] font-bold opacity-70 truncate">{addr.street_address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 pt-1 border-t border-slate-50 dark:border-slate-800 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setView('profile'); setIsAddrOpen(false); }}
                      className="w-full p-3 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      + Add New Address
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar - More Prominent like Zepto/Blinkit */}
          <motion.form
            ref={searchRef}
            layout
            onSubmit={handleSearch}
            className="relative flex-1 group hidden sm:block"
          >
            <div className="relative">
              <input
                type="text"
                placeholder='Search for "milk", "eggs", "biscuits"...'
                className={`w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm font-medium ${isSearchFocused ? 'bg-white dark:bg-slate-800 ring-4 ring-emerald-500/10' : ''}`}
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearchFocused ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'}`} size={20} strokeWidth={2.5} />
            </div>

            {/* Suggestions Overlay */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full mt-3 left-0 right-0 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden z-[60]"
                >
                  <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-4">
                    {suggestions.length > 0 ? (
                      <div className="grid grid-cols-1 divide-y divide-slate-50 dark:divide-slate-800">
                        {suggestions.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSearchQuery(p.name);
                              setIsSearchFocused(false);
                              setTimeout(() => {
                                handleSearch({ preventDefault: () => { } } as any);
                              }, 10);
                            }}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-sm group-hover/item:scale-105 transition-transform border border-slate-100 dark:border-slate-800">
                                <img src={p.image} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-slate-800 dark:text-white group-hover/item:text-emerald-600 transition-colors uppercase tracking-tight italic">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">{p.unit}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-base font-black text-slate-900 dark:text-white italic tracking-tighter">₹{p.price}</p>
                              {p.mrp > p.price && (
                                <p className="text-[10px] text-slate-400 line-through font-bold">₹{p.mrp}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 px-6 text-center space-y-3">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-800 mx-auto">
                          <Search size={32} />
                        </div>
                        <p className="text-slate-400 font-black italic text-sm">No products found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* User & Cart Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-all border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center font-black text-xs uppercase shadow-sm border border-emerald-500/20">
                    {user.name[0]}
                  </div>
                  <span className="hidden lg:block text-[11px] font-black italic text-slate-700 dark:text-slate-200 uppercase tracking-tighter">{user.name.split(' ')[0]}</span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-4 w-52 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-2 z-[100] overflow-hidden"
                    >
                      <button onClick={() => { setIsUserMenuOpen(false); setView('profile'); }} className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition-all text-xs uppercase tracking-tight">
                        <UserIcon size={16} /> My Account
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => { setIsUserMenuOpen(false); setView('admin'); }} className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 font-bold transition-all text-xs uppercase tracking-tight">
                          <LayoutDashboard size={16} /> Admin Panel
                        </button>
                      )}
                      {(user?.role === 'executive' || user?.role === 'admin') && (
                        <button onClick={() => { setIsUserMenuOpen(false); setView('executive'); }} className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 font-bold transition-all text-xs uppercase tracking-tight">
                          <Package size={16} /> Fulfillment Hub
                        </button>
                      )}
                      <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500 font-extrabold transition-all text-xs uppercase tracking-tight">
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => { setView('auth'); setAuthMode('login'); }}
                className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
              >
                <UserIcon size={22} />
              </button>
            )}

            {/* Cart Button like Zepto */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="group relative bg-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <ShoppingCart size={18} fill="white" />
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[11px] sm:text-base font-black italic tracking-tighter whitespace-nowrap">
                  ₹{cartTotal}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                  {cartCount} Items
                </span>
              </div>
              <div className="hidden sm:block pl-2 border-l border-white/20">
                <ChevronRight size={14} strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar at bottom of header */}
        <div className="sm:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder='Search "chocolate", "milk", "bread"...'
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </form>
        </div>
      </header>
    </>
  );
};
