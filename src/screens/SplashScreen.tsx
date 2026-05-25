// Splash / onboarding screen for visitors who don't yet have a session.
// Hero-image driven layout (no video, no OkapiBet branding, no casino
// carousel). The screen funnels visitors into /register or /login and
// teases the four live games (Okapi Climb, Predictstreet, Loto, Scratch).
import { motion } from 'framer-motion';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getSession } from '../lib/auth';

type Badge = { label: string; color: string };
type GameTile = {
  emoji: string;
  title: string;
  subtitle: string;
  badge?: Badge;
  to: string;
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45 },
});

export default function SplashScreen() {
  const nav = useNavigate();
  const [jackpot, setJackpot] = useState<number>(5_000_000);

  // Bounce already-logged-in users to home, otherwise fetch the live
  // jackpot (silent failure → keep the 5M CDF placeholder).
  useEffect(() => {
    if (getSession()) {
      nav('/', { replace: true });
      return;
    }
    api
      .lotoLatest()
      .then((r) => setJackpot(Number(r.pot_cdf || 5_000_000)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const games: GameTile[] = [
    {
      emoji: '🚀',
      title: 'OKAPI CLIMB',
      subtitle: 'CRASH × 50',
      badge: { label: 'LIVE', color: '#00C875' },
      to: '/climb',
    },
    {
      emoji: '⚽',
      title: 'PREDICTSTREET',
      subtitle: 'PARIS FOOT WC26',
      badge: { label: 'FIFA', color: '#4a9eff' },
      to: '/jouer',
    },
    {
      emoji: '🎱',
      title: 'LOTO CONGO',
      subtitle: '20H KINSHASA',
      to: '/loto',
    },
    {
      emoji: '🎰',
      title: 'SCRATCH CARD',
      subtitle: 'GAIN INSTANT',
      badge: { label: 'NOUVEAU', color: '#FF8C00' },
      to: '/scratch',
    },
  ];

  const goto = (path: string) => (n: NavigateFunction) => n(path);

  return (
    <div style={{ minHeight: '100vh', background: '#05050A' }}>
      {/* 1. HERO ---------------------------------------------------------- */}
      <motion.div
        {...fadeUp(0)}
        style={{
          position: 'relative',
          width: '100%',
          height: '52vw',
          maxHeight: 260,
          overflow: 'hidden',
        }}
      >
        <img
          src="/images/heroplash.png"
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5,5,10,0.15) 0%, rgba(5,5,10,0.75) 72%, rgba(5,5,10,1) 100%)',
          }}
        />
        {/* Top-left badge */}
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#00C875',
            background: 'rgba(0,200,117,0.15)',
            border: '1px solid rgba(0,200,117,0.45)',
          }}
        >
          PLATEFORME OFFICIELLE DRC
        </span>
        {/* Bottom-centered tagline */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 16,
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: 5,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          JOUEZ · GAGNEZ · ENCAISSEZ
        </div>
      </motion.div>

      {/* 2. JACKPOT BAND ------------------------------------------------- */}
      <motion.div
        {...fadeUp(0.1)}
        style={{
          background: 'rgba(20,14,2,0.98)',
          borderTop: '2px solid #FF8C00',
          borderBottom: '2px solid #FF8C00',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 7,
              letterSpacing: 3,
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            JACKPOT ACTUEL
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#FFD700',
              lineHeight: 1.1,
            }}
          >
            {Math.max(jackpot, 500_000).toLocaleString('fr-FR')} CDF
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 7,
              letterSpacing: 3,
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            PARTENAIRE
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#4a9eff',
              letterSpacing: 1,
            }}
          >
            PREDICTSTREET
          </div>
        </div>
      </motion.div>

      {/* 3. GAMES GRID --------------------------------------------------- */}
      <motion.div {...fadeUp(0.2)} style={{ padding: 16 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            color: 'rgba(255,255,255,0.25)',
            marginBottom: 10,
          }}
        >
          NOS JEUX
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {games.map((g) => (
            <button
              key={g.title}
              type="button"
              onClick={() => goto(g.to)(nav)}
              style={{
                position: 'relative',
                textAlign: 'left',
                background: '#0D0D18',
                border: '1px solid rgba(255,215,0,0.25)',
                borderRadius: 12,
                padding: 16,
                color: '#FFD700',
                cursor: 'pointer',
                minHeight: 108,
              }}
            >
              {g.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: g.badge.color,
                    background: `${g.badge.color}22`,
                    border: `1px solid ${g.badge.color}66`,
                  }}
                >
                  {g.badge.label}
                </span>
              )}
              <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 8 }}>
                {g.emoji}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#FFD700',
                  letterSpacing: 1,
                }}
              >
                {g.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 2,
                }}
              >
                {g.subtitle}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 4. BONUS BANNER ------------------------------------------------- */}
      <motion.div
        {...fadeUp(0.3)}
        onClick={() => nav('/register')}
        style={{
          margin: '0 16px',
          background: 'rgba(255,215,0,0.06)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 22 }}>🎁</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: '#FFD700',
              fontWeight: 700,
            }}
          >
            BONUS DE BIENVENUE
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
            +100% jusqu'à 500K CDF
          </div>
        </div>
        <span style={{ color: '#FFD700', fontSize: 18 }}>→</span>
      </motion.div>

      {/* 5. CTAs --------------------------------------------------------- */}
      <motion.div
        {...fadeUp(0.4)}
        style={{
          padding: '16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => nav('/register')}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 16,
            border: 'none',
            background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
            color: '#000000',
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(255,140,0,0.25)',
          }}
        >
          S'INSCRIRE &amp; JOUER
        </button>
        <button
          type="button"
          onClick={() => nav('/login')}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 16,
            background: 'transparent',
            border: '1px solid rgba(255,215,0,0.5)',
            color: '#FFD700',
            fontSize: 16,
            letterSpacing: 3,
            cursor: 'pointer',
          }}
        >
          J'AI DÉJÀ UN COMPTE
        </button>
      </motion.div>

      {/* 6. PAYMENT PILLS ----------------------------------------------- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 16px 0',
          flexWrap: 'wrap',
        }}
      >
        {['ORANGE MONEY', 'AIRTEL', 'AFRICELL'].map((p) => (
          <span
            key={p}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: 9,
              letterSpacing: 1,
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {p}
          </span>
        ))}
      </div>

      {/* 7. DISCLAIMER --------------------------------------------------- */}
      <p
        style={{
          textAlign: 'center',
          fontSize: 9,
          color: 'rgba(255,255,255,0.15)',
          padding: '12px 16px 24px',
          margin: 0,
        }}
      >
        +18 ANS · AGRÉÉ MJS N°047/2016
      </p>
    </div>
  );
}
