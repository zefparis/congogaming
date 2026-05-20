import { motion } from 'framer-motion';

export type Provider = {
  id: number;
  name: string;
  short: string;
  color: string;
  ring: string;
  logo: string;
};

export const PROVIDERS: Provider[] = [
  { id: 10, name: 'Orange', short: 'Money', color: 'bg-orange-500', ring: 'ring-orange-300', logo: '/images/logo/Orange.png' },
  { id: 17, name: 'Airtel', short: 'Money', color: 'bg-red-600', ring: 'ring-red-400', logo: '/images/logo/Airtel.png' },
  { id: 19, name: 'Africell', short: 'Money', color: 'bg-blue-600', ring: 'ring-blue-400', logo: '/images/logo/afrimoney.png' },
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
      className={`relative h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden
        ${selected ? `ring-4 ${provider.ring}` : 'opacity-90'}`}
    >
      <img
        src={provider.logo}
        alt={provider.name}
        className="max-h-16 max-w-[80%] object-contain"
      />
      {selected && (
        <span className="absolute top-2 right-2 bg-congogreen text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-black">✓</span>
      )}
    </motion.button>
  );
}
