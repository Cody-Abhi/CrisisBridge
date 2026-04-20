// src/pages/staff/StaffPending.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  ShieldCheck, 
  Clock, 
  Building2, 
  Fingerprint, 
  UserCheck, 
  ArrowLeft,
  Moon,
  Sun,
  Loader2
} from 'lucide-react'

function timeAgoFromDate(ts) {
  if (!ts) return 'Recently'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function StaffPending() {
  const { currentUser, userProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    if (!currentUser) return

    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      const data = snap.data()
      if (data?.staffProfile?.isApproved === true) {
        refreshProfile()
        navigate('/staff/dashboard')
      }
    })

    return () => unsub()
  }, [currentUser, navigate, refreshProfile])

  const sp = userProfile?.staffProfile
  const designationMap = {
    fire_safety: 'Fire Safety Team',
    medical:     'Medical Response',
    security:    'Security Personnel',
    general:     'General Operations',
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-8 transition-all duration-500 font-sans ${
      darkMode 
        ? 'bg-[#030712] text-slate-200 selection:bg-indigo-500/30' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${
          darkMode ? 'bg-indigo-600/20' : 'bg-blue-400/10'
        }`} />
        <div className={`absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${
          darkMode ? 'bg-purple-600/20' : 'bg-indigo-400/10'
        }`} />
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleDarkMode}
          className={`p-3 rounded-2xl border transition-all duration-300 shadow-xl backdrop-blur-xl ${
            darkMode 
              ? 'bg-slate-900/50 border-white/5 text-indigo-400 hover:text-indigo-300 hover:border-white/10' 
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-xl relative">
        
        {/* Verification Status Card */}
        <div className={`rounded-[2.5rem] p-8 sm:p-12 border shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
          darkMode 
            ? 'bg-slate-900/40 border-white/5 shadow-indigo-500/5' 
            : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}>
          
          <div className="flex flex-col items-center">
            
            {/* Animated Icon Scanner */}
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[40px] opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
                <div className={`w-full h-full rounded-3xl flex items-center justify-center transition-colors overflow-hidden relative ${
                  darkMode ? 'bg-slate-900' : 'bg-white'
                }`}>
                  <ShieldCheck 
                    size={48} 
                    className={`relative z-10 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} 
                  />
                  {/* Moving Scanner Line */}
                  <div className="absolute inset-0 w-full h-[2px] bg-indigo-400/50 blur-[2px] shadow-[0_0_15px_rgba(129,140,248,0.5)] animate-scan-y top-0" />
                </div>
              </div>
              
              {/* Spinning Orbitals */}
              <div className="absolute -inset-4 border-2 border-dashed border-indigo-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute -inset-8 border border-dashed border-indigo-500/10 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
            </div>

            <div className="text-center mb-10">
              <h1 className={`text-3xl sm:text-4xl font-black mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Verification Pending
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-[320px] mx-auto font-medium leading-relaxed mb-4">
                Your credentials have been submitted. An administrator must approve your access before you can proceed.
              </p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                darkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                Please wait for admin to accept your request
              </div>
            </div>

            {/* Submission Detail Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <DetailCard 
                icon={<Building2 size={16} />}
                label="Facility"
                value={sp?.hotelName || 'Crisis Bridge'}
                darkMode={darkMode}
              />
              <DetailCard 
                icon={<Fingerprint size={16} />}
                label="Staff Code"
                value={sp?.hotelCode || '—'}
                darkMode={darkMode}
              />
              <DetailCard 
                icon={<UserCheck size={16} />}
                label="Role"
                value={designationMap[sp?.designation] || 'General Staff'}
                darkMode={darkMode}
              />
              <DetailCard 
                icon={<Clock size={16} />}
                label="Submitted"
                value={timeAgoFromDate(userProfile?.createdAt)}
                darkMode={darkMode}
              />
            </div>

            {/* Status Monitoring Indicator */}
            <div className={`w-full rounded-2xl p-5 border flex items-center justify-between transition-all duration-300 ${
              darkMode 
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-emerald-50 border-emerald-100'
            }`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-40" />
                  <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-700'
                }`}>
                  Live Monitoring Enabled
                </span>
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 h-3 rounded-full bg-emerald-500/40 animate-pulse`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <button
            onClick={() => navigate('/')}
            className={`group flex items-center gap-3 text-sm font-bold transition-all ${
              darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              darkMode ? 'bg-white/5 border border-white/5 group-hover:bg-white/10' : 'bg-slate-200/50 border border-slate-200 group-hover:bg-slate-200'
            }`}>
              <ArrowLeft size={16} />
            </div>
            <span>Back to Portal</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-500/10 px-4 py-2 rounded-full border border-slate-500/10">
            <Loader2 size={12} className="animate-spin" />
            Auto-refresh active
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-y {
          0%, 100% { transform: translateY(0); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(100px); }
        }
        .animate-scan-y {
          animation: scan-y 3s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}

function DetailCard({ icon, label, value, darkMode }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      darkMode 
        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' 
        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
    }`}>
      <div className="flex items-center gap-2 mb-2 opacity-60">
        <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-bold truncate leading-none transition-colors ${
        darkMode ? 'text-slate-100' : 'text-slate-800'
      }`}>
        {value}
      </p>
    </div>
  )
}

