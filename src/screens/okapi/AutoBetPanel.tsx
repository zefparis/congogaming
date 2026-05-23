import { useState } from 'react'

export interface AutoConfig {
  amount: number
  targetMultiplier: number
  maxRounds: number | null // null = infinite
  stopOnProfit: number // 0 = disabled
  stopOnLoss: number // 0 = disabled
}

interface Props {
  running: boolean
  /** Rounds elapsed since START AUTO. */
  roundsPlayed: number
  /** Cumulative profit & loss (CDF) since START AUTO. */
  totalPnl: number
  /** Last error message, if any (e.g. network failure on a round). */
  errorMsg: string | null
  onStart: (cfg: AutoConfig) => void
  onStop: () => void
}

const ROUND_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '∞', value: null },
]

const MIN_BET = 100
const MAX_BET = 50000

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')

export default function AutoBetPanel({
  running,
  roundsPlayed,
  totalPnl,
  errorMsg,
  onStart,
  onStop,
}: Props) {
  const [amount, setAmount] = useState<number>(500)
  const [target, setTarget] = useState<number>(1.5)
  const [maxRounds, setMaxRounds] = useState<number | null>(10)
  const [stopProfit, setStopProfit] = useState<number>(0)
  const [stopLoss, setStopLoss] = useState<number>(0)

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.floor(n) || 0))

  const start = () => {
    onStart({
      amount: clamp(amount, MIN_BET, MAX_BET),
      targetMultiplier: Math.max(1.01, Math.round(target * 100) / 100),
      maxRounds,
      stopOnProfit: Math.max(0, Math.floor(stopProfit) || 0),
      stopOnLoss: Math.max(0, Math.floor(stopLoss) || 0),
    })
  }

  if (running) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          height: '100%',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#1a1a1a',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
          }}
        >
          <span style={{ color: '#888' }}>Round</span>
          <strong style={{ color: '#FFD700' }}>
            {roundsPlayed}
            {maxRounds != null ? ` / ${maxRounds}` : ' / ∞'}
          </strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#1a1a1a',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
          }}
        >
          <span style={{ color: '#888' }}>P&amp;L</span>
          <strong
            style={{
              color: totalPnl > 0 ? '#00A86B' : totalPnl < 0 ? '#DC2626' : '#fff',
            }}
          >
            {totalPnl > 0 ? '+' : ''}
            {fmt(totalPnl)} CDF
          </strong>
        </div>
        {errorMsg && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              color: '#fca5a5',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            {errorMsg}
          </div>
        )}
        <button
          onClick={onStop}
          style={{
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            color: 'white',
            fontWeight: 900,
            fontSize: 14,
            borderRadius: 8,
            border: 'none',
            padding: '10px 0',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            marginTop: 'auto',
          }}
        >
          STOP AUTO
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        height: '100%',
      }}
    >
      <Row label="Mise (CDF)">
        <input
          type="number"
          min={MIN_BET}
          max={MAX_BET}
          value={amount}
          onChange={(e) => setAmount(clamp(Number(e.target.value), MIN_BET, MAX_BET))}
          style={inputStyle}
        />
      </Row>
      <Row label="Cashout auto à ×">
        <input
          type="number"
          step="0.01"
          min={1.01}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value) || 1.5)}
          style={inputStyle}
        />
      </Row>
      <Row label="Rounds">
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {ROUND_OPTIONS.map((r) => {
            const active = maxRounds === r.value
            return (
              <button
                key={r.label}
                onClick={() => setMaxRounds(r.value)}
                style={{
                  background: active ? '#FFD700' : '#333',
                  color: active ? '#000' : '#FFD700',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 4,
                  padding: '2px 6px',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: 22,
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </Row>
      {/* Stop gain / stop perte share one row to save vertical space. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: '#aaa', fontSize: 10 }}>Stop gain</span>
          <input
            type="number"
            min={0}
            value={stopProfit}
            placeholder="0=off"
            onChange={(e) => setStopProfit(Number(e.target.value) || 0)}
            style={{ ...inputStyle, width: '100%', textAlign: 'left' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: '#aaa', fontSize: 10 }}>Stop perte</span>
          <input
            type="number"
            min={0}
            value={stopLoss}
            placeholder="0=off"
            onChange={(e) => setStopLoss(Number(e.target.value) || 0)}
            style={{ ...inputStyle, width: '100%', textAlign: 'left' }}
          />
        </label>
      </div>
      <button
        onClick={start}
        style={{
          background: 'linear-gradient(135deg, #00A86B, #059669)',
          color: 'white',
          fontWeight: 900,
          fontSize: 14,
          borderRadius: 8,
          border: 'none',
          padding: '10px 0',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          marginTop: 'auto',
        }}
      >
        START AUTO
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#222',
  color: 'white',
  border: 'none',
  outline: 'none',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 13,
  width: 90,
  textAlign: 'right',
  fontWeight: 600,
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: '#aaa', fontSize: 11 }}>{label}</span>
      {children}
    </div>
  )
}
