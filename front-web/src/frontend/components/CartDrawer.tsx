import React from 'react';
import {
  X, ShoppingCart, Minus, Plus, ArrowLeft, ReceiptText, ShieldCheck,
  CreditCard, Home, Clock, Ticket, MapPin, User as UserIcon, Zap,
  Package, ChevronRight, Trash2, MapPinOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, User, Product, PickupLocation, PickupSlot } from '../../types';
import { ProductCard } from './ProductCard';


interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  addToCart: (p: any) => void;
  removeFromCart: (id: number) => void;
  user: User | null;
  suggestedProducts: Product[];
  userAddresses: any[];
  handleCheckout: (data: any) => void;
  selectedLocationId: number | null;
  setSelectedLocationId: (id: number | null) => void;
  setView: (view: any) => void;
  setSelectedCategory: (id: number | null) => void;
  step: 'cart' | 'checkout';
  setStep: (step: 'cart' | 'checkout') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen, onClose, cart, cartTotal, cartCount, addToCart, removeFromCart,
  handleCheckout, user, suggestedProducts, userAddresses, selectedLocationId,
  setSelectedLocationId, setView, setSelectedCategory, step, setStep
}) => {
  const [orderType, setOrderType] = React.useState<'delivery' | 'pickup'>('delivery');
  const [deliverySlots, setDeliverySlots] = React.useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = React.useState<number | null>(null);
  const [couponCode, setCouponCode] = React.useState('');
  const [activeCoupon, setActiveCoupon] = React.useState<{ id: number, discount: number } | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');

  const [pickupLocations, setPickupLocations] = React.useState<PickupLocation[]>([]);
  const [pickupSlots, setPickupSlots] = React.useState<PickupSlot[]>([]);
  const [selectedPickupLocationId, setSelectedPickupLocationId] = React.useState<number | null>(null);

  const DELIVERY_PINCODES = ['845305']; // pincodes eligible for home delivery

  const hasDeliveryAddress = userAddresses.some(a => DELIVERY_PINCODES.includes(a.pincode));
  const selectedAddr = userAddresses.find(a => a.id === selectedLocationId);
  const isSelectedAddrEligible = !!selectedAddr && DELIVERY_PINCODES.includes(selectedAddr.pincode);

  React.useEffect(() => {
    if (step === 'checkout') {
      if (!hasDeliveryAddress) {
        setOrderType('pickup');
      } else if (!orderType) {
        setOrderType('delivery');
      }
    }
  }, [step, hasDeliveryAddress]);

  React.useEffect(() => {
    if (isOpen) {
      // Fetch delivery slots
      fetch('/api/delivery-slots')
        .then(res => res.json())
        .then(data => {
          setDeliverySlots(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0 && orderType === 'delivery') setSelectedSlotId(data[0].id);
        })
        .catch(() => { });

      // Fetch pickup locations
      fetch('/api/pickup-locations')
        .then(res => res.json())
        .then(data => {
          setPickupLocations(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) setSelectedPickupLocationId(data[0].id);
        })
        .catch(() => { });

      // Fetch pickup slots
      fetch('/api/pickup-slots')
        .then(res => res.json())
        .then(data => setPickupSlots(Array.isArray(data) ? data : []))
        .catch(() => { });

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setCouponCode('');
      setActiveCoupon(null);
      setCouponError('');
      setSelectedSlotId(null);
      setStep('cart');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-select first slot when order type or location changes
  React.useEffect(() => {
    if (orderType === 'delivery') {
      if (deliverySlots.length > 0 && !selectedSlotId) {
        setSelectedSlotId(deliverySlots[0].id);
      }
    } else {
      const locationSlots = pickupSlots.filter(s => s.location_id === selectedPickupLocationId && s.is_active);
      if (locationSlots.length > 0) {
        // If current slot is not in the list for this location, pick first
        const isCurrentSlotValid = locationSlots.some(s => s.id === selectedSlotId);
        if (!isCurrentSlotValid) {
          setSelectedSlotId(locationSlots[0].id);
        }
      } else {
        setSelectedSlotId(null);
      }
    }
  }, [orderType, selectedPickupLocationId, deliverySlots, pickupSlots]);

  // Reset slot when toggling order type to avoid ID mixups
  const handleOrderTypeChange = (type: 'delivery' | 'pickup') => {
    if (type !== orderType) {
      setOrderType(type);
      setSelectedSlotId(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode || !user) return;
    setVerifyingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': user.token || '' },
        body: JSON.stringify({ code: couponCode, cart_total: cartTotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveCoupon({ id: data.coupon_id, discount: data.discount_amount });
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setActiveCoupon(null);
      }
    } catch { setCouponError('Network error'); }
    finally { setVerifyingCoupon(false); }
  };

  const deliveryFee = (orderType === 'delivery' && cartTotal < 500) ? 20 : 0;
  const finalTotal = Math.max(0, cartTotal - (activeCoupon?.discount || 0)) + deliveryFee;

  const canPlaceOrder = !!user && (
    (orderType === 'pickup' && !!selectedPickupLocationId && !!selectedSlotId) ||
    (orderType === 'delivery' && !!selectedLocationId && isSelectedAddrEligible && !!selectedSlotId)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Drawer — full height, single panel, right side */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-[480px] bg-white dark:bg-slate-950 z-[70] shadow-2xl flex flex-col"
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-3">
                {step === 'checkout' && (
                  <button
                    onClick={() => setStep('cart')}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {step === 'cart' ? 'My Cart' : 'Checkout'}
                  </h2>
                  {step === 'cart' && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ─── Scrollable Content ─── */}
            <div className="flex-1 overflow-y-auto">

              {/* ══════ CART STEP ══════ */}
              {step === 'cart' && (
                <div className="p-4 space-y-4 pb-40">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <ShoppingCart size={32} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="font-black text-lg text-slate-700 dark:text-white">Your cart is empty</p>
                        <p className="text-xs text-slate-400 mt-1">Add items to get started</p>
                      </div>
                      <button
                        onClick={() => { onClose(); }}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items */}
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        {cart.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 py-3.5 ${idx !== cart.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-700">
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight line-clamp-2">{item.name}</h4>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">{item.unit}</p>
                              <p className="text-xs font-black text-slate-700 dark:text-white mt-1">
                                ₹{item.price}
                                {item.mrp > item.price && (
                                  <span className="ml-1.5 text-slate-400 line-through font-medium text-[9px]">₹{item.mrp}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center shrink-0">
                              <div className="flex items-center bg-emerald-600 text-white rounded-xl overflow-hidden shadow-sm">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-emerald-700 transition-colors"
                                >
                                  {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} strokeWidth={3} />}
                                </button>
                                <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-emerald-700 transition-colors"
                                >
                                  <Plus size={12} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Suggested Products */}
                      {suggestedProducts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4 px-1">
                            <Zap size={18} className="text-amber-500 fill-amber-500" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">You Might Also Like</h3>
                          </div>
                          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
                            {suggestedProducts.map(p => (
                              <div key={p.id} className="min-w-[180px] max-w-[180px]">
                                <ProductCard
                                  product={p}
                                  addToCart={addToCart}
                                  removeFromCart={removeFromCart}
                                  cartItem={cart.find(item => item.id === p.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coupon */}
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Ticket size={15} className="text-amber-500" />
                          <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Apply Coupon</h4>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-xs font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!activeCoupon}
                          />
                          {activeCoupon ? (
                            <button
                              onClick={() => { setActiveCoupon(null); setCouponCode(''); }}
                              className="px-4 text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={handleApplyCoupon}
                              disabled={verifyingCoupon || !couponCode}
                              className="px-4 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-40"
                            >
                              {verifyingCoupon ? '...' : 'Apply'}
                            </button>
                          )}
                        </div>
                        {couponError && <p className="text-[10px] text-rose-500 font-bold mt-2">{couponError}</p>}
                        {activeCoupon && <p className="text-[10px] text-emerald-600 font-black mt-2">🎉 Saved ₹{activeCoupon.discount}!</p>}
                      </div>

                      {/* Bill Details */}
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ReceiptText size={15} className="text-emerald-600" />
                          <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bill Details</h4>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 font-medium">
                          <span>Item Total ({cartCount} items)</span>
                          <span className="font-bold text-slate-800 dark:text-white">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 font-medium">
                          <span>Delivery Fee</span>
                          <span className={deliveryFee === 0 ? "text-emerald-600 font-black" : "font-black text-slate-800 dark:text-white"}>
                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                          </span>
                        </div>
                        {activeCoupon && (
                          <div className="flex justify-between text-sm text-emerald-600 font-black">
                            <span>Coupon ({couponCode})</span>
                            <span>-₹{activeCoupon.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                          <span className="font-black text-slate-900 dark:text-white text-base">Total to Pay</span>
                          <span className="font-black text-emerald-600 text-xl">₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ══════ CHECKOUT STEP ══════ */}
              {step === 'checkout' && (
                <div className="p-4 space-y-5 pb-40">

                  <div className="space-y-6">
                    {/* 1. Choose Order Type First */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">1. Choose Order Type</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => handleOrderTypeChange('pickup')}
                          className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${orderType === 'pickup'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200'}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${orderType === 'pickup' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <Package size={24} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${orderType === 'pickup' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>Pickup Point</span>
                        </div>

                        <div
                          onClick={() => { if (hasDeliveryAddress) handleOrderTypeChange('delivery'); }}
                          className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all ${orderType === 'delivery'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-100 dark:border-slate-800'} ${hasDeliveryAddress ? 'cursor-pointer hover:border-emerald-200' : 'opacity-40 grayscale cursor-not-allowed'}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${orderType === 'delivery' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <Home size={24} />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${orderType === 'delivery' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>Home Delivery</span>
                            {!hasDeliveryAddress && <span className="text-[7px] font-bold text-rose-500 uppercase mt-0.5">845305 Only</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Choose Delivery Address / Store Point */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-600" />
                          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                            {orderType === 'pickup' ? 'Pickup Point Location' : 'Select Delivery Address'}
                          </h3>
                        </div>
                        {orderType === 'delivery' && (
                          <button
                            onClick={() => { setView('profile'); onClose(); }}
                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            + New Address
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {orderType === 'pickup' ? (
                          /* Managed Pickup Locations */
                          <div className="space-y-3">
                            {pickupLocations.map(loc => (
                              <div
                                key={loc.id}
                                onClick={() => setSelectedPickupLocationId(loc.id)}
                                className={`flex items-start gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedPickupLocationId === loc.id
                                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-lg shadow-emerald-500/5'
                                  : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200'}`}
                              >
                                <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center shrink-0 border transition-colors ${selectedPickupLocationId === loc.id ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                                  <Package size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-black text-sm tracking-tight ${selectedPickupLocationId === loc.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{loc.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold mt-0.5">{loc.address}</p>
                                  <p className="text-[9px] font-black text-emerald-600 mt-2 flex items-center gap-1 opacity-70 italic">
                                    📍 {loc.city}, {loc.pincode}
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${selectedPickupLocationId === loc.id ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                                  {selectedPickupLocationId === loc.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                              </div>
                            ))}
                            {pickupLocations.length === 0 && (
                              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No pickup points available currently.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Home Delivery Address Options */
                          <div className="space-y-3">
                            {userAddresses.filter(a => DELIVERY_PINCODES.includes(a.pincode)).map(addr => (
                              <div
                                key={addr.id}
                                onClick={() => setSelectedLocationId(addr.id)}
                                className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedLocationId === addr.id
                                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-md transform scale-[1.01]'
                                  : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200'}`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${selectedLocationId === addr.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                  {selectedLocationId === addr.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-[11px] text-slate-800 dark:text-white uppercase tracking-tight">{addr.name}</p>
                                    {addr.is_default && <span className="text-[8px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Default</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed truncate">{addr.street_address}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{addr.city} — {addr.pincode}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time Slots (Conditional on Order Type) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-emerald-600" />
                      <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                        {orderType === 'pickup' ? 'Select Pickup Time' : 'Select Delivery Slot'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(orderType === 'delivery' ? deliverySlots : pickupSlots.filter(s => s.location_id === selectedPickupLocationId)).map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all ${selectedSlotId === slot.id
                            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-lg shadow-emerald-500/5 transform scale-[1.02]'
                            : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200'
                            }`}
                        >
                          <span className={`text-[10px] font-black uppercase block ${selectedSlotId === slot.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                            {slot.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{slot.start_time} – {slot.end_time}</span>
                        </button>
                      ))}
                      {(orderType === 'pickup' && pickupSlots.filter(s => s.location_id === selectedPickupLocationId).length === 0) && (
                        <p className="col-span-2 text-[10px] text-slate-400 italic">No timings available for this location.</p>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-emerald-600" />
                      <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">Payment Method</h3>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-500/30">
                      <div className="w-5 h-5 rounded-full border-4 border-emerald-600 bg-white dark:bg-slate-900" />
                      <div className="flex-1">
                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase">Cash On Delivery / In-Store</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Pay when you receive your order</p>
                      </div>
                      <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                    </div>
                  </div>

                  {/* Order Summary recap */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Summary</p>
                      <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        <Package size={10} className="text-emerald-600" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{orderType}</span>
                      </div>
                    </div>

                    {/* Fulfillment Details */}
                    {orderType === 'pickup' && selectedPickupLocationId && (
                      <div className="mb-4 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          <span>Location</span>
                          <span className="text-slate-900 dark:text-white">{pickupLocations.find(l => l.id === selectedPickupLocationId)?.name}</span>
                        </div>
                        {selectedSlotId && (
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            <span>Timing Slot</span>
                            <span className="text-emerald-600">
                              {pickupSlots.find(s => s.id === selectedSlotId)?.name} ({pickupSlots.find(s => s.id === selectedSlotId)?.start_time})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="truncate flex-1 max-w-[200px]">{item.name}</span>
                        <span className="font-bold shrink-0 ml-2">x{item.quantity} — ₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    {activeCoupon && (
                      <div className="flex justify-between text-xs text-emerald-600 font-black pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Coupon ({couponCode})</span>
                        <span>-₹{activeCoupon.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-black pt-1">
                      <span className="text-slate-500 uppercase">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? "text-emerald-600 uppercase" : "text-slate-900 dark:text-white"}>
                        {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-black text-slate-900 dark:text-white text-sm">Total</span>
                      <span className="font-black text-emerald-600 text-lg">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                </div>
              )}

              {/* ══════ NOT LOGGED IN ══════ */}
              {!user && (
                <div className="flex flex-col items-center justify-center py-24 gap-5 p-8 text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600">
                    <UserIcon size={32} />
                  </div>
                  <div>
                    <p className="font-black text-xl text-slate-800 dark:text-white">Sign in to continue</p>
                    <p className="text-xs text-slate-400 mt-1">Login to view your cart and place orders</p>
                  </div>
                  <button
                    onClick={() => { onClose(); setView('auth'); }}
                    className="bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                  >
                    Login Now →
                  </button>
                </div>
              )}
            </div>

            {/* ─── Sticky Footer ─── */}
            {user && (
              <div className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
                {cart.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                        <p className="text-xl font-black text-emerald-600">₹{finalTotal.toFixed(2)}</p>
                      </div>
                      {orderType === 'delivery' && cartTotal < 500 ? (
                        <div className="text-right">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Add ₹{(500 - cartTotal).toFixed(0)} for Free Delivery</p>
                          <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 ml-auto overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(cartTotal / 500) * 100}%` }}></div>
                          </div>
                        </div>
                      ) : step === 'checkout' && !canPlaceOrder && (
                        <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wide text-right max-w-[150px] leading-relaxed">
                          Select address & time slot to continue
                        </p>
                      )}
                    </div>

                    {step === 'cart' ? (
                      <button
                        onClick={() => setStep('checkout')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        Proceed to Checkout <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckout({
                          locationId: orderType === 'delivery' ? selectedLocationId : null,
                          pickupLocationId: orderType === 'pickup' ? selectedPickupLocationId : null,
                          deliverySlotId: orderType === 'delivery' ? selectedSlotId : null,
                          pickupSlotId: orderType === 'pickup' ? selectedSlotId : null,
                          couponId: activeCoupon?.id,
                          discountAmount: activeCoupon?.discount,
                          order_type: orderType
                        })}
                        disabled={!canPlaceOrder}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        Place Order →
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => { onClose(); setView('home'); setSelectedCategory(null); }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all"
                  >
                    Explore Products →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
