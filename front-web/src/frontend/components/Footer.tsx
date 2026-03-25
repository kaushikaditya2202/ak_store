import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Zap, ChevronRight } from 'lucide-react';
import { Category } from '../../types';

interface FooterProps {
  categories: Category[];
  setView: (view: any) => void;
  setSelectedCategory: (id: number | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, setView, setSelectedCategory }) => {
  const rootCategories = categories.filter(c => !c.parent_id);

  const handleCategoryClick = (id: number) => {
    setView('home');
    setSelectedCategory(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-24 lg:pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {/* Brand Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('home'); setSelectedCategory(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Zap size={24} fill="white" />
            </div>
            <h1 className="text-2xl font-black text-emerald-600 tracking-tighter">AK Store</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
            Your daily essentials, delivered exactly when you need them. Experience reliable slot-based grocery delivery in your city with AK Store.
          </p>
          <div className="flex items-center gap-4">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest mb-6">Popular Categories</h4>
          <ul className="space-y-3">
            {rootCategories.slice(0, 6).map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className="text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                >
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest mb-6">Customer Support</h4>
          <ul className="space-y-3">
            {[
              { label: 'My Account', view: 'profile' },
              { label: 'Order History', view: 'profile' },
              { label: 'Help Center', view: 'help' },
              { label: 'Our Services', view: 'services' },
              { label: 'About Us', view: 'about' },
              { label: 'Privacy Policy', view: 'privacy' },
              { label: 'Terms of Service', view: 'terms' }
            ].map((item, i) => (
              <li key={i}>
                <button
                  onClick={() => { if (item.view) { setView(item.view); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                  className="text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group text-left"
                >
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest mb-6">Get In Touch</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-emerald-600 dark:text-emerald-400"><MapPin size={18} /></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Bank Road<br />Raxaul, Bihar 845305</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-emerald-600 dark:text-emerald-400"><Phone size={18} /></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">+91 98765 43210</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-emerald-600 dark:text-emerald-400"><Mail size={18} /></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">akstorerxl@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900">
            <Zap size={18} fill="currentColor" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            © 2026 AK<br />All rights reserved.
          </p>
        </div>

        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-right">
          Developed by <button onClick={() => { setView('developer'); window.scrollTo(0, 0); }} className="text-emerald-600 hover:text-emerald-500 transition-colors uppercase font-black">AK</button>
        </p>
      </div>
    </footer>
  );
};
