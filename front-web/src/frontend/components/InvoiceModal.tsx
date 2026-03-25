import React from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, Printer, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, User } from '../../types';

interface InvoiceModalProps {
   order: Order | null;
   isOpen: boolean;
   onClose: () => void;
   user: User | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose, user }) => {
   if (!order) return null;

   const handlePrint = () => {
      window.print();
   };

   const modalContent = (
      <AnimatePresence>
         {isOpen && (
            <div className="invoice-modal-portal">
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] print:hidden"
               />
               <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] bg-white dark:bg-slate-950 z-[1100] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:static print:inset-auto print:translate-x-0 print:translate-y-0 print:w-full print:h-auto print:rounded-none print:shadow-none print:bg-white print:overflow-visible invoice-modal-container font-sans"
               >
                  {/* Header */}
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-20 print:hidden">
                     <div className="flex items-center gap-2">
                        <Receipt className="text-emerald-600" />
                        <h2 className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">Tax Receipt</h2>
                     </div>
                     <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all font-black flex items-center gap-2 text-xs">
                           <Printer size={18} /> Print
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-500">
                           <X size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 print:p-0 print:overflow-visible print:block">
                     <div className="max-w-[450px] mx-auto print:max-w-none print:w-full print:mx-0 print:px-8 print:py-8 print:font-sans text-slate-900 dark:text-slate-100 print:text-black">

                        {/* Store Info & Branding */}
                        <div className="text-center mb-8 pb-8 border-b border-slate-100 dark:border-slate-800 border-dashed">
                           <div className="flex flex-col items-center gap-3 mb-4">
                              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                                 <Zap size={28} fill="white" />
                              </div>
                              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">AK Store</h1>
                           </div>
                           <div className="space-y-1 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                              <p>Bank Road, Main Road</p>
                              <p>Raxaul, Bihar - 845305</p>
                              <p className="pt-2 text-emerald-600 dark:text-emerald-400">GSTIN: 10AVPPK6529A1ZW</p>
                           </div>
                        </div>

                        {/* Customer & Order Details Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                           <div className="space-y-4">
                              <div>
                                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Billed To</h4>
                                 <p className="text-xs font-black uppercase text-slate-900 dark:text-white leading-tight">
                                    {order.user_name || user?.name || 'Guest User'}
                                 </p>
                                 <p className="text-[10px] font-bold text-slate-500 mt-1">
                                    {order.user_phone || user?.phone || 'N/A'}
                                 </p>
                              </div>
                              <div>
                                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Shipping Address</h4>
                                 <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-relaxed">
                                    {order.address || (user?.street_address ? `${user.street_address}, ${user.city}` : 'Counter Sale')}
                                 </p>
                              </div>
                           </div>

                           <div className="space-y-4 text-right">
                              <div>
                                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Invoice ID</h4>
                                 <p className="text-sm font-black text-emerald-600 italic">#AK-ORD-{order.id}</p>
                              </div>
                              <div>
                                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Date Issued</h4>
                                 <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                       day: '2-digit',
                                       month: 'short',
                                       year: 'numeric'
                                    })}
                                 </p>
                                 <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                    {new Date(order.created_at).toLocaleTimeString('en-IN', {
                                       hour: '2-digit',
                                       minute: '2-digit'
                                    })}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-4 md:p-6 mb-8 border border-slate-100 dark:border-slate-800">
                           <div className="space-y-4">
                              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                                 <div className="col-span-6">Item Description</div>
                                 <div className="col-span-2 text-center">Unit</div>
                                 <div className="col-span-2 text-center">Qty</div>
                                 <div className="col-span-2 text-right">Total</div>
                              </div>

                              {(order.order_items || (order as any).items || []).map((item: any, idx: number) => (
                                 <div key={idx} className="grid grid-cols-12 gap-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 px-2 items-center">
                                    <div className="col-span-6">
                                       <p className="font-bold text-slate-900 dark:text-white text-xs">{item.product_name || 'Loading...'}</p>
                                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">SKU: #{item.product_id || item.id}</p>
                                    </div>
                                    <div className="col-span-2 text-center text-[11px] font-bold text-slate-500">
                                       ₹{item.price}
                                    </div>
                                    <div className="col-span-2 text-center text-[11px] font-black text-slate-900 dark:text-white">
                                       x{item.quantity}
                                    </div>
                                    <div className="col-span-2 text-right text-[11px] font-black text-slate-900 dark:text-white">
                                       ₹{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-3 pt-4 border-t-2 border-slate-900 dark:border-white border-dashed">
                           <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Subtotal</span>
                              <span className="text-slate-900 dark:text-white">₹{(order.total - (order.delivery_fee || 0) + (order.discount_amount || 0)).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                              <span>Delivery Fee</span>
                              <span className={(order.delivery_fee || 0) > 0 ? "text-slate-900 dark:text-white" : "text-emerald-600"}>
                                 {(order.delivery_fee || 0) > 0 ? `₹${(order.delivery_fee || 0).toFixed(2)}` : 'FREE'}
                              </span>
                           </div>
                           {(order.discount_amount || 0) > 0 && (
                              <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                                 <span>Promo Applied</span>
                                 <span>-₹{(order.discount_amount || 0).toFixed(2)}</span>
                              </div>
                           )}

                           <div className="flex justify-between items-center py-6 px-6 bg-slate-900 dark:bg-white rounded-2xl md:rounded-3xl mt-6">
                              <span className="text-white dark:text-slate-900 text-lg md:text-xl font-black italic uppercase tracking-tighter leading-none">Net Payable</span>
                              <span className="text-white dark:text-emerald-600 text-2xl md:text-3xl font-black italic leading-none">₹{order.total.toFixed(2)}</span>
                           </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 text-center space-y-4">
                           <div className="h-px w-20 bg-slate-200 dark:bg-slate-800 mx-auto"></div>
                           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-2 inline-block px-4 rounded-lg">*** PAID & VERIFIED ***</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
                              Terms: Please check the items properly.<br />
                              Thank you for shopping with AK Store!
                           </p>
                        </div>
                     </div>
                  </div>

                  <style dangerouslySetInnerHTML={{
                     __html: `
             @media print {
               @page { margin: 0; size: 80mm auto; }
               html, body { 
                 margin: 0; padding: 0; background: white !important; 
                 height: auto !important; overflow: visible !important; width: 80mm !important;
               }
               #root, .print\\:hidden, button { display: none !important; }
               .invoice-modal-portal { display: block !important; position: static !important; width: 80mm !important; background: white !important; }
               .invoice-modal-container { display: block !important; position: static !important; width: 80mm !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; background: white !important; max-height: none !important; overflow: visible !important; }
               .flex-1 { overflow: visible !important; height: auto !important; display: block !important; }
             }
          `}} />
               </motion.div>
            </div>
         )}
      </AnimatePresence>
   );

   return typeof document !== 'undefined'
      ? createPortal(modalContent, document.body)
      : null;
};
