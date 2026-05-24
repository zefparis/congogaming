import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { getSession, refreshBalance } from '../lib/auth';
import { api } from '../lib/api';

// Shared style for primary home CTAs (glassmorphism, white text).
// Inline styles take precedence over any Tailwind utility, so this fully
// neutralises any other color rule applied to the button.
const ctaStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: '14px',
  color: '#FFFFFF',
  fontWeight: '800',
  letterSpacing: '2px',
  fontSize: '15px',
  padding: '14px 20px',
  width: 'auto',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  fontFamily: 'Bebas Neue',
  cursor: 'pointer',
};

export default function HomeScreen() {
  const nav = useNavigate();
  const session = getSession();
  const [balance, setBalance] = useState<number>(session?.balance_cdf ?? 0);
  const [lotoPot, setLotoPot] = useState<number>(0);
  const [flashPot, setFlashPot] = useState<number>(0);

  useEffect(() => {
    if (session) refreshBalance(session.id).then(setBalance).catch(() => {});
    api.lotoLatest().then((r) => setLotoPot(Number(r.pot_cdf || 0))).catch(() => {});
    api.flashLatest().then((r) => setFlashPot(Number(r.pot_cdf || 0))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Banner header */}
      <div style={{ overflow: 'hidden' }}>
        <img
          src="/images/banner.jpg"
          alt="Congo Gaming"
          className="breathe"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Glassmorphism solde bar */}
      <div
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,215,0,0.2)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2 }}>
          SOLDE
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wallet style={{ color: '#FFD700', width: 16, height: 16 }} />
          <span style={{ color: '#FFD700', fontSize: 20, fontWeight: 800 }}>
            {balance.toLocaleString('fr-FR')}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>CDF</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, minHeight: 280 }}>
          {/* Background image */}
          <img
            src="/images/worldcup2026.jpg"
            alt="FIFA World Cup 2026"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              opacity: 0.75,
            }}
          />

          {/* Dark gradient overlay bottom to top */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.05) 100%)',
            }}
          />

          {/* World Cup trophy */}
          <img
            src="/images/okapi/copa.PNG"
            alt="World Cup Trophy"
            className="shimmer-gold"
            style={{
              position: 'absolute',
              right: '-5px',
              bottom: '20%',
              height: '72%',
              width: 'auto',
              objectFit: 'contain',
              zIndex: 2,
              mixBlendMode: 'normal',
              opacity: 1,
            }}
          />

          {/* Content on top */}
          <div style={{ position: 'relative', maxWidth: '55%', zIndex: 3, padding: '20px 16px' }}>
            <div style={{ fontSize: 10, color: '#FFD700', letterSpacing: 3, marginBottom: 4 }}>
              🏆 ÉVÉNEMENT OFFICIEL
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: 'white', lineHeight: 1 }}>
              FIFA WORLD CUP
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: '#FFD700', lineHeight: 1 }}>
              2026
            </div>
            <div style={{ fontSize: 13, color: '#00A86B', marginTop: 4, marginBottom: 16 }}>
              ⚽ Gagnez gros — Paris & Prédictions
            </div>
            <motion.button
              whileHover={{ filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98, filter: 'brightness(1.1)' }}
              onClick={() => nav('/jouer')}
              style={ctaStyle}
            >
              JOUER MAINTENANT →
            </motion.button>
          </div>
        </div>

        {/* OKAPI CLIMB card */}
        <div
          onClick={() => nav('/climb')}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            minHeight: 220,
            cursor: 'pointer',
          }}
        >
          <img
            src="/images/okapi/okapi-climb.png"
            alt="Okapi Climb"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 100%)',
            }}
          />

          {/* Okapi character */}
          <img
            src="/images/okapi/okapi-tip.png"
            alt="Okapi"
            style={{
              position: 'absolute',
              right: '0',
              bottom: '0',
              height: '35%',
              width: 'auto',
              objectFit: 'contain',
              zIndex: 2,
              filter: 'drop-shadow(0 0 12px rgba(255,165,0,0.5))',
            }}
          />
          <div style={{ position: 'relative', maxWidth: '58%', zIndex: 3, padding: '20px 16px' }}>
            <div style={{ fontSize: 10, color: '#FFD700', letterSpacing: 3, marginBottom: 4 }}>
              🏔️ CRASH GAME
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 44, color: '#FFD700', lineHeight: 1 }}>
              OKAPI CLIMB
            </div>
            <div style={{ fontSize: 13, color: 'white', marginTop: 4, marginBottom: 16, opacity: 0.85 }}>
              Pariez, encaissez avant le crash. Jusqu'à ×50
            </div>
            <motion.button
              whileHover={{ filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98, filter: 'brightness(1.1)' }}
              onClick={(e) => { e.stopPropagation(); nav('/climb'); }}
              style={ctaStyle}
            >
              GRIMPER MAINTENANT →
            </motion.button>
          </div>
        </div>

        {/* LOTO CONGO — premium hero card with okapi casino background */}
        <div
          onClick={() => nav('/loto')}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            minHeight: 280,
            cursor: 'pointer',
          }}
        >
          <img
            src="/images/loto-okapi.png"
            alt="Loto Congo"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 45%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%)',
            }}
          />
          {/* Top section: title + jackpot badge, pinned to top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: 16,
              zIndex: 3,
            }}
          >
            <div
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: 38,
                color: '#FFFFFF',
                lineHeight: 1,
                letterSpacing: 2,
                textShadow:
                  '0 2px 12px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <img
                src="/images/okapi/drapeau.PNG"
                alt="DRC Flag"
                style={{
                  display: 'inline-block',
                  animation: 'flag-float 2s ease-in-out infinite',
                  borderRadius: 3,
                  flexShrink: 0,
                  width: 36,
                  height: 24,
                  objectFit: 'contain',
                }}
              />
              LOTO CONGO
            </div>
            {lotoPot >= 5_000_000 ? (
              <div
                className="pulse-red"
                style={{
                  color: '#FF3333',
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: '1px',
                  marginTop: 10,
                }}
              >
                🔥 Jackpot disponible
              </div>
            ) : (
              <div
                className="pulse-red"
                style={{
                  color: '#FF3333',
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: '1px',
                  marginTop: 80,
                }}
              >
                🏆 Jackpot en cours
              </div>
            )}
          </div>

          {/* Bottom section: button, pinned to bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              zIndex: 3,
            }}
          >
            <motion.button
              whileHover={{ filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98, filter: 'brightness(1.1)' }}
              onClick={(e) => { e.stopPropagation(); nav('/loto'); }}
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#FFFFFF',
                fontFamily: 'Bebas Neue',
                fontWeight: '800',
                fontSize: 15,
                borderRadius: '14px',
                width: '100%',
                padding: '14px 0',
                letterSpacing: '2px',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                cursor: 'pointer',
              }}
            >
              JOUER MAINTENANT →
            </motion.button>
          </div>
        </div>

        {/* LOTO EXPRESS — electric dark card with green accent */}
        <div
          onClick={() => nav('/flash')}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            minHeight: 200,
            cursor: 'pointer',
            background: '#0a0a1a',
            border: '1px solid rgba(0,168,107,0.4)',
          }}
        >
          {/* Scattered lightning bolts background */}
          {[
            { top: '8%', left: '6%', size: 64, rotate: -15 },
            { top: '18%', right: '12%', size: 96, rotate: 20 },
            { top: '55%', left: '20%', size: 80, rotate: 10 },
            { bottom: '10%', right: '8%', size: 72, rotate: -25 },
            { bottom: '30%', right: '32%', size: 56, rotate: 35 },
            { top: '45%', right: '4%', size: 48, rotate: -10 },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: b.top,
                bottom: b.bottom,
                left: b.left,
                right: b.right,
                fontSize: b.size,
                opacity: 0.08,
                transform: `rotate(${b.rotate}deg)`,
                color: '#00A86B',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
            >
              ⚡
            </div>
          ))}

          {/* Loto balls sticker - center-right */}
          <img
            src="/images/okapi/bloto-ball.PNG"
            alt=""
            className="float-y"
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '48%',
              height: '35%',
              width: 'auto',
              objectFit: 'contain',
              zIndex: 2,
              filter: 'drop-shadow(0 0 10px rgba(0,168,107,0.5))',
            }}
          />

          {/* Fire ball sticker - bottom-right */}
          <img
            src="/images/okapi/fire.JPG"
            alt=""
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              height: '45%',
              width: 'auto',
              objectFit: 'contain',
              zIndex: 2,
              mixBlendMode: 'screen',
              animation: 'fire-pulse 1.2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 12px rgba(255,100,0,0.8))',
            }}
          />

          <div style={{ position: 'relative', zIndex: 3, maxWidth: '60%', padding: '20px 16px' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 44, color: '#00A86B', lineHeight: 1, letterSpacing: 2 }}>
              ⚡ LOTO EXPRESS
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 14, marginTop: 12, fontWeight: 600 }}>
              Tirage toutes les 30 min
            </div>
            {flashPot >= 250_000 ? (
              <div
                className="animate-flicker"
                style={{ color: '#00A86B', fontWeight: 700, fontSize: 15, marginTop: 4 }}
              >
                ⚡ JACKPOT DISPO !
              </div>
            ) : (
              <div style={{ color: '#FFFFFF', fontSize: 15, marginTop: 4, fontWeight: 600 }}>
                Pot : {flashPot.toLocaleString('fr-FR')} CDF
              </div>
            )}
            <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4, marginBottom: 16 }}>
              1 000 CDF / ticket
            </div>
            <motion.button
              whileHover={{ filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98, filter: 'brightness(1.1)' }}
              onClick={(e) => { e.stopPropagation(); nav('/flash'); }}
              style={{
                ...ctaStyle,
                background: '#00A86B',
                border: '1px solid rgba(0,168,107,0.7)',
              }}
            >
              JOUER MAINTENANT →
            </motion.button>
          </div>
        </div>

        {/* DÉPÔT / RETRAIT — moved below loto cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => nav('/depot')}
            className="h-24 rounded-2xl bg-congogreen text-white font-display text-2xl tracking-wide flex flex-col items-center justify-center"
          >
            DÉPÔT
            <span className="text-xs font-body opacity-80">+ Fonds</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => nav('/retrait')}
            className="h-24 rounded-2xl bg-zinc-900 border border-gold/40 text-gold font-display text-2xl tracking-wide flex flex-col items-center justify-center"
          >
            RETRAIT
            <span className="text-xs font-body opacity-80">- Fonds</span>
          </motion.button>
        </div>

        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Astuce</div>
          <div className="text-sm mt-1">Jouez de manière responsable. 18+ uniquement.</div>
        </div>

        <button
          onClick={() => nav('/legal')}
          className="block w-full text-center text-xs text-gray-600 hover:text-gray-400 pt-2 pb-1"
        >
          © Congo Gaming Limited SARL — Agréé MJS N°047/2016 — ARPTC N°0573-0574/2023
        </button>
      </div>
    </div>
  );
}
