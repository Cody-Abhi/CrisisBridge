import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db, rtdb } from '../../firebase/config'
import {
  doc, getDoc, updateDoc,
  serverTimestamp, arrayUnion, arrayRemove,
  collection, query, where, getDocs
} from 'firebase/firestore'
import {
  ref, set, onValue, off, update, push, remove, onDisconnect
} from 'firebase/database'
import { getEmergency } from '../../utils/emergencyHelpers'
import { timeAgo } from '../../utils/timeHelpers'
import StaffSidebar from '../../components/staff/StaffSidebar'
import SOSPopup from '../../components/staff/SOSPopup'
import ChatWindow from '../../components/chat/ChatWindow'
import Header from '../../components/layout/Header'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

/* ── Tab names from crisis-bridge prototype ── */
const TAB_EMOJIS = ['🏨', '🚨', '💬', '📡', '📋']
const TAB_IDS = ['grid', 'incident', 'chat', 'group', 'history']

export default function StaffDashboard() {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────
  const [hotel, setHotel] = useState(null)
  const [activeSOS, setActiveSOS] = useState({})
  const [myIncident, setMyIncident] = useState(null)
  const [newSOSAlert, setNewSOSAlert] = useState(null)
  const [isOnDuty, setIsOnDuty] = useState(false)
  const [activeTab, setActiveTab] = useState('grid')
  const [clock, setClock] = useState('')
  const [assignmentStep, setAssignmentStep] = useState(1) // 1=assigned, 2=arrived, 3=resolved
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolveNotes, setResolveNotes] = useState('')
  const [triggeredSeconds, setTriggeredSeconds] = useState(0)
  const [expandedHistory, setExpandedHistory] = useState(null)
  const [historyFilter, setHistoryFilter] = useState({ type: 'all', status: 'all' })
  const [incidentHistory, setIncidentHistory] = useState([])
  const [toast_msg, setToastMsg] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isOnDutyRef = useRef(isOnDuty)
  isOnDutyRef.current = isOnDuty

  // ── Live clock ────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-GB', { hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Fetch Staff List ───────────────────────────────────────────────────

  // ── Timer for triggered assignment ────────────────────────────────────
  useEffect(() => {
    if (myIncident && assignmentStep < 3) {
      const id = setInterval(() => setTriggeredSeconds(s => s + 1), 1000)
      return () => clearInterval(id)
    }
  }, [myIncident, assignmentStep])

  // ── Toast auto-dismiss ────────────────────────────────────────────────
  useEffect(() => {
    if (toast_msg) {
      const id = setTimeout(() => setToastMsg(null), 3000)
      return () => clearTimeout(id)
    }
  }, [toast_msg])

  // ── Helper: does this SOS match my designation? ────────────────────────
  const isSOSForMe = useCallback((emergencyType, designation) => {
    if (emergencyType === 'common') return true
    if (emergencyType === 'fire' && designation === 'fire_safety') return true
    if (emergencyType === 'medical' && designation === 'medical') return true
    if (emergencyType === 'security' && designation === 'security') return true
    return false
  }, [])

  // ── Main Firebase setup ───────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile?.staffProfile || !currentUser) return

    const { hotelCode, designation, isOnDuty: savedDuty } = userProfile.staffProfile
    setIsOnDuty(savedDuty || false)

    // 1. Fetch hotel config (room layout)
    const fetchHotel = async () => {
      try {
        const snap = await getDoc(doc(db, 'hotels', hotelCode))
        if (snap.exists()) setHotel(snap.data())
      } catch (err) {
        console.error('Hotel fetch error:', err)
      }
    }
    fetchHotel()

    // 2. Set presence in Realtime DB
    const presenceRef = ref(rtdb, `staff_presence/${hotelCode}/${currentUser.uid}`)
    set(presenceRef, {
      staffId: currentUser.uid,
      name: userProfile.name,
      designation,
      isOnline: true,
      isOnDuty: savedDuty || false,
      lastSeen: Date.now(),
      currentIncident: null,
    })
    onDisconnect(presenceRef).update({ isOnline: false, lastSeen: Date.now() })

    // 3. Listen to all SOS signals for this hotel
    const sosRef = ref(rtdb, `sos/${hotelCode}`)
    onValue(sosRef, (snapshot) => {
      const data = snapshot.val() || {}
      setActiveSOS(data)

      // Check for NEW unassigned SOS matching my designation
      Object.values(data).forEach(sos => {
        if (
          sos.status === 'active' &&
          !sos.assignedStaffId &&
          isSOSForMe(sos.emergencyType, designation) &&
          isOnDutyRef.current
        ) {
          setNewSOSAlert(prev => {
            // Don't show if we already have a popup (same incident)
            if (prev?.roomNumber === sos.roomNumber) return prev
            return sos
          })
        }
      })

      // Track my own assigned incident
      const mine = Object.values(data).find(s => s.assignedStaffId === currentUser.uid)
      if (mine) {
        setMyIncident(mine)
        setAssignmentStep(mine.status === 'arrived' ? 2 : 1)
      } else {
        // Cleared from RTDB (resolved)
        setMyIncident(prev => {
          if (prev) setAssignmentStep(3)
          return null
        })
      }
    })

    // 4. Fetch incident history from Firestore
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'incidents'),
          where('response.resolvedBy', '==', currentUser.uid)
        )
        const snap = await getDocs(q)
        setIncidentHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.warn('History fetch error:', err)
      }
    }
    fetchHistory()

    return () => off(sosRef)
  }, [userProfile, currentUser, isSOSForMe])

  // ── Toggle duty ───────────────────────────────────────────────────────
  const toggleDuty = async (newDutyState) => {
    if (!userProfile?.staffProfile) return
    const hotelCode = userProfile.staffProfile.hotelCode
    setIsOnDuty(newDutyState)
    try {
      const presenceRef = ref(rtdb, `staff_presence/${hotelCode}/${currentUser.uid}`)
      await update(presenceRef, { isOnDuty: newDutyState })
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'staffProfile.isOnDuty': newDutyState,
      })
      toast.success(newDutyState ? 'You are now On Duty' : 'You are now Off Duty')
    } catch (err) {
      toast.error('Failed to update duty status')
    }
  }

  // ── Accept SOS ─────────────────────────────────────────────────────────
  const acceptSOS = async (sosData) => {
    const hotelCode = userProfile.staffProfile.hotelCode
    setNewSOSAlert(null)
    try {
      const sosRef = ref(rtdb, `sos/${hotelCode}/${sosData.roomNumber}`)
      await update(sosRef, {
        status: 'assigned',
        assignedStaffId: currentUser.uid,
        assignedStaffName: userProfile.name,
        assignedDesignation: userProfile.staffProfile.designation,
        acceptedAt: Date.now(),
      })
      if (sosData.incidentId) {
        await updateDoc(doc(db, 'incidents', sosData.incidentId), {
          'response.assignedStaffId': currentUser.uid,
          'response.assignedStaffName': userProfile.name,
          'response.acceptedAt': serverTimestamp(),
          status: 'assigned',
          timeline: arrayUnion({
            event: 'STAFF_ACCEPTED',
            timestamp: Date.now(),
            actor: currentUser.uid,
            actorName: userProfile.name,
          }),
        })
        await updateDoc(doc(db, 'users', currentUser.uid), {
          'staffProfile.activeIncidents': arrayUnion(sosData.incidentId),
        })
        const presenceRef = ref(rtdb, `staff_presence/${hotelCode}/${currentUser.uid}`)
        await update(presenceRef, { currentIncident: sosData.incidentId })

        const chatRef = ref(rtdb, `chats/${sosData.incidentId}`)
        const sysMsg = push(chatRef)
        await set(sysMsg, {
          messageId: sysMsg.key,
          type: 'system_message',
          message: `${userProfile.name} has accepted this emergency and is on the way.`,
          timestamp: Date.now(),
        })
      }
      setMyIncident({ ...sosData, status: 'assigned' })
      setAssignmentStep(1)
      setTriggeredSeconds(0)
      setActiveTab('incident')
      toast.success(`Responding to Room ${sosData.roomNumber}`)
    } catch (err) {
      console.error('Accept SOS error:', err)
      toast.error('Failed to accept. Try again.')
    }
  }

  // ── Mark Arrived ──────────────────────────────────────────────────────
  const markArrived = async () => {
    if (!myIncident) return
    const hotelCode = userProfile.staffProfile.hotelCode
    try {
      const sosRef = ref(rtdb, `sos/${hotelCode}/${myIncident.roomNumber}`)
      await update(sosRef, { status: 'arrived', arrivedAt: Date.now() })
      if (myIncident.incidentId) {
        await updateDoc(doc(db, 'incidents', myIncident.incidentId), {
          'response.arrivedAt': serverTimestamp(),
          timeline: arrayUnion({
            event: 'STAFF_ARRIVED',
            timestamp: Date.now(),
            actor: currentUser.uid,
          }),
        })
        const chatRef = ref(rtdb, `chats/${myIncident.incidentId}`)
        const msg = push(chatRef)
        await set(msg, {
          messageId: msg.key,
          type: 'system_message',
          message: `${userProfile.name} has arrived at Room ${myIncident.roomNumber}.`,
          timestamp: Date.now(),
        })
      }
      setAssignmentStep(2)
      toast.success('Marked as arrived. Guest has been notified.')
    } catch (err) {
      toast.error('Failed to mark arrived')
    }
  }

  // ── Resolve Incident ──────────────────────────────────────────────────
  const resolveIncident = async () => {
    if (!myIncident || !resolveNotes.trim()) return
    const hotelCode = userProfile.staffProfile.hotelCode
    try {
      const sosRef = ref(rtdb, `sos/${hotelCode}/${myIncident.roomNumber}`)
      await remove(sosRef)
      if (myIncident.incidentId) {
        await updateDoc(doc(db, 'incidents', myIncident.incidentId), {
          'response.resolvedAt': serverTimestamp(),
          'response.resolutionNotes': resolveNotes,
          'response.resolvedBy': currentUser.uid,
          status: 'resolved',
          timeline: arrayUnion({
            event: 'RESOLVED',
            timestamp: Date.now(),
            actor: currentUser.uid,
          }),
        })
        await updateDoc(doc(db, 'users', currentUser.uid), {
          'staffProfile.activeIncidents': arrayRemove(myIncident.incidentId),
        })
        const presenceRef = ref(rtdb, `staff_presence/${hotelCode}/${currentUser.uid}`)
        await update(presenceRef, { currentIncident: null })
        const chatRef = ref(rtdb, `chats/${myIncident.incidentId}`)
        const msg = push(chatRef)
        await set(msg, {
          messageId: msg.key,
          type: 'system_message',
          message: `Emergency resolved by ${userProfile.name}. ${resolveNotes}`,
          timestamp: Date.now(),
        })
      }
      setAssignmentStep(3)
      setShowResolveForm(false)
      toast.success('Emergency resolved and recorded!')
    } catch (err) {
      console.error('Resolve error:', err)
      toast.error('Failed to resolve. Try again.')
    }
  }

  const formatTriggeredTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s.toString().padStart(2, '0')}s ago`
  }

  const { darkMode } = useTheme()

  // ── Rooms from hotel config ────────────────────────────────────────────
  const floorLayout = hotel?.hotelConfig?.floorLayout || {};
  const floors = Object.entries(floorLayout).map(([floor, rooms]) => ({ floor, rooms })).sort((a, b) => Number(a.floor) - Number(b.floor));


  // ── Room type from activeSOS ───────────────────────────────────────────
  const getRoomType = (room) => {
    const key = String(room)
    if (activeSOS[key]) return activeSOS[key].emergencyType || 'normal'
    return 'normal'
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-50 text-slate-800'}`}>
      {/* ── Sidebar ── */}
      <StaffSidebar
        isOnDuty={isOnDuty}
        onToggleDuty={toggleDuty}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col min-h-screen md:h-screen overflow-hidden min-w-0">
        <Header
          title={{
            grid: 'Room Grid',
            incident: 'My Assignment',
            chat: 'Incident Chat',
            group: 'Group Chat',
            history: 'My History'
          }[activeTab]}
          subtitle={`${clock} • ${userProfile?.staffProfile?.hotelName || 'Crisis Bridge'}`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="tab-content" key={activeTab}>
              {activeTab === 'grid' && (
                <RoomGridTab floors={floors} activeSOS={activeSOS} getRoomType={getRoomType} darkMode={darkMode} />
              )}
              {activeTab === 'incident' && (
                <MyAssignmentTab
                  myIncident={myIncident}
                  step={assignmentStep}
                  triggeredSeconds={triggeredSeconds}
                  formatTime={formatTriggeredTime}
                  onMarkArrived={markArrived}
                  showResolveForm={showResolveForm}
                  setShowResolveForm={setShowResolveForm}
                  resolveNotes={resolveNotes}
                  setResolveNotes={setResolveNotes}
                  onResolve={resolveIncident}
                  darkMode={darkMode}
                />
              )}
              {activeTab === 'chat' && myIncident?.incidentId && (
                <ChatWindow
                  channelId={myIncident.incidentId}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  title={`INCIDENT CHANNEL — ROOM ${myIncident.roomNumber} 🔥`}
                  isReadOnly={false}
                />
              )}
              {activeTab === 'chat' && !myIncident?.incidentId && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-20">forum</span>
                  <h3 className="text-xl font-bold mb-2">NO ACTIVE INCIDENT</h3>
                  <p>Accept an emergency to join the incident chat</p>
                </div>
              )}
              {activeTab === 'group' && (
                <ChatWindow
                  channelId={`staff_${userProfile?.staffProfile?.hotelCode}`}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  title={`STAFF CHANNEL — ${userProfile?.staffProfile?.hotelName || 'HOTEL'} 📡`}
                  isReadOnly={false}
                />
              )}
              {activeTab === 'history' && (
                <IncidentHistoryTab history={incidentHistory} darkMode={darkMode} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── SOS Popup ── */}
      {newSOSAlert && isOnDuty && (
        <SOSPopup
          sosData={newSOSAlert}
          onAccept={acceptSOS}
          onDecline={() => setNewSOSAlert(null)}
        />
      )}



      {/* ── Toast ── */}
      {toast_msg && <div className="toast">{toast_msg}</div>}
    </div>
  )
}


