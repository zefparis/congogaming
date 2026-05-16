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
      <div className="h-screen flex flex-col items-center justify-between pb-10">
      <div style={{ 
        width: '100%',
        height: '420px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            width: '110%',
            height: '80%',
            objectFit: 'cover',
            objectPosition: 'center 60%',
            transform: 'scale(1.0)',
            mixBlendMode: 'screen',
          }}
        >
          <source src="/videos/okapibet.mp4" type="video/mp4" />
        </video>
      </div>
      <div style={{ marginTop: 8 }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="font-display text-2xl tracking-wider text-gold text-center"
        >
          Pariez. Gagnez. Encaissez.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-gray-400 text-sm px-8 mt-4"
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
