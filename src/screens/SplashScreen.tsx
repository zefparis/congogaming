import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const nav = useNavigate();
  return (
    <div className="h-screen flex flex-col items-center justify-between bg-bg px-6 py-10 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <motion.img
          src="/images/okapi.png"
          alt="Congo Gaming"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-32 w-auto object-contain mx-auto drop-shadow-[0_0_40px_rgba(255,215,0,0.35)]"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="h-1 bg-gradient-to-r from-congogreen via-gold to-congored mt-6 rounded-full"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 font-display text-2xl tracking-wider text-gold text-center"
        >
          Pariez. Gagnez. Encaissez.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="w-full flex flex-col gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/register')}
          className="w-full h-14 rounded-2xl bg-gold text-black font-display text-2xl tracking-wider"
        >
          S'INSCRIRE
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/login')}
          className="w-full h-14 rounded-2xl border-2 border-gold text-gold font-display text-xl tracking-wider bg-transparent"
        >
          J'AI DÉJÀ UN COMPTE
        </motion.button>
        <p className="text-center text-zinc-600 text-xs uppercase tracking-widest mt-2">RDC • 2026</p>
      </motion.div>
    </div>
  );
}
