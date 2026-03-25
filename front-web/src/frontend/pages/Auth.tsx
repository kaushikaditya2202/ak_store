import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Phone, User as UserIcon, Mail, MapPin } from 'lucide-react';
import { User } from '../../types';

interface AuthProps {
  authMode: 'login' | 'signup' | 'verify_otp';
  setAuthMode: (mode: 'login' | 'signup' | 'verify_otp') => void;
  setUser: (user: User) => void;
  setView: (view: any, mode?: 'push' | 'replace' | 'none') => void;
}

export const Auth: React.FC<AuthProps> = ({ authMode, setAuthMode, setUser, setView }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, phone, name, password,
          street_address: streetAddress, city, state, pincode, landmark
        })
      });
      const data = await res.json();
      if (res.ok) {
        await requestOtp(phone);
      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch (e) {
      console.error('Signup error:', e);
      setError('Connection error. Please check if the server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setView(data.role === 'admin' ? 'admin' : (data.role === 'executive' ? 'executive' : 'home'), 'replace');
      } else {
        setError(data.error || 'Invalid credentials. Please check your phone and password.');
      }
    } catch (e) {
      console.error('Login error:', e);
      setError('Connection refused. Please check if the server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async (phoneNumber: string) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'OTP sent to your registered email');
        setAuthMode('verify_otp');
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (e) {
      console.error('Request OTP error:', e);
      setError('Connection error. Please check if the server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setView(data.role === 'admin' ? 'admin' : (data.role === 'executive' ? 'executive' : 'home'), 'replace');
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (e) {
      console.error('OTP verify error:', e);
      setError('Connection error. Please try again (Port 8000).');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-16 flex items-center px-6 sticky top-0 z-50">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2 text-slate-900 dark:text-white font-black italic tracking-tighter text-xl group"
        >
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 group-hover:scale-110 transition-transform">
            <ArrowLeft size={18} />
          </div>
          AK <span className="text-emerald-600">STORE</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-50 dark:border-slate-800 relative overflow-hidden">
          {/* Accent Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 italic tracking-tighter uppercase">
              {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Join Us' : 'Verify OTP'}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest mb-8">
              {authMode === 'login' ? 'Login to continue shopping' : authMode === 'signup' ? 'Create your account' : 'Check your email for code'}
            </p>

            {message && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest text-center animate-in zoom-in-95">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest text-center animate-in shake">
                {error}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleVerifyOtp} className="space-y-5">
              {authMode === 'signup' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                      <div className="relative">
                        <input type="text" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold transition-all outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
                      <div className="relative">
                        <input type="tel" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold transition-all outline-none" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email (for OTPs)</label>
                    <div className="relative">
                      <input type="email" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold transition-all outline-none" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-12 py-3 text-sm font-bold transition-all outline-none" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-4 text-slate-400">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Delivery Address</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Street Address</label>
                      <div className="relative">
                        <input type="text" required placeholder="House No, Building, Street" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold transition-all outline-none" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} />
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">City</label>
                        <input type="text" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none" value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">State</label>
                        <input type="text" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none" value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pincode</label>
                        <input type="text" required placeholder="6-digit" maxLength={6} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none" value={pincode} onChange={e => setPincode(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Landmark (Optional)</label>
                      <input type="text" placeholder="Near..., Building Name, etc." className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none" value={landmark} onChange={e => setLandmark(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {authMode === 'login' && (
                <div className="space-y-5 py-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                    <div className="relative">
                      <input type="tel" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold transition-all outline-none" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter 10-digit number" />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-12 py-3 text-sm font-bold transition-all outline-none" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {authMode === 'verify_otp' && (
                <div className="space-y-6 py-6 text-center">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enter 6-digit Code</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-3xl px-6 py-4 text-2xl font-black text-center tracking-[0.5em] transition-all outline-none"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      maxLength={6}
                      placeholder="000000"
                    />
                    <p className="text-[10px] font-bold text-slate-400">Didn't receive code? <button type="button" onClick={() => requestOtp(phone)} className="text-emerald-600 font-black">Resend</button></p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  authMode === 'login' ? 'Proceed to Shopping' : authMode === 'signup' ? 'Create My Account' : 'Verify & Continue'
                )}
              </button>
            </form>

            {authMode !== 'verify_otp' && (
              <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {authMode === 'login' ? "New to AK Store?" : "Already a member?"}
                  <button
                    onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
                    className="ml-2 text-emerald-600 font-black uppercase tracking-tighter hover:underline"
                  >
                    {authMode === 'login' ? 'Register Now' : 'Sign In instead'}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
