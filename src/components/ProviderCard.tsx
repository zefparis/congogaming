import { motion } from 'framer-motion';

export type Provider = {
  id: number;
  name: string;
  short: string;
  color: string;
  ring: string;
};

export const PROVIDERS: Provider[] = [
  { id: 10, name: 'Orange', short: 'Money', color: 'bg-orange-500', ring: 'ring-orange-300' },
  { id: 17, name: 'Airtel', short: 'Money', color: 'bg-red-600', ring: 'ring-red-400' },
  { id: 19, name: 'Africell', short: 'Money', color: 'bg-blue-600', ring: 'ring-blue-400' },
];

type Props = {
  provider: Provider;
  selected: boolean;
  onClick: () => void;
};

export default function ProviderCard({ provider, selected, onClick }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative h-24 rounded-2xl ${provider.color} flex flex-col items-center justify-center text-white font-bold shadow-lg
        ${selected ? `ring-4 ${provider.ring}` : 'opacity-90'}`}
    >
      <span className="font-display text-2xl tracking-wide">{provider.name}</span>
      <span className="text-xs opacity-90">{provider.short}</span>
      {selected && (
        <span className="absolute top-2 right-2 bg-white text-black rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-black">✓</span>
      )}
    </motion.button>
  );
}
