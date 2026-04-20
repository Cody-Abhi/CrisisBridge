// src/components/staff/SOSPopup.jsx
// Full-screen SOS accept/decline modal — the most critical staff UI component
// Appears when a new SOS arrives that matches the staff member's designation

import { useEffect, useState } from 'react'
import { getEmergency }        from '../../utils/emergencyHelpers'
import { timeAgo }             from '../../utils/timeHelpers'

// Visual config per emergency type
const EMERGENCY_STYLES = {
  fire:     { border: 'border-red-500',    bg: 'bg-red-600',    glow: 'shadow-red-500/60',    textBg: 'bg-red-50    text-red-900',    badge: 'bg-red-100    text-red-700'    },
  medical:  { border: 'border-green-500',  bg: 'bg-green-600',  glow: 'shadow-green-500/60',  textBg: 'bg-green-50  text-green-900',  badge: 'bg-green-100  text-green-700'  },
  security: { border: 'border-amber-400',  bg: 'bg-amber-500',  glow: 'shadow-amber-400/60',  textBg: 'bg-amber-50  text-amber-900',  badge: 'bg-amber-100  text-amber-700'  },
  common:   { border: 'border-purple-500', bg: 'bg-purple-600', glow: 'shadow-purple-500/60',  textBg: 'bg-purple-50 text-purple-900', badge: 'bg-purple-100 text-purple-700' },
}

const AUTO_DISMISS_SECONDS = 90

export default function SOSPopup({ sosData, onAccept, onDecline }) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DISMISS_SECONDS)
  const [accepting,   setAccepting]   = useState(false)

  const emergency = getEmergency(sosData.emergencyType)
  const styles    = EMERGENCY_STYLES[sosData.emergencyType] || EMERGENCY_STYLES.common
  const progress  = (secondsLeft / AUTO_DISMISS_SECONDS) * 100

  // ── Countdown → auto-dismiss ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onDecline()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Play alert sound (Web Audio API — no file needed) ─────────────────────
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      const frequencies = [880, 1100, 880, 1100]
      let time = ctx.currentTime
      frequencies.forEach(freq => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'square'
        gain.gain.setValueAtTime(0.1, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
        osc.start(time)
        osc.stop(time + 0.15)
        time += 0.2
      })
    } catch {
      // Ignore — browser may block audio without user gesture
    }
  }, [])

  const handleAccept = async () => {
    setAccepting(true)
    await onAccept(sosData)
    setAccepting(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      
      {/* Alarm Pulse Glow background */}
      <div className={`absolute inset-0 opacity-20 animate-pulse ${styles.bg}`} />
      
      {/* Scanner Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="w-full h-1 bg-white absolute top-0 animate-[scanner_4s_linear_infinite]" />
      </div>

      <div className={`
        relative w-full max-w-sm rounded-[2.5rem] bg-white border-[6px] ${styles.border}
        shadow-[0_0_100px_rgba(0,0,0,0.5)] ${styles.glow}
        animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]
        overflow-hidden
      `}>
        {/* Emergency type header */}
        <div className={`${styles.textBg} px-6 py-7 text-center relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-current opacity-5 blur-2xl" />
          
          <div className="text-6xl mb-3 drop-shadow-xl animate-bounce">{emergency.icon}</div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{emergency.label}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            <p className="text-xs uppercase tracking-widest font-bold opacity-70">
              Live Emergency Detected · {timeAgo(sosData.triggeredAt)}
            </p>
          </div>
        </div>

        {/* Details section */}
        <div className="px-7 py-6 space-y-4 bg-white">
          <DetailRow label="Location"
            value={`ROOM ${sosData.roomNumber} (FLOOR ${sosData.floor || sosData.roomNumber?.[0] || '?'})`}
            icon="📍" />
          <DetailRow label="Primary Guest"
            value={sosData.guestName}
            icon="👤" />
          <DetailRow label="Direct Link"
            value={
              <a href={`tel:${sosData.guestPhone}`}
                className="font-bold text-red-600 hover:text-red-700 underline decoration-2 underline-offset-4 decoration-red-200">
                {sosData.guestPhone}
              </a>
            }
            icon="📱" />
          <DetailRow label="Occupancy"
            value={`${sosData.numberOfGuests || 1} PERSON(S)`}
            icon="👥" />

          {/* Status badge */}
          <div className={`flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl text-[10px] font-black tracking-wider uppercase
            ${styles.badge}`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            Awaiting Immediate Response
          </div>
        </div>

        {/* Countdown footer */}
        <div className="px-7 pb-4 bg-slate-50/50">
          <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase mb-2 text-slate-400">
            <span>Critical Dismiss Window</span>
            <span className={`${secondsLeft < 20 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
              {secondsLeft}S REMAINING
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-[2px]">
            <div
              className={`h-full rounded-full transition-none ${styles.bg}`}
              style={{ width: `${progress}%`, transition: 'width 1s linear' }}
            >
              <div className="w-full h-full bg-white/20 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-7 pb-6 pt-2 flex gap-3 bg-slate-50/50">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className={`flex-[2] py-5 rounded-[1.25rem] font-black text-white text-sm uppercase tracking-wider
              transition-all active:scale-95 shadow-xl disabled:opacity-50
              ${accepting
                ? 'bg-green-400 cursor-wait'
                : 'bg-green-600 hover:bg-green-500 shadow-green-600/30'
              }`}
          >
            {accepting ? 'Deploying...' : 'Accept Mission'}
          </button>
          <button
            onClick={onDecline}
            disabled={accepting}
            className="flex-1 py-5 rounded-[1.25rem] font-black text-slate-500 text-xs uppercase tracking-tight
              bg-white hover:bg-slate-100 border-2 border-slate-200 transition-all active:scale-95"
          >
            Pass
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanner {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}

// ── Helper component ─────────────────────────────────────────────────────────
const DetailRow = ({ label, value, icon }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-2 text-slate-500 text-sm shrink-0 mt-0.5">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
    <span className="text-slate-900 font-semibold text-sm text-right">{value}</span>
  </div>
)
