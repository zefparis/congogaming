import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Check } from 'lucide-react';
import NumPad from '../components/NumPad';
import { detectOperator, registerUser, validateCongoPhone } from '../lib/auth';

type Step = 'phone' | 'pin';

export default function RegisterScreen() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const op = detectOperator(phone);

  const onPhoneDigit = (d: string) => {
    setPhone((prev) => (prev.length < 10 ? prev + d : prev));
    setErr(null);
  };
  const onPhoneDelete = () => setPhone((prev) => prev.slice(0, -1));
  const onPinDelete = () => setPin((prev) => prev.slice(0, -1));
  const onPinDigit = async (d: string) => {
    let next = '';
    setPin((prev) => {
      next = prev.length < 4 ? prev + d : prev;
      return next;
    });
    if (next.length === 4) {
      try {
        setLoading(true);
        await registerUser(phone, next);
        nav('/', { replace: true });
      } catch (e: any) {
        setErr(e.message || 'Erreur');
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  const goNext = () => {
    if (!validateCongoPhone(phone)) return setErr('Numéro RDC invalide (10 chiffres)');
    if (!adult) return setErr('Vous devez avoir 18 ans ou plus');
    setErr(null);
    setStep('pin');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 pt-10">
      <Link to="/login" className="text-zinc-400 text-sm mb-4">← Retour</Link>
      <h1 className="font-display text-4xl text-gold tracking-wide">CRÉER UN COMPTE</h1>
      <p className="text-zinc-400 text-sm mt-1 mb-6">
        {step === 'phone' ? 'Entrez votre numéro' : 'Choisissez votre code PIN'}
      </p>

      {step === 'phone' ? (
        <>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
            <Phone className="w-6 h-6 text-gold" />
            <div className="flex-1">
              <div className="text-xs text-zinc-500">Numéro de téléphone</div>
              <input
                type="text"
                value={phone}
                readOnly
                inputMode="none"
                placeholder="09XXXXXXXX"
                aria-label="Numéro de téléphone"
                className="w-full bg-transparent border-0 outline-none font-display text-3xl tracking-widest text-white placeholder:text-zinc-700 caret-transparent select-none"
              />
            </div>
            {op && <span className="text-xs px-2 py-1 rounded bg-gold/20 text-gold font-bold">{op}</span>}
          </div>

          <button
            onClick={() => setAdult(!adult)}
            className="mt-5 flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800"
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${adult ? 'bg-congogreen' : 'bg-zinc-800 border border-zinc-700'}`}>
              {adult && <Check className="w-5 h-5 text-white" />}
            </div>
            <span className="text-sm text-left">J'ai 18 ans ou plus</span>
          </button>

          {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}

          <div className="mt-5">
            <NumPad onDigit={onPhoneDigit} onDelete={onPhoneDelete} variant="amount" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goNext}
            className="mt-5 h-14 rounded-2xl bg-gold text-black font-display text-2xl tracking-wider"
          >
            CONTINUER
          </motion.button>
        </>
      ) : (
        <>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
            <Lock className="w-6 h-6 text-gold" />
            <div className="flex-1">
              <div className="text-xs text-zinc-500">Code PIN (4 chiffres)</div>
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
          {loading && <div className="mt-3 text-gold text-sm">Création du compte…</div>}

          <div className="mt-5">
            <NumPad onDigit={onPinDigit} onDelete={onPinDelete} />
          </div>

          <button onClick={() => setStep('phone')} className="mt-4 text-zinc-400 text-sm">
            ← Modifier le numéro
          </button>
        </>
      )}
    </div>
  );
}
