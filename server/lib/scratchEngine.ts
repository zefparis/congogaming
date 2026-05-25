/**
 * Scratch card grid generator.
 *
 * Symbols and 3-in-a-row payouts:
 *   okapi    × 50  (jackpot)
 *   diamond  × 20
 *   lightning× 10
 *   star     ×  5
 *   coin     ×  3
 *   flame    ×  2
 *
 * Plus: any 2 identical symbols anywhere in the 9-cell grid → bet × 0.5 (consolation).
 *
 * House edge ≈ 37.5% with current weights.
 * EV per bet = Σ (weight_i / Σw) * payout_multiplier_i
 * House edge = 1 - EV.
 */

export type ScratchSymbol = 'okapi' | 'diamond' | 'lightning' | 'star' | 'coin' | 'flame';

export const SYMBOLS: ScratchSymbol[] = [
  'okapi',
  'diamond',
  'lightning',
  'star',
  'coin',
  'flame',
];

const THREE_IN_A_ROW: Record<ScratchSymbol, number> = {
  okapi: 50,
  diamond: 20,
  lightning: 10,
  star: 5,
  coin: 3,
  flame: 2,
};
const CONSOLATION = 0.5;

type Outcome =
  | { kind: 'jackpot_okapi' }
  | { kind: 'three'; sym: ScratchSymbol }
  | { kind: 'consolation' }
  | { kind: 'lose' };

// Explicit roll ladder (cumulative probabilities). The previous weighted
// table over-rewarded small wins; this ladder is the source of truth and
// matches the product spec:
//   0.5%  okapi      ×50
//   1.0%  diamond    ×20
//   2.0%  lightning  ×10
//   2.0%  star       ×5
//   1.0%  coin       ×3
//   1.0%  flame      ×2
//  25.0%  consolation ×0.5
//  67.5%  lose
function pickOutcome(): Outcome {
  const roll = Math.random();
  if (roll < 0.005) return { kind: 'jackpot_okapi' };
  if (roll < 0.015) return { kind: 'three', sym: 'diamond' };
  if (roll < 0.035) return { kind: 'three', sym: 'lightning' };
  if (roll < 0.055) return { kind: 'three', sym: 'star' };
  if (roll < 0.065) return { kind: 'three', sym: 'coin' };
  if (roll < 0.075) return { kind: 'three', sym: 'flame' };
  if (roll < 0.325) return { kind: 'consolation' };
  return { kind: 'lose' };
}

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function buildGrid(
  type: 'win' | 'consolation' | 'lose',
  symbol?: ScratchSymbol,
): ScratchSymbol[] {
  const symbols = SYMBOLS.slice();
  const grid: ScratchSymbol[] = [];

  if (type === 'win' && symbol) {
    grid.push(symbol, symbol, symbol);
    for (let i = 3; i < 9; i++) {
      const others = symbols.filter((s) => s !== symbol);
      grid.push(others[Math.floor(Math.random() * others.length)]);
    }
    return grid;
  }

  if (type === 'consolation') {
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    grid.push(s, s);
    const others = symbols.filter((x) => x !== s);
    while (grid.length < 9) {
      grid.push(others[grid.length % others.length]);
    }
    return grid.sort(() => Math.random() - 0.5);
  }

  // lose
  const pool: ScratchSymbol[] = [...symbols, ...symbols.slice(0, 3)];
  return pool.sort(() => Math.random() - 0.5).slice(0, 9);
}

function evaluate(
  grid: ScratchSymbol[],
): { kind: 'three' | 'consolation' | 'lose'; sym?: ScratchSymbol } {
  for (const [a, b, c] of WIN_LINES) {
    if (grid[a] === grid[b] && grid[b] === grid[c]) return { kind: 'three', sym: grid[a] };
  }
  const counts: Partial<Record<ScratchSymbol, number>> = {};
  for (const s of grid) counts[s] = (counts[s] ?? 0) + 1;
  if (Object.values(counts).some((n) => (n ?? 0) >= 2)) return { kind: 'consolation' };
  return { kind: 'lose' };
}

export function generateGrid(bet: number): { grid: ScratchSymbol[]; win: number } {
  const outcome = pickOutcome();
  let grid: ScratchSymbol[];
  switch (outcome.kind) {
    case 'jackpot_okapi':
      grid = buildGrid('win', 'okapi');
      break;
    case 'three':
      grid = buildGrid('win', outcome.sym);
      break;
    case 'consolation':
      grid = buildGrid('consolation');
      break;
    case 'lose':
    default:
      grid = buildGrid('lose');
      break;
  }
  const ev = evaluate(grid);
  let win = 0;
  if (ev.kind === 'three' && ev.sym) {
    win = Math.floor(bet * THREE_IN_A_ROW[ev.sym]);
  } else if (ev.kind === 'consolation') {
    win = Math.floor(bet * CONSOLATION);
  }
  return { grid, win };
}
