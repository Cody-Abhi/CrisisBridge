import { useState } from 'react'
import { getEmergency } from '../../utils/emergencyHelpers'
import { useTheme } from '../../contexts/ThemeContext'

const SOS_ANIMATIONS = {
  fire:     'bg-red-600     shadow-red-500/50     shadow-lg animate-[sos-pulse_1s_ease-in-out_infinite]',
  medical:  'bg-green-600   shadow-green-500/50   shadow-lg animate-[sos-pulse_1s_ease-in-out_infinite]',
  security: 'bg-amber-500   shadow-amber-400/50   shadow-lg animate-[sos-pulse_1s_ease-in-out_infinite]',
  common:   'bg-purple-600  shadow-purple-500/50  shadow-lg animate-[sos-pulse_1s_ease-in-out_infinite]',
}

export default function RoomBlock({ roomNumber, sosData, onClick }) {
  const { darkMode } = useTheme()
  const [hovered, setHovered] = useState(false)

  const isActive = !!sosData
  const emergency = isActive ? getEmergency(sosData.emergencyType) : null

  return (
    <div
      onClick={() => isActive && onClick && onClick(sosData)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative w-12 h-12 rounded-lg flex flex-col items-center justify-center
        text-[10px] font-black tracking-tighter transition-all duration-300 select-none
        ${isActive
          ? `${SOS_ANIMATIONS[sosData.emergencyType] || SOS_ANIMATIONS.common} text-white cursor-pointer`
          : darkMode 
            ? 'bg-surface-container border border-white/5 text-slate-500 cursor-default' 
            : 'bg-slate-50 border border-slate-100 text-slate-400 cursor-default'
        }
        ${isActive && hovered ? 'scale-110' : ''}
      `}
      title={isActive ? `${emergency.label} — Room ${roomNumber}` : `Room ${roomNumber}`}
    >
      <span className="text-[10px] leading-none">{isActive ? emergency.icon : ''}</span>
      <span className="leading-none mt-0.5">{roomNumber}</span>

      {/* Tooltip on hover */}
      {isActive && hovered && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-3 whitespace-nowrap z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
          darkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}>
          <p className="mb-1">{emergency?.label}</p>
          <p className={darkMode ? 'text-slate-600' : 'text-slate-300'}>{sosData.guestName || 'Unknown Guest'}</p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current/10 opacity-70">
             <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
             {sosData.status || 'Active'}
          </div>
        </div>
      )}
    </div>
  )
}
