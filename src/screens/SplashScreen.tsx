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
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#06060E',
        paddingBottom: 40,
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
            padding: '6px 16px',
            borderRadius: 20,
            border: '1.5px solid #c8a000',
            color: '#f0c000',
            fontSize: 10,
            letterSpacing: 3,
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
            width: '100%',
            height: 220,
            borderRadius: 16,
            overflow: 'hidden',
            border: '2px solid #f0b800',
            background: '#000',
            boxShadow: '0 0 20px rgba(240,184,0,0.5)',
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
              'linear-gradient(180deg, #fff1a8 0%, #ffcf3a 35%, #c97f00 50%, #ffcf3a 65%, #fff1a8 100%)',
            borderTop: '1px solid rgba(255,240,180,0.8)',
            color: '#0a0500',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 3,
            cursor: 'pointer',
            marginBottom: 10,
            boxShadow: '0 0 12px rgba(240,165,0,0.7)',
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
              'linear-gradient(180deg, #d9a847 0%, #a87a1a 35%, #7a5410 50%, #a87a1a 65%, #d9a847 100%)',
            border: '1.5px solid #d9a847',
            color: '#ffe488',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow: '0 0 8px rgba(200,144,32,0.5)',
          }}
        >
          DÉJÀ CLIENT
        </button>

        <div
          style={{
            marginTop: 16,
            paddingBottom: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
            }}
          >
            ORANGE MONEY · AIRTEL · AFRICELL
          </div>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              letterSpacing: 1.5,
              color: '#f0b800',
              background: 'rgba(240,160,0,0.12)',
              border: '1px solid rgba(240,160,0,0.3)',
              borderRadius: 6,
              padding: '3px 10px',
              marginTop: 4,
            }}
          >
            +18 ANS · AGRÉÉ MJS N°047/2016
          </span>
        </div>
      </div>
    </div>
  );
}
