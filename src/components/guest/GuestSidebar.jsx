import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

export default function GuestSidebar({ hotelData, isOpen, onClose, onCheckOut }) {
  const navigate = useNavigate()
  const { userProfile, logout } = useAuth()
  const { darkMode } = useTheme()

  const guest = userProfile?.guestProfile
  const hotel = hotelData

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  const emergencyLines = [
    {
      label: 'Fire Service',
      icon: 'local_fire_department',
      number: hotel?.emergencyNumbers?.fire || '101',
    },
    {
      label: 'Ambulance',
      icon: 'medical_services',
      number: hotel?.emergencyNumbers?.ambulance || '108',
    },
    {
      label: 'Police',
      icon: 'shield',
      number: hotel?.emergencyNumbers?.police || '100',
    },
    {
      label: 'Front Desk',
      icon: 'apartment',
      number: hotel?.emergencyNumbers?.security || 'Reception',
    },
  ]

  return (
    <div
      className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[86vw] max-w-80 md:w-84 h-full flex flex-col overflow-y-auto shadow-2xl transition-all duration-300 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        darkMode
          ? 'bg-surface-container-low border-r border-slate-800 text-slate-300'
          : 'bg-white border-r border-slate-200 text-slate-800'
      }`}
    >
      <div
        className={`p-6 relative overflow-hidden flex-shrink-0 ${
          darkMode
            ? 'bg-gradient-to-b from-[#131B2C] to-transparent border-b border-white/5'
            : 'bg-slate-50 border-b border-slate-100'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div 
            onClick={() => navigate('/guest/dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-48 transition-all duration-300 group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Crisis Bridge Logo" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
                darkMode
                  ? 'text-slate-500 hover:text-white bg-white/5 hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
              title="Close sidebar"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0B0F19] border border-white/10 flex items-center justify-center text-white font-bold text-xl">
              {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
          <div>
            <p className={`${darkMode ? 'text-white' : 'text-slate-900'} font-bold`}>
              {userProfile?.name || '-'}
            </p>
            <p className="text-slate-400 text-xs font-medium">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Stay</h4>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          </div>
          <div
            className={`rounded-2xl p-4 shadow-lg space-y-3 transition-colors ${
              darkMode
                ? 'bg-[#151D2F] border border-white/5 hover:border-indigo-500/20'
                : 'bg-slate-50 border border-slate-200 hover:border-indigo-500/20'
            }`}
          >
            <InfoRow label="Hotel" value={guest?.currentHotelName} highlight darkMode={darkMode} />
            <InfoRow label="Room" value={`Rm ${guest?.currentRoomNumber || '-'}`} mono darkMode={darkMode} />
            <InfoRow label="ID Code" value={guest?.currentHotelCode} mono darkMode={darkMode} />
            <InfoRow
              label="Guests"
              value={guest?.numberOfGuests ? `${guest.numberOfGuests} Pax` : '-'}
              darkMode={darkMode}
            />
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Emergency Lines
          </h4>
          <div className="space-y-2">
            {emergencyLines.map((item) => (
              <a
                key={item.label}
                href={`tel:${item.number}`}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all group cursor-pointer ${
                  darkMode
                    ? 'bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30'
                    : 'bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      darkMode
                        ? 'text-slate-300 group-hover:text-white'
                        : 'text-slate-700 group-hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-red-400 tracking-wider">
                  CALL
                </span>
              </a>
            ))}
          </div>
        </section>

        <button
          onClick={() => navigate('/guest/history')}
          className={`w-full text-left rounded-xl px-4 py-4 text-sm font-medium transition-all flex items-center justify-between ${
            darkMode
              ? 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-200'
              : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] opacity-70">history</span>
            View Stay History
          </span>
          <span className="material-symbols-outlined text-[18px] text-slate-500">arrow_forward</span>
        </button>
      </div>

      <div
        className={`p-5 mt-auto border-t space-y-3 ${
          darkMode ? 'border-white/5 bg-[#080C14]' : 'border-slate-200 bg-slate-50'
        }`}
      >
        {onCheckOut && (
          <button
            onClick={onCheckOut}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 py-3 rounded-xl text-sm font-bold transition-all duration-300"
          >
            Check Out and Disconnect
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="w-full text-slate-500 hover:text-slate-300 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value, mono, highlight, darkMode }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500 font-medium">{label}</span>
    <span
      className={`${
        highlight
          ? `${darkMode ? 'text-white' : 'text-slate-900'} font-bold`
          : `${darkMode ? 'text-slate-300' : 'text-slate-700'} font-medium`
      } ${mono ? `${darkMode ? 'font-mono tracking-widest text-[#5DCAA5]' : 'font-mono tracking-widest text-emerald-600'}` : ''}`}
    >
      {value || '-'}
    </span>
  </div>
)
