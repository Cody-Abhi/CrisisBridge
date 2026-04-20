// src/pages/guest/GuestHistory.jsx
// Fetches real incident history from Firestore for the current guest

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getGuestIncidents } from '../../firebase/firestore'
import { emergencyLabel, toDateString } from '../../utils/helpers'

export default function GuestHistory() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const { darkMode } = useTheme()
  const [incidents, setIncidents] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!currentUser?.uid) return
    getGuestIncidents(currentUser.uid)
      .then(data => { setIncidents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [currentUser?.uid])

  return (
    <div className={`min-h-screen p-6 md:p-12 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-50 text-slate-800'}`}>
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${darkMode ? 'bg-indigo-900/10' : 'bg-indigo-500/5'}`} />

      <div className="max-w-4xl mx-auto relative z-10">
        <button onClick={() => navigate('/guest/mode-select')}
          className={`group flex items-center gap-2 transition-colors mb-10 text-sm font-semibold tracking-wide uppercase ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
          <span className={`w-8 h-8 rounded-full border flex items-center justify-center ${darkMode ? 'bg-white/[0.05] border-white/10 group-hover:bg-white/10' : 'bg-slate-100 border-slate-200 group-hover:bg-slate-200'}`}>←</span>
          Return to Hub
        </button>

        <div className="flex items-center gap-5 mb-12">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-[#1A233A] to-[#0B0F19] border-white/10' : 'bg-white border-slate-200'}`}>📋</div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Personal Vault</h1>
            <p className={`mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your encrypted emergency & stay records.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Incidents', value: incidents.length, red: incidents.length > 0 },
            { label: 'Active',          value: incidents.filter(i => i.status === 'active').length,   red: true },
            { label: 'Resolved',        value: incidents.filter(i => i.status === 'resolved').length, red: false },
          ].map((stat, idx) => (
            <div key={idx} className={`p-6 rounded-[2rem] border shadow-xl transition-colors ${darkMode ? 'bg-[#0B0F19]/60 backdrop-blur-md border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-4xl sm:text-5xl font-black ${stat.red && stat.value > 0 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Incident List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className={`text-center py-24 rounded-[2rem] border border-dashed backdrop-blur-sm ${darkMode ? 'bg-[#0B0F19]/40 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
            <div className={`w-20 h-20 mx-auto border-2 border-dashed rounded-full flex items-center justify-center text-3xl mb-4 opacity-50 ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>🧳</div>
            <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>No incidents on record.</p>
            <p className={`text-sm mt-2 max-w-sm mx-auto ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Emergency logs will appear here once triggered.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((inc, idx) => (
              <div key={inc.incidentId || idx} className={`p-6 sm:p-8 rounded-[2rem] border shadow-xl flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all ${darkMode ? 'bg-[#0B0F19]/60 backdrop-blur-md border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{inc.guest?.name || userProfile?.name}</h3>
                    <span className={`text-[10px] font-mono tracking-widest border px-2 py-0.5 rounded-full ${darkMode ? 'text-slate-500 border-white/10' : 'text-slate-500 border-slate-200'}`}>
                      Rm {inc.guest?.roomNumber}
                    </span>
                    <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${
                      inc.status === 'active'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>{inc.status}</span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">
                    {emergencyLabel(inc.emergency?.type)} &bull; {toDateString(inc.emergency?.triggeredAt)}
                  </p>
                  {inc.response?.assignedStaffName && (
                    <p className="text-slate-500 text-xs mt-1">Responder: {inc.response.assignedStaffName}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-mono text-slate-600 tracking-widest">{inc.incidentId?.slice(-10).toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
