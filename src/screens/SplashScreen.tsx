// Splash / onboarding screen for visitors who don't yet have a session.
// Visual identity for the post-PredictStreet relaunch: a single hero image
// (no video, no OkapiBet branding, no casino card carousel). The screen is
// strictly informational + funnels the user into /register or /login.
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getSession, refreshBalance } from '../lib/auth';

const fmtCdf = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n));

type GameTile = {
  emoji: string;
  title: string;
  subtitle: string;
  badge?: { label: string; color: string };
  onClick: (nav: ReturnType<typeof useNavigate>) => void;
};

export default function SplashScreen() {
  const nav = useNavigate();
  const [jackpot, setJackpot] = useState<number>(5_000_000);

  // If the user already has a session, bounce them straight to the home
  // screen. We also opportunistically refresh the balance so the home view
  // doesn't render with a stale figure.
  useEffect(() => {
    const session = getSession();
    if (session) {
      refreshBalance(session.id).catch(() => {});
      nav('/', { replace: true });
    }
  }, [nav]);

  // Live jackpot. We tolerate API failure silently (the default 5M CDF stays
  // shown) — this is a marketing screen, not a transactional surface.
  useEffect(() => {
    api
      .lotoLatest()
      .then((r) => setJackpot(Number(r.pot_cdf || 5_000_000)))
      .catch(() => {});
  }, []);

  const games: GameTile[] = [
    {
      emoji: '🚀',
      title: 'OKAPI CLIMB',
      subtitle: 'CRASH × 50',
      badge: { label: 'LIVE', color: '#00C875' },
      onClick: (n) => n('/register'),
    },
    {
      emoji: '⚽',
      title: 'PREDICTSTREET',
      subtitle: 'PARIS FOOT WC26',
      badge: { label: 'FIFA', color: '#4a9eff' },
      onClick: (n) => n('/register'),
    },
    {
      emoji: '🎱',
      title: 'LOTO CONGO',
      subtitle: '20H KINSHASA',
      onClick: (n) => n('/register'),
    },
    {
      emoji: '🎰',
      title: 'SCRATCH CARD',
      subtitle: 'GAIN INSTANT',
      badge: { label: 'NOUVEAU', color: '#FF8C00' },
      onClick: (n) => n('/register'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05050A' }}>
      {/* 1. HERO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full overflow-hidden"
        style={{ height: '52vw', maxHeight: 260 }}
      >
        <img
          src="/images/heroplash.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,5,10,0.2) 0%, rgba(5,5,10,0.8) 75%, rgba(5,5,10,1) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4 flex flex-col items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest"
            style={{
              background: 'rgba(0,200,117,0.18)',
              color: '#00C875',
              border: '1px solid rgba(0,200,117,0.45)',
            }}
          >
            PLATEFORME OFFICIELLE DRC
          </span>
          <span className="text-[10px] tracking-[0.25em]" style={{ color: '#9CA3AF' }}>
            JOUEZ · GAGNEZ · ENCAISSEZ
          </span>
        </div>
      </motion.div>

      {/* 2. JACKPOT BAND */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: '#0D0D18',
          borderTop: '1px solid rgba(255,215,0,0.35)',
          borderBottom: '1px solid rgba(255,215,0,0.35)',
        }}
      >
        <div>
          <div className="text-[9px] tracking-widest" style={{ color: '#9CA3AF' }}>
            JACKPOT ACTUEL
          </div>
          <div
            className="font-display text-2xl leading-none"
            style={{ color: '#FFD700' }}
          >
            {fmtCdf(jackpot)} <span style={{ fontSize: 12 }}>CDF</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] tracking-widest" style={{ color: '#9CA3AF' }}>
            PARTENAIRE
          </div>
          <div
            className="text-sm font-bold tracking-wide"
            style={{ color: '#4a9eff' }}
          >
            PREDICTSTREET
          </div>
        </div>
      </motion.div>

      {/* 3. GAMES GRID 2x2 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="px-4 mt-4 grid grid-cols-2 gap-3"
      >
        {games.map((g) => (
          <motion.button
            key={g.title}
            whileTap={{ scale: 0.97 }}
            onClick={() => g.onClick(nav)}
            className="relative text-left p-3 flex flex-col gap-1"
            style={{
              background: '#0D0D18',
              border: '1px solid rgba(255,215,0,0.18)',
              borderRadius: 12,
              minHeight: 92,
            }}
          >
            {g.badge && (
              <span
                className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                style={{
                  background: `${g.badge.color}22`,
                  color: g.badge.color,
                  border: `1px solid ${g.badge.color}66`,
                }}
              >
                {g.badge.label}
              </span>
            )}
            <span className="text-2xl">{g.emoji}</span>
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: '#FFFFFF' }}
            >
              {g.title}
            </span>
            <span className="text-[10px] tracking-wider" style={{ color: '#9CA3AF' }}>
              {g.subtitle}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* 4. BONUS BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        onClick={() => nav('/register')}
        className="mx-4 mt-4 rounded-xl px-3.5 py-2.5 flex items-center gap-3 cursor-pointer"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,215,0,0.18) 0%, rgba(255,140,0,0.06) 60%, transparent 100%)',
          border: '1px solid rgba(255,215,0,0.4)',
        }}
      >
        <span className="text-2xl">🎁</span>
        <div className="flex-1">
          <p
            className="font-semibold text-xs tracking-wide"
            style={{ color: '#FFD700' }}
          >
            BONUS DE BIENVENUE
          </p>
          <p className="text-white text-sm font-bold">
            +100% jusqu'à 500K CDF
          </p>
        </div>
        <span className="text-lg" style={{ color: '#FFD700' }}>
          →
        </span>
      </motion.div>

      {/* 5. CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="px-4 mt-4 flex flex-col gap-2.5"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/register')}
          className="w-full h-14 rounded-2xl font-display tracking-wider"
          style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
            color: '#000',
            fontSize: 22,
            boxShadow: '0 8px 24px rgba(255,215,0,0.25)',
          }}
        >
          S'INSCRIRE &amp; JOUER
        </motion.button>
        <button
          onClick={() => nav('/login')}
          className="w-full h-10 text-sm tracking-wider"
          style={{ color: '#FFD700' }}
        >
          J'ai déjà un compte
        </button>
      </motion.div>

      {/* 6. PAYMENT PILLS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="px-4 mt-4 flex justify-center gap-2 flex-wrap"
      >
        {['ORANGE MONEY', 'AIRTEL', 'AFRICELL'].map((p) => (
          <span
            key={p}
            className="px-2.5 py-1 rounded-full text-[9px] tracking-widest"
            style={{
              background: '#0D0D18',
              color: '#9CA3AF',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {p}
          </span>
        ))}
      </motion.div>

      {/* 7. DISCLAIMER */}
      <p
        className="text-center text-[9px] mt-3 mb-4 px-4 leading-relaxed"
        style={{ color: '#4B5563' }}
      >
        +18 ANS · AGRÉÉ MJS N°047/2016
      </p>
    </div>
  );
}