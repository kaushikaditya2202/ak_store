import React, { useState, useEffect, useMemo } from 'react';
import { Category, Product, CartItem, User } from './types';
import { Header } from './frontend/components/Header';
import { Sidebar } from './frontend/components/Sidebar';
import { CartDrawer } from './frontend/components/CartDrawer';
import { BottomNav } from './frontend/components/BottomNav';
import { Footer } from './frontend/components/Footer';
import { Home } from './frontend/pages/Home';
import { Auth } from './frontend/pages/Auth';
import { Admin } from './frontend/pages/Admin';
import { Profile } from './frontend/pages/Profile';
import { Executive } from './frontend/pages/Executive';
import { Legal } from './frontend/pages/Legal';
import { Developer } from './frontend/pages/Developer';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ShoppingCart, ChevronRight } from 'lucide-react';

export default function App() {
  // 1. Move ALL state to the top
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as any) || 'system';
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [view, setView] = useState<'home' | 'categories' | 'admin' | 'executive' | 'profile' | 'auth' | 'privacy' | 'terms' | 'help' | 'about' | 'services' | 'developer'>(() => {
    const saved = localStorage.getItem('currentView');
    const savedUserStr = localStorage.getItem('user');
    const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

    if (!savedUser && (saved === 'admin' || saved === 'executive' || saved === 'profile')) {
      return 'home';
    }
    if (savedUser) {
      if (saved === 'admin' && savedUser.role !== 'admin') return 'home';
      if (saved === 'executive' && savedUser.role !== 'executive' && savedUser.role !== 'admin') return 'home';
    }
    return (saved as any) || 'home';
  });
  const [cartStep, setCartStep] = useState<'cart' | 'checkout'>('cart');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify_otp'>('login');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategoryState] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedCategory');
    return saved !== null && saved !== 'null' ? Number(saved) : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartInitialized, setIsCartInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // 2. Navigation & History Logic
  const navigate = (newView: typeof view, mode: 'push' | 'replace' | 'none' = 'push') => {
    if (view === newView && !isCartOpen) return;
    if (mode === 'push') {
      window.history.pushState({ view: newView, isCartOpen: false, cartStep: 'cart' }, '', '#');
    } else if (mode === 'replace') {
      window.history.replaceState({ view: newView, isCartOpen: false, cartStep: 'cart' }, '', '#');
    }
    setView(newView);
    localStorage.setItem('currentView', newView);
    setIsCartOpen(false);
  };

  useEffect(() => {
    // Sync view with localStorage
    if (view !== 'auth') {
      localStorage.setItem('currentView', view);
    }
  }, [view]);

  // Persist selectedCategory
  const setSelectedCategory = (id: number | null) => {
    setSelectedCategoryState(id);
    localStorage.setItem('selectedCategory', String(id));
  };

  useEffect(() => {
    const handleNav = (e: any) => navigate(e.detail);
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('navTo', handleNav);
    window.addEventListener('openCart', handleOpenCart);
    return () => {
      window.removeEventListener('navTo', handleNav);
      window.removeEventListener('openCart', handleOpenCart);
    };
  }, []);

  useEffect(() => {
    // Push initial home state if needed
    if (!window.history.state) {
      window.history.replaceState({ view: 'home', isCartOpen: false, cartStep: 'cart' }, '', '#');
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state) {
        setView(state.view || 'home');
        setIsCartOpen(state.isCartOpen || false);
        setCartStep(state.cartStep || 'cart');
      } else {
        setView('home');
        setIsCartOpen(false);
        setCartStep('cart');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history when cart state changes
  useEffect(() => {
    if (isCartOpen) {
      const currentState = window.history.state;
      if (!currentState || !currentState.isCartOpen) {
        window.history.pushState({ view, isCartOpen: true, cartStep }, '', '#');
      }
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (isCartOpen && cartStep === 'checkout') {
      const currentState = window.history.state;
      if (!currentState || currentState.cartStep === 'cart') {
        window.history.pushState({ view, isCartOpen: true, cartStep: 'checkout' }, '', '#');
      }
    }
  }, [cartStep]);

  // 3. Effects & API Calls
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    if (themeMode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } else {
      applyTheme(themeMode === 'dark');
    }
  }, [themeMode]);

  useEffect(() => {
    if (user) fetchUserAddresses();
  }, [user]);

  const fetchUserAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses', {
        headers: { 'Authorization': user?.token || '' }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        let addresses = [...data];
        // If user has a base address but it's not in the saved addresses list, add it as virtual id 0
        if (user?.street_address && !data.find(a => a.street_address === user.street_address)) {
          addresses.unshift({
            id: 0,
            name: 'Home',
            street_address: user.street_address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            landmark: user.landmark,
            is_default: true
          });
        }
        setUserAddresses(addresses);
        if (addresses.length > 0 && !selectedLocationId) {
          const def = addresses.find((a: any) => a.is_default) || addresses[0];
          setSelectedLocationId(def.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Only fetch products by category if we're not currently performing a search
    if (!searchQuery) {
      fetchProducts(selectedCategory || undefined);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const fetchProducts = async (categoryId?: number) => {
    const url = categoryId ? `/api/products?category=${categoryId}` : '/api/products';
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data);
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setIsCartInitialized(false);
    localStorage.removeItem('user');
    localStorage.removeItem('currentView');
    localStorage.removeItem('adminTab');
    setView('home');
    setIsSidebarOpen(false);
    setIsCartOpen(false);
  };

  useEffect(() => {
    if (!user) {
      setCart([]);
      setIsCartInitialized(false);
      return;
    }
    setIsCartInitialized(false);
  }, [user?.token]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchProducts(selectedCategory || undefined);
      return;
    }
    // Result handling is in home view mode of Home.tsx
    if (view !== 'home') navigate('home');
    setSelectedCategory(null);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Search failed:", e);
    }
  };

  const addToCart = (product: Product) => {
    if (product.out_of_stock || (product.stock !== undefined && product.stock <= 0)) {
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  useEffect(() => {
    if (!user || !isCartInitialized) {
      return;
    }
    const syncCart = async () => {
      try {
        await fetch('/api/user/cart/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': user.token || ''
          },
          body: JSON.stringify(cart.map(item => ({ product_id: item.id, quantity: item.quantity })))
        });
      } catch (e) { console.error('Sync failed', e); }
    };
    syncCart();
  }, [cart, user, isCartInitialized]);

  const fetchUserCart = async () => {
    if (!user || products.length === 0) return;
    try {
      const res = await fetch('/api/user/cart', {
        headers: { 'Authorization': user.token || '' }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const fullItems = data.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return product ? { ...product, quantity: item.quantity } : null;
        }).filter(Boolean) as CartItem[];
        setCart(fullItems);
      }
    } catch (e) { console.error(e); }
    finally { setIsCartInitialized(true); }
  };

  useEffect(() => {
    if (user && products.length > 0 && !isCartInitialized) {
      fetchUserCart();
    }
  }, [user, products, isCartInitialized]);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const suggestedProducts = useMemo(() => {
    const cartIds = new Set(cart.map(item => item.id));
    return products.filter(p => !cartIds.has(p.id)).slice(0, 5);
  }, [cart, products]);

  // Redirect logged-in users away from auth view to prevent navigation loops
  useEffect(() => {
    if (user && view === 'auth') {
      navigate(user.role === 'admin' ? 'admin' : (user.role === 'executive' ? 'executive' : 'home'), 'replace');
    }
  }, [user, view]);

  // Ensure checkout step cannot be active if cart is empty
  useEffect(() => {
    if (cart.length === 0 && cartStep === 'checkout') {
      setCartStep('cart');
    }
  }, [cart.length, cartStep]);

  const handleCheckout = async (checkoutData: {
    locationId?: number | null,
    pickupLocationId?: number | null,
    deliverySlotId?: number | null,
    pickupSlotId?: number | null,
    couponId?: number | null,
    discountAmount?: number | null,
    order_type?: string
  }) => {
    if (!user) {
      navigate('auth');
      return;
    }
    if (cart.length === 0) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.token || ''
        },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          address_id: checkoutData.locationId || null,
          pickup_location_id: checkoutData.pickupLocationId || null,
          delivery_slot_id: checkoutData.deliverySlotId || null,
          pickup_slot_id: checkoutData.pickupSlotId || null,
          coupon_id: checkoutData.couponId || null,
          discount_amount: checkoutData.discountAmount || 0,
          order_type: checkoutData.order_type || 'delivery'
        })
      });
      if (res.ok) {
        setCart([]);
        setIsCartOpen(false);
        setShowOrderSuccess(true);
        setTimeout(() => {
          setShowOrderSuccess(false);
          const nextView = user.role === 'admin' ? 'admin' : (user.role === 'executive' ? 'executive' : 'profile');
          navigate(nextView as any);
        }, 3000);
      } else {
        const errorData = await res.json();
        alert(`Failed to place order: ${errorData.error || errorData.detail || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error: Failed to reach the server. Please check your connection.');
    }
  };


  // 4. View Switcher
  const renderView = () => {
    if (view === 'auth') return <Auth authMode={authMode} setAuthMode={setAuthMode} setUser={setUser} setView={(v, m) => navigate(v as any, m)} />;
    if (view === 'admin') return <Admin user={user} setView={(v) => navigate(v as any)} products={products} categories={categories} fetchProducts={fetchProducts} />;
    if (view === 'executive') return <Executive user={user} setView={(v) => navigate(v as any)} />;
    if (view === 'profile') return <Profile user={user} setUser={setUser} setView={(v) => navigate(v as any)} themeMode={themeMode} setThemeMode={setThemeMode} userAddresses={userAddresses} fetchUserAddresses={fetchUserAddresses} />;

    if (['privacy', 'terms', 'help', 'about', 'services'].includes(view)) {
      return <Legal page={view as any} setView={(v) => navigate(v as any)} />;
    }
    if (view === 'developer') return <Developer setView={(v) => navigate(v as any)} />;

    return (
      <Home
        products={products}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        setView={(v) => navigate(v as any)}
        viewMode={view === 'categories' ? 'categories' : 'home'}
        user={user}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isInitialLoading ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-24 h-24 bg-emerald-600 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
          >
            <Zap size={48} fill="white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black italic tracking-tighter"
          >
            AK <span className="text-emerald-500">STORE</span>
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="h-1 bg-emerald-600 mt-4 rounded-full"
          />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors w-full overflow-x-hidden relative"
        >
          {!(view === 'admin' || view === 'executive') && (
            <Header
              user={user}
              cartCount={cartCount}
              cartTotal={cartTotal}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              setIsSidebarOpen={setIsSidebarOpen}
              setIsCartOpen={setIsCartOpen}
              setView={(v) => navigate(v as any)}
              setAuthMode={setAuthMode}
              userAddresses={userAddresses}
              selectedLocationId={selectedLocationId}
              setSelectedLocationId={setSelectedLocationId}
              setSelectedCategory={setSelectedCategory}
              handleLogout={handleLogout}
            />
          )}

          <div className={`${(view === 'admin' || view === 'executive') ? 'w-full px-4 py-8' : 'max-w-7xl mx-auto px-4 py-8 flex gap-8 items-start relative'}`}>
            {!(view === 'admin' || view === 'executive') && (
              <Sidebar
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={(id) => {
                  setSelectedCategory(id);
                  setIsSidebarOpen(false);
                  if (view !== 'home' && view !== 'categories') navigate('home');
                }}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                user={user}
                handleLogout={handleLogout}
              />
            )}

            <main className="flex-1 min-w-0">
              {renderView()}
            </main>
          </div>

          {!(view === 'admin' || view === 'executive') && (
            <Footer categories={categories} setView={(v) => navigate(v as any)} setSelectedCategory={setSelectedCategory} />
          )}

          {!(view === 'admin' || view === 'executive') && (
            <BottomNav
              view={view}
              setView={(v) => navigate(v as any)}
              user={user}
              setIsSidebarOpen={setIsSidebarOpen}
              setSelectedCategory={setSelectedCategory}
              cartCount={cartCount}
              openCart={() => setIsCartOpen(true)}
            />
          )}

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            cartTotal={cartTotal}
            cartCount={cartCount}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            handleCheckout={handleCheckout}
            user={user}
            suggestedProducts={suggestedProducts}
            userAddresses={userAddresses}
            selectedLocationId={selectedLocationId}
            setSelectedLocationId={setSelectedLocationId}
            setView={(v) => navigate(v as any)}
            setSelectedCategory={setSelectedCategory}
            step={cartStep}
            setStep={setCartStep}
          />

          {showOrderSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 max-w-sm w-full text-center shadow-2xl flex flex-col items-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-500/5" />
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 relative z-10 animate-bounce">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic mb-2 relative z-10">Order Placed!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold relative z-10">Your items are being prepared.</p>
              </motion.div>
            </motion.div>
          )}

          {cartCount > 0 && !isCartOpen && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="lg:hidden fixed bottom-20 left-4 right-4 z-[45]"
            >
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-between animate-in slide-in-from-bottom border border-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{cartCount} {cartCount === 1 ? 'Item' : 'Items'} added</span>
                    <span className="text-lg font-black italic tracking-tighter">Total ₹{cartTotal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white/20 px-4 py-2 rounded-xl">
                  View Cart <ChevronRight size={16} />
                </div>
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
