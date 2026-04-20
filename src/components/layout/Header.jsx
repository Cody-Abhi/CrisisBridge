import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

export default function Header({ title, subtitle, showNotifications = true, customActions, onMenuClick }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { userProfile } = useAuth()

  return (
    <header className="glass border-b border-slate-200/50 dark:border-white/5 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex justify-between items-center gap-3 shrink-0 z-30 sticky top-0 transition-all duration-300">
      <div className="flex items-start gap-2 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shrink-0"
            title="Open navigation"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight transition-colors truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5 transition-colors truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {customActions && <div className="hidden sm:flex items-center gap-2">{customActions}</div>}

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {showNotifications && (
            <button className="relative p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all group">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-cs-red rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
            </button>
          )}
        </div>

        <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10"></div>

        <div className="flex items-center gap-2 sm:gap-3 group px-1 sm:px-2 py-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-600/20 transform group-hover:scale-105 transition-transform shrink-0">
            {userProfile?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-sm hidden md:block">
            <p className="font-black text-slate-800 dark:text-white truncate max-w-[120px] leading-tight">
              {userProfile?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black mt-0.5">
              {userProfile?.role || 'Member'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
