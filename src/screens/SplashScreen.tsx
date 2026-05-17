import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const GAME_TEASERS = [
  { name: 'Roulette', emoji: '🎰' },
  { name: 'Crash', emoji: '🚀' },
  { name: 'Blackjack', emoji: '🃏' },
  { name: 'Dice', emoji: '🎲' },
  { name: 'Live Dealer', emoji: '🎥' },
  { name: 'Slots', emoji: '💎' },
];

export default function SplashScreen() {
  const nav = useNavigate();
  const [liveCount, setLiveCount] = useState(247);

  // Simulated live ticker — replace with real socket later
  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount(c => c + Math.floor(Math.random() * 5) - 2);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col"
         style={{ backgroundImage: 'url(/images/background.png)' }}>

      {/* Live signals strip — top */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="tracking-wide">{liveCount.toLocaleString()} joueurs en ligne</span>
        </div>
        <span className="text-zinc-500 tracking-widest">RDC · 2026</span>
      </div>

      {/* Okapi video — UNTOUCHED, just cleaner container */}
      <div className="flex-shrink-0 px-4 mt-2">
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl">
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
            style={{ objectPosition: 'center 60%' }}
          >
            <source src="/videos/okapibet.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Brand statement — stronger, local */}
      <div className="px-6 mt-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-display text-3xl text-gold tracking-wider leading-tight"
        >
          L'app de jeux<br/>du Congo
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-zinc-400 text-sm mt-3"
        >
          Licence ARPTC · Paiement Mobile Money
        </motion.p>
      </div>

      {/* Game teasers — horizontal scroll, infinite */}
      <div className="mt-6 overflow-hidden">
        <motion.div
          className="flex gap-3 px-4"
          animate={{ x: [0, -600] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...GAME_TEASERS, ...GAME_TEASERS].map((g, i) => (
            <div key={i}
                 className="flex-shrink-0 w-24 h-24 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center justify-center backdrop-blur">
              <span className="text-3xl">{g.emoji}</span>
              <span className="text-xs text-zinc-400 mt-1">{g.name}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA block */}
      <div className="mt-auto px-6 pb-8 pt-6">
        {/* Welcome bonus banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mb-4 rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent px-4 py-3 flex items-center gap-3"
        >
          <span className="text-2xl">🎁</span>
          <div className="flex-1">
            <p className="text-gold font-semibold text-sm">Bonus de bienvenue</p>
            <p className="text-zinc-300 text-xs">+100% sur votre 1er dépôt — jusqu'à 500K CDF</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => nav('/register')}
            className="w-full h-14 rounded-2xl bg-gold text-black font-display text-2xl tracking-wider shadow-lg shadow-gold/20"
          >
            S'INSCRIRE
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => nav('/login')}
            className="w-full h-12 rounded-2xl border-2 border-gold/60 text-gold font-display text-base tracking-wider bg-transparent"
          >
            J'AI DÉJÀ UN COMPTE
          </motion.button>
        </motion.div>

        {/* Regulatory disclaimer — present but discreet */}
        <p className="text-center text-zinc-600 text-[10px] mt-4 leading-relaxed">
          ⚠️ Jeu réservé aux 18 ans et plus · Le jeu peut créer une dépendance · Jouez responsable
        </p>
      </div>
    </div>
  );
}