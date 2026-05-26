// Splash / onboarding screen for visitors who don't yet have a session.
// Minimal premium branding splash — brand block + 2 CTAs only.
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getSession } from '../lib/auth';

export default function SplashScreen() {
  const nav = useNavigate();

  // Bounce already-logged-in users to home.
  useEffect(() => {
    if (getSession()) nav('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        height: '100dvh',
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
          className="font-display"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(240,160,0,0.08)',
            border: '1px solid rgba(240,160,0,0.3)',
            borderRadius: 8,
            padding: '8px 16px',
            color: '#ffffff',
            fontSize: 20,
            letterSpacing: 3,
            textAlign: 'center',
          }}
        >
          <span>JOUEZ</span>
          <span style={{ color: '#f0b800' }}>·</span>
          <span>GAGNEZ</span>
          <span style={{ color: '#f0b800' }}>·</span>
          <span>ENCAISSEZ</span>
        </div>

        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            overflow: 'hidden',
            border: '2px solid #f0b800',
            background: '#000',
            boxShadow: '0 0 30px rgba(240,160,0,0.5)',
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            src="/videos/okapibet.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              mixBlendMode: 'lighten',
            }}
          />
        </div>

      </div>

      {/* SECTION 2 — CTAs */}
      <div
        style={{
          flexShrink: 0,
          padding: '0 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={() => nav('/register')}
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            border: 0,
            borderRadius: 14,
            padding: '18px 0',
            background:
              'linear-gradient(180deg, #ffe066 0%, #f0a500 18%, #c97f00 50%, #f0a500 82%, #ffe066 100%)',
            color: '#1a0800',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 3,
            cursor: 'pointer',
            marginBottom: 10,
            boxShadow:
              'inset 0 1px 0 rgba(255,240,150,0.6), inset 0 -1px 0 rgba(80,40,0,0.4), 0 4px 16px rgba(200,120,0,0.5)',
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>S'INSCRIRE</span>
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              background:
                'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
              transform: 'translateX(-120%)',
              animation: 'splashShimmer 2.5s linear infinite',
              pointerEvents: 'none',
            }}
          />
        </button>
        <style>{`@keyframes splashShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }`}</style>

        <button
          type="button"
          onClick={() => nav('/login')}
          style={{
            width: '100%',
            borderRadius: 14,
            padding: '18px 0',
            background:
              'linear-gradient(180deg, #b8860b 0%, #8b6914 40%, #6b500f 60%, #b8860b 100%)',
            border: '1px solid #f0c040',
            color: '#ffe08a',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow:
              'inset 0 1px 0 rgba(255,220,100,0.3), 0 2px 8px rgba(0,0,0,0.5)',
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
