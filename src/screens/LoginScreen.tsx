import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock } from 'lucide-react';
import NumPad from '../components/NumPad';
import { detectOperator, loginUser, validateCongoPhone } from '../lib/auth';

export default function LoginScreen() {
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const op = detectOperator(phone);

  const onPhoneDigit = (d: string) => {
    if (phone.length >= 10) return;
    setPhone(phone + d);
    setErr(null);
  };

  const goPin = () => {
    if (!validateCongoPhone(phone)) return setErr('Numéro RDC invalide');
    setStep('pin');
    setErr(null);
  };

  const onPinDigit = async (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      try {
        setLoading(true);
        await loginUser(phone, next);
        nav('/', { replace: true });
      } catch (e: any) {
        setErr(e.message || 'Erreur');
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 pt-12">
      <div className="flex items-center gap-3 mb-6">
        <img src="/lion.svg" className="w-12 h-12" alt="" />
        <div>
          <div className="font-display text-3xl shine-text leading-none">CONGO GAMING</div>
          <div className="text-zinc-500 text-xs uppercase tracking-widest">Connexion</div>
        </div>
      </div>

      {step === 'phone' ? (
        <>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
            <Phone className="w-6 h-6 text-gold" />
            <div className="flex-1">
              <div className="text-xs text-zinc-500">Numéro</div>
              <div className="font-display text-3xl tracking-widest">
                {phone || <span className="text-zinc-700">09XXXXXXXX</span>}
              </div>
            </div>
            {op && <span className="text-xs px-2 py-1 rounded bg-gold/20 text-gold font-bold">{op}</span>}
          </div>
          {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}
          <div className="mt-5">
            <NumPad onDigit={onPhoneDigit} onDelete={() => setPhone(phone.slice(0, -1))} variant="amount" />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goPin}
            className="mt-5 h-14 rounded-2xl bg-gold text-black font-display text-2xl tracking-wider"
          >
            CONTINUER
          </motion.button>
          <p className="mt-6 text-center text-sm text-zinc-400">
            Pas de compte ?{' '}
            <Link to="/register" className="text-gold font-semibold">Créer un compte</Link>
          </p>
        </>
      ) : (
        <>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
            <Lock className="w-6 h-6 text-gold" />
            <div className="flex-1">
              <div className="text-xs text-zinc-500">Code PIN</div>
              <div className="flex gap-3 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-display text-2xl ${
                      pin.length > i ? 'bg-gold border-gold text-black' : 'border-zinc-700 text-zinc-700'
                    }`}
                  >
                    {pin.length > i ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}
          {loading && <div className="mt-3 text-gold text-sm">Connexion…</div>}
          <div className="mt-5">
            <NumPad onDigit={onPinDigit} onDelete={() => setPin(pin.slice(0, -1))} />
          </div>
          <button onClick={() => { setStep('phone'); setPin(''); }} className="mt-4 text-zinc-400 text-sm">
            ← Modifier le numéro
          </button>
        </>
      )}
    </div>
  );
}
