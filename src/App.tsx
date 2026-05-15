import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import DepositScreen from './screens/DepositScreen';
import WithdrawScreen from './screens/WithdrawScreen';
import AccountScreen from './screens/AccountScreen';
import LotoScreen from './screens/LotoScreen';
import FlashScreen from './screens/FlashScreen';
import BottomNav from './components/BottomNav';
import { getSession } from './lib/auth';

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/splash" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const showNav = ['/', '/loto', '/flash', '/compte'].includes(location.pathname);
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/splash" element={<PageWrap><SplashScreen /></PageWrap>} />
          <Route path="/login" element={<PageWrap><LoginScreen /></PageWrap>} />
          <Route path="/register" element={<PageWrap><RegisterScreen /></PageWrap>} />
          <Route path="/" element={<Protected><PageWrap><HomeScreen /></PageWrap></Protected>} />
          <Route path="/jouer" element={<Protected><PageWrap><GameScreen /></PageWrap></Protected>} />
          <Route path="/depot" element={<Protected><PageWrap><DepositScreen /></PageWrap></Protected>} />
          <Route path="/retrait" element={<Protected><PageWrap><WithdrawScreen /></PageWrap></Protected>} />
          <Route path="/compte" element={<Protected><PageWrap><AccountScreen /></PageWrap></Protected>} />
          <Route path="/loto" element={<Protected><PageWrap><LotoScreen /></PageWrap></Protected>} />
          <Route path="/flash" element={<Protected><PageWrap><FlashScreen /></PageWrap></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <div className="mx-auto w-full max-w-app min-h-screen bg-bg relative pb-20">
      <AppRoutes />
    </div>
  );
}
