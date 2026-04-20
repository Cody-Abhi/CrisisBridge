import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

export default function AdminSidebar({ hotelCode, pendingCount = 0, mobileOpen = false, onMobileClose }) {
  const { logout, userProfile } = useAuth()
  const { darkMode } = useTheme()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const collapsed = isCollapsed && !mobileOpen

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error(error)
      navigate('/')
    }
  }

  const links = [
    { to: '/admin/dashboard',  icon: 'dashboard', label: 'Dashboard'       },
    { to: '/admin/chat',       icon: 'forum',     label: 'Staff Chat'      },
    { to: '/admin/staff',      icon: 'groups',    label: 'Staff Requests'  },
    { to: '/admin/incidents',  icon: 'history',   label: 'Incidents'       },
  ]

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

      <aside className={`fixed md:static inset-y-0 left-0 z-50 md:z-40 ${collapsed ? 'md:w-20' : 'md:w-64'} w-72 max-w-[86vw] glass border-r border-slate-200/50 dark:border-white/5 flex flex-col h-screen transition-all duration-300 shadow-2xl shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden md:flex absolute -right-3 top-20 rounded-xl w-6 h-6 items-center justify-center border shadow-xl z-50 transition-all ${
          darkMode ? 'bg-slate-800 border-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-slate-200'
        }`}
      >
        <span className="material-symbols-outlined text-[14px] font-bold">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Brand logo */}
      <div className={`p-4 transition-all ${collapsed ? 'md:px-2 md:flex md:justify-center' : 'sm:p-6'}`}>
        <div 
          onClick={() => navigate('/admin/dashboard')}
          className={`flex items-center group transition-all cursor-pointer ${collapsed ? '' : 'gap-3'}`}
        >
          <div className={`${collapsed ? 'w-10 h-10' : 'w-full'} transition-all duration-300`}>
            <img 
              src="/logo.png" 
              alt="Crisis Bridge Logo" 
              className={`w-full h-auto object-contain transition-all group-hover:scale-105 ${collapsed ? 'scale-125' : ''}`}
            />
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
            title="Close navigation"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 px-3 space-y-1.5 overflow-y-auto ${collapsed ? 'md:flex md:flex-col md:items-center' : ''}`}>
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => `
              relative flex items-center rounded-2xl transition-all duration-300 group
              ${collapsed ? 'md:w-12 md:h-12 md:justify-center px-4 py-3.5 gap-3.5 w-full' : 'px-4 py-3.5 gap-3.5 w-full'}
              ${isActive
                ? 'bg-cs-red text-white shadow-xl shadow-red-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:scale-110`}>
              {item.icon}
            </span>
            {!collapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}

            {item.to === '/admin/staff' && pendingCount > 0 && (
              <span className={`
                bg-amber-500 text-white font-black rounded-lg flex items-center justify-center shadow-sm
                ${collapsed ? 'md:absolute md:-top-1 md:-right-1 md:w-5 md:h-5 md:text-[9px] ml-auto px-1.5 py-0.5 min-w-[20px] h-5 text-[10px]' : 'ml-auto px-1.5 py-0.5 min-w-[20px] h-5 text-[10px]'}
              `}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`mt-auto p-3 border-t border-slate-200/50 dark:border-white/5 ${collapsed ? 'md:flex md:flex-col md:items-center md:gap-3' : 'space-y-3'}`}>
        {!collapsed && (
          <div className="glass-accent rounded-2xl p-4 flex flex-col gap-1 border-dashed border-2 border-cs-red/20 mx-1">
            <span className="text-[9px] text-cs-red/60 font-black tracking-[0.2em] uppercase">Hotel Code</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-black text-cs-red">{hotelCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(hotelCode)
                  toast.success('Code copied')
                }}
                className="p-1.5 hover:bg-cs-red/10 rounded-lg transition-colors"
                title="Copy Code"
              >
                <span className="material-symbols-outlined text-sm font-bold text-cs-red">content_copy</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          onPointerUp={onMobileClose}
          className={`
            flex items-center rounded-2xl transition-all duration-200 group
            ${collapsed ? 'md:w-12 md:h-12 md:justify-center px-4 py-3.5 gap-3.5 w-full' : 'px-4 py-3.5 gap-3.5 w-full'}
            text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400
          `}
        >
          <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">logout</span>
          {!collapsed && <span className="text-sm font-bold tracking-tight">Sign Out</span>}
        </button>
      </div>
      </aside>
    </>
  )
}
