import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, ChevronRight, ArrowLeft, LayoutGrid, Zap, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { Product, CartItem, Category, User } from '../../types';

interface HomeProps {
  products: Product[];
  categories: Category[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  cart: CartItem[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: number) => void;
  viewMode?: 'home' | 'categories';
  setView: (view: any) => void;
  user: User | null;
  searchQuery?: string;
}

export const Home: React.FC<HomeProps> = ({
  products, categories, selectedCategory, setSelectedCategory, cart, addToCart, removeFromCart, setView, user, searchQuery, viewMode = 'home'
}) => {
  const rootCategories = categories.filter(c => !c.parent_id);
  const selectedCatObj = categories.find(c => c.id === selectedCategory);

  // If selected category is a subcategory, find its parent
  const parentCat = selectedCatObj?.parent_id ? categories.find(c => c.id === selectedCatObj.parent_id) : selectedCatObj;
  const orderedRootCategories = parentCat
    ? [
        ...rootCategories.filter(c => c.id === parentCat.id),
        ...rootCategories.filter(c => c.id !== parentCat.id),
      ]
    : rootCategories;
  const subCategories = parentCat ? categories.filter(c => c.parent_id === parentCat.id) : [];
  const parentCategoryProductIds = new Set(subCategories.map(c => c.id));

  const matchesSelectedCategory = (product: Product) => {
    if (!selectedCategory) {
      return true;
    }
    if (selectedCategory === parentCat?.id) {
      return product.category_id === selectedCategory || parentCategoryProductIds.has(product.category_id);
    }
    return product.category_id === selectedCategory;
  };

  const [showAllCats, setShowAllCats] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [catLimit, setCatLimit] = useState(5);
  const contentRef = useRef<HTMLDivElement>(null);
  const categoryHeaderRef = useRef<HTMLDivElement>(null);
  const shouldScrollToCategoryHeaderRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setCatLimit(window.innerWidth < 640 ? 7 : 5);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slides = [
    {
      title: "We are now live!",
      subtitle: "In your city",
      description: "Fast delivery right to your doorstep in at your choice.",
      badge: "Big News",
      accent: "bg-white/20",
      bg: "bg-gradient-to-r from-emerald-500 to-teal-600"
    },
    {
      title: "Direct Savings",
      subtitle: "Best Offers Always",
      description: "Existing offers and discounts applied automatically. No codes needed!",
      badge: "Existing offers",
      accent: "bg-blue-400/20",
      bg: "bg-gradient-to-r from-blue-600 to-indigo-700"
    },
    {
      title: "Custom Selection",
      subtitle: "Products your choice",
      description: "Get exactly what you need, fresh and high quality at best rates.",
      badge: "Personalized",
      accent: "bg-rose-400/20",
      bg: "bg-gradient-to-r from-purple-600 to-rose-600"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedCategory || !shouldScrollToCategoryHeaderRef.current) {
      return;
    }

    const header = categoryHeaderRef.current;
    if (!header) {
      return;
    }

    requestAnimationFrame(() => {
      header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      shouldScrollToCategoryHeaderRef.current = false;
    });
  }, [selectedCategory]);

  const handleCategoryClick = (id: number) => {
    shouldScrollToCategoryHeaderRef.current = true;
    setSelectedCategory(id);
  };

