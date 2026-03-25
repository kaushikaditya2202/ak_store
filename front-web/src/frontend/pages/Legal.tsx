import React from 'react';
import { Shield, FileText, HelpCircle, Users, Zap, ArrowLeft, Target, Award, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalProps {
  page: 'privacy' | 'terms' | 'help' | 'about' | 'services';
  setView: (view: any) => void;
}

export const Legal: React.FC<LegalProps> = ({ page, setView }) => {
  const content = {
    privacy: {
      title: "Privacy Policy",
      icon: <Shield className="text-emerald-600" size={32} />,
      sections: [
        { subtitle: "1. Information We Collect", body: "We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes your name, email, phone number, and delivery address." },
        { subtitle: "2. How We Use Your Data", body: "Your information is used to process your orders, maintain your account, and send you important updates about our service. We do not sell your personal data to third parties." },
        { subtitle: "3. Data Security", body: "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure." }
      ]
    },
    terms: {
      title: "Terms of Service",
      icon: <FileText className="text-emerald-600" size={32} />,
      sections: [
        { subtitle: "1. Service Eligibility", body: "You must be at least 18 years old to use AK Store. By using our service, you agree to provide accurate and complete information." },
        { subtitle: "2. Delivery & Returns", body: "We promise delivery within your chosen time slot. Fresh products like fruits and vegetables can be returned at the doorstep if quality is not satisfactory." },
        { subtitle: "3. Payment", body: "We accept digital payments and cash on delivery. All prices include applicable taxes unless stated otherwise." }
      ]
    },
    help: {
      title: "Help Center",
      icon: <HelpCircle className="text-emerald-600" size={32} />,
      sections: [
        { subtitle: "How do I track my order?", body: "You can track your order live from the 'Order History' section in your profile. You'll see real-time status updates from pending to delivered." },
        { subtitle: "Can I cancel my order?", body: "Orders can be cancelled before picking process begins. After that, we start packing your fresh items to ensure timely delivery." },
        { subtitle: "My item is missing or damaged?", body: "Please contact us at akstorerxl@gmail.com or call our helpline +91 98765 43210 immediately for a refund or replacement." }
      ]
    },
    about: {
      title: "About AK Store",
      icon: <Users className="text-emerald-600" size={32} />,
      sections: [
        { subtitle: "Our Mission", body: "At AK Store, we believe that grocery shopping should be effortless and reliable. Our mission is to deliver the freshest products to your doorstep consistently." },
        { subtitle: "Speed & Quality", body: "We've built a hyper-local delivery network that ensures your milk is cold and your vegetables are crisp when they reach you. We prioritize quality over everything." },
        { subtitle: "Powered by AKmedia", body: "AK Store is a technological marvel developed by AK, combining state-of-the-art inventory management with a seamless user experience." }
      ]
    },
    services: {
      title: "Our Services",
      icon: <Zap className="text-emerald-600" size={32} />,
      sections: [
        { subtitle: "1. Reliable Delivery", body: "We promise delivery within your carefully selected time slot across our service zones. Fresh items are prioritized to reach you in optimum condition." },
        { subtitle: "2. Quality Assurance", body: "Every item undergoes a rigorous quality check. From fresh produce to packaged goods, we only deliver what we would consume ourselves." },
        { subtitle: "3. 24/7 Customer Support", body: "Our customer success team is available round the clock to assist you with order tracking, returns, and any other queries." }
      ]
    }
  };

  const currentPage = content[page];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => { setView('home'); window.scrollTo(0, 0); }}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center">
              {currentPage.icon}
            </div>
            <div>
              <h1 className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter">{currentPage.title}</h1>
              <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">AK Store Marketplace</p>
            </div>
          </div>

          <div className="space-y-12">
            {currentPage.sections.map((sec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-black italic text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> {sec.subtitle}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg">
                  {sec.body}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 pt-12 border-t border-slate-50 dark:border-slate-800 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Zap size={18} fill="white" />
              </div>
              <span className="text-xl font-black italic text-emerald-600">AK Store</span>
            </div>
            <p
              onClick={() => { setView('developer'); window.scrollTo(0, 0); }}
              className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-center hover:text-emerald-500 transition-colors cursor-pointer"
            >
              © 2026 AKmedia Pvt. Limited.<br />
              Developed by AKmedia Pvt. Limited
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
