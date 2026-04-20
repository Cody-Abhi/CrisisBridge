import { timeAgo } from '../../utils/timeHelpers'
import { getEmergency } from '../../utils/emergencyHelpers'
import { useTheme } from '../../contexts/ThemeContext'

export default function IncidentCard({ sosData, onViewChat, onMarkResolved }) {
  const { darkMode } = useTheme()
  const emergency = getEmergency(sosData.emergencyType)

  return (
    <div className={`border-l-4 rounded-xl p-5 mb-4 transition-all duration-300 ${
      darkMode ? 'bg-surface-container-high shadow-lg' : 'bg-white shadow-sm border border-slate-100'
    } ${
      sosData.emergencyType === 'fire'     ? 'border-red-500' :
      sosData.emergencyType === 'medical'  ? 'border-green-500' :
      sosData.emergencyType === 'security' ? 'border-amber-500' :
      'border-purple-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-colors ${
             sosData.emergencyType === 'fire' ? (darkMode ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600') :
             sosData.emergencyType === 'medical' ? (darkMode ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600') :
             sosData.emergencyType === 'security' ? (darkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600') :
             (darkMode ? 'bg-purple-500/10 text-purple-500' : 'bg-purple-50 text-purple-600')
          }`}>
            {emergency?.icon}
          </div>
          <div>
            <p className={`font-black text-sm transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>{emergency?.label}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(sosData.triggeredAt)}</p>
          </div>
        </div>
        <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full tracking-widest transition-all ${
          sosData.status === 'active'   ? (darkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200') :
          sosData.status === 'assigned' ? (darkMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200') :
          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
        }`}>
          {sosData.status || 'Active'}
        </span>
      </div>

      {/* Details */}
      <div className={`grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-5 p-4 rounded-2xl transition-colors ${
        darkMode ? 'bg-surface-container-highest/30 border border-white/5' : 'bg-slate-50 border border-slate-100'
      }`}>
        <div>
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Room</p>
          <p className={`font-black text-lg transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>{sosData.roomNumber}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Guest</p>
          <p className={`font-bold transition-colors truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{sosData.guestName}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Phone</p>
          <p className={`font-bold transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{sosData.guestPhone}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase font-black tracking-widest mb-1 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Assigned Staff</p>
          <p className={`font-bold transition-colors truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {sosData.assignedStaffName || <span className="text-red-500 text-[10px] font-black uppercase tracking-widest underline decoration-red-500/30">Unassigned</span>}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewChat && onViewChat(sosData.incidentId)}
          className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-[0.98] ${
            darkMode ? 'bg-white text-slate-900 hover:bg-slate-200 shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chat</span> Chat
        </button>
        <button
          onClick={() => onMarkResolved && onMarkResolved(sosData)}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span> Resolve
        </button>
      </div>
    </div>
  )
}
