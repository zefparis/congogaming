import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import NumPad from '../components/NumPad';
import ProviderCard, { PROVIDERS } from '../components/ProviderCard';
import { getSession, refreshBalance } from '../lib/auth';
import { api } from '../lib/api';

type State = 'idle' | 'pending' | 'success' | 'error';

// Keep these in sync with server/routes/deposit.ts MIN_AMOUNTS.
const MIN_AMOUNTS: Record<number, number> = {
  10: 100,   // Orange
  17: 100,   // Airtel
  19: 2250,  // Africell / Afrimoney
};
const DEFAULT_CHIPS = [1000, 5000, 10000, 25000];
const AFRICELL_CHIPS = [2500, 5000, 10000, 20000];

const detectProvider = (phone: string): number | null => {
  if (/^08[45678]/.test(phone)) return 10;  // Orange
  if (/^08[19]/.test(phone)) return 17;      // Airtel  
  if (/^097/.test(phone)) return 17;         // Airtel
  if (/^099/.test(phone)) return 17;         // Airtel
  if (/^09[23]/.test(phone)) return 19;      // Africell
  return null;
};

export default function DepositScreen() {
  const nav = useNavigate();
  const session = getSession();
  const [amount, setAmount] = useState('');
  const [providerId, setProviderId] = useState<number>(10);
  const [phone, setPhone] = useState(session?.phone || '');
  const [autoDetected, setAutoDetected] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [msg, setMsg] = useState<string>('');

  const onDigit = (d: string) => {
    if (amount.length >= 9) return;
    const next = (amount + d).replace(/^0+/, '');
    setAmount(next);
  };

  const submit = async () => {
    if (!session) return;
    const amt = Number(amount);
    const minAmount = MIN_AMOUNTS[providerId] ?? 100;
    if (!amt || amt < minAmount) {
      setState('error');
      setMsg(`Montant minimum : ${minAmount.toLocaleString('fr-FR')} CDF`);
      return;
    }
    if (!/^0[89]\d{8}$/.test(phone)) { setState('error'); setMsg('Numéro invalide'); return; }
    setState('pending');
    setMsg('Demande envoyée. Confirmez sur votre téléphone…');
    try {
      const r = await api.deposit({ user_id: session.id, amount: amt, provider_id: providerId, phone });
      // Poll status briefly
      let tries = 0;
      const poll = async () => {
        tries++;
        try {
          const s = await api.status(r.order_id);
          if (s.status === 2) {
            setState('success'); setMsg('Dépôt réussi !');
            await refreshBalance(session.id);
            return;
          }
          if (s.status === 3) { setState('error'); setMsg('Transaction échouée'); return; }
        } catch {}
        if (tries < 10) setTimeout(poll, 3000);
      };
      setTimeout(poll, 3000);
    } catch (e: any) {
      setState('error'); setMsg(e.message || 'Erreur');
    }
  };

  return (
    <div className="min-h-screen p-4 pb-28">
      <header className="flex items-center gap-3 py-2">
        <button onClick={() => nav('/')} className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gold">
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
      </header>

      <div className="mt-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-widest">Numéro</div>
        <input
          inputMode="numeric"
          value={phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            setPhone(value);
            const detected = detectProvider(value);
            if (detected) {
              setProviderId(detected);
              setAutoDetected(true);
            }
          }}
          className="bg-transparent w-full font-display text-2xl tracking-widest outline-none mt-1"
        />
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Opérateur</div>
        <div className="grid grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={providerId === p.id}
              autoDetected={autoDetected && providerId === p.id}
              onClick={() => {
                setProviderId(p.id);
                setAutoDetected(false);
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-widest">Montant (CDF)</div>
        <div className="font-display text-5xl text-white mt-1">
          {amount ? Number(amount).toLocaleString('fr-FR') : <span className="text-zinc-700">0</span>}
        </div>
        <div className="flex gap-2 mt-3">
          {(providerId === 19 ? AFRICELL_CHIPS : DEFAULT_CHIPS).map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="flex-1 h-9 rounded-lg bg-zinc-800 text-xs font-semibold border border-zinc-700"
            >
              {v.toLocaleString('fr-FR')}
            </button>
          ))}
        </div>
        {providerId === 19 && (
          <div className="mt-2 text-[11px] text-amber-400/80">
            Montant minimum : 2 250 CDF
          </div>
        )}
      </div>

      <div className="mt-4">
        <NumPad onDigit={onDigit} onDelete={() => setAmount(amount.slice(0, -1))} variant="amount" />
      </div>

      {state !== 'idle' && (
        <div className={`mt-4 p-3 rounded-xl border flex items-start gap-2 ${
          state === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
          state === 'success' ? 'bg-congogreen/10 border-congogreen/30 text-congogreen' :
          'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {state === 'pending' && <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
          {state === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {state === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm">{msg}</span>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={submit}
        disabled={state === 'pending'}
        className="mt-4 w-full h-16 rounded-2xl bg-congogreen text-white font-display text-3xl tracking-widest disabled:opacity-60"
      >
        CONFIRMER
      </motion.button>
    </div>
  );
}
