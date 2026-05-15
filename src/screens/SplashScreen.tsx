import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const nav = useNavigate();
  return (
    <div
      style={{
        backgroundImage: 'url(/images/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      <div className="h-screen flex flex-col items-center justify-between px-6 pt-4 pb-10 overflow-hidden">
      <div className="flex flex-col items-center w-full mt-8">
        <motion.img
          src="/images/okapi.PNG"
          alt="Congo Gaming"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-56 w-auto object-contain mx-auto drop-shadow-[0_0_40px_rgba(255,215,0,0.35)]"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '12rem' }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="h-1 bg-gradient-to-r from-congogreen via-gold to-congored mx-auto rounded-full"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 font-display text-2xl tracking-wider text-gold text-center"
        >
          Pariez. Gagnez. Encaissez.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-gray-400 text-sm px-8 mt-8"
        >
          ⚠️ Jeu réservé aux personnes de 18 ans et plus. Le jeu peut créer une dépendance.
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
    </div>
  );
}
