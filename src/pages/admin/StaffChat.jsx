import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db, rtdb } from '../../firebase/config'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { ref, onValue, set, onDisconnect } from 'firebase/database'
import AdminSidebar from '../../components/layout/AdminSidebar'
import ChatWindow from '../../components/chat/ChatWindow'
import { useTheme } from '../../contexts/ThemeContext'

const DEFAULT_CHANNELS = [
  { id: 'general',    name: 'General',           icon: 'forum',       desc: 'Hotel-wide announcements & discussion' },
  { id: 'emergency',  name: 'Emergency Ops',     icon: 'emergency',   desc: 'Active emergency coordination' },
  { id: 'security',   name: 'Security',          icon: 'shield',      desc: 'Security team channel' },
  { id: 'medical',    name: 'Medical',           icon: 'medical_services', desc: 'Medical response team' },
  { id: 'fire_safety',name: 'Fire Safety',       icon: 'local_fire_department', desc: 'Fire safety team' },
  { id: 'maintenance',name: 'Maintenance',       icon: 'build',       desc: 'Facility & maintenance ops' },
]

export default function StaffChat() {
  const { currentUser, userProfile } = useAuth()
  const hotelCode = userProfile?.adminProfile?.hotelCode
  const isUserOnline = (presence) => Boolean(presence?.isOnline || presence?.online)

  const [activeChannel, setActiveChannel] = useState('general')
  const [onlineUsers, setOnlineUsers]     = useState({})
  const [activeStaff, setActiveStaff]     = useState([])
  const [pendingCount, setPendingCount]   = useState(0)
  const [, setUnreadCounts]               = useState({})
  const [searchQuery, setSearchQuery]     = useState('')
  const [showMembers, setShowMembers]     = useState(true)
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  // ── Listen to pending staff requests count ────────────────────────────
  useEffect(() => {
    if (!hotelCode) return

    const q = query(
      collection(db, 'staff_requests'),
      where('hotelCode', '==', hotelCode),
      where('status', '==', 'pending')
    )
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size))
    return () => unsub()
  }, [hotelCode])

  // ── Set own presence in RTDB ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !hotelCode) return

    const presenceRef = ref(rtdb, `staff_presence/${hotelCode}/${currentUser.uid}`)
    const connectedRef = ref(rtdb, '.info/connected')

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(presenceRef, {
          name:   userProfile?.name || 'Admin',
          role:   'admin',
          designation: 'admin',
          isOnline: true,
          isOnDuty: true,
          lastSeen: Date.now(),
          currentIncident: null,
        })
        onDisconnect(presenceRef).set({
          name:   userProfile?.name || 'Admin',
          role:   'admin',
          designation: 'admin',
          isOnline: false,
          isOnDuty: false,
          lastSeen: Date.now(),
          currentIncident: null,
        })
      }
    })

    return () => {
      unsub()
      set(presenceRef, {
        name:   userProfile?.name || 'Admin',
        role:   'admin',
        designation: 'admin',
        isOnline: false,
        isOnDuty: false,
        lastSeen: Date.now(),
        currentIncident: null,
      })
    }
  }, [currentUser, hotelCode, userProfile])

  // ── Listen to online presence ─────────────────────────────────────────
  useEffect(() => {
    if (!hotelCode) return

    const presRef = ref(rtdb, `staff_presence/${hotelCode}`)
    const unsub = onValue(presRef, (snap) => {
      setOnlineUsers(snap.val() || {})
    })

    return () => unsub()
  }, [hotelCode])

  // ── Listen to active staff from Firestore ─────────────────────────────
  useEffect(() => {
    if (!hotelCode) return

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'staff'),
      where('staffProfile.hotelCode', '==', hotelCode),
      where('staffProfile.isApproved', '==', true)
    )
    const unsub = onSnapshot(q, (snap) => {
      setActiveStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => unsub()
  }, [hotelCode])

  // ── Listen for unread counts per channel ──────────────────────────────
  useEffect(() => {
    if (!hotelCode) return

    const listeners = DEFAULT_CHANNELS.map(ch => {
      const msgRef = ref(rtdb, `chats/${hotelCode}_${ch.id}/messages`)
      return onValue(msgRef, (snap) => {
        const data = snap.val()
        const count = data ? Object.keys(data).length : 0
        setUnreadCounts(prev => ({ ...prev, [ch.id]: count }))
      })
    })

    return () => listeners.forEach(unsub => unsub())
  }, [hotelCode])

  const channelId = hotelCode ? `${hotelCode}_${activeChannel}` : null
  const activeChannelData = DEFAULT_CHANNELS.find(c => c.id === activeChannel)

  const onlineCount = Object.values(onlineUsers).filter(isUserOnline).length
  const totalMembers = activeStaff.length + 1 // +1 for admin

  const filteredStaff = activeStaff.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Role color helpers
  const getRoleColor = (role) => {
    const colors = {
      admin:       'bg-blue-500',
      fire_safety: 'bg-red-500',
      medical:     'bg-emerald-500',
      security:    'bg-amber-500',
      general:     'bg-purple-500',
    }
    return colors[role] || 'bg-slate-400'
  }

  const { darkMode } = useTheme()

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-100 text-slate-800'}`}>
      <AdminSidebar
        hotelCode={hotelCode}
        pendingCount={pendingCount}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex min-h-screen md:h-screen overflow-hidden relative">
        <button
          onClick={() => setSidebarOpen(true)}
          className={`md:hidden absolute top-3 left-3 z-30 w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
            darkMode
              ? 'bg-slate-900/90 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-700 shadow'
          }`}
          title="Open navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* ── Channel Sidebar ──────────────────────────────────────────── */}
        <div className={`hidden md:flex w-72 border-r flex-col shrink-0 transition-colors duration-300 ${darkMode ? 'bg-surface-container-low border-slate-800/80' : 'bg-white border-slate-200'}`}> 
          {/* Channel header */}
          <div className={`p-5 border-b transition-colors ${darkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="material-symbols-outlined text-white text-[16px]">chat</span>
              </div>
              <div>
                <h2 className={`font-bold text-sm tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Staff Chat</h2>
                <p className="text-slate-500 text-[10px] font-medium">{onlineCount} online · {totalMembers} members</p>
              </div>
            </div>
          </div>

          {/* Channels list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            <p className="text-slate-500 text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-2">Channels</p>
            {DEFAULT_CHANNELS.map(ch => {
              const isActive = activeChannel === ch.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? (darkMode ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-600')
                      : (darkMode ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                  )}
                  <span className={`material-symbols-outlined text-[18px] transition ${
                    isActive ? (darkMode ? 'text-blue-400' : 'text-blue-600') : 'text-slate-400 group-hover:text-slate-600'
                  }`}>{ch.icon}</span>
                  <span className="truncate">{ch.name}</span>
                  {ch.id === 'emergency' && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>

          {/* User info footer */}
          <div className={`p-4 border-t transition-colors ${darkMode ? 'border-slate-800/60 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                  {userProfile?.name?.charAt(0) || 'A'}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 transition-colors ${darkMode ? 'border-slate-900' : 'border-white'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{userProfile?.name || 'Admin'}</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Admin</p>
              </div>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  showMembers 
                    ? (darkMode ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600') 
                    : (darkMode ? 'text-slate-600 hover:bg-white/5 hover:text-slate-400' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')
                }`}
                title="Toggle members panel"
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Chat Area ───────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-300 ${darkMode ? 'bg-surface' : 'bg-white'}`}>
          {/* Channel info header */}
          <div className={`px-4 sm:px-6 py-4 border-b backdrop-blur-sm shrink-0 transition-colors ${darkMode ? 'border-slate-800/60 bg-slate-900/50 shadow-lg shadow-black/10' : 'border-slate-100 bg-white/80 shadow-sm'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <span className={`material-symbols-outlined text-xl transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{activeChannelData?.icon}</span>
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-sm sm:text-base tracking-tight flex items-center gap-2 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    <span className="truncate">{activeChannelData?.name}</span>
                    {activeChannel === 'emergency' && (
                      <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-[9px] uppercase tracking-wider font-bold rounded-full ring-1 ring-red-500/20">
                        Priority
                      </span>
                    )}
                  </h3>
                  <p className="hidden sm:block text-slate-500 text-xs font-medium truncate">{activeChannelData?.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className={`hidden sm:flex w-9 h-9 rounded-lg items-center justify-center transition ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>
                <button className={`hidden sm:flex w-9 h-9 rounded-lg items-center justify-center transition ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                  <span className="material-symbols-outlined text-[18px]">push_pin</span>
                </button>
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className={`hidden lg:flex w-9 h-9 rounded-lg items-center justify-center transition ${
                    showMembers 
                      ? (darkMode ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600') 
                      : (darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-300' : 'bg-slate-100 text-slate-500 hover:text-slate-700')
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </button>
              </div>
            </div>
            <div className="md:hidden mt-3">
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                Channel
              </label>
              <select
                value={activeChannel}
                onChange={(e) => setActiveChannel(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${
                  darkMode
                    ? 'bg-slate-800/70 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {DEFAULT_CHANNELS.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 min-h-0">
            {channelId ? (
              <ChatWindow
                channelId={channelId}
                currentUser={currentUser}
                userProfile={userProfile}
                title={activeChannelData?.name || 'Chat'}
                channelTheme={activeChannel === 'emergency' ? 'emergency' : 'default'}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">forum</span>
                <p className="font-medium">No hotel registered</p>
                <p className="text-sm text-slate-600 mt-1">Register your hotel to start chatting with staff.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Members Panel ────────────────────────────────────────────── */}
        {showMembers && (
          <div className={`hidden lg:flex w-72 border-l flex-col shrink-0 transition-colors duration-300 ${darkMode ? 'bg-surface-container-low border-slate-800/60' : 'bg-white border-slate-200'}`}>
            <div className={`p-5 border-b transition-colors ${darkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-sm mb-3 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Members — {totalMembers}</h3>
              <div className="relative">
                <span className="material-symbols-outlined text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full rounded-lg pl-9 pr-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 ${
                    darkMode 
                      ? 'bg-slate-800/60 border-slate-700/50 text-slate-300 placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:ring-blue-400 focus:border-blue-400'
                  }`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {/* Online section */}
              <p className="text-emerald-500 text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Online — {onlineCount}
              </p>

              {/* Admin (self) */}
              {isUserOnline(onlineUsers[currentUser?.uid]) && (
                <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition group ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                      {userProfile?.name?.charAt(0) || 'A'}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 transition-colors ${darkMode ? 'border-slate-900' : 'border-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{userProfile?.name} <span className="text-slate-500 text-xs">(you)</span></p>
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded transition-colors ${darkMode ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' : 'bg-blue-50 text-blue-600'}`}>
                      Admin
                    </span>
                  </div>
                </div>
              )}

              {/* Online staff */}
              {filteredStaff
                .filter(s => isUserOnline(onlineUsers[s.id]))
                .map(staff => (
                  <div key={staff.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition group ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full ${getRoleColor(staff.staffProfile?.designation)} flex items-center justify-center text-white font-bold text-[10px]`}>
                        {staff.name?.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 transition-colors ${darkMode ? 'border-slate-900' : 'border-white'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{staff.name}</p>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded transition-colors ${darkMode ? 'bg-slate-800/50 text-slate-400 ring-1 ring-slate-700/50' : 'bg-slate-100 text-slate-600'}`}>
                        {staff.staffProfile?.designation?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}

              {/* Offline section */}
              <p className="text-slate-600 text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-2 mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                Offline — {totalMembers - onlineCount}
              </p>

              {/* Offline staff */}
              {filteredStaff
                .filter(s => !isUserOnline(onlineUsers[s.id]))
                .map(staff => (
                  <div key={staff.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition group opacity-50 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                        {staff.name?.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{staff.name}</p>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded transition-colors ${darkMode ? 'bg-slate-800/50 text-slate-500 ring-1 ring-slate-600/30' : 'bg-slate-100 text-slate-400'}`}>
                        {staff.staffProfile?.designation?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


