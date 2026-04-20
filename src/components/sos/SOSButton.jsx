import { useState, useRef } from 'react'

const CONFIG = {
  common:   { label: '🆘 General SOS', bg: 'bg-purple-600', shadow: 'shadow-purple-500/50', ring: 'ring-purple-500/50', text: 'text-white' },
  fire:     { label: '🔥 Fire',        bg: 'bg-red-600',    shadow: 'shadow-red-600/50',    ring: 'ring-red-500/50',    text: 'text-white' },
  medical:  { label: '⚕️ Medical',     bg: 'bg-emerald-600',shadow: 'shadow-emerald-500/50',ring: 'ring-emerald-500/50',text: 'text-white' },
  security: { label: '🛡️ Security',   bg: 'bg-amber-500',  shadow: 'shadow-amber-500/50',  ring: 'ring-amber-500/50',  text: 'text-amber-950' },
}

export default function SOSButton({ type = 'common', size = 'small', onTrigger, disabled }) {
  const [pressing,   setPressing]   = useState(false)
  const [countdown,  setCountdown]  = useState(null)
  const timerRef   = useRef(null)
  const intervalRef = useRef(null)

  const cfg = CONFIG[type]
  const isLarge = size === 'large'

  const startPress = () => {
    if (disabled) return
    setPressing(true)
    setCountdown(2)

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return null
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = setTimeout(() => {
      setPressing(false)
      onTrigger(type)
    }, 2000)
  }

  const cancelPress = () => {
    setPressing(false)
    setCountdown(null)
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
  }

  return (
    <button
      onMouseDown={startPress}
      onTouchStart={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchEnd={cancelPress}
      disabled={disabled}
      className={`
        relative overflow-hidden
        ${isLarge ? 'w-56 h-56 text-2xl font-black rounded-full' : 'w-28 h-28 text-sm font-bold rounded-3xl'}
        ${cfg.bg} ${cfg.text} select-none
        border border-white/20
        ${!disabled ? `
          hover:scale-105 active:scale-95 shadow-xl ${cfg.shadow} 
          hover:shadow-2xl hover:${cfg.shadow} hover:border-white/40
          before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:bg-white/10
          cursor-pointer
        ` : 'opacity-30 cursor-not-allowed grayscale-[0.5]'}
        ${pressing ? 'scale-95 ring-[6px] ' + cfg.ring : ''}
        transition-all duration-300 flex flex-col items-center justify-center gap-2
      `}
    >
      {/* Dynamic Pulse Ring Background Layer for Large Button */}
      {isLarge && !disabled && !pressing && (
        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${cfg.bg}`} />
      )}

      {pressing ? (
        <div className="z-10 flex flex-col items-center">
          <span className="text-4xl font-black tracking-tighter drop-shadow-lg">{countdown}</span>
          <span className="text-xs uppercase tracking-widest opacity-80 mt-1 font-semibold">Hold</span>
        </div>
      ) : (
        <span className="z-10 drop-shadow-md flex flex-col items-center gap-1">
          {isLarge ? (
             <span className="flex flex-col items-center gap-2">
               <span className="text-5xl">{cfg.label.split(' ')[0]}</span>
               <span className="uppercase tracking-widest text-lg opacity-90">{cfg.label.split(' ').slice(1).join(' ')}</span>
             </span>
          ) : (
             cfg.label
          )}
        </span>
      )}
    </button>
  )
}
