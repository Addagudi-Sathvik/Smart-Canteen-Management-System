import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { googleLogin } from '../../store/slices/authSlice';
import { UtensilsCrossed, Loader2, Sparkles, Clock, Shield } from 'lucide-react';
import Card from '../../components/ui/Card';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGoogleBtn = () => {
      if (!googleBtnRef.current || !window.google?.accounts) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) dispatch(googleLogin(response.credential));
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        width: 300,
        logo_alignment: 'center',
      });
    };

    if (window.google?.accounts) {
      initializeGoogleBtn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleBtn;
    document.body.appendChild(script);
  }, [dispatch]);

  const features = [
    { icon: Clock, text: 'Order in seconds' },
    { icon: Sparkles, text: 'Live order tracking' },
    { icon: Shield, text: 'Secure Google sign-in' },
  ];

  return (
    <div className="min-h-screen flex mesh-bg">
      {/* Hero — desktop */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-12 flex-col justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/30 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <span className="font-display font-bold text-2xl">CanteenHub</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight">
            Smart college canteen,<br />zero queue stress.
          </h1>
          <p className="text-brand-100 text-lg max-w-md">
            Browse the menu, track your order live, and pick up when it&apos;s ready — all from your phone.
          </p>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <motion.li
                key={f.text}
                className="flex items-center gap-3 text-white/90"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <f.icon className="w-5 h-5 text-brand-200" />
                <span className="font-medium">{f.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-brand-200/80">© CanteenHub — College Self-Service</p>
      </motion.div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 items-center justify-center shadow-glow mb-4">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-espresso-900 dark:text-espresso-50">CanteenHub</h1>
            <p className="text-espresso-500 dark:text-espresso-400 text-sm mt-1">Smart Self-Service College Canteen</p>
          </div>

          <Card glass className="shadow-elevated" padding="p-8 sm:p-10">
            <h2 className="font-display text-xl font-bold text-espresso-900 dark:text-espresso-50">Welcome back</h2>
            <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-2 mb-6">
              Sign in with your college Google account to continue
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-tomato-600 dark:text-red-400 text-sm rounded-xl border border-red-200/50 dark:border-red-800/30"
              >
                {error}
              </motion.div>
            )}

            <div className="flex justify-center min-h-[48px]">
              <div ref={googleBtnRef}>
                {!GOOGLE_CLIENT_ID && (
                  <p className="text-sm text-espresso-400 text-center">
                    Set VITE_GOOGLE_CLIENT_ID in your .env file.
                  </p>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-espresso-500">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                Signing in...
              </div>
            )}
          </Card>

          <p className="text-center text-xs text-espresso-400 dark:text-espresso-600 mt-6">
            By signing in, you agree to our terms of service.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
