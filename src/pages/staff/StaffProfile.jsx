// src/pages/staff/StaffProfile.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { STAFF_DESIGNATIONS } from '../../utils/emergencyHelpers'
import StaffSidebar from '../../components/staff/StaffSidebar'
import Header from '../../components/layout/Header'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

export default function StaffProfile() {
  const { userProfile, currentUser, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const [isOnDuty, setIsOnDuty] = useState(userProfile?.staffProfile?.isOnDuty || false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sp = userProfile?.staffProfile
  const designation = STAFF_DESIGNATIONS[sp?.designation]

  const toggleDuty = async (newDutyState) => {
    setIsOnDuty(newDutyState)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'staffProfile.isOnDuty': newDutyState,
      })
      toast.success(newDutyState ? 'Terminal Operational' : 'Terminal Dormant')
    } catch (err) {
      toast.error('Sync failure')
    }
  }

  const stats = [
    { label: 'Missions Logged', value: '14', icon: 'history_edu', color: 'blue' },
    { label: 'Avg Feedback', value: '4.9', icon: 'stars', color: 'amber' },
    { label: 'Response Time', value: '2.4m', icon: 'timer', color: 'emerald' },
  ]

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${darkMode ? 'bg-surface text-white' : 'bg-slate-50 text-slate-900'}`}>
      <StaffSidebar
        isOnDuty={isOnDuty}
        onToggleDuty={toggleDuty}
        activeTab="profile"
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-h-screen md:h-screen overflow-hidden min-w-0">
        <Header
          title="Commander Profile"
          subtitle="Personnel identifier & system permissions"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Main Identity Card */}
            <div className={`relative overflow-hidden rounded-[40px] border p-10 transition-all duration-500 ${
              darkMode ? 'bg-surface-container-low border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
            }`}>
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32" />
              
              <div className="relative flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-500/40 transition-transform duration-500 group-hover:scale-105">
                    {userProfile?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-surface-container-low rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-xl">verified</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-3xl font-black tracking-tighter">{userProfile?.name}</h2>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                      sp?.isApproved 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse'
                    }`}>
                      {sp?.isApproved ? 'Verified Personnel' : 'Authentication Pending'}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight mb-6">{userProfile?.email}</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-blue-500">hotel</span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{sp?.hotelName}</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-blue-500">badge</span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{sp?.employeeId || 'ID: UNSPECIFIED'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((s, idx) => (
                <div key={idx} className={`p-6 rounded-[32px] border transition-all duration-500 ${
                  darkMode ? 'bg-surface-container-low border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl bg-${s.color}-500/10 flex items-center justify-center mb-4`}>
                    <span className={`material-symbols-outlined text-${s.color}-500`}>{s.icon}</span>
                  </div>
                  <div className="text-2xl font-black tracking-tighter mb-1">{s.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Detailed Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProfileSection title="Core Assignment" icon="assignment_ind" darkMode={darkMode}>
                <ProfileRow label="Role / Designation" value={`${designation?.label || sp?.designation}`} icon={designation?.icon || 'shield'} darkMode={darkMode} />
                <ProfileRow label="Access Code" value={sp?.hotelCode} icon="key" darkMode={darkMode} isMono />
                <ProfileRow label="Auth Status" value={sp?.isApproved ? 'Level 4 Clear' : 'Level 0 (Locked)'} icon="admin_panel_settings" darkMode={darkMode} />
              </ProfileSection>

              <ProfileSection title="Communication" icon="contact_emergency" darkMode={darkMode}>
                <ProfileRow label="Terminal UID" value={currentUser?.uid?.substring(0, 12) + '...'} icon="fingerprint" darkMode={darkMode} isMono />
                <ProfileRow label="Contact Line" value={userProfile?.phone || 'Emergency Only'} icon="call" darkMode={darkMode} />
                <ProfileRow label="Last Pulse" value="Online Now" icon="monitor_heart" darkMode={darkMode} />
              </ProfileSection>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-10">
              <button
                onClick={() => navigate('/staff/dashboard')}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border ${
                  darkMode 
                    ? 'border-white/5 bg-white/5 hover:bg-white/10' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 shadow-lg shadow-slate-200/50'
                }`}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                To Dashboard
              </button>
              <button
                onClick={() => toast.error('Encryption active - Modification restricted')}
                className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all duration-300"
              >
                <span className="material-symbols-outlined">edit_square</span>
                Edit Credentials
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const ProfileSection = ({ title, icon, children, darkMode }) => (
  <div className={`p-8 rounded-[40px] border ${
    darkMode ? 'bg-surface-container-low border-white/5' : 'bg-white border-slate-200'
  }`}>
    <div className="flex items-center gap-3 mb-8">
      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-blue-500 text-lg">{icon}</span>
      </div>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
)

const ProfileRow = ({ label, value, icon, darkMode, isMono }) => (
  <div className="group">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</div>
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-lg text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors">{icon}</span>
      <span className={`text-sm font-bold tracking-tight ${isMono ? 'font-mono' : ''} ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  </div>
)
