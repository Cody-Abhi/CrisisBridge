import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const ROLES = [
  {
    value: 'guest',
    icon:  '🧳',
    label: 'Guest',
    desc:  'I am staying at a hotel and need emergency access',
  },
  {
    value: 'staff',
    icon:  '👷',
    label: 'Staff',
    desc:  'I work at a hotel and want to respond to emergencies',
  },
  {
    value: 'admin',
    icon:  '🏨',
    label: 'Admin',
    desc:  'I manage a hotel and want to monitor emergencies',
  },
]

const DESIGNATIONS = [
  { value: 'fire_safety', label: '🔥 Fire Safety Officer' },
  { value: 'medical',     label: '🏥 Medical Responder'   },
  { value: 'security',    label: '🛡️ Security Personnel'  },
  { value: 'general',     label: '👷 General Staff'       },
]

export default function Signup() {
  const { signup, loginWithGoogle, completeGoogleSignup } = useAuth()
  const { darkMode } = useTheme()
  const navigate     = useNavigate()

  const [step,        setStep]        = useState(1)
  const [role,        setRole]        = useState('')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [hotelCode,   setHotelCode]   = useState('')
  const [designation, setDesignation] = useState('')
  const [employeeId,  setEmployeeId]  = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [isGoogleAuth,setIsGoogleAuth]= useState(false)

  // ── Google Signup Handler ──────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setError('')
    setLoading(true)
    try {
      const { user, profileExists } = await loginWithGoogle()
      if (profileExists) {
        setError('This Google account is already registered. Please go to Sign In instead.')
      } else {
        setIsGoogleAuth(true)
        setName(user.displayName || '')
        setEmail(user.email || '')
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.')
    }
    setLoading(false)
  }

  // ── Step 1: Role selection ─────────────────────────────────────────────────
  const handleRoleSelect = (r) => {
    setRole(r)
    setStep(2)
  }

  // ── Step 2: Validate personal details ─────────────────────────────────────
  const handleStep2Next = () => {
    setError('')
    if (!name.trim())                   return setError('Full name is required.')
    if (!email.trim())                  return setError('Email is required.')
    if (!/^\d{10}$/.test(phone))        return setError('Enter a valid 10-digit phone number.')
    if (!isGoogleAuth) {
      if (password.length < 8)            return setError('Password must be at least 8 characters.')
      if (password !== confirmPwd)        return setError('Passwords do not match.')
    }
    if (role === 'staff') {
      setStep(3) // Staff needs extra fields
    } else {
      handleSubmit() // Guest and Admin go straight to account creation
    }
  }

  // ── Final submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    // Staff extra validation
    if (role === 'staff') {
      if (hotelCode.trim().length !== 6) return (setError('Hotel code must be exactly 6 characters.'), setLoading(false))
      if (!designation)                  return (setError('Please select your designation.'), setLoading(false))
    }

    try {
      if (isGoogleAuth) {
        await completeGoogleSignup(name, email, phone, role, {
          hotelCode:   hotelCode.trim().toUpperCase(),
          designation,
          employeeId,
        })
      } else {
        await signup(email, password, name, phone, role, {
          hotelCode:   hotelCode.trim().toUpperCase(),
          designation,
          employeeId,
        })
      }

      // Redirect based on role
      if (role === 'admin')  navigate('/admin/register-hotel')
      if (role === 'staff')  navigate('/staff/pending')
      if (role === 'guest')  navigate('/guest/mode-select')
    } catch (err) {
      const msg = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/weak-password':        'Password is too weak.',
      }
      setError(msg[err.code] || err.message || 'Signup failed. Please try again.')
    }
    setLoading(false)
  }

  const inputClass = `w-full rounded-2xl px-5 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-cs-red/50 ${
    darkMode 
      ? 'bg-surface-container-high border-slate-800 text-white placeholder:text-slate-600' 
      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white'
  }`

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-50 text-slate-900'}`}>
      {/* Logo */}
      <div 
        onClick={() => navigate('/')}
        className="w-32 cursor-pointer group transition-transform duration-500 hover:scale-105 mb-8"
      >
        <img 
          src="/logo.png" 
          alt="Crisis Bridge Logo" 
          className="w-full h-auto object-contain drop-shadow-lg" 
        />
      </div>

      <div className={`rounded-3xl shadow-sm border w-full max-w-lg p-6 sm:p-10 transition-all duration-300 ${
        darkMode ? 'bg-surface-container-low border-slate-800' : 'bg-white border-slate-200'
      }`}>

        {/* Progress indicator */}
        {role && (
          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {['Role', 'Details', role === 'staff' ? 'Work' : 'Review'].map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step > i + 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                  step === i + 1 ? 'bg-cs-red text-white shadow-lg shadow-red-500/20 scale-110' :
                  darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${step === i + 1 ? (darkMode ? 'text-white' : 'text-slate-800') : 'text-slate-400'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`w-6 h-px transition-colors ${step > i + 1 ? 'bg-emerald-500' : darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className={`border rounded-xl p-4 mb-8 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* ── STEP 1: Role ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-2 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Create Account</h2>
            <p className={`text-sm mb-8 transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-500'}`}>Choose how you want to use Crisis Bridge</p>
            <div className="grid grid-cols-1 gap-4">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => handleRoleSelect(r.value)}
                  className={`flex items-center gap-5 p-5 border-2 rounded-2xl transition-all text-left group active:scale-[0.98] ${
                    darkMode 
                      ? 'border-slate-800 hover:border-cs-red hover:bg-slate-900' 
                      : 'border-slate-100 bg-slate-50/50 hover:border-cs-red hover:bg-red-50'
                  }`}
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">{r.icon}</span>
                  <div>
                    <p className={`font-black text-base transition-colors ${darkMode ? 'text-white' : 'text-slate-800'} group-hover:text-cs-red`}>{r.label}</p>
                    <p className={`text-xs mt-1 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-500'} font-medium`}>{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className={`text-center text-sm mt-10 font-medium transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Already have an account?{' '}
              <Link to="/login" className="text-cs-red font-black hover:underline ml-1">SIGN IN</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Personal Details ─────────────────────────────── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setStep(1)} 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h2 className={`text-xl font-black transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Personal Details</h2>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${darkMode ? 'text-cs-red' : 'text-cs-red'}`}>
                  Joining as {role}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {!isGoogleAuth && (
                <>
                  <button 
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] border-2 group ${
                      darkMode
                        ? 'bg-transparent border-slate-700 text-white hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    SIGN UP WITH GOOGLE
                  </button>
                  <div className={`relative flex py-1 items-center ${darkMode ? 'text-slate-500' : 'text-slate-400'} text-xs font-bold uppercase tracking-widest`}>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4">or sign up with email</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>
                </>
              )}

              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Full Name</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} disabled={isGoogleAuth}
                  placeholder="John Doe" className={`${inputClass} ${isGoogleAuth ? 'opacity-50 cursor-not-allowed' : ''}`} />
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={isGoogleAuth}
                  placeholder="john@example.com" className={`${inputClass} ${isGoogleAuth ? 'opacity-50 cursor-not-allowed' : ''}`} />
              </div>
              <div className={`grid grid-cols-1 ${!isGoogleAuth ? 'md:grid-cols-2' : ''} gap-4`}>
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Phone Number</label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                    placeholder="9876543210" maxLength={10} className={inputClass} />
                </div>
                {!isGoogleAuth && (
                  <div>
                     <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Password</label>
                     <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                      placeholder="••••••••" className={inputClass} />
                  </div>
                )}
              </div>
              {!isGoogleAuth && (
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Confirm Password</label>
                  <input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)}
                    placeholder="••••••••" className={inputClass} />
                </div>
              )}

              <button 
                onClick={handleStep2Next}
                disabled={loading}
                className="w-full bg-cs-red hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 group"
              >
                {loading ? 'PROCESSING...' : (role === 'staff' ? 'NEXT: WORK DETAILS' : 'CREATE ACCOUNT')}
                {!loading && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Staff Extra Fields ────────────────────────────── */}
        {step === 3 && role === 'staff' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setStep(2)} 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h2 className={`text-xl font-black transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Work Information</h2>
                <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Final Verification</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Hotel Unique Code
                </label>
                <input
                  type="text"
                  value={hotelCode}
                  onChange={e => setHotelCode(e.target.value.toUpperCase())}
                  placeholder="HTLX42"
                  maxLength={6}
                  className={`${inputClass} font-mono tracking-[0.3em] text-center text-xl !py-5`}
                />
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 px-1 transition-colors ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Get this 6-character code from your Hotel Admin
                </p>
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Designation</label>
                <select
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="">Select your role...</option>
                  {DESIGNATIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Employee ID (Optional)</label>
                <input type="text" value={employeeId} onChange={e=>setEmployeeId(e.target.value)}
                  placeholder="EMP-1234" className={inputClass} />
              </div>

              {/* Info box */}
              <div className={`rounded-2xl p-4 text-[11px] font-bold uppercase tracking-wider transition-colors border-2 ${
                darkMode ? 'bg-amber-500/5 border-amber-500/10 text-amber-500/70' : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                  <p>Your account will require manual approval by the hotel administrator before access is granted.</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-cs-red hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 group"
              >
                {loading ? 'CREATING ACCOUNT...' : 'COMPLETE REGISTRATION'}
                {!loading && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">check_circle</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
