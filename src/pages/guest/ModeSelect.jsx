// src/pages/guest/ModeSelect.jsx
// Guest mode selection — live Firestore-backed

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { checkOutGuest } from '../../services/hotelService'
import { toDateString } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function ModeSelect() {
  const navigate = useNavigate()
  const { currentUser, userProfile, refreshProfile, isStaying } = useAuth()
  const { darkMode } = useTheme()
  const guest = userProfile?.guestProfile

  const handleCheckOut = async () => {
    if (!window.confirm('Check out and remove emergency access?')) return
    try {
      await checkOutGuest(currentUser.uid)
      await refreshProfile()
      toast.success('Checked out successfully. Stay safe!')
    } catch (err) {
      toast.error('Check-out failed. Please try again.')
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-50 text-slate-800'}`}>
      
      <div className={`absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -mr-[400px] -mt-[400px] pointer-events-none ${darkMode ? 'bg-indigo-900/10' : 'bg-indigo-500/5'}`} />
      <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] -ml-[300px] -mb-[300px] pointer-events-none ${darkMode ? 'bg-red-900/10' : 'bg-red-500/5'}`} />

      <div className="max-w-4xl w-full z-10">

        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className={`inline-flex items-center justify-center gap-3 mb-6 px-5 py-2.5 rounded-full backdrop-blur-md border ${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-700 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/50">
              <span className="text-white font-black text-[10px] tracking-widest">CS</span>
            </div>
            <span className={`text-xl font-bold tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>Crisis Bridge</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black mb-4 tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Welcome, {userProfile?.name?.split(' ')[0] || 'Guest'}!
          </h1>
          <p className={`text-lg font-medium max-w-xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Connect to your hotel's emergency response grid or access your safety profile.
          </p>
        </div>

        {/* Active Check-in Banner */}
        {isStaying && (
          <div className="mb-10 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 text-xl shrink-0">✓</div>
              <div>
                <h3 className="text-emerald-400 font-bold tracking-wide">Active Check-in Detected</h3>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-emerald-200/70' : 'text-emerald-600/70'}`}>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-emerald-800'}`}>{guest?.currentHotelName}</span>
                  {' '}— Room <span className={`font-bold ${darkMode ? 'text-white' : 'text-emerald-800'}`}>{guest?.currentRoomNumber}</span>
                  {guest?.checkInDate && (
                    <span className="text-slate-500"> · Since {toDateString(guest.checkInDate?.seconds ? guest.checkInDate.seconds * 1000 : guest.checkInDate)}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={handleCheckOut}
                className="px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all">
                Check Out
              </button>
              <button onClick={() => navigate('/guest/dashboard')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                Resume Dashboard
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">

          <div onClick={() => navigate('/guest/hotel-registration')}
            className={`group relative backdrop-blur-xl rounded-[2rem] p-8 md:p-10 border cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-red-500/50 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.3)] flex flex-col items-center text-center ${darkMode ? 'bg-[#0B0F19]/80 border-white/10' : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-all duration-500 z-10 shadow-lg border ${darkMode ? 'bg-white/[0.03] border-white/10 group-hover:bg-red-500/10 group-hover:border-red-500/30' : 'bg-slate-50 border-slate-200 group-hover:bg-red-50 group-hover:border-red-200'}`}>🏨</div>
            <h2 className={`text-2xl font-bold mb-4 tracking-tight z-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Hotel Verification</h2>
            <p className={`font-medium leading-relaxed z-10 mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Link your device to the hotel emergency grid for real-time SOS protection.
            </p>
            <button className={`mt-auto px-8 py-3.5 w-full rounded-xl font-bold transition-all duration-500 z-10 text-sm tracking-wide border ${darkMode ? 'bg-white/[0.05] border-white/10 text-white group-hover:bg-red-600 group-hover:border-red-500 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
              Initialize Connection
            </button>
          </div>

          <div onClick={() => navigate('/guest/history')}
            className={`group relative backdrop-blur-xl rounded-[2rem] p-8 md:p-10 border cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-indigo-500/50 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] flex flex-col items-center text-center ${darkMode ? 'bg-[#0B0F19]/80 border-white/10' : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-all duration-500 z-10 shadow-lg border ${darkMode ? 'bg-white/[0.03] border-white/10 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30' : 'bg-slate-50 border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-200'}`}>📋</div>
            <h2 className={`text-2xl font-bold mb-4 tracking-tight z-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Profile & History</h2>
            <p className={`font-medium leading-relaxed z-10 mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Access your digital stay records, past emergency logs, and safety profiles.
            </p>
            <button className={`mt-auto px-8 py-3.5 w-full rounded-xl font-bold transition-all duration-500 z-10 text-sm tracking-wide border ${darkMode ? 'bg-white/[0.05] border-white/10 text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}>
              Access Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
