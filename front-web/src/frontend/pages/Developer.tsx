import React from 'react';
import { 
  ArrowLeft, Mail, Phone, MapPin, Code, Smartphone, Zap, Brain, 
  Palette, Cloud, Github, Linkedin, Twitter, Layout
} from 'lucide-react';
import { motion } from 'motion/react';

interface DeveloperProps {
  setView: (view: any) => void;
}

interface Service {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export const Developer: React.FC<DeveloperProps> = ({ setView }) => {

  const services: Service[] = [
    {
      id: 1,
      icon: <Code className="w-8 h-8" />,
      title: "Website Design & Development",
      description: "Beautiful, responsive, and high-performing websites tailored to your vision. From concept to deployment.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      id: 2,
      icon: <Brain className="w-8 h-8" />,
      title: "AI & Machine Learning APIs",
      description: "Custom AI solutions including chatbots, recommendation systems, image processing, and NLP integration.",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile App Development",
      description: "Cross-platform mobile applications with native performance and seamless user experience.",
      color: "from-blue-500 to-indigo-500"
    },
    {
      id: 4,
      icon: <Palette className="w-8 h-8" />,
      title: "UI/UX Design",
      description: "User-centered design solutions that are both beautiful and functional across all devices.",
      color: "from-pink-500 to-rose-500"
    },
    {
      id: 5,
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud Infrastructure",
      description: "Scalable cloud solutions with deployment, optimization, and continuous integration support.",
      color: "from-cyan-500 to-blue-500"
    },
    {
      id: 6,
      icon: <Zap className="w-8 h-8" />,
      title: "Full Custom Solutions",
      description: "End-to-end project development from planning and design to deployment and maintenance.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => { setView('home'); window.scrollTo(0, 0); }}
            className="flex items-center gap-2 text-slate-400 font-bold hover:text-emerald-400 transition-all mb-12 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
          </motion.button>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-20 lg:mb-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-6">
                <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full">
                  ✨ Creative Developer Collective
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight">
                Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Digital Tomorrow</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl">
                A passionate developers, designers, and tech enthusiasts dedicated to create exceptional digital experiences. Specialize in crafting innovative websites, powerful APIs, intelligent AI solutions, and scalable applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-3 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-white font-bold rounded-lg transition-all">
                  Our Services
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-3xl sm:rounded-4xl border border-white/5 backdrop-blur-3xl p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 sm:p-8">
                  <Code className="text-emerald-500 opacity-20 w-24 h-24 sm:w-32 sm:h-32" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6">What We Do</div>
                  <div className="space-y-4 sm:space-y-6">
                    {[
                      { icon: <Code size={20} />, text: "Web Development" },
                      { icon: <Brain size={20} />, text: "AI & ML Solutions" },
                      { icon: <Layout size={20} />, text: "Design & UX" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                          {item.icon}
                        </div>
                        <span className="font-bold text-sm sm:text-base">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Services Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 lg:mb-32"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-slate-700 transition-all group cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20`}>
                    {service.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-slate-400 text-sm sm:text-base">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 lg:mb-32"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-12">Get in Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Mail size={24} />, title: "Email", detail: "kaushikaditya943@gmail.com", color: "from-pink-500 to-rose-500" },
                { icon: <Phone size={24} />, title: "Phone", detail: "+91 82102 82166", color: "from-emerald-500 to-teal-500" },
                { icon: <MapPin size={24} />, title: "Location", detail: "Pune, Maharashtra - India", color: "from-blue-500 to-indigo-500" }
              ].map((contact, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-white/10 transition-all group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center mb-4 shadow-lg shadow-black/20`}>
                    {contact.icon}
                  </div>
                  <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{contact.title}</h3>
                  <p className="text-lg font-bold">{contact.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center mb-20 lg:mb-32"
          >
            <h2 className="text-2xl sm:text-4xl font-black mb-4">Ready to Build Something Amazing?</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-sm sm:text-base">
              Whether you need a stunning website, intelligent APIs, or a complete digital transformation, we're here to help bring your vision to life.
            </p>
            <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 active:scale-95" onClick={() => window.location.href = 'mailto:kaushikaditya943@gmail.com'}>
              Contact
            </button>
          </motion.div>

          {/* Footer */}
          <div className="pt-12 border-t border-slate-800 text-center pb-12">
            <p className="text-slate-500 font-semibold text-sm mb-6">
              AK Developer Collective © 2026 - Crafting Digital Excellence
            </p>
            <div className="flex justify-center gap-6">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
