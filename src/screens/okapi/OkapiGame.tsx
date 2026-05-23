import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { gameSocket } from '../../lib/okapi-socket'
import type { GameMessage } from '../../lib/okapi-socket'
import { okapiApi } from '../../lib/okapi-api'
import { getSession, saveSession } from '../../lib/auth'
import MultiplierDisplay from './MultiplierDisplay'
import CrashHistory from './CrashHistory'
import PlayersList from './PlayersList'
import BetPanel from './BetPanel'
import ClimbCurve from './ClimbCurve'

type GameState = 'waiting' | 'playing' | 'crashed' | 'cashedout'
type BgKey = 'climb' | 'slip' | 'crash' | 'win'

const BG_MAP: Record<BgKey, string> = {
  climb: '/images/okapi/okapi-climb.png',
  slip: '/images/okapi/okapi-slip.png',
  crash: '/images/okapi/okapi-crash.png',
  win: '/images/okapi/okapi-win.png',
}

export default function OkapiGame() {
  const nav = useNavigate()
  const session = getSession()
  const userId = session?.id ?? ''
  // Always start at 0; the real balance is fetched from the backend on mount.
  // Never trust the value cached in localStorage to display in-game.
  const [balance, setBalance] = useState<number>(0)
  const [betError, setBetError] = useState<string | null>(null)
  const [betSubmitting, setBetSubmitting] = useState<boolean>(false)

  const updateBalance = useCallback((n: number) => {
    const num = Number(n) || 0
    setBalance(num)
    const s = getSession()
    if (s) saveSession({ ...s, balance_cdf: num })
  }, [])

  // Canonical balance fetch: hits api.congogaming.com/api/wallet/balance which
  // reads public.users.balance_cdf. This is the only source of truth for the
  // in-game balance display.
  const syncBalance = useCallback(async () => {
    if (!userId) return
    try {
      const res = await okapiApi.getBalance(userId)
      updateBalance(res.balance)
    } catch {
      /* keep last known value */
    }
  }, [userId, updateBalance])

  const [state, setState] = useState<GameState>('waiting')
  const [countdown, setCountdown] = useState<number>(5)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [crashPoint, setCrashPoint] = useState<number | null>(null)
  const [cashoutMultiplier, setCashoutMultiplier] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const [multiplier, setMultiplier] = useState<number>(1)

  const [betId, setBetId] = useState<string | null>(null)
  const hasBetRef = useRef(false)
  const betIdRef = useRef<string | null>(null)
  const gotServerMsg = useRef(false)

  // Pull authoritative balance from the backend on mount
  useEffect(() => {
    syncBalance()
  }, [syncBalance])

  // Connect WS and load history
  useEffect(() => {
    gameSocket.connect()
    okapiApi.history().then((r) => setHistory(r.history)).catch(() => {})
    return () => {
      // keep socket alive across re-renders, but close on unmount
      gameSocket.close()
    }
  }, [])

  // Subscribe to socket events
  useEffect(() => {
    const off = gameSocket.on((msg: GameMessage) => {
      gotServerMsg.current = true
      switch (msg.type) {
        case 'WAITING':
          setState('waiting')
          setCountdown(msg.countdown)
          setCrashPoint(null)
          setCashoutMultiplier(null)
          setMultiplier(1)
          setBetId(null)
          betIdRef.current = null
          hasBetRef.current = false
          // New round: re-sync wallet so any settled bet from the previous
          // round (lost or won) is reflected on screen.
          syncBalance()
          break
        case 'PLAYING':
          setState('playing')
          setStartTime(msg.startTime)
          break
        case 'TICK':
          setMultiplier(msg.multiplier)
          break
        case 'CRASHED':
          setState((prev) => (prev === 'cashedout' ? 'cashedout' : 'crashed'))
          setCrashPoint(msg.crashPoint)
          setHistory((h) => [msg.crashPoint, ...h].slice(0, 20))
          betIdRef.current = null
          // Bet was already deducted at placement; nothing else to charge.
          // Still re-sync to be safe (covers reconnect / missed events).
          syncBalance()
          break
        case 'CASHOUT_CONFIRM':
          // eslint-disable-next-line no-console
          console.log('Player cashed out:', msg)
          break
        case 'HISTORY':
          setHistory(msg.history)
          break
      }
    })
    return () => {
      off()
    }
  }, [syncBalance])

  // Local fallback state machine if no server is connected
  useEffect(() => {
    let raf = 0
    let timer: number | null = null
    let localCrash = 0

    function startWaiting() {
      setState('waiting')
      setMultiplier(1)
      setCrashPoint(null)
      setCashoutMultiplier(null)
      setBetId(null)
      hasBetRef.current = false
      let c = 5
      setCountdown(c)
      timer = window.setInterval(() => {
        c -= 1
        setCountdown(c)
        if (c <= 0) {
          if (timer) window.clearInterval(timer)
          startPlaying()
        }
      }, 1000)
    }

    function startPlaying() {
      const r = Math.random()
      localCrash = r < 0.05 ? 1.0 : Math.max(1.0, (1 / (1 - r)) * 0.95)
      const t0 = performance.now()
      setStartTime(t0)
      setState('playing')
      const loop = () => {
        const elapsed = (performance.now() - t0) / 1000
        const m = 1 + 0.06 * elapsed + Math.pow(0.06 * elapsed, 2)
        setMultiplier(m)
        if (m >= localCrash) {
          setCrashPoint(localCrash)
          setHistory((h) => [localCrash, ...h].slice(0, 20))
          setState((prev) => (prev === 'cashedout' ? 'cashedout' : 'crashed'))
          timer = window.setTimeout(() => startWaiting(), 3000)
          return
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    const fallback = window.setTimeout(() => {
      if (gotServerMsg.current) return
      startWaiting()
    }, 2000)

    return () => {
      window.clearTimeout(fallback)
      if (timer) {
        window.clearInterval(timer)
        window.clearTimeout(timer)
      }
      cancelAnimationFrame(raf)
    }
  }, [])

  const bgKey: BgKey = useMemo(() => {
    if (state === 'cashedout') return 'win'
    if (state === 'crashed') return 'crash'
    if (state === 'playing' && multiplier >= 5) return 'slip'
    return 'climb'
  }, [state, multiplier])

  const onTick = useCallback((m: number) => {
    setMultiplier(m)
  }, [])

  const handlePlaceBet = async (amount: number) => {
    if (!userId) {
      nav('/login')
      return
    }
    if (betSubmitting) return
    if (amount > balance) {
      setBetError('Solde insuffisant')
      return
    }
    setBetError(null)
    setBetSubmitting(true)
    try {
      const res = await okapiApi.placeBet(userId, amount)
      // Only commit the bet client-side after the server has actually
      // debited the wallet via adjust_balance.
      setBetId(res.bet_id)
      betIdRef.current = res.bet_id
      hasBetRef.current = true
      if (res.balance !== null && res.balance !== undefined) {
        updateBalance(res.balance)
      } else {
        // Server up but Supabase not configured: pull authoritative value.
        await syncBalance()
      }
    } catch (err: any) {
      // No optimistic update happened, so nothing to roll back. Surface error.
      setBetError(err?.message?.includes('Insufficient')
        ? 'Solde insuffisant'
        : 'Mise refusée')
      // Re-sync just in case.
      syncBalance()
    } finally {
      setBetSubmitting(false)
    }
  }

  const handleCashout = async () => {
    if (!hasBetRef.current) return
    const currentBetId = betIdRef.current
    if (!currentBetId) return
    const localM = multiplier
    setState('cashedout')
    setCashoutMultiplier(localM)
    try {
      const res = await okapiApi.cashout(userId, currentBetId)
      setCashoutMultiplier(res.multiplier)
      if (res.balance !== null && res.balance !== undefined) {
        updateBalance(res.balance)
      } else {
        // Pull authoritative value from the backend.
        await syncBalance()
      }
    } catch {
      // Cashout failed (e.g. race with crash). Re-sync to reflect the loss.
      syncBalance()
    } finally {
      betIdRef.current = null
    }
  }

  const okapiAnimClass =
    state === 'playing'
      ? 'okapi-climbing'
      : state === 'crashed'
      ? 'okapi-crashed'
      : ''

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#000000',
        overflow: 'hidden',
        color: 'white',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          zIndex: 30,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          gap: 8,
        }}
      >
        <button
          onClick={() => nav('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: 4,
          }}
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className="tracking-widest whitespace-nowrap"
          style={{ fontFamily: 'Bebas Neue', fontSize: 18, lineHeight: 1, color: '#FFD700' }}
        >
          OKAPI CLIMB
        </div>
        <div
          className="font-semibold tracking-wider whitespace-nowrap"
          style={{ fontSize: 12, color: '#FFD700' }}
        >
          {balance.toLocaleString()} CDF
        </div>
      </div>

      {/* HISTORY BAR */}
      <div
        style={{
          height: 28,
          flexShrink: 0,
          zIndex: 30,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 6,
          overflowX: 'auto',
        }}
        className="no-scrollbar"
      >
        <CrashHistory history={history} />
      </div>

      {/* GAME ZONE */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <AnimatePresence>
          <motion.img
            key={bgKey}
            src={BG_MAP[bgKey]}
            alt="okapi"
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={okapiAnimClass}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
            }}
          />
        </AnimatePresence>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55))',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        <ClimbCurve state={state} startTime={startTime} />

        <div
          className="hidden md:block"
          style={{ position: 'absolute', left: 16, top: 16, zIndex: 25 }}
        >
          <PlayersList
            state={state}
            multiplier={multiplier}
            crashPoint={crashPoint}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 25,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            {state === 'waiting' && (
              <div
                className="text-white/80 tracking-widest"
                style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 8 }}
              >
                PROCHAIN TOUR DANS {countdown}s
              </div>
            )}
            <MultiplierDisplay
              state={state}
              startTime={startTime}
              crashPoint={crashPoint}
              cashoutMultiplier={cashoutMultiplier}
              onTick={onTick}
            />
          </div>
        </div>
      </div>

      {/* BET PANEL */}
      <div
        style={{
          height: 160,
          flexShrink: 0,
          flexGrow: 0,
          background: '#111111',
          borderTop: '1px solid #333333',
          padding: '12px 16px',
          zIndex: 30,
        }}
      >
        {betError && (
          <div
            role="alert"
            style={{
              position: 'absolute',
              top: -28,
              left: 16,
              right: 16,
              background: 'rgba(220, 38, 38, 0.95)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              textAlign: 'center',
              zIndex: 40,
            }}
          >
            {betError}
          </div>
        )}
        <BetPanel
          state={state}
          multiplier={multiplier}
          hasBet={Boolean(betId)}
          onPlaceBet={handlePlaceBet}
          onCashout={handleCashout}
        />
      </div>
    </div>
  )
}