  const renderCategoryView = () => (
    <div className="flex items-start gap-0 min-h-[calc(100vh-140px)] overflow-visible rounded-3xl sm:border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* Mobile/Tablet Sidebar (Hidden on Large screens) */}
      <div className="w-20 sm:w-24 lg:hidden bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 overflow-visible flex flex-col items-center py-4 gap-3 shrink-0 self-stretch">
        {orderedRootCategories.map(cat => {
          const isParentActive = selectedCategory === cat.id || parentCat?.id === cat.id;
          const mobileSubcategories = categories.filter(c => c.parent_id === cat.id);

          return (
            <div key={cat.id} className="w-full px-1">
              <div
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-1 cursor-pointer w-full"
              >
                <div className={`w-12 h-12 shrink-0 rounded-[14px] overflow-hidden border transition-all ${isParentActive
                  ? 'border-emerald-500 bg-white shadow-md shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 opacity-70 hover:opacity-100'
                  }`}>
                  {cat.image_url ? (
                    <img src={cat.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase">{cat.name[0]}</div>
                  )}
                </div>
                <span className={`text-[9px] font-black text-center leading-tight uppercase tracking-tighter line-clamp-2 px-0.5 ${isParentActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {cat.name}
                </span>
              </div>

              {isParentActive && mobileSubcategories.length > 0 && (
                <div className="mt-2 ml-3 flex flex-col items-start gap-2 border-l border-emerald-200 pl-2.5">
                  {mobileSubcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleCategoryClick(sub.id)}
                      className="flex flex-col items-center gap-1 text-left"
                    >
                      <div className={`w-9 h-9 rounded-[10px] overflow-hidden border ${selectedCategory === sub.id ? 'border-emerald-500 bg-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                        {sub.image_url ? (
                          <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-black text-[9px] uppercase">{sub.name[0]}</div>
                        )}
                      </div>
                      <span className={`max-w-[46px] text-[8px] font-black leading-tight text-center ${selectedCategory === sub.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Product Area */}
      <div className="flex-1 overflow-visible p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 border-l lg:border-none border-slate-100 dark:border-slate-800 relative w-full min-h-full pb-24">
        <div ref={categoryHeaderRef} className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-20 py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-sm sm:text-2xl lg:text-3xl text-slate-900 dark:text-white uppercase tracking-tighter italic">
              {selectedCategory ? parentCat?.name : 'All Products'}
            </h3>
          </div>
          <span className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.18em] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            {selectedCategory
              ? products.filter(matchesSelectedCategory).length
              : products.length
            } Items
          </span>
        </div>

        <div className="flex flex-col gap-6">
          <div className="lg:hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {(selectedCategory
                ? products.filter(matchesSelectedCategory)
                : products
              ).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItem={cart.find(item => item.id === product.id)}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  onClick={setSelectedProductForModal}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-8">
            {(() => {
              const directParentProducts = parentCat
                ? products.filter(product => product.category_id === parentCat.id)
                : [];

              const groupedSections = [
                ...(selectedCategory === parentCat?.id && directParentProducts.length > 0
                  ? [{ id: `parent-${parentCat.id}`, name: parentCat.name, items: directParentProducts }]
                  : []),
                ...((selectedCategory === parentCat?.id ? subCategories : subCategories.filter(sub => sub.id === selectedCategory))
                  .map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    items: products.filter(product => product.category_id === sub.id),
                  }))
                  .filter(section => section.items.length > 0)),
              ];

              if (groupedSections.length === 0) {
                return (
                  <div className="grid grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
                    {products.filter(matchesSelectedCategory).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartItem={cart.find(item => item.id === product.id)}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        onClick={setSelectedProductForModal}
                        compact
                      />
                    ))}
                  </div>
                );
              }

              return groupedSections.map(section => (
                <section key={section.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-7 rounded-full bg-emerald-500"></div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      {section.name}
                    </h4>
                  </div>
                  <div className="grid grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
                    {section.items.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartItem={cart.find(item => item.id === product.id)}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        onClick={setSelectedProductForModal}
                        compact
                      />
                    ))}
                  </div>
                </section>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesGrid = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 lg:py-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:max-w-2xl sm:mx-auto">
        <button
          onClick={() => { setSelectedCategory(0); setView('categories'); }}
          className={`flex-1 px-4 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${selectedCategory === 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700'}`}
        >
          <div className={`${selectedCategory === 0 ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30'} p-2 rounded-xl`}>
            <Zap size={18} className={selectedCategory === 0 ? 'text-white' : 'text-emerald-600'} fill={selectedCategory === 0 ? "white" : "none"} />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">All Products</span>
        </button>

        <button
          onClick={() => { setSelectedCategory(null); setView('categories'); }}
          className={`flex-1 px-4 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${selectedCategory === null ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-100 dark:border-slate-700'}`}
        >
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30">
            <LayoutGrid size={18} />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">Explore Categories</span>
        </button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-10">
        {orderedRootCategories.map(cat => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="flex flex-col items-center gap-2 lg:gap-3 cursor-pointer group"
          >
            <div className="relative aspect-square w-full rounded-2xl lg:rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm group-hover:border-emerald-200 group-hover:-translate-y-1 transition-all duration-300">
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <LayoutGrid size={24} strokeWidth={1} />
                </div>
              )}
            </div>
            <span className="text-[10px] lg:text-xs font-black text-center text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-tighter line-clamp-2 px-1 group-hover:text-emerald-600 transition-colors">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );



  if (searchQuery) {
    return (
      <main className="flex-1 min-w-0" ref={contentRef}>
        <div className="px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-10 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40"></div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">Search Results</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found {products.length} items for "{searchQuery}"</p>
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItem={cart.find(item => item.id === product.id)}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  onClick={setSelectedProductForModal}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <Package size={40} strokeWidth={1} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">No products found</h4>
                <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto mt-1">Try searching for something else or browse categories.</p>
              </div>
            </div>
          )}
        </div>
        <ProductDetailsModal
          isOpen={selectedProductForModal !== null}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
          cartItem={selectedProductForModal ? cart.find(item => item.id === selectedProductForModal.id) : undefined}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          user={user}
        />
      </main>
    );
  }

  if (viewMode === 'categories') {
    return (
      <main className="flex-1 min-w-0">
        {(selectedCategory !== null) ? renderCategoryView() : (
          <div className="px-4">
            {renderCategoriesGrid()}
          </div>
        )}
        <ProductDetailsModal
          isOpen={selectedProductForModal !== null}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
          cartItem={selectedProductForModal ? cart.find(item => item.id === selectedProductForModal.id) : undefined}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          user={user}
        />
      </main>
    );
  }

  // Banner Carousel Section
  const renderBanner = () => (
    <div className="relative mb-8 overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl shadow-emerald-500/10 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`relative h-[220px] sm:h-[300px] lg:h-[420px] ${slides[currentSlide].bg} flex items-center overflow-hidden`}
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>

          <div className="relative z-10 px-6 sm:px-12 lg:px-20 w-full flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`inline-block px-4 py-1.5 ${slides[currentSlide].accent} backdrop-blur-xl rounded-full text-[10px] md:text-sm font-black uppercase tracking-[0.2em] mb-4 border border-white/20 shadow-xl`}
            >
              {slides[currentSlide].badge}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-2xl sm:text-5xl lg:text-7xl font-black mb-3 italic leading-[0.95] tracking-tighter"
            >
              {slides[currentSlide].title} <br />
              <span className="text-white/80">{slides[currentSlide].subtitle}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-white/80 mb-6 font-bold text-[10px] sm:text-base lg:text-xl max-w-[200px] sm:max-w-md lg:max-w-xl line-clamp-2 md:line-clamp-none"
            >
              {slides[currentSlide].description}
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setSelectedCategory(0); setView('categories'); }}
              className="bg-white text-slate-900 px-8 py-3 lg:px-10 lg:py-4 rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-emerald-50 transition-all"
            >
              Explore Now
            </motion.button>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 hidden md:block transform rotate-12 scale-150 translate-x-1/4 translate-y-1/4 pointer-events-none">
            <ShoppingCart size={400} strokeWidth={1} className="text-white" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );

  if (selectedCategory !== null) {
    return (
      <main className="flex-1 min-w-0" ref={contentRef}>
        {renderCategoryView()}
      </main>
    );
  }

  if (searchQuery) {
    return (
      <main className="flex-1 min-w-0" ref={contentRef}>
        <div className="px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-10 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40"></div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">Search Results</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found {products.length} items for "{searchQuery}"</p>
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItem={cart.find(item => item.id === product.id)}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  onClick={setSelectedProductForModal}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <Package size={40} strokeWidth={1} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic italic tracking-tight">No products found</h4>
                <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto mt-1">Try searching for something else or browse categories.</p>
              </div>
            </div>
          )}
        </div>
        <ProductDetailsModal
          isOpen={selectedProductForModal !== null}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
          cartItem={selectedProductForModal ? cart.find(item => item.id === selectedProductForModal.id) : undefined}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          user={user}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0" ref={contentRef}>
      <div className="block">
        {renderBanner()}

        {/* Feature Highlights Bar */}
        {!selectedCategory && (
          <div className="flex overflow-x-auto gap-4 md:gap-8 pb-10 scrollbar-hide">
            {[
              { icon: <Zap size={22} className="text-amber-500" />, title: "Convenient", sub: "Slot-based delivery" },
              { icon: <ShoppingCart size={22} className="text-emerald-500" />, title: "Best Prices", sub: "Cheaper than local" },
              { icon: <Package size={22} className="text-blue-500" />, title: "Fresh Stocks", sub: "Quality guaranteed" },
              { icon: <ArrowLeft size={22} className="rotate-180 text-rose-500" />, title: "Easy Returns", sub: "No questions asked" }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm min-w-[200px] flex-1 hover:scale-105 transition-transform duration-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{f.title}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories Section - Clean Grid like Zepto */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex flex-col">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">
                Categories
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Shop by what you love</p>
            </div>
            <button
              onClick={() => {
                if (showAllCats) {
                  setShowAllCats(false);
                } else {
                  setShowAllCats(true);
                }
              }}
              className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800"
            >
              {showAllCats ? 'See Less' : 'See All'}
            </button>
          </div>

          <div className={`grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10 transition-all duration-500 px-2 ${showAllCats ? '' : 'max-h-[350px] sm:max-h-[300px] overflow-hidden'}`}>
            {rootCategories.slice(0, catLimit).map(cat => (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-2 md:gap-3 cursor-pointer group min-w-[72px] sm:min-w-[84px] lg:min-w-0 flex-1 snap-start"
              >
                <div className="relative aspect-square w-full rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 border-2 border-slate-50 dark:border-slate-900 bg-white dark:bg-slate-900 shadow-sm group-hover:border-emerald-200 group-hover:-translate-y-1">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black text-2xl uppercase italic">
                      {cat.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-[9px] md:text-[11px] font-black text-center leading-[1.1] uppercase tracking-tighter italic transition-all line-clamp-2 px-1 text-slate-600 dark:text-slate-400">
                  {cat.name}
                </span>
              </div>
            ))}
            {/* View More Button */}
            <div
              onClick={() => { setShowAllCats(true); }}
              className={`flex flex-col items-center gap-2 md:gap-3 cursor-pointer group min-w-[72px] sm:min-w-[84px] lg:min-w-0 flex-1 snap-start ${showAllCats ? 'hidden' : 'flex'}`}
            >
              <div className="relative aspect-square w-full rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 border-2 border-slate-50 dark:border-slate-900 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shadow-sm group-hover:border-emerald-200 group-hover:-translate-y-1">
                <ChevronRight size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[9px] md:text-[11px] font-black text-center leading-[1.1] uppercase tracking-tighter italic transition-all line-clamp-2 px-1 text-emerald-600">
                View More
              </span>
            </div>
            {showAllCats && rootCategories.slice(catLimit).map(cat => (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-2 md:gap-3 cursor-pointer group min-w-[72px] sm:min-w-[84px] lg:min-w-0 flex-1 snap-start"
              >
                <div className="relative aspect-square w-full rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 border-2 border-slate-50 dark:border-slate-900 bg-white dark:bg-slate-900 shadow-sm group-hover:border-emerald-200 group-hover:-translate-y-1">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black text-2xl uppercase italic">
                      {cat.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-[9px] md:text-[11px] font-black text-center leading-[1.1] uppercase tracking-tighter italic transition-all line-clamp-2 px-1 text-slate-600 dark:text-slate-400">
                  {cat.name}
                </span>
              </div>
            ))}
            {/* View More Button for redirect */}
            <div
              onClick={() => { setSelectedCategory(0); setView('categories'); }}
              className={`flex flex-col items-center gap-2 md:gap-3 cursor-pointer group min-w-[72px] sm:min-w-[84px] lg:min-w-0 flex-1 snap-start ${showAllCats ? 'flex' : 'hidden'}`}
            >
              <div className="relative aspect-square w-full rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 border-2 border-slate-50 dark:border-slate-900 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shadow-sm group-hover:border-emerald-200 group-hover:-translate-y-1">
                <ChevronRight size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[9px] md:text-[11px] font-black text-center leading-[1.1] uppercase tracking-tighter italic transition-all line-clamp-2 px-1 text-emerald-600">
                All Products
              </span>
            </div>
          </div>
        </div>

        {/* Active Category View */}
        {selectedCategory && (
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-10 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40"></div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{selectedCatObj?.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100 shadow-sm"
              >
                &larr; Back to Shop
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
              {products.filter(matchesSelectedCategory).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartItem={cart.find(item => item.id === product.id)}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  onClick={setSelectedProductForModal}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Product Shelves */}
        {!selectedCategory && (
          <div className="space-y-16 md:space-y-24 pb-20">
            {orderedRootCategories.map((cat, index) => {
              const catProducts = products.filter(p => {
                const subCatIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
                return p.category_id === cat.id || subCatIds.includes(p.category_id);
              });
              if (catProducts.length === 0) return null;

              const variants = [
                { bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', accent: 'text-emerald-600', dot: 'bg-emerald-500' },
                { bg: 'bg-amber-50/50 dark:bg-amber-950/20', accent: 'text-amber-600', dot: 'bg-amber-500' },
                { bg: 'bg-rose-50/50 dark:bg-rose-950/20', accent: 'text-rose-600', dot: 'bg-rose-500' },
                { bg: 'bg-indigo-50/50 dark:bg-indigo-950/20', accent: 'text-indigo-600', dot: 'bg-indigo-500' }
              ];
              const variant = variants[index % variants.length];

              return (
                <section key={cat.id} className={`-mx-4 px-4 py-10 md:mx-0 md:px-10 md:rounded-[3rem] transition-all duration-500 ${variant.bg} border-y md:border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group/shelf`}>
                  {/* Background Accents */}
                  <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${variant.dot}`}></div>

                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-8 ${variant.dot} rounded-full`}></div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase italic leading-none">{cat.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Quickly Curated For You</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCategoryClick(cat.id)}
                      className="group flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:gap-4 transition-all"
                    >
                      View All <ChevronRight size={14} className={variant.accent} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-3">
                    {catProducts.slice(0, 7).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartItem={cart.find(item => item.id === product.id)}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        onClick={setSelectedProductForModal}
                        compact
                        blendBg
                      />
                    ))}
                    {catProducts.length > 7 && (
                      <div
                        onClick={() => handleCategoryClick(cat.id)}
                        className="aspect-[0.96] flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[1rem] border border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group/seeall"
                      >
                        <div className={`p-2.5 rounded-full mb-2 group-hover/seeall:scale-110 transition-transform bg-slate-50 dark:bg-slate-700`}>
                          <ChevronRight size={18} className={variant.accent} />
                        </div>
                        <span className="font-black text-[9px] uppercase tracking-widest text-slate-400 group-hover/seeall:text-emerald-600 text-center px-2">View More</span>
                        <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-500">+{catProducts.length - 7}</span>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <ProductDetailsModal
        isOpen={selectedProductForModal !== null}
        onClose={() => setSelectedProductForModal(null)}
        product={selectedProductForModal}
        cartItem={selectedProductForModal ? cart.find(item => item.id === selectedProductForModal.id) : undefined}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        user={user}
      />
    </main>
  );
};
