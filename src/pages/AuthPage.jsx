import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardPathByRole, setAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/contexts/locale-context';

const meshBackground = "/assets/mesh_5.png";

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => '');
  if (text) {
    return { message: text };
  }

  return { message: fallbackMessage };
}

function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'login';
  const isLogin = mode === 'login';
  const { toast } = useToast();
  const { t } = useLocale();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEduEmail = (email) => {
    const e = email.trim();
    const eduIntl = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-z]{2})?$/i;
    const eduTr = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.tr$/i;
    return eduIntl.test(e) || eduTr.test(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    // Custom Validation to replace ugly browser popups
    if (!isLogin) {
      if (!formData.firstName) return setError('First name is required.');
      if (!formData.lastName) return setError('Last name is required.');
      if (!formData.role) return setError('Please select a designation.');
    }
    if (!formData.email) return setError('Institutional email is required.');
    if (!formData.password) return setError('Secure password is required.');

    if (!isLogin && !validateEduEmail(formData.email)) {
      setError('Institution verified .edu email required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        });

        const data = await parseApiResponse(
          response,
          'Login failed. Server did not return a valid response.',
        );
        if (!response.ok) {
          throw new Error(data.errors?.[0] || data.message || 'Login failed.');
        }

        setAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        navigate(getDashboardPathByRole(data.user.role));
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          }),
        });

        const data = await parseApiResponse(
          response,
          'Registration failed. Server did not return a valid response.',
        );
        if (!response.ok) {
          throw new Error(data.errors?.[0] || data.message || 'Registration failed.');
        }

        const infoMsg = data.message || 'Registration successful. Please verify your email, then sign in.';
        setInfo(infoMsg);
      toast({ title: t('authRegisterSuccessTitle', 'Registration successful'), description: infoMsg, variant: 'success' });
        setSearchParams({ mode: 'login' });
        setFormData({ email: formData.email, password: '', firstName: '', lastName: '', role: '' });
      }
    } catch (submitError) {
      setError(submitError.message);
    toast({ title: t('errorTitle', 'Error'), description: submitError.message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setSearchParams({ mode: isLogin ? 'register' : 'login' });
    setError('');
    setInfo('');
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      
      {/* Left Aesthetic Pane */}
      <div className="relative hidden w-full md:flex md:w-1/2 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={meshBackground} alt="Holographic Mesh" className="w-full h-full object-cover saturate-150 contrast-125 opacity-90 dark:opacity-70 dark:mix-blend-screen" />
          <div className="absolute inset-0 bg-background/20 backdrop-blur-md mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/90"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-start px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-serif text-5xl lg:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white drop-shadow-lg dark:drop-shadow-2xl leading-none">
              Co-create the <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-300 dark:to-indigo-500">Future of Medical Tech.</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-800 dark:text-white/80 font-mono tracking-wide max-w-md drop-shadow-md dark:drop-shadow-none">
              Secure, validated, and highly specialized collaboration network for hardware engineers, data scientists, and surgical pioneers.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Interaction Pane */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-24 relative z-10 bg-background/50 backdrop-blur-3xl pt-32">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h2 className="font-sans text-4xl font-bold tracking-tight mb-3">{isLogin ? 'Sign In' : 'Join Network'}</h2>
            <p className="text-muted-foreground font-medium">{isLogin ? 'Authenticate securely to access your dashboard.' : 'Enter your credentials to begin validation.'}</p>
          </div>

          {info && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              className="mb-8"
            >
              <div className="relative overflow-hidden rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 px-5 py-4 flex items-center gap-4 shadow-lg shadow-emerald-500/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm tracking-wide">{info}</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }} 
              animate={{ opacity: 1, height: 'auto', scale: 1 }} 
              className="mb-8"
            >
              <div className="relative overflow-hidden rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/30 px-5 py-4 flex items-center gap-4 shadow-lg shadow-red-500/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-red-500 text-sm">✕</span>
                </div>
                <p className="text-red-500 dark:text-red-400 font-medium text-sm tracking-wide">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
                    <input 
                      type="text"
                      value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-transparent border-b-2 border-border/50 focus:border-primary px-2 py-3 text-lg outline-none transition-colors placeholder:text-muted/50 font-medium"
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-transparent border-b-2 border-border/50 focus:border-primary px-2 py-3 text-lg outline-none transition-colors placeholder:text-muted/50 font-medium"
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Designation Role</label>
                    <select 
                      value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-transparent border-b-2 border-border/50 focus:border-primary px-2 py-3 text-lg outline-none transition-colors appearance-none font-medium text-foreground cursor-pointer"
                    >
                      <option value="" disabled className="bg-background text-muted-foreground">{t('authDivisionPlaceholder', 'Select your division…')}</option>
                      <option value="engineer" className="bg-background text-foreground">Hardware / ML Engineer</option>
                      <option value="healthcare" className="bg-background text-foreground">Healthcare Professional</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Institutional Email</label>
              <input 
                type="text" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-transparent border-b-2 border-border/50 focus:border-primary px-2 py-3 text-lg outline-none transition-colors placeholder:text-muted-foreground/30 font-medium"
                placeholder="name@university.edu"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Secure Password</label>
              <input 
                type="password"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-transparent border-b-2 border-border/50 focus:border-primary px-2 py-3 text-lg outline-none transition-colors placeholder:text-muted-foreground/30 font-medium font-mono"
                placeholder="••••••••••••"
              />
            </div>

            <div className="pt-6">
              <button type="submit" className="w-full relative group overflow-hidden rounded-2xl bg-primary text-primary-foreground py-4 px-8 font-semibold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3">
                <span className="relative z-10">{isSubmitting ? 'Processing...' : (isLogin ? 'Authenticate Identity' : 'Submit Credentials')}</span>
                {/* Micro animation highlight element for premium feel */}
                <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-500 ease-in-out group-hover:left-[100%] z-0"></span>
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-border/40 text-center flex flex-col gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              {isLogin ? "Unregistered entity?" : "Already verified?"}
            </span>
            <button 
              type="button" 
              onClick={toggleMode} 
              className="font-bold underline decoration-2 underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors text-foreground tracking-wide uppercase text-sm"
            >
              {isLogin ? 'Initialize Validation' : 'Access Dashboard'}
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

export default AuthPage;
