import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shuffle,
  Trash2,
  XCircle,
} from 'lucide-react';
import { getSession, refreshBalance } from '../lib/auth';
import { api } from '../lib/api';

type State = 'idle' | 'pending' | 'success' | 'error';

type Tirage = {
  id: string;
  numeros: number[];
  complementaire: number;
  jackpot: number;
  hash_pre: string;
  drawn_at: string;
};

type Ticket = {
  id: string;
  numeros: number[];
  prix_cdf: number;
  gains_cdf: number;
  nb_bons: number;
  status: 'pending' | 'gagnant' | 'perdant';
  tirage_id: string | null;
  created_at: string;
};

const TICKET_PRICE = 500;

export default function LotoScreen() {
  const nav = useNavigate();
  const session = getSession();

  const [selected, setSelected] = useState<number[]>([]);
  const [state, setState] = useState<State>('idle');
  const [msg, setMsg] = useState('');
  const [playedNums, setPlayedNums] = useState<number[] | null>(null);

  const [tirage, setTirage] = useState<Tirage | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showTickets, setShowTickets] = useState(false);

  useEffect(() => {
    api.lotoLatest().then((r) => setTirage(r.tirage)).catch(() => {});
    if (session) {
      api.lotoMesTickets(session.id).then((r) => setTickets(r.tickets)).catch(() => {});
    }
  }, []);

  const isFull = selected.length === 6;

  const toggle = (n: number) => {
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 6) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
    if (state !== 'idle') {
      setState('idle');
      setMsg('');
    }
  };

  const quickPick = () => {
    const set = new Set<number>();
    while (set.size < 6) set.add(Math.floor(Math.random() * 49) + 1);
    setSelected(Array.from(set).sort((a, b) => a - b));
    setState('idle');
    setMsg('');
  };

  const clearSel = () => {
    setSelected([]);
    setState('idle');
    setMsg('');
    setPlayedNums(null);
  };

  const submit = async () => {
    if (!session || !isFull || state === 'pending') return;
    setState('pending');
    setMsg('Validation du ticket…');
    try {
      await api.lotoTicket(session.id, selected);
      setState('success');
      setMsg('Ticket enregistré !');
      setPlayedNums(selected);
      setSelected([]);
      await refreshBalance(session.id);
      // refresh tickets list
      api.lotoMesTickets(session.id).then((r) => setTickets(r.tickets)).catch(() => {});
    } catch (e: any) {
      setState('error');
      setMsg(e.message || 'Erreur');
    }
  };

  const grid = useMemo(() => Array.from({ length: 49 }, (_, i) => i + 1), []);

  return (
    <div className="min-h-screen p-4 pb-28">
      <header className="flex items-center gap-3 py-2">
        <button
          onClick={() => nav('/')}
          className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gold"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img
          src="/images/okapi.PNG"
          alt="Congo Gaming"
          className="h-10 w-auto object-contain cursor-pointer"
          onClick={() => {
            const user = getSession();
            user ? nav('/home') : nav('/');
          }}
        />
        <h1 className="font-display text-2xl text-gold tracking-wider ml-auto">LOTO</h1>
      </header>

      {/* Dernier tirage */}
      <div className="mt-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Dernier tirage</div>
          {tirage && (
            <div className="text-[10px] text-zinc-500">
              {new Date(tirage.drawn_at).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
        {tirage ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {tirage.numeros.map((n) => (
              <Ball key={n} n={n} variant="gold" />
            ))}
            <span className="text-zinc-600 mx-1">+</span>
            <Ball n={tirage.complementaire} variant="green" />
          </div>
        ) : (
          <div className="mt-2 text-sm text-zinc-400">Prochain tirage bientôt</div>
        )}
        <div className="mt-3 text-[10px] text-zinc-500 uppercase tracking-widest">Jackpot</div>
        <div className="font-display text-3xl text-gold">
          {(tirage?.jackpot ?? 5_000_000).toLocaleString('fr-FR')}
          <span className="text-xs text-zinc-400 ml-1">CDF</span>
        </div>
      </div>

      {/* Sélection */}
      <div className="mt-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            Choisissez 6 numéros
          </div>
          <div className="font-display text-xl text-gold">{selected.length}/6</div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {grid.map((n) => {
            const on = selected.includes(n);
            return (
              <motion.button
                key={n}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggle(n)}
                className={`h-11 rounded-lg font-display text-lg transition-colors ${
                  on
                    ? 'bg-gold text-black font-bold shadow-[0_0_12px_rgba(255,215,0,0.5)]'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-200'
                }`}
              >
                {n}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={quickPick}
            className="h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Shuffle className="w-4 h-4" /> QUICK PICK
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={clearSel}
            disabled={selected.length === 0}
            className="h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> EFFACER
          </motion.button>
        </div>
      </div>

      {/* Status messages */}
      {state !== 'idle' && (
        <div
          className={`mt-4 p-3 rounded-xl border flex items-start gap-2 ${
            state === 'pending'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
              : state === 'success'
              ? 'bg-congogreen/10 border-congogreen/30 text-congogreen'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {state === 'pending' && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
          {state === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {state === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
          <div className="text-sm">
            <div>{msg}</div>
            {state === 'success' && playedNums && (
              <div className="mt-2 flex flex-wrap gap-1">
                {playedNums.map((n) => (
                  <Ball key={n} n={n} variant="gold" small />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={submit}
        disabled={!isFull || state === 'pending'}
        className="mt-4 w-full h-16 rounded-2xl bg-gradient-to-r from-gold via-yellow-300 to-gold text-black font-display text-2xl tracking-widest disabled:opacity-50 disabled:from-zinc-700 disabled:via-zinc-700 disabled:to-zinc-700 disabled:text-zinc-400"
      >
        JOUER — {TICKET_PRICE} CDF
      </motion.button>

      {/* Mes tickets accordion */}
      <div className="mt-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 overflow-hidden">
        <button
          onClick={() => setShowTickets((v) => !v)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="text-xs uppercase tracking-widest text-zinc-400">
            Mes tickets ({tickets.length})
          </div>
          {showTickets ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {showTickets && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {tickets.length === 0 && (
                  <div className="text-sm text-zinc-500">Aucun ticket pour le moment.</div>
                )}
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl bg-zinc-950 border border-zinc-800 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] text-zinc-500">
                        {new Date(t.created_at).toLocaleString('fr-FR')}
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {t.numeros.map((n) => (
                        <Ball key={n} n={n} variant="gold" small />
                      ))}
                    </div>
                    {t.gains_cdf > 0 && (
                      <div className="mt-2 text-sm text-congogreen font-semibold">
                        + {t.gains_cdf.toLocaleString('fr-FR')} CDF
                      </div>
                    )}
                    {t.status !== 'pending' && (
                      <div className="mt-1 text-[10px] text-zinc-500">
                        {t.nb_bons} numéro{t.nb_bons > 1 ? 's' : ''} correct
                        {t.nb_bons > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Ball({
  n,
  variant,
  small,
}: {
  n: number;
  variant: 'gold' | 'green';
  small?: boolean;
}) {
  const size = small ? 'w-7 h-7 text-sm' : 'w-10 h-10 text-lg';
  const color =
    variant === 'gold'
      ? 'bg-gradient-to-br from-yellow-300 to-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]'
      : 'bg-gradient-to-br from-emerald-400 to-congogreen text-white shadow-[0_0_10px_rgba(0,168,107,0.4)]';
  return (
    <div
      className={`${size} ${color} rounded-full flex items-center justify-center font-display`}
    >
      {n}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'gagnant' | 'perdant' }) {
  const map = {
    pending: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300',
    gagnant: 'bg-congogreen/15 border-congogreen/30 text-congogreen',
    perdant: 'bg-zinc-700/30 border-zinc-700 text-zinc-400',
  } as const;
  const label = { pending: 'En attente', gagnant: 'Gagnant', perdant: 'Perdant' }[status];
  return (
    <span
      className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${map[status]}`}
    >
      {label}
    </span>
  );
}
