// src/pages/guest/HotelRegistration.jsx
// Wired to validateHotelCode + checkInGuest services

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { validateHotelCode, checkInGuest } from '../../services/hotelService'
import toast from 'react-hot-toast'

export default function HotelRegistration() {
  const navigate = useNavigate()
  const { currentUser, refreshProfile } = useAuth()
  const { darkMode } = useTheme()

  const [hotelCode,  setHotelCode]  = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Validate hotel code against Firestore
      const { valid, hotelData, error: vErr } = await validateHotelCode(hotelCode)
      if (!valid) { setError(vErr); setLoading(false); return }

      // 2. Update guest profile in Firestore
      await checkInGuest(currentUser.uid, {
        hotelCode:  hotelCode.toUpperCase(),
        hotelName:  hotelData.hotelName,
        roomNumber: roomNumber.trim(),
        guestCount,
      })

      // 3. Refresh auth context so dashboard has fresh data
      await refreshProfile()

      toast.success(`Connected to ${hotelData.hotelName}!`)
      navigate('/guest/dashboard')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-50 text-slate-800'}`}>

      <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none ${darkMode ? 'bg-red-900/10' : 'bg-red-500/5'}`} />
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none ${darkMode ? 'bg-indigo-900/10' : 'bg-indigo-500/5'}`} />

      <div className="w-full max-w-md z-10 relative">
        <div className={`absolute inset-0 blur-3xl -z-10 rounded-full ${darkMode ? 'bg-gradient-to-b from-red-500/10 to-transparent' : 'bg-gradient-to-b from-red-200/50 to-transparent'}`} />

        <div className={`backdrop-blur-3xl rounded-[2rem] border overflow-hidden shadow-2xl transition-colors ${darkMode ? 'bg-[#0B0F19]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>

          {/* Top accent + header */}
          <div className={`px-8 py-8 border-b text-center relative overflow-hidden ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />
            <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-red-500 mb-4 border ${darkMode ? 'bg-white/[0.05] border-white/10' : 'bg-red-50 border-red-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Hotel Registration</h2>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Link your device to the hotel emergency grid</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">

            {error && (
              <div className="p-4 bg-red-500/10 text-red-400 text-sm rounded-2xl border border-red-500/20 font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-lg leading-none mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-red-400 transition-colors">
                  Property Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={hotelCode}
                  onChange={e => setHotelCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HTLX42"
                  maxLength={6}
                  className={`w-full px-5 py-4 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:outline-none uppercase font-mono tracking-[0.2em] transition-all placeholder:normal-case placeholder:tracking-normal border ${darkMode ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                />
                <p className="text-[11px] text-slate-500 mt-2 font-medium">6-character code from the hotel front desk.</p>
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-red-400 transition-colors">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="e.g. 305"
                  className={`w-full px-5 py-4 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:outline-none font-bold tracking-wide transition-all placeholder:font-normal border ${darkMode ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Occupants</label>
                <div className={`flex gap-2 p-1.5 rounded-xl border ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  {[1, 2, 3, 4, '5+'].map(num => (
                    <button key={num} type="button" onClick={() => setGuestCount(num)}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                        guestCount === num
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                          : (darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200')
                      }`}
                    >{num}</button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-4 mt-4 hover:bg-red-500 hover:text-white rounded-xl font-black tracking-wide text-sm flex items-center justify-center gap-2 transition-all duration-500 disabled:opacity-50 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] ${darkMode ? 'bg-white text-[#0B0F19] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-slate-900 text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)]'}`}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${darkMode ? 'border-[#0B0F19]' : 'border-white'}`} />
                  AUTHENTICATING...
                </span>
              ) : 'CONNECT TO GRID'}
            </button>

            <p className="text-center text-[11px] text-slate-500 pt-2 font-medium flex items-center justify-center gap-1.5 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Standard emergency authorisation. Information used only for response.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
