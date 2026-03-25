import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Minus, ShoppingBag, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, User, Review } from '../../types';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  cartItem?: CartItem;
  addToCart: (p: Product) => void;
  removeFromCart: (id: number) => void;
  user: User | null;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product, isOpen, onClose, cartItem, addToCart, removeFromCart, user
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  useEffect(() => {
    if (product && isOpen) {
      fetchReviews();
      setActiveTab('details');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product, isOpen]);

  const fetchReviews = async () => {
    if (!product) return;
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': user.token || '' },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) { setComment(''); setRating(5); fetchReviews(); }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  if (!product) return null;

  const isOutOfStock = product.out_of_stock || (product.stock !== undefined && product.stock <= 0);
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[210] w-full md:w-[800px] lg:w-[900px] bg-white dark:bg-slate-900 rounded-t-[28px] md:rounded-[28px] flex flex-col overflow-hidden shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">Back</span>
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 lg:p-8">
                <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
                  <div className="w-full md:w-[45%] lg:w-1/2 shrink-0">
                    <div className="relative rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 p-6 md:p-10 flex items-center justify-center aspect-square">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                      {discount > 0 && !isOutOfStock && (
                        <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg shadow-lg uppercase">
                          {discount}% OFF
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute top-4 left-4 bg-slate-500 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg shadow-lg uppercase">
                          Sold Out
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 py-2">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.brand && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                          {product.brand}
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                        {product.unit}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-800">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                          In Stock
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-3">
                      {product.name}
                    </h2>

                    {product.catch && (
                      <p className="text-sm md:text-base text-emerald-600 dark:text-emerald-400 font-bold italic mb-6">
                        "{product.catch}"
                      </p>
                    )}

                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₹{product.price}
                      </span>
                      {product.mrp && product.mrp > product.price && (
                        <div className="flex flex-col pb-1">
                          <span className="text-lg md:text-xl text-slate-400 line-through font-semibold">₹{product.mrp}</span>
                          <span className="text-[10px] md:text-xs text-emerald-600 font-black uppercase tracking-wide">
                            Save ₹{(product.mrp - product.price).toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Add to Cart CTA */}
                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                      {isOutOfStock ? (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 md:py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                          Currently Out of Stock
                        </div>
                      ) : cartItem && cartItem.quantity > 0 ? (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-emerald-600 text-white rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/20">
                            <button onClick={() => removeFromCart(product.id)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:bg-emerald-700 transition-colors">
                              <Minus size={18} strokeWidth={3} />
                            </button>
                            <span className="w-10 md:w-12 text-center font-black text-lg md:text-xl">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(product)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:bg-emerald-700 transition-colors">
                              <Plus size={18} strokeWidth={3} />
                            </button>
                          </div>
                          <div className="flex flex-col hidden sm:flex">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                            <span className="text-lg md:text-xl font-black text-emerald-600">₹{(product.price * cartItem.quantity).toFixed(0)}</span>
                          </div>
                          <button
                            onClick={() => { onClose(); window.dispatchEvent(new Event('openCart')); }}
                            className="ml-auto flex items-center justify-center gap-2 flex-1 sm:flex-none bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                          >
                            <ShoppingBag size={18} /> View Cart
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 md:py-5 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={24} strokeWidth={3} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 md:px-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mt-4 mb-0">
                  {(['details', 'reviews'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      {tab === 'details' ? 'Product Details' : `Reviews (${reviews.length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-8">
                {activeTab === 'details' && (
                  <div className="space-y-5">
                    {product.description && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>
                      </div>
                    )}
                    {product.highlights && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Highlights</h3>
                        <ul className="space-y-2">
                          {product.highlights.split('\n').filter(h => h.trim()).map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              {h.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(product.mfg_date || product.country_of_origin) && (
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                        {product.mfg_date && (
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Best Before</p>
                            <p className="text-sm font-bold dark:text-white">{product.mfg_date}</p>
                          </div>
                        )}
                        {product.country_of_origin && (
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Origin</p>
                            <p className="text-sm font-bold dark:text-white">{product.country_of_origin}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-5 pb-8">
                    {user ? (
                      <form onSubmit={handleSubmitReview} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl">
                        <h4 className="font-black text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Rate this product</h4>
                        <div className="flex items-center gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="transition-transform hover:scale-125"
                            >
                              <Star size={28} className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          placeholder="Share your experience..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none h-24 mb-3 transition-all"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm mb-3">Login to write a review</p>
                        <button
                          onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('navTo', { detail: 'auth' })); }}
                          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                        >
                          Login Now
                        </button>
                      </div>
                    )}

                    {reviews.length === 0 ? (
                      <p className="center text-slate-400 text-sm py-8 text-center italic">No reviews yet. Be the first to review!</p>
                    ) : (
                      reviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-black uppercase">
                              {review.user_name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{review.user_name}</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={10} className={review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 ml-11">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
