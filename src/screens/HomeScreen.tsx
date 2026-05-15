import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Trophy, Wallet } from 'lucide-react';
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl border border-gold/30"
          style={{
            background:
              'linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 50%, #2a1f00 100%)',
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-congogreen/20 rounded-full blur-3xl" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
              <Flame className="w-4 h-4 animate-flicker" /> Événement
            </div>
            <h2 className="font-display text-4xl mt-2 leading-none">
              <span className="shine-text">FIFA WORLD CUP</span>
              <br />
              <span className="text-white">2026™</span>
            </h2>
            <div className="flex items-center gap-2 mt-3 text-sm text-zinc-300">
              <Trophy className="w-4 h-4 text-gold" /> Gagnez gros
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => nav('/jouer')}
              className="mt-5 w-full h-16 rounded-2xl bg-gradient-to-r from-gold via-yellow-300 to-gold text-black font-display text-3xl tracking-widest shadow-[0_8px_30px_rgba(255,215,0,0.45)]"
            >
              JOUER MAINTENANT
            </motion.button>
          </div>
        </motion.div>

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
                Tirage /30 min — 500 CDF
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
      </div>
    </div>
  );
}
