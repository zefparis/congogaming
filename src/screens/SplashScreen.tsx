// Splash / onboarding screen for visitors who don't yet have a session.
// FIFA World Cup 2026 / PredictStreet co-branded design.
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession } from '../lib/auth';

const BEBAS = "'Bebas Neue', sans-serif";
const BARLOW = "'Barlow Condensed', sans-serif";
const KICKOFF = new Date('2026-06-11T00:00:00Z').getTime();

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function SplashScreen() {
  const nav = useNavigate();
  const [t, setT] = useState(() => diff(KICKOFF));

  useEffect(() => {
    if (getSession()) {
      nav('/', { replace: true });
      return;
    }
    const id = setInterval(() => setT(diff(KICKOFF)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: '#050c1f',
        color: '#ffffff',
        fontFamily: BARLOW,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background image */}
      <img
        src="/images/screensplash.jpg"
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />
      {/* Overlay gradient */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(5,12,31,0) 0%, rgba(5,12,31,0) 40%, rgba(5,12,31,0.6) 65%, #050c1f 82%, #050c1f 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '100dvh',
          padding: '16px 20px 28px',
        }}
      >
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          <span>DRC · Officiel</span>
          <span>Agréé MJS N°047/2016</span>
        </div>

        {/* Flex spacer */}
        <div style={{ flex: 1 }} />

        {/* FIFA logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <img
            src="/images/logo/logofifa.jpg"
            alt="FIFA"
            style={{
              width: 80,
              height: 80,
              objectFit: 'cover',
              objectPosition: 'center',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'block',
            }}
          />
        </div>

        {/* Separator line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            margin: '6px 0 18px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ whiteSpace: 'nowrap' }}>
            Partenaire officiel prediction market
          </span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Title */}
        <h1
          style={{
            margin: 0,
            textAlign: 'center',
            fontFamily: BEBAS,
            fontSize: 68,
            lineHeight: 0.95,
            letterSpacing: 2,
            color: '#ffffff',
          }}
        >
          CONGO GAMING
        </h1>

        {/* Italic subtitle */}
        <div
          style={{
            textAlign: 'center',
            fontFamily: BARLOW,
            fontStyle: 'italic',
            fontSize: 16,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.85)',
            marginTop: 6,
          }}
        >
          Prediction Market · DRC
        </div>

        {/* FIFA tag */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <span
            style={{
              display: 'inline-block',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 999,
              padding: '5px 14px',
              fontFamily: BARLOW,
              fontSize: 12,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#ffffff',
            }}
          >
            FIFA World Cup 2026™
          </span>
        </div>

        {/* Countdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginTop: 22,
          }}
        >
          {[
            { v: t.d, l: 'Jours' },
            { v: t.h, l: 'Heures' },
            { v: t.m, l: 'Min' },
            { v: t.s, l: 'Sec' },
          ].map((c) => (
            <div
              key={c.l}
              style={{
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                padding: '10px 4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: BEBAS,
                  fontSize: 28,
                  lineHeight: 1,
                  letterSpacing: 1,
                  color: '#ffffff',
                }}
              >
                {pad(c.v)}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: BARLOW,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {c.l}
              </div>
            </div>
          ))}
        </div>

        {/* ADI pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <span
            style={{
              display: 'inline-block',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 999,
              padding: '6px 14px',
              fontFamily: BARLOW,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            ADI PredictStreet · Powered by FIFA Data
          </span>
        </div>

        {/* Buttons */}
        <button
          type="button"
          onClick={() => nav('/register')}
          style={{
            marginTop: 22,
            width: '100%',
            border: 'none',
            borderRadius: 12,
            padding: '16px 0',
            background: '#ffffff',
            color: '#050c1f',
            fontWeight: 700,
            fontFamily: BEBAS,
            fontSize: 22,
            letterSpacing: 4,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(255,255,255,0.25)',
          }}
        >
          S'INSCRIRE
        </button>

        <button
          type="button"
          onClick={() => nav('/login')}
          style={{
            marginTop: 10,
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 12,
            padding: '14px 0',
            color: '#ffffff',
            fontFamily: BEBAS,
            fontSize: 20,
            letterSpacing: 4,
            cursor: 'pointer',
          }}
        >
          DÉJÀ CLIENT
        </button>

        {/* Footer */}
        <div
          style={{
            marginTop: 22,
            textAlign: 'center',
            fontFamily: BARLOW,
            color: 'rgba(255,255,255,0.55)',
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Orange Money · Airtel Money · Africell Money
        </div>
        <div
          style={{
            marginTop: 4,
            textAlign: 'center',
            fontFamily: BARLOW,
            color: 'rgba(255,255,255,0.35)',
            fontSize: 10,
            letterSpacing: 1.5,
          }}
        >
          +18 ans · Agréé MJS N°047/2016 · Jouez responsable
        </div>
      </div>
    </div>
  );
}
