import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// 8 cards : card1.png → card8.png dans /public/images/
const GAMES = [
  
  { id: 'g2', category: 'Live',   image: '/images/card2.png' },
  { id: 'g3', category: 'Casino', image: '/images/card3.png' },
  { id: 'g4', category: 'Casino', image: '/images/card4.png' },
  { id: 'g5', category: 'Casino', image: '/images/card5.png' },
  { id: 'g6', category: 'Casino', image: '/images/card6.png' },
  { id: 'g7', category: 'Casino', image: '/images/card7.png' },
  { id: 'g8', category: 'Slots',  image: '/images/card8.png' },
];

const CATEGORIES = ['Tout', 'En direct', 'Casino', 'Slots', 'Crash'];

export default function SplashScreen() {
  const nav = useNavigate();
  const [liveCount, setLiveCount] = useState(247);
  const [activeCategory, setActiveCategory] = useState('Tout');

  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount(c => Math.max(180, c + Math.floor(Math.random() * 7) - 3));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const filtered =
    activeCategory === 'Tout'      ? GAMES
  : activeCategory === 'En direct' ? GAMES.filter(g => g.category === 'Live')
  :                                  GAMES.filter(g => g.category === activeCategory);

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col"
      style={{ backgroundImage: 'url(/images/background.png)' }}
    >
      {/* Strip live */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="tracking-wide tabular-nums">
            {liveCount.toLocaleString()} joueurs en ligne
          </span>
        </div>
        <span className="text-zinc-500 tracking-widest">OKAPIBET · RDC</span>
      </div>

      {/* Okapi — peut être plus prominent maintenant qu'on a un carrousel */}
      <div className="flex-shrink-0 px-6 mt-1">
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
            style={{ objectPosition: 'center 60%' }}
          >
            <source src="/videos/okapibet.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Headline */}
      <div className="px-6 text-center -mt-1">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-display text-3xl text-gold tracking-wider"
        >
          BETA. WIN. RETIRE.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-zinc-400 text-xs mt-1.5 tracking-wide"
        >
          Mobile Money
        </motion.p>
      </div>

      {/* Catégories */}
      <div className="px-4 mt-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs tracking-wide transition-all ${
                activeCategory === cat
                  ? 'bg-gold text-black font-semibold'
                  : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Carrousel horizontal — gain de place vertical */}
      <div className="mt-3 flex-1">
        <motion.div
          key={activeCategory}
          className="flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show:   { transition: { staggerChildren: 0.05, delayChildren: 0.3 } }
          }}
        >
          {filtered.map(game => (
            <motion.div
              key={game.id}
              variants={{
                hidden: { opacity: 0, x: 30, scale: 0.95 },
                show:   { opacity: 1, x:  0, scale: 1    }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav('/register')}
              className="flex-shrink-0 w-[140px] aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer snap-start"
            >
              <img
                src={game.image}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}

          {/* Carte "+200 jeux" à la fin du carrousel */}
          {activeCategory === 'Tout' && (
            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30, scale: 0.95 },
                show:   { opacity: 1, x:  0, scale: 1    }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav('/register')}
              className="flex-shrink-0 w-[140px] aspect-[3/4] rounded-xl bg-gradient-to-br from-gold/25 to-gold/5 border border-gold/50 flex flex-col items-center justify-center text-center px-3 cursor-pointer snap-start"
            >
              <span className="text-3xl mb-2">🎰</span>
              <p className="text-gold text-sm font-bold tracking-wide">+200 JEUX</p>
              <p className="text-gold/70 text-[10px] mt-1">Après inscription</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bonus + CTAs */}
      <div className="px-6 pb-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mb-3 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent px-3.5 py-2.5 flex items-center gap-3"
        >
          <span className="text-2xl">🎁</span>
          <div className="flex-1">
            <p className="text-gold font-semibold text-xs tracking-wide">BONUS DE BIENVENUE</p>
            <p className="text-white text-sm font-bold">+100% jusqu'à 500K CDF</p>
          </div>
          <span className="text-gold text-lg">→</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="flex flex-col gap-2.5"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => nav('/register')}
            className="w-full h-14 rounded-2xl bg-gold text-black font-display text-xl tracking-wider shadow-xl shadow-gold/30"
          >
            S'INSCRIRE & JOUER
          </motion.button>
          <button
            onClick={() => nav('/login')}
            className="w-full h-10 text-gold text-sm tracking-wider"
          >
            J'ai déjà un compte
          </button>
        </motion.div>

        <p className="text-center text-zinc-600 text-[9px] mt-3 leading-relaxed">
          18+ · Licence ARPTC n°0573 · Le jeu peut créer une dépendance
        </p>
      </div>
    </div>
  );
}