// ════════════════════════════════════════
// ROOM GRID TAB
// ════════════════════════════════════════
function RoomGridTab({ floors, activeSOS, getRoomType }) {
  const [hover, setHover] = useState(null)

  const getTooltip = (room) => {
    const key = String(room)
    const sos = activeSOS[key]
    if (sos) {
      const minutesAgo = sos.triggeredAt
        ? Math.floor((Date.now() - sos.triggeredAt) / 60000)
        : '?'
      return `Room ${room} — ${(sos.emergencyType || 'SOS').toUpperCase()} — ${minutesAgo}m ago`
    }
    return `Room ${room} — Available`
  }

  if (!floors.length) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight mb-2">LIVE HOTEL GRID</h2>
          <span className="text-slate-500 font-medium">Loading hotel layout...</span>
        </div>
        <div className="h-64 flex flex-col items-center justify-center bg-slate-100 dark:bg-surface-container-low rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="text-4xl mb-4">🏨</div>
          <h3 className="font-bold">LOADING HOTEL DATA</h3>
          <p className="text-sm text-slate-500">Fetching room configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2">LIVE HOTEL GRID</h2>
          <span className="text-slate-500 font-medium">Last updated: just now</span>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold ring-1 ring-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live Monitoring
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {floors.map((f) => (
          <div className="floor-section" key={f.floor}>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
                FLOOR {f.floor}
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {(f.rooms || []).map((room) => {
                const type = getRoomType(room)
                const isSOS = type !== 'normal'

                return (
                  <div
                    key={room}
                    className={`relative aspect-square rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 cursor-pointer group px-4 text-center ${type === 'normal'
                      ? 'bg-slate-100 dark:bg-surface-container-low text-slate-400 dark:text-slate-600 hover:scale-105 hover:bg-slate-200 dark:hover:bg-surface-bright'
                      : type === 'fire'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                        : type === 'medical'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                          : type === 'security'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40 animate-pulse'
                            : 'bg-purple-500 text-white shadow-lg shadow-purple-500/40 animate-pulse'
                      }`}
                    onMouseEnter={() => setHover(room)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {room}
                    {hover === room && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-xl font-medium animate-in fade-in zoom-in duration-200">
                        {getTooltip(room)}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-slate-100 dark:bg-surface-container-low rounded-2xl flex flex-wrap gap-6 items-center border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Legend</div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-500/50" /> FIRE
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" /> MEDICAL
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50" /> SECURITY
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm shadow-purple-500/50" /> COMMON
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full" /> AVAILABLE
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════
// MY ASSIGNMENT TAB
// ════════════════════════════════════════
function MyAssignmentTab({ myIncident, step, triggeredSeconds, formatTime, onMarkArrived, showResolveForm, setShowResolveForm, resolveNotes, setResolveNotes, onResolve, darkMode }) {
  if (!myIncident && step !== 3) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <div className="w-20 h-20 bg-slate-100 dark:bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span className="material-symbols-outlined text-4xl opacity-30">shield</span>
        </div>
        <h3 className="text-xl font-bold mb-2">NO ACTIVE ASSIGNMENT</h3>
        <p>Stay on duty to receive emergency alerts</p>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-12 text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
            <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">EMERGENCY RESOLVED</h2>
          <p className="text-emerald-600/70 dark:text-emerald-400/60 font-medium">Room resolved successfully. Good work!</p>
        </div>
        <div className="bg-white dark:bg-surface-container-low border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 text-center">Response Timeline</h4>
          <div className="space-y-6">
            {['SOS TRIGGERED', 'ASSIGNED', 'ARRIVED', 'RESOLVED'].map((label, i) => (
              <TimelineItem key={i} label={label} state="resolved" isLast={i === 3} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const emergency = getEmergency(myIncident?.emergencyType)
  const steps = ['SOS TRIGGERED', 'ASSIGNED', 'ARRIVED', 'RESOLVED']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`rounded-3xl p-8 flex items-center gap-6 shadow-lg shadow-black/5 transition-all ${myIncident.emergencyType === 'fire'
        ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white'
        : myIncident.emergencyType === 'medical'
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
          : myIncident.emergencyType === 'security'
            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
        }`}>
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-inner">
          {emergency.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black tracking-tight uppercase leading-none mb-1">{emergency.label} EMERGENCY</h2>
          <p className="opacity-90 font-medium text-sm">Action required immediately</p>
        </div>
        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black tracking-widest uppercase border border-white/20">
          Response Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-container-low border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Location Info</div>
          <div className="flex items-end gap-3 mb-1">
            <span className="text-5xl font-black text-slate-800 dark:text-white transition-colors">{myIncident.roomNumber}</span>
            <span className="text-slate-400 font-bold mb-1.5 uppercase text-xs tracking-wider">Room</span>
          </div>
          <div className="text-lg font-bold text-blue-500 mb-6">FLOOR {myIncident.floor || '—'}</div>

          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Guest</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200 transition-colors">{myIncident.guestName || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Phone</span>
              <span className="font-mono text-sm text-slate-800 dark:text-slate-200 transition-colors">{myIncident.guestPhone || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-container-low border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Response Status</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white transition-colors mb-2">
              {formatTime(triggeredSeconds)}
            </div>
            <p className="text-xs text-slate-500 font-medium">Time elapsed since triggered</p>
          </div>

          <div className="mt-8 flex items-center gap-3 px-4 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Assigned to you</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-container-low border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Process Status</h4>
        <div className="space-y-6">
          {steps.map((label, i) => {
            let state = 'pending'
            if (i <= step) state = 'completed'
            return <TimelineItem key={i} label={label} state={state} isLast={i === 3} />
          })}
        </div>
      </div>

      <div className="space-y-4">
        {step === 1 && (
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            onClick={onMarkArrived}
          >
            <span className="material-symbols-outlined">how_to_reg</span>
            MARK ARRIVED AT ROOM
          </button>
        )}
        {step === 2 && !showResolveForm && (
          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            onClick={() => setShowResolveForm(true)}
          >
            <span className="material-symbols-outlined">check_circle</span>
            RESOLVE EMERGENCY
          </button>
        )}
        {showResolveForm && (
          <div className="bg-slate-100 dark:bg-surface-container-highest rounded-3xl p-6 transition-colors shadow-inner space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-xs font-bold text-slate-500 uppercase px-2">Resolution Findings</div>
            <textarea
              className="w-full bg-white dark:bg-surface-container-low border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px] resize-none"
              placeholder="Describe the action taken and final outcome..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-xl transition-colors"
                onClick={() => setShowResolveForm(false)}
              >
                Cancel
              </button>
              <button
                className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                onClick={onResolve}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineItem({ label, state, isLast }) {
  const isCompleted = state === 'completed' || state === 'resolved' || state === 'arrived' || (label === 'Assigned')
  const isCurrent = (label === 'Assigned' && state === 'assigned') || (label === 'Arrived' && state === 'arrived')

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-2 transition-colors duration-500 ${isCompleted ? 'bg-blue-600 border-blue-600' :
          isCurrent ? 'border-blue-600 animate-pulse' : 'border-slate-300 dark:border-slate-700'
          }`} />
        {!isLast && (
          <div className={`w-0.5 flex-1 transition-colors duration-500 ${isCompleted ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
            }`} />
        )}
      </div>
      <div className={`pb-8 transition-colors duration-500 ${isCompleted || isCurrent ? 'text-slate-800 dark:text-white' : 'text-slate-400'
        }`}>
        <p className="text-sm font-bold leading-none">{label}</p>
        {isCurrent && <p className="text-[10px] text-blue-500 mt-1 uppercase tracking-widest font-black">Active Phase</p>}
      </div>
    </div>
  )
}

function StaffChat({ currentUser, staffData }) {
  const hotelCode = staffData?.staffProfile?.hotelCode
  return (
    <div className="h-[calc(100vh-280px)] bg-white dark:bg-surface-container-low rounded-[40px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
      <ChatWindow
        channelId={`staff_${hotelCode}`}
        currentUser={currentUser}
        userProfile={staffData}
        title="Staff Comms Channel"
        height="100%"
      />
    </div>
  )
}

function IncidentHistoryTab({ history, darkMode }) {
  const [expanded, setExpanded] = useState(null)

  if (!history || history.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 mt-8">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">history</span>
        <h3 className="text-xl font-bold">No past incidents found</h3>
        <p className="text-sm max-w-xs text-center opacity-60">Your history of resolved emergencies will appear here once you complete assignments.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-8 pb-20">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black italic tracking-tight uppercase">Past Missions</h3>
          <p className="text-slate-500 text-sm font-medium">History of your emergency responses</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-blue-600">{history.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Resolved</div>
        </div>
      </div>

      <div className="grid gap-4">
        {history.map((incident) => (
          <div
            key={incident.id}
            className="group bg-white dark:bg-surface-container-low border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-blue-500/30"
          >
            <div
              className="p-6 cursor-pointer"
              onClick={() => setExpanded(expanded === incident.id ? null : incident.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${incident.type === 'FIRE' ? 'bg-orange-500/10 text-orange-500' :
                    incident.type === 'MEDICAL' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {incident.type === 'FIRE' ? 'local_fire_department' :
                        incident.type === 'MEDICAL' ? 'medical_services' : 'emergency'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-lg">Room {incident.roomNumber || 'N/A'}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {incident.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {incident.response?.resolvedAt ? new Date(incident.response.resolvedAt.seconds * 1000).toLocaleString() : 'Date Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolution</p>
                    <p className="text-blue-600 font-bold text-sm">Success</p>
                  </div>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${expanded === incident.id ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {expanded === incident.id && (
              <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm text-blue-600">rate_review</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">After-Action Report</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{incident.response?.resolutionNotes || 'No specific notes recorded for this incident. System indicates successful intervention by response team member.'}"
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
