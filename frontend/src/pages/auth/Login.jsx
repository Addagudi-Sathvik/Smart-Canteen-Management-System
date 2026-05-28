import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { googleLogin } from '../../store/slices/authSlice';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

// Floating food orbs for the hero side
const FOOD_ORBS = [
  { emoji: '🍛', x: '15%', y: '18%', size: 'text-4xl', delay: 0,    duration: 6 },
  { emoji: '☕', x: '72%', y: '12%', size: 'text-3xl', delay: 0.8,  duration: 7 },
  { emoji: '🥪', x: '80%', y: '55%', size: 'text-4xl', delay: 0.4,  duration: 5.5 },
  { emoji: '🧃', x: '10%', y: '68%', size: 'text-3xl', delay: 1.2,  duration: 6.5 },
  { emoji: '🍩', x: '50%', y: '80%', size: 'text-2xl', delay: 0.6,  duration: 8 },
  { emoji: '🌯', x: '38%', y: '10%', size: 'text-2xl', delay: 1.5,  duration: 5 },
];

const features = [
  { emoji: '⚡', label: 'Order in seconds',      sub: 'No more waiting in line' },
  { emoji: '📍', label: 'Live order tracking',   sub: 'Know exactly when it\'s ready' },
  { emoji: '🔒', label: 'Secure sign-in',        sub: 'Your college Google account' },
];

const Login = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const init = () => {
      if (!googleBtnRef.current || !window.google?.accounts) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => { if (res.credential) dispatch(googleLogin(res.credential)); },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard', shape: 'rectangular', theme: 'outline',
        text: 'signin_with', size: 'large', width: 300, logo_alignment: 'center',
      });
    };
    if (window.google?.accounts) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.onload = init;
    document.body.appendChild(s);
  }, [dispatch]);

  return (
    <div className="min-h-screen flex bg-surface dark:bg-espresso-950">

      {/* ── Left hero panel ─────────────────────────────────────── */}
      <motion.div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14"
        style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 40%, #F59E0B 75%, #FBBF24 100%)' }}
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px' }}
        />

        {/* Soft radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute bottom-[-5%] right-[-10%] w-80 h-80 rounded-full bg-espresso-950/20 blur-[60px]" />
        </div>

        {/* Floating food emoji orbs */}
        {FOOD_ORBS.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute select-none pointer-events-none ${orb.size}`}
            style={{ left: orb.x, top: orb.y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.7, 0.7, 0],
              scale: [0.6, 1, 1, 0.6],
              y: [0, -14, -14, 0],
            }}
            transition={{
              delay: orb.delay,
              duration: orb.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {orb.emoji}
          </motion.div>
        ))}

        {/* Logo */}
        <motion.div
          className="relative z-10 flex items-center gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
            🍽️
          </div>
          <span className="font-display font-bold text-2xl text-white tracking-tight">CanteenHub</span>
        </motion.div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <p className="text-brand-100 font-semibold text-sm uppercase tracking-[0.2em] mb-4">
              Smart Self-Service Canteen
            </p>
            <h1 className="font-display font-bold text-white leading-[1.1]" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
              Skip the queue.<br />
              <span className="text-brand-200">Eat better.</span>
            </h1>
            <p className="text-white/70 text-lg mt-4 leading-relaxed max-w-sm">
              Order from anywhere on campus, track your food live, and collect it when it's ready.
            </p>
          </motion.div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-lg flex-shrink-0">
                  {f.emoji}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-white/55 text-xs">{f.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          className="relative z-10 text-white/40 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          © CanteenHub · College Self-Service
        </motion.p>
      </motion.div>

      {/* ── Right sign-in panel ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <motion.div
              className="inline-flex w-16 h-16 rounded-3xl items-center justify-center text-3xl shadow-glow mb-4"
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🍽️
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-espresso-900 dark:text-espresso-50">CanteenHub</h1>
            <p className="text-espresso-400 text-sm mt-1">Smart Self-Service College Canteen</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-espresso-900 rounded-3xl shadow-elevated border border-espresso-100 dark:border-espresso-800 p-8 sm:p-10">

            {/* Header */}
            <div className="mb-8">
              <div className="w-12 h-1 bg-brand-500 rounded-full mb-5" />
              <h2 className="font-display text-2xl font-bold text-espresso-900 dark:text-espresso-50">
                Welcome back
              </h2>
              <p className="text-espresso-500 dark:text-espresso-400 text-sm mt-2 leading-relaxed">
                Sign in with your college Google account to start ordering
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 text-tomato-600 dark:text-red-400 text-sm rounded-2xl border border-red-200/60 dark:border-red-800/30 flex items-start gap-2"
              >
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Google button */}
            <div className="flex justify-center min-h-[48px] mb-4">
              <div ref={googleBtnRef}>
                {!GOOGLE_CLIENT_ID && (
                  <p className="text-sm text-espresso-400 text-center px-4 py-3 bg-espresso-50 dark:bg-espresso-800 rounded-2xl">
                    Set <code className="font-mono text-brand-600">VITE_GOOGLE_CLIENT_ID</code> in your .env file.
                  </p>
                )}
              </div>
            </div>

            {loading && (
              <motion.div
                className="flex items-center justify-center gap-2 text-sm text-espresso-500 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                Signing you in…
              </motion.div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-espresso-100 dark:bg-espresso-800" />
              <span className="text-xs text-espresso-400 font-medium">your college account only</span>
              <div className="flex-1 h-px bg-espresso-100 dark:bg-espresso-800" />
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['⚡ Fast ordering', '📍 Live tracking', '🕐 Pickup slots'].map((pill) => (
                <span
                  key={pill}
                  className="text-xs px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full font-medium border border-brand-100 dark:border-brand-800/40"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-espresso-400 dark:text-espresso-600 mt-5">
            By signing in, you agree to our terms of service.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;