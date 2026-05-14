import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-32 h-32 rounded-full bg-zinc-900 flex items-center justify-center border-2 border-gold/40 shadow-[0_0_60px_rgba(255,215,0,0.4)]"
      >
        <img src="/lion.svg" alt="Congo Gaming" className="w-24 h-24" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 font-display text-5xl tracking-widest shine-text"
      >
        CONGO GAMING
      </motion.h1>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '60%' }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="h-1 bg-gradient-to-r from-congogreen via-gold to-congored mt-4 rounded-full"
      />
      <p className="mt-4 text-zinc-500 text-sm uppercase tracking-widest">RDC • 2026</p>
    </div>
  );
}
