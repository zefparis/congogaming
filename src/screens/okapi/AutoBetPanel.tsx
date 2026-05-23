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
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false)

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

  // ---------------- RUNNING: compact status bar + STOP ----------------
  if (running) {
    return (
      <div style={containerStyle}>
        {errorMsg && <ErrorBanner msg={errorMsg} />}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#1a1a1a',
            borderRadius: 8,
            padding: '0 12px',
            height: 36,
            fontSize: 12,
            color: 'white',
          }}
        >
          <span style={{ color: '#888' }}>Round</span>
          <strong style={{ color: '#FFD700' }}>
            {roundsPlayed}
            {maxRounds != null ? `/${maxRounds}` : '/∞'}
          </strong>
          <span style={{ color: '#444', margin: '0 4px' }}>·</span>
          <span style={{ color: '#888' }}>P&amp;L</span>
          <strong
            style={{
              color: totalPnl > 0 ? '#00A86B' : totalPnl < 0 ? '#DC2626' : '#fff',
              marginLeft: 'auto',
            }}
          >
            {totalPnl > 0 ? '+' : ''}
            {fmt(totalPnl)} CDF
          </strong>
        </div>
        <button
          onClick={onStop}
          style={{
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            color: 'white',
            fontWeight: 900,
            fontSize: 14,
            borderRadius: 8,
            border: 'none',
            height: 40,
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          STOP AUTO
        </button>
      </div>
    )
  }

  // ---------------- IDLE: 2-row compact config + ⚙ ----------------
  return (
    <div style={containerStyle}>
      {errorMsg && <ErrorBanner msg={errorMsg} />}

      {/* Row 1: Mise | ×target | ⚙ */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ ...fieldShell, flex: 1.4 }}>
          <span style={fieldLabel}>Mise</span>
          <input
            type="number"
            min={MIN_BET}
            max={MAX_BET}
            value={amount}
            onChange={(e) =>
              setAmount(clamp(Number(e.target.value), MIN_BET, MAX_BET))
            }
            style={compactInput}
          />
        </div>
        <div style={{ ...fieldShell, flex: 1 }}>
          <span style={{ ...fieldLabel, color: '#FFD700' }}>×</span>
          <input
            type="number"
            step="0.01"
            min={1.01}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 1.5)}
            style={compactInput}
          />
        </div>
        <button
          onClick={() => setAdvancedOpen(true)}
          aria-label="Réglages avancés"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            background: '#222',
            border: '1px solid #333',
            color: '#FFD700',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>

      {/* Row 2: round chips */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
        {ROUND_OPTIONS.map((r) => {
          const active = maxRounds === r.value
          return (
            <button
              key={r.label}
              onClick={() => setMaxRounds(r.value)}
              style={{
                flex: 1,
                background: active ? '#FFD700' : '#222',
                color: active ? '#000' : '#FFD700',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 999,
                padding: '4px 0',
                border: active ? 'none' : '1px solid #333',
                cursor: 'pointer',
                height: 26,
              }}
            >
              {r.label}
            </button>
          )
        })}
      </div>

      {/* START AUTO — full width gold (mirrors MISER weight) */}
      <button
        onClick={start}
        style={{
          background: 'linear-gradient(135deg, #FFD700, #F59E0B)',
          color: '#000000',
          fontWeight: 900,
          fontSize: 16,
          borderRadius: 10,
          border: 'none',
          height: 44,
          cursor: 'pointer',
          letterSpacing: '0.08em',
          marginTop: 'auto',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.25)',
        }}
      >
        START AUTO
      </button>

      {/* Advanced settings bottom sheet */}
      {advancedOpen && (
        <AdvancedSheet
          stopProfit={stopProfit}
          stopLoss={stopLoss}
          onChangeProfit={setStopProfit}
          onChangeLoss={setStopLoss}
          onClose={() => setAdvancedOpen(false)}
        />
      )}
    </div>
  )
}

// ---------------- Helpers ----------------

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: '100%',
  height: '100%',
}

const fieldShell: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: '#222',
  borderRadius: 8,
  height: 36,
  padding: '0 8px',
  gap: 4,
  border: '1px solid #333',
}

const fieldLabel: React.CSSProperties = {
  color: '#888',
  fontSize: 11,
  fontWeight: 600,
  flexShrink: 0,
}

const compactInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  color: 'white',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  fontWeight: 700,
  textAlign: 'right',
  padding: 0,
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div
      role="alert"
      style={{
        background: 'rgba(220, 38, 38, 0.2)',
        color: '#fca5a5',
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid rgba(220, 38, 38, 0.4)',
      }}
    >
      {msg}
    </div>
  )
}

interface SheetProps {
  stopProfit: number
  stopLoss: number
  onChangeProfit: (n: number) => void
  onChangeLoss: (n: number) => void
  onClose: () => void
}

function AdvancedSheet({
  stopProfit,
  stopLoss,
  onChangeProfit,
  onChangeLoss,
  onClose,
}: SheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 99,
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          background: '#1a1a2e',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: '14px 18px 18px',
          zIndex: 100,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <strong style={{ fontSize: 14, letterSpacing: '0.04em' }}>
            Réglages avancés
          </strong>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#aaa',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <label style={sheetField}>
          <span style={{ color: '#aaa', fontSize: 12 }}>
            Stop gain (CDF) — 0 = désactivé
          </span>
          <input
            type="number"
            min={0}
            value={stopProfit}
            placeholder="0"
            onChange={(e) => onChangeProfit(Number(e.target.value) || 0)}
            style={sheetInput}
          />
        </label>
        <label style={sheetField}>
          <span style={{ color: '#aaa', fontSize: 12 }}>
            Stop perte (CDF) — 0 = désactivé
          </span>
          <input
            type="number"
            min={0}
            value={stopLoss}
            placeholder="0"
            onChange={(e) => onChangeLoss(Number(e.target.value) || 0)}
            style={sheetInput}
          />
        </label>
      </div>
    </>
  )
}

const sheetField: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 12,
}

const sheetInput: React.CSSProperties = {
  background: '#0f0f1e',
  color: 'white',
  border: '1px solid #333',
  outline: 'none',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 700,
}
