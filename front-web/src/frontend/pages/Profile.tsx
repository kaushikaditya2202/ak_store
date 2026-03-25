import React, { useState, useEffect } from 'react';
import { Package, LogOut, LayoutDashboard, ArrowLeft, Trash2, Plus, Sun, Moon, Monitor, ChevronDown, ChevronUp, Clock, MapPin, ReceiptText, Receipt } from 'lucide-react';
import { User, Order } from '../../types';
import { InvoiceModal } from '../components/InvoiceModal';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface ProfileProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setView: (view: any) => void;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  userAddresses: any[];
  fetchUserAddresses: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, setUser, setView, themeMode, setThemeMode, userAddresses, fetchUserAddresses }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive primary address from user object
  const hasPrimaryAddress = user?.street_address && user?.city;
  const primaryAddress = hasPrimaryAddress ? {
    id: 'primary',
    name: 'Primary Address',
    street_address: user?.street_address,
    city: user?.city,
    state: user?.state,
    pincode: user?.pincode,
    landmark: user?.landmark
  } : null;

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': user?.token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('currentView');
    localStorage.removeItem('adminTab');
    setView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-24">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-4 sticky top-0 z-40">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-black text-sm hover:gap-3 transition-all">
          <ArrowLeft size={18} strokeWidth={3} />
          <span className="uppercase tracking-widest italic">Return to Store</span>
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10">
        {/* User Profile Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all hover:shadow-emerald-500/5 group">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors duration-700"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] text-white flex items-center justify-center text-2xl md:text-4xl font-black shadow-xl shadow-emerald-500/30 transform transition-transform duration-500 hover:rotate-6">
                {user?.name[0]}
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none mb-1 md:mb-2">{user?.name}</h2>
                <div className="space-y-1">
                  <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {user?.email}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {user?.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setView('admin')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-700 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <LayoutDashboard size={14} /> Admin
                </button>
              )}
              {(user?.role === 'executive' || user?.role === 'admin') && (
                <button
                  onClick={() => setView('executive')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-700 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Package size={14} /> Executive
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-5 py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-all border border-slate-100 dark:border-slate-700/50"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appearance Selection */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all h-fit">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Sun size={14} strokeWidth={2.5} /> Appearance Mode
            </h3>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-3xl border-2 transition-all duration-300 ${themeMode === mode
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 grayscale opacity-60'
                    }`}
                >
                  <div className={`p-3 rounded-2xl transition-all ${themeMode === mode ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-transparent'}`}>
                    {mode === 'light' && <Sun size={20} />}
                    {mode === 'dark' && <Moon size={20} />}
                    {mode === 'system' && <Monitor size={20} />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tighter">{mode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Addresses Section */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <MapPin size={14} strokeWidth={2.5} /> Delivery Addresses
              </h3>
              <button
                onClick={() => setShowAddrForm(!showAddrForm)}
                className={`p-2 rounded-xl transition-all ${showAddrForm ? 'bg-rose-50 text-rose-500 rotate-45' : 'bg-emerald-50 text-emerald-600 hover:scale-110'}`}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-3">
              {/* All Saved Addresses (including virtual signup address) */}
              {userAddresses.map((addr: any) => (
                <div key={addr.id} className={`p-4 rounded-[1.5rem] border relative group transition-all ${addr.id === 0 ? 'border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/20 hover:border-emerald-500/30'}`}>
                  {addr.id === 0 && <div className="absolute -right-2 -top-2 px-3 py-1 bg-emerald-600 text-[8px] font-black text-white rounded-bl-xl uppercase tracking-tighter transform rotate-3"></div>}
                  <p className="font-black text-slate-800 dark:text-white text-sm mb-1 italic">{addr.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                    {addr.street_address}<br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  {addr.id !== 0 && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete this address?')) {
                          const res = await fetch(`/api/user/addresses/${addr.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': user?.token || '' }
                          });
                          if (res.ok) fetchUserAddresses();
                        }
                      }}
                      className="absolute bottom-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

              {userAddresses.length === 0 && !showAddrForm && (
                <p className="text-center py-6 text-slate-400 font-bold text-xs italic opacity-60">No addresses saved yet.</p>
              )}
            </div>

            {showAddrForm && (
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                try {
                  const res = await fetch('/api/user/addresses', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': user?.token || ''
                    },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    setShowAddrForm(false);
                    fetchUserAddresses();
                  } else {
                    const err = await res.json();
                    alert(err.detail || 'Failed to save address');
                  }
                } catch (err) {
                  alert('Network error while saving address');
                }
              }} className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-950/50 border border-emerald-500/10 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-3 tracking-widest">Type</label>
                    <input name="name" placeholder="Home / Office" required className="w-full px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-900 dark:text-white text-xs font-bold shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-3 tracking-widest">Address</label>
                    <input name="street_address" placeholder="Building/Street" required className="w-full px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-900 dark:text-white text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input name="city" placeholder="City" required className="w-full px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-900 dark:text-white text-xs font-bold shadow-sm" />
                    <input name="state" placeholder="State" required className="w-full px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-900 dark:text-white text-xs font-bold shadow-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input name="pincode" placeholder="Pincode" required className="w-full px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-900 dark:text-white text-xs font-bold shadow-sm" />
                    <input name="landmark" placeholder="Landmark" className="w-full px-4 py-2.5 rounded-xl border-none bg-white dark:bg-slate-900 dark:text-white text-xs font-bold shadow-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 text-[10px] uppercase tracking-widest transition-all">Save</button>
                  <button type="button" onClick={() => setShowAddrForm(false)} className="px-5 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Order History Implementation */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic tracking-tighter">
              <Package size={24} className="text-emerald-500" /> Recent Transactions
            </h3>
            <button onClick={fetchOrders} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all border border-emerald-100 dark:border-emerald-900/50">Refresh</button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Synchronizing Orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-dashed border-slate-100 dark:border-slate-800 text-center space-y-5">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                  <ReceiptText size={28} />
                </div>
                <div>
                  <p className="text-slate-400 font-black text-sm italic">You haven't placed any orders yet.</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Start filling your cart now</p>
                </div>
                <button onClick={() => setView('home')} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/20">Go Shopping</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group transition-all">
                  <div
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 md:p-3 rounded-2xl ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] md:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">INV-0{order.id}</p>
                        <div className="flex items-center gap-2 text-[9px] md:text-xs text-slate-400 font-bold mt-0.5">
                          <Clock size={10} /> {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-sm md:text-lg text-slate-900 dark:text-white italic leading-none">₹{order.total}</p>
                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${order.status === 'delivered' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {order.status}
                        </span>
                      </div>
                      {expandedOrder === order.id ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/30 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-[11px] font-bold border-b border-white dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-[9px] text-slate-400 font-black shadow-sm">{item.quantity}</span>
                              <span className="text-slate-700 dark:text-slate-200 max-w-[150px] truncate">{item.product_name || 'Loading...'}</span>
                            </div>
                            <span className="text-slate-900 dark:text-white">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-3 mt-1">
                          {(user?.role === 'admin' || user?.role === 'executive' || order.status === 'delivered') && (
                            <div className="pt-3 mt-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedOrderForInvoice(order); }}
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
                              >
                                <Receipt size={14} /> Full Invoice
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <InvoiceModal
        isOpen={selectedOrderForInvoice !== null}
        onClose={() => setSelectedOrderForInvoice(null)}
        order={selectedOrderForInvoice}
        user={user}
      />
    </div>
  );
};
