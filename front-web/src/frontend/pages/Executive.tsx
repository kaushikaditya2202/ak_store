import React, { useState, useEffect, useMemo } from 'react';
import { Package, ArrowLeft, CheckCircle2, Circle, Clock, Printer, MapPin, Phone, ChevronDown, ChevronUp, LayoutGrid, ListChecks, Search, RefreshCcw, AlertTriangle, ChevronRight, Zap, Target, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Order } from '../../types';
import { InvoiceModal } from '../components/InvoiceModal';

interface ExecutiveProps {
  user: User | null;
  setView: (view: any) => void;
}

export const Executive: React.FC<ExecutiveProps> = ({ user, setView }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'packed'>('pending');
  // Store when an order was packed locally to handle the 1-minute delay
  const [recentlyPacked, setRecentlyPacked] = useState<Record<number, number>>({});

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/executive/orders', {
        headers: { 'Authorization': user?.token || '' }
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        setError(null);
      }
    } catch (e: any) {
      console.error('Failed to fetch orders:', e);
      setError(e.message || 'Failed to connect to fulfillment server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 30000);
    return () => clearInterval(interval);
  }, []);

  // Timer to clear recently packed status after 1 minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRecentlyPacked(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [id, time] of Object.entries(next)) {
          if (now - Number(time) > 60000) {
            delete next[Number(id)];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const toggleItemPick = async (orderId: number, itemId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/executive/items/${itemId}/pick`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token || ''
        },
        body: JSON.stringify({ is_checked: !currentStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => {
          if (o.id === orderId && (o as any).items) {
            return {
              ...o,
              items: (o as any).items.map((item: any) => item.id === itemId ? { ...item, is_checked: !currentStatus } : item)
            };
          }
          return o;
        }));
      }
    } catch (e) {
      console.error('Failed to pick item:', e);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token || ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        if (newStatus === 'packed') {
          // Add to recently packed timer
          setRecentlyPacked(prev => ({ ...prev, [orderId]: Date.now() }));
        }
        fetchOrders();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const activeOrdersList = useMemo(() => {
    return orders.filter(o => o && o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);

  const ordersBySlot = useMemo(() => {
    const slots: Record<string, Order[]> = {};
    activeOrdersList.forEach(o => {
      const s = (o as any).slot_info || 'Unscheduled';
      if (!slots[s]) slots[s] = [];
      slots[s].push(o);
    });
    return slots;
  }, [activeOrdersList]);

  // Derived lists based on the 1-minute transfer rule
  const pendingOrders = useMemo(() => {
    return activeOrdersList.filter(o => {
      if (o.status === 'pending') return true;
      if (o.status === 'packed' && recentlyPacked[o.id]) return true; // Recently packed, still in pending list
      return false;
    });
  }, [activeOrdersList, recentlyPacked]);

  const packedOrders = useMemo(() => {
    return activeOrdersList.filter(o => {
      if (o.status === 'packed' && !recentlyPacked[o.id]) return true; // Packed and grace period finished
      return false;
    });
  }, [activeOrdersList, recentlyPacked]);

  const displayOrders = useMemo(() => {
    let base = activeTab === 'pending' ? pendingOrders : packedOrders;

    if (selectedSlot) {
      base = base.filter(o => ((o as any).slot_info || 'Unscheduled') === selectedSlot);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(o =>
        o.id.toString().includes(q) ||
        o.user_name?.toLowerCase().includes(q) ||
        (o as any).user_phone?.includes(q)
      );
    }
    return base;
  }, [activeTab, pendingOrders, packedOrders, selectedSlot, searchQuery]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-emerald-600">
        <RefreshCcw size={32} className="animate-spin" />
        <p className="font-black text-[9px] uppercase tracking-[0.4em]">Node Link Active...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-2 border-rose-100 dark:border-rose-900/30 text-center max-w-sm shadow-2xl">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-2">Connection Error</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold mb-6 text-xs">{error}</p>
        <button onClick={() => fetchOrders(true)} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">Retry Connection</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors pb-24">
      <div className="max-w-[1600px] mx-auto p-3 lg:p-6">
        {/* Header Terminal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-950 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="relative z-10">
            <h2 className="text-xl lg:text-3xl font-black italic tracking-tighter flex items-center gap-3 uppercase text-slate-900 dark:text-white">
              <div className="w-9 h-9 lg:w-11 lg:h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 shrink-0">
                <Zap size={20} fill="currentColor" />
              </div>
              Fulfillment <span className="text-emerald-600">Hub</span>
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                {user?.name || 'Staff Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 mt-2 md:mt-0">
            <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <button onClick={() => setActiveTab('pending')} className={`flex flex-col items-center px-4 py-1.5 rounded-lg transition-all ${activeTab === 'pending' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400'}`}>
                <p className="text-[7px] font-black uppercase tracking-widest mb-0.5">Pending</p>
                <p className="text-sm font-black leading-none">{pendingOrders.length}</p>
              </button>
              <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
              <button onClick={() => setActiveTab('packed')} className={`flex flex-col items-center px-4 py-1.5 rounded-lg transition-all ${activeTab === 'packed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>
                <p className="text-[7px] font-black uppercase tracking-widest mb-0.5">Ready</p>
                <p className="text-sm font-black leading-none">{packedOrders.length}</p>
              </button>
            </div>
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white px-5 py-3.5 rounded-xl text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95"
            >
              <ArrowLeft size={14} /> <span className="hidden xs:inline">Exit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* Table 1: Slots Monitor */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-950 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-fit xl:sticky xl:top-24">
              <div className="flex items-center justify-between mb-4 lg:mb-6 px-1">
                <h3 className="text-[9px] lg:text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                  <Clock size={14} /> Batch Flow
                </h3>
              </div>

              <div className="flex xl:flex-col overflow-x-auto xl:overflow-x-visible gap-2 pb-2 xl:pb-0 scrollbar-hide">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className={`flex-none xl:w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl md:rounded-[1.25rem] transition-all border-2 whitespace-nowrap min-w-[120px] ${!selectedSlot ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20 text-white' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-900 dark:text-white'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${!selectedSlot ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                      <LayoutGrid size={12} />
                    </div>
                    <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest">All Batches</span>
                  </div>
                  <span className={`text-[9px] font-black ml-3 ${!selectedSlot ? 'text-white' : 'text-slate-400'}`}>{activeOrdersList.length}</span>
                </button>

                {Object.entries(ordersBySlot).map(([slot, items]) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex-none xl:w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl md:rounded-[1.25rem] transition-all border-2 whitespace-nowrap min-w-[120px] ${selectedSlot === slot ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20 text-white' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-900 dark:text-white'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${selectedSlot === slot ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                        <Clock size={12} />
                      </div>
                      <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest truncate max-w-[80px] lg:max-w-none">{slot}</span>
                    </div>
                    <span className={`text-[9px] font-black ml-3 ${selectedSlot === slot ? 'text-white' : 'text-slate-400'}`}>{items.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table 2: Orders Flow */}
          <div className="xl:col-span-9 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 lg:p-3 rounded-xl ${activeTab === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {activeTab === 'pending' ? <Target size={20} /> : <Box size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-lg lg:text-2xl uppercase italic tracking-tighter text-slate-900 dark:text-white leading-tight">
                    {activeTab === 'pending' ? 'PENDING' : 'PACKED'} <span className={activeTab === 'pending' ? 'text-orange-500' : 'text-emerald-600'}>SECTION</span>
                  </h3>
                  <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {activeTab === 'pending' ? 'ORDERS READY FOR PACKAGING' : 'READY FOR DISPATCH'}
                  </p>
                </div>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search ID, Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-1 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:uppercase"
                />
              </div>
            </div>

            <div className="space-y-4">
              {displayOrders.length > 0 ? (
                displayOrders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-slate-950 rounded-[1.5rem] lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="p-4 lg:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 lg:w-16 lg:h-16 bg-slate-900 dark:bg-white rounded-xl lg:rounded-[1.5rem] flex items-center justify-center font-black text-lg lg:text-2xl italic tracking-tighter text-white dark:text-slate-900 shadow-md shrink-0">
                          #{order.id}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-sm lg:text-lg uppercase tracking-tight text-slate-900 dark:text-white truncate max-w-[150px] lg:max-w-md">{order.user_name}</h3>
                            {recentlyPacked[order.id] && (
                              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1">
                                <Clock size={8} /> Moving in {Math.round(60 - (Date.now() - recentlyPacked[order.id]) / 1000)}s
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 lg:gap-5">
                            <p className="text-[10px] lg:text-[12px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                              <MapPin size={12} className="text-emerald-500 shrink-0" />
                              <span className="truncate max-w-[160px] lg:max-w-md">{order.address}</span>
                            </p>
                            <div className="flex items-center gap-1.5 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                              <Clock size={10} /> {order.slot_info}
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                              Total: ₹{order.total} {order.delivery_fee > 0 && <span className="text-[7px] text-slate-400 ml-1">(Fee: ₹{order.delivery_fee})</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row gap-2 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedOrderForInvoice(order)} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"><Printer size={16} /></button>
                          <button onClick={() => toggleOrderExpansion(order.id)} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-300 border border-slate-100 dark:border-slate-800">
                            {expandedOrders[order.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>

                        {order.status === 'packed' ? (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 whitespace-nowrap"
                          >
                            <CheckCircle2 size={14} /> MARK DELIVERED
                          </button>
                        ) : (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'packed')}
                            disabled={!(order as any).items?.every((item: any) => item.is_checked)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md transition-all ${(order as any).items?.every((item: any) => item.is_checked)
                              ? 'bg-orange-500 text-white shadow-orange-500/20'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                              }`}
                          >
                            <Package size={14} /> MARK PACKED
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedOrders[order.id] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-50 dark:border-slate-800 bg-[#fcfcfc] dark:bg-[#030712]">
                          <div className="p-4 lg:p-6">
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2"><ListChecks size={14} /> CHECKLIST</h4>
                              <span className="text-[8px] font-black text-slate-400">
                                {Math.round(((order as any).items?.filter((i: any) => i.is_checked).length / (order as any).items?.length) * 100)}% Complete
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {(order as any).items?.map((item: any) => (
                                <div key={item.id} onClick={() => toggleItemPick(order.id, item.id, item.is_checked)} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${item.is_checked ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/20 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.is_checked ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                                      {item.is_checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`font-black text-[10px] uppercase italic tracking-tight truncate ${item.is_checked ? 'line-through' : 'text-slate-900 dark:text-white'}`}>{item.product_name}</p>
                                      <p className="text-[7px] font-bold text-slate-400 uppercase">QTY: {item.quantity}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center bg-white dark:bg-slate-950 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <Package size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-300 dark:text-slate-700 uppercase italic">WAIT FOR ORDERS</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {
        selectedOrderForInvoice && (
          <InvoiceModal isOpen={true} user={null} order={selectedOrderForInvoice} onClose={() => setSelectedOrderForInvoice(null)} />
        )
      }
    </div >
  );
};
