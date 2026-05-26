// Splash / onboarding screen for visitors who don't yet have a session.
// Minimal premium branding splash — brand block + 2 CTAs only.
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getSession } from '../lib/auth';

export default function SplashScreen() {
  const nav = useNavigate();
  const [jackpot, setJackpot] = useState<number | null>(null);

  // Bounce already-logged-in users to home, otherwise fetch the live
  // jackpot (silent failure → leave jackpot line hidden).
  useEffect(() => {
    if (getSession()) {
      nav('/', { replace: true });
      return;
    }
    api
      .lotoLatest()
      .then((r) => setJackpot(Number(r.pot_cdf || 0) || null))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#06060E',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% -20%, rgba(255,165,0,0.08), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* SECTION 1 — HERO */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            border: '1px solid rgba(0,200,117,0.5)',
            color: '#00C875',
            fontSize: 10,
            letterSpacing: 4,
            fontWeight: 700,
            marginBottom: 28,
          }}
        >
          PLATEFORME OFFICIELLE DRC
        </span>

        <h1
          style={{
            margin: 0,
            textAlign: 'center',
            letterSpacing: 2,
            lineHeight: 0.9,
            fontWeight: 900,
            fontSize: 64,
          }}
        >
          <span style={{ display: 'block', color: '#FFFFFF' }}>CONGO</span>
          <span style={{ display: 'block', color: '#FFD700' }}>GAMING</span>
        </h1>

        <div
          aria-hidden
          style={{
            width: 60,
            height: 2,
            margin: '18px auto',
            background:
              'linear-gradient(90deg, transparent, #FFD700, transparent)',
          }}
        />

        <div
          style={{
            fontSize: 11,
            letterSpacing: 5,
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'center',
          }}
        >
          JOUEZ · GAGNEZ · ENCAISSEZ
        </div>

        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: 160,
            height: 'auto',
            objectFit: 'contain',
            marginTop: 24,
            mixBlendMode: 'screen',
          }}
        >
          <source src="/videos/okapibet.mp4" type="video/mp4" />
        </video>

        {jackpot != null && (
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: 'rgba(255,215,0,0.5)',
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            JACKPOT {jackpot.toLocaleString('fr-FR')} CDF
          </div>
        )}
      </div>

      {/* SECTION 2 — CTAs */}
      <div style={{ padding: '0 20px 40px', position: 'relative', zIndex: 1 }}>
        <button
          type="button"
          onClick={() => nav('/register')}
          style={{
            width: '100%',
            height: 56,
            border: 'none',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
            color: '#000000',
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: 3,
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          S'INSCRIRE
        </button>

        <button
          type="button"
          onClick={() => nav('/login')}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 16,
            background: 'transparent',
            border: '1px solid rgba(255,215,0,0.45)',
            color: '#FFD700',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 3,
            cursor: 'pointer',
          }}
        >
          DÉJÀ CLIENT
        </button>

        <div
          style={{
            fontSize: 9,
            letterSpacing: 2,
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          ORANGE MONEY · AIRTEL · AFRICELL
        </div>

        <div
          style={{
            fontSize: 8,
            color: 'rgba(255,255,255,0.12)',
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          +18 ANS · AGRÉÉ MJS N°047/2016
        </div>
      </div>
    </div>
  );
}
