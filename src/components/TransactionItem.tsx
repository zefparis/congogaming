import { ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle } from 'lucide-react';

type Props = {
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: number;
  date: string;
};

const STATUS_LABEL: Record<number, { label: string; color: string; icon: any }> = {
  0: { label: 'En attente', color: 'text-yellow-400', icon: Clock },
  1: { label: 'En cours', color: 'text-yellow-400', icon: Clock },
  2: { label: 'Réussi', color: 'text-congogreen', icon: CheckCircle2 },
  3: { label: 'Échoué', color: 'text-red-500', icon: XCircle },
};

export default function TransactionItem({ type, amount, status, date }: Props) {
  const isDep = type === 'deposit';
  const Icon = isDep ? ArrowDownToLine : ArrowUpFromLine;
  const s = STATUS_LABEL[status] || STATUS_LABEL[0];
  const SIcon = s.icon;
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900/70 rounded-xl border border-zinc-800">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDep ? 'bg-congogreen/20 text-congogreen' : 'bg-gold/20 text-gold'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{isDep ? 'Dépôt' : 'Retrait'}</div>
        <div className="text-xs text-zinc-400">{new Date(date).toLocaleString('fr-FR')}</div>
      </div>
      <div className="text-right">
        <div className={`font-display text-xl ${isDep ? 'text-congogreen' : 'text-gold'}`}>
          {isDep ? '+' : '-'}{amount.toLocaleString('fr-FR')}
        </div>
        <div className={`text-[11px] flex items-center gap-1 justify-end ${s.color}`}>
          <SIcon className="w-3 h-3" /> {s.label}
        </div>
      </div>
    </div>
  );
}
