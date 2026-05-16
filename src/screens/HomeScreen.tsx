import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { getSession, refreshBalance } from '../lib/auth';
import { api } from '../lib/api';

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
      <header className="flex items-center justify-between p-4 border-b border-zinc-900">
        <img src="/images/okapi.PNG" alt="Congo Gaming" className="h-10 w-auto object-contain" />
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Solde</div>
          <div className="font-display text-2xl text-gold flex items-center gap-1 justify-end">
            <Wallet className="w-5 h-5" />
            {balance.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-zinc-500">CDF</div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, minHeight: 220 }}>
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
              objectPosition: 'center top',
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

          {/* Content on top */}
          <div style={{ position: 'relative', padding: '20px 16px' }}>
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
            <button
              onClick={() => nav('/jouer')}
              style={{
                width: '100%',
                padding: '13px 0',
                background: 'linear-gradient(90deg, #FFD700, #F59E0B)',
                color: '#000000',
                fontWeight: 900,
                fontSize: 16,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Bebas Neue',
                letterSpacing: 2,
              }}
            >
              JOUER MAINTENANT →
            </button>
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => nav('/loto')}
            className="cursor-pointer rounded-2xl bg-zinc-900 border border-gold/30 p-3 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className="text-2xl">🎱</div>
              <div className="font-display text-lg text-gold tracking-wider">LOTO CONGO</div>
            </div>
            {lotoPot >= 5_000_000 ? (
              <div className="text-[11px] text-gold font-semibold animate-flicker">
                🔥 JACKPOT DISPO !
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400">
                Pot : {lotoPot.toLocaleString('fr-FR')} CDF
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); nav('/loto'); }}
              className="mt-1 h-9 rounded-xl bg-gold text-black font-display text-sm tracking-wider"
            >
              JOUER
            </motion.button>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => nav('/flash')}
            className="cursor-pointer rounded-2xl bg-zinc-900 border border-congogreen/40 p-3 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className="text-2xl">⚡</div>
              <div className="font-display text-lg text-gold tracking-wider">LOTO FLASH</div>
            </div>
            {flashPot >= 250_000 ? (
              <div className="text-[11px] text-gold font-semibold animate-flicker">
                ⚡ JACKPOT DISPO !
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400">
                Tirage /30 min — 1 000 CDF
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); nav('/flash'); }}
              className="mt-1 h-9 rounded-xl bg-congogreen text-white font-display text-sm tracking-wider"
            >
              JOUER
            </motion.button>
          </motion.div>
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
