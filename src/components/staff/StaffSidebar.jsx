// src/components/staff/StaffSidebar.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { STAFF_DESIGNATIONS } from '../../utils/emergencyHelpers'
import toast from 'react-hot-toast'

export default function StaffSidebar({ isOnDuty, onToggleDuty, activeTab, onTabChange, mobileOpen = false, onMobileClose }) {
  const { logout, userProfile } = useAuth()
  const { darkMode } = useTheme()
  const navigate = useNavigate()

  const designation = STAFF_DESIGNATIONS[userProfile?.staffProfile?.designation]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (err) {
      toast.error('Logout failed')
    }
  }

  const tabs = [
    { id: 'grid',      icon: 'dashboard', label: 'Monitor' },
    { id: 'incident',  icon: 'notification_important', label: 'Mission' },
    { id: 'chat',      icon: 'forum', label: 'Chat' },
    { id: 'history',   icon: 'history', label: 'History' },
    { id: 'profile',   icon: 'person', label: 'Profile', isRoute: true },
  ]

  const handleTabClick = (tab) => {
    if (tab.isRoute) {
      navigate('/staff/profile')
    } else {
      if (window.location.pathname !== '/staff/dashboard') {
        navigate('/staff/dashboard')
      }
      onTabChange?.(tab.id)
    }
    onMobileClose?.()
  }

  return (
    <>
      {onMobileClose && (
        <button
          onClick={onMobileClose}
          aria-label="Close navigation overlay"
          className={`md:hidden fixed inset-0 bg-black/45 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 w-72 max-w-[86vw] md:w-84 h-screen flex flex-col transition-all duration-500 z-50 shrink-0 border-r transform ${
        darkMode 
          ? 'bg-surface-container-low border-white/5' 
          : 'bg-white border-slate-200'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Brand Header */}
      {/* Brand Header */}
      <div className={`p-6 md:p-8 flex items-center`}>
        <div 
          onClick={() => navigate('/staff/dashboard')}
          className="w-48 cursor-pointer group transition-transform duration-500 hover:scale-105"
        >
          <img 
            src="/logo.png" 
            alt="Crisis Bridge Logo" 
            className="w-full h-auto object-contain" 
          />
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden absolute top-5 right-5 w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Close navigation"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Profile Summary */}
      <div className="px-6 mb-8">
        <div className={`p-5 rounded-[32px] transition-all duration-500 border ${
          darkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-slate-50 border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
              {userProfile?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className={`font-black text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {userProfile?.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-xs text-blue-500">{designation?.icon || 'shield'}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {designation?.label || 'Responder'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Hotel Link</span>
              <span className="text-blue-500 font-black">{userProfile?.staffProfile?.hotelCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Toggle */}
      <div className="px-6 mb-8">
        <div className={`p-4 rounded-[28px] ${darkMode ? 'bg-slate-900/40' : 'bg-slate-100/50'} border border-slate-200/50 dark:border-white/5`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
            <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
          </div>
          <button
            onClick={() => onToggleDuty?.(!isOnDuty)}
            className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-tighter uppercase transition-all duration-500 ${
              isOnDuty 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {isOnDuty ? 'Operational (ON DUTY)' : 'Dormant (OFF DUTY)'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' 
                  : darkMode 
                    ? 'text-slate-500 hover:bg-white/5 hover:text-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-105' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-50 shadow-inner" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-8 mt-auto">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
            darkMode 
              ? 'text-slate-500 border-white/5 hover:border-red-500/20 hover:text-red-400 hover:bg-red-500/5' 
              : 'text-slate-400 border-slate-100 hover:border-red-100 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
          Terminal Shutdown
        </button>
      </div>
      </aside>
    </>
  )
}
