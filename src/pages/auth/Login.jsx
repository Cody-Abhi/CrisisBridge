import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const { darkMode } = useTheme()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState('guest')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const { user, profileExists, profile } = await loginWithGoogle()
      if (!profileExists) {
        setError('No Crisis Bridge account found for this Google account. Please create an account instead.')
        setLoading(false)
        return
      }

      // Role mismatch check
      if (profile.role !== role) {
        setError(`This account is registered as a "${profile.role}", not "${role}". Please select the correct role.`)
        setLoading(false)
        return
      }

      // Route based on role
      if (profile.role === 'admin') {
        navigate(profile.adminProfile?.isHotelRegistered
          ? '/admin/dashboard'
          : '/admin/register-hotel')
      } else if (profile.role === 'staff') {
        navigate(profile.staffProfile?.isApproved
          ? '/staff/dashboard'
          : '/staff/pending')
      } else {
        navigate('/guest/mode-select')
      }
    } catch (err) {
      setError(err.message || 'Google Sign-in failed. Please try again.')
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { profile } = await login(email, password)

      // Role mismatch check
      if (profile.role !== role) {
        setError(`This account is registered as a "${profile.role}", not "${role}". Please select the correct role.`)
        setLoading(false)
        return
      }

      // Route based on role
      if (profile.role === 'admin') {
        navigate(profile.adminProfile?.isHotelRegistered
          ? '/admin/dashboard'
          : '/admin/register-hotel')
      } else if (profile.role === 'staff') {
        navigate(profile.staffProfile?.isApproved
          ? '/staff/dashboard'
          : '/staff/pending')
      } else {
        navigate('/guest/mode-select')
      }
    } catch (err) {
      const msg = {
        'auth/user-not-found':  'No account found with this email.',
        'auth/wrong-password':  'Incorrect password. Please try again.',
        'auth/invalid-email':   'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      }
      setError(msg[err.code] || 'Login failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-cs-navy flex-col items-center justify-center p-12">
        <div 
          onClick={() => navigate('/')}
          className="w-48 cursor-pointer group transition-transform duration-500 hover:scale-105 mb-8"
        >
          <img 
            src="/logo.png" 
            alt="Crisis Bridge Logo" 
            className="w-full h-auto object-contain drop-shadow-2xl" 
          />
        </div>
        <p className="text-slate-300 text-center text-lg mb-10 italic">
          "One Tap. Every Responder. Zero Delay."
        </p>
        {/* Role preview cards */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {[
            { icon: '🧳', label: 'Guests',  desc: 'Trigger SOS from your room' },
            { icon: '👷', label: 'Staff',   desc: 'Accept and respond to emergencies' },
            { icon: '🏨', label: 'Admin',   desc: 'Monitor and coordinate your hotel' },
          ].map(r => (
            <div key={r.label} className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{r.label}</p>
                <p className="text-slate-300 text-xs">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className={`flex-1 flex items-center justify-center p-4 sm:p-8 transition-colors duration-300 ${darkMode ? 'bg-surface' : 'bg-white'}`}>
        <div className="w-full max-w-md">
          <h2 className={`text-3xl font-black mb-2 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Welcome Back</h2>
          <p className={`mb-8 transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-500'}`}>Sign in to your Crisis Bridge account</p>

          {error && (
            <div className={`border rounded-lg p-4 mb-6 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Role selector */}
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-3 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>I am a...</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { value: 'guest', label: 'Guest',  icon: '🧳' },
                  { value: 'staff', label: 'Staff',  icon: '👷' },
                  { value: 'admin', label: 'Admin',  icon: '🏨' },
                ].map(r => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`py-2.5 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 transition-all active:scale-[0.98] ${
                      role === r.value
                        ? 'border-cs-red bg-red-500/10 text-cs-red shadow-lg shadow-red-500/10'
                        : darkMode 
                          ? 'border-slate-800 text-slate-500 hover:border-slate-700' 
                          : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-cs-red/50 ${
                  darkMode 
                    ? 'bg-surface-container-high border-slate-800 text-white placeholder:text-slate-600' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-xs font-black uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Password</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-cs-red hover:underline">Forgot?</button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-cs-red/50 ${
                  darkMode 
                    ? 'bg-surface-container-high border-slate-800 text-white placeholder:text-slate-600' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white'
                }`}
              />
            </div>

            <button
               type="submit"
               disabled={loading}
               className="w-full bg-cs-red hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] mt-2 group"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH EMAIL'}
                {!loading && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
              </div>
            </button>
            
            <div className={`relative flex py-1 items-center ${darkMode ? 'text-slate-500' : 'text-slate-400'} text-xs font-bold uppercase tracking-widest`}>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink-0 mx-4">or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <button
               type="button"
               disabled={loading}
               onClick={handleGoogleLogin}
               className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] border-2 group ${
                 darkMode
                   ? 'bg-transparent border-slate-700 text-white hover:bg-slate-800'
                   : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
               }`}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              SIGN IN WITH GOOGLE
            </button>
          </form>

          <p className={`text-center text-sm mt-8 font-medium transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-cs-red font-black hover:underline ml-1">
              CREATE ACCOUNT
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
