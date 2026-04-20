import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db, rtdb } from '../../firebase/config'
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { ref, onValue, remove } from 'firebase/database'
import { pushChatMessage } from '../../firebase/realtime'
import ChatWindow from '../../components/chat/ChatWindow'
import AdminSidebar from '../../components/layout/AdminSidebar'
import RoomGrid from '../../components/sos/RoomGrid'
import IncidentCard from '../../components/sos/IncidentCard'
import AdminAIChatbot from '../../components/admin/ai/AdminAIChatbot'
import Header from '../../components/layout/Header'
import toast from 'react-hot-toast'

const computeAvgResponseTime = (incidents) => {
  const resolved = incidents.filter(
    i => i.status === 'resolved' && i.response?.acceptedAt && i.emergency?.triggeredAt
  )
  if (resolved.length === 0) return 'N/A'
  const avgMs = resolved.reduce((sum, i) => {
    const accepted = i.response.acceptedAt?.toMillis ? i.response.acceptedAt.toMillis() : (i.response.acceptedAt || 0)
    const triggered = i.emergency.triggeredAt?.toMillis ? i.emergency.triggeredAt.toMillis() : (i.emergency.triggeredAt || 0)
    return sum + Math.abs(accepted - triggered)
  }, 0) / resolved.length
  const avgSec = Math.floor(avgMs / 1000)
  return avgSec < 60
    ? `${avgSec}s`
    : `${Math.floor(avgSec / 60)}m ${avgSec % 60}s`
}

export default function AdminDashboard() {
  const { currentUser, userProfile } = useAuth()
  const hotelCode = userProfile?.adminProfile?.hotelCode

  const [hotel, setHotel] = useState(null)
  const [activeSOS, setActiveSOS] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [incidents, setIncidents] = useState([])
  const [staffList, setStaffList] = useState([])

  const [openChatId, setOpenChatId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeSOSMap = activeSOS.reduce((acc, s) => {
    if (s.roomNumber) acc[s.roomNumber] = s
    return acc
  }, {})

  const todayStatsObj = {
    totalIncidents: incidents.length,
    resolvedCount: incidents.filter(i => i.status === 'resolved').length,
    avgResponseTime: computeAvgResponseTime(incidents),
    pendingApprovals: pendingCount,
  }

  useEffect(() => {
    if (!hotelCode) { setLoading(false); return }
    const fetchHotel = async () => {
      try {
        const snap = await getDoc(doc(db, 'hotels', hotelCode))
        if (snap.exists()) setHotel(snap.data())
      } catch (err) {
        console.error('Failed to fetch hotel:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHotel()
  }, [hotelCode])

  useEffect(() => {
    if (!hotelCode) return
    const sosRef = ref(rtdb, `sos/${hotelCode}`)
    const unsub = onValue(sosRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) { setActiveSOS([]); return }
      const sosList = Object.entries(data).map(([roomKey, val]) => ({
        ...val,
        roomKey,
        roomNumber: val.roomNumber || roomKey,
        incidentId: val.incidentId || roomKey,
        firestoreIncidentId: val.incidentId || null,
      }))
      setActiveSOS(sosList.sort((a, b) => (b.triggeredAt || b.timestamp || 0) - (a.triggeredAt || a.timestamp || 0)))
    })
    return () => unsub()
  }, [hotelCode])

  useEffect(() => {
    if (!hotelCode) return
    const q = query(
      collection(db, 'staff_requests'),
      where('hotelCode', '==', hotelCode),
      where('status', '==', 'pending')
    )
    const unsub = onSnapshot(q, (snap) => {
      setPendingCount(snap.size)
    })

    return () => unsub()
  }, [hotelCode])

  useEffect(() => {
    if (!hotelCode) return

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'staff'),
      where('staffProfile.hotelCode', '==', hotelCode)
    )
    const unsub = onSnapshot(q, (snap) => {
      setStaffList(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    })

    return () => unsub()
  }, [hotelCode])

  useEffect(() => {
    if (!hotelCode) return

    const q = query(
      collection(db, 'incidents'),
      where('hotelCode', '==', hotelCode)
    )
    const unsub = onSnapshot(q, (snap) => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => unsub()
  }, [hotelCode])

  const handleResolve = async (sosData) => {
    const incidentDocId = sosData.firestoreIncidentId || sosData.incidentId
    const resolvedByName = userProfile?.name || 'Admin'
    const resolutionNote = 'Resolved from the admin dashboard.'

    try {
      if (incidentDocId) {
        await updateDoc(doc(db, 'incidents', incidentDocId), {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: currentUser.uid,
          resolutionNotes: resolutionNote,
          'response.resolvedAt': serverTimestamp(),
          'response.resolvedBy': currentUser.uid,
          'response.resolvedByName': resolvedByName,
          'response.resolutionNotes': resolutionNote,
          timeline: arrayUnion({
            event: 'ADMIN_RESOLVED',
            timestamp: Date.now(),
            actor: currentUser.uid,
            actorName: resolvedByName,
            note: resolutionNote,
          }),
        })

        try {
          await pushChatMessage(incidentDocId, {
            type: 'system_message',
            message: `Emergency resolved by ${resolvedByName}. ${resolutionNote}`,
            timestamp: Date.now(),
          })
        } catch (chatError) {
          console.warn('Failed to post admin resolution message:', chatError)
        }
      }

      await remove(ref(rtdb, `sos/${hotelCode}/${sosData.roomKey || sosData.roomNumber}`))
      if (openChatId === sosData.incidentId) setOpenChatId(null)
      toast.success(`Incident in Room ${sosData.roomNumber} resolved.`)
    } catch (err) {
      console.error('Failed to resolve:', err)
      toast.error('Failed to resolve incident.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
      </div>
    )
  }

  if (!hotelCode) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No hotel registered yet.</p>
          <a href="/admin/register-hotel" className="text-blue-600 underline font-bold">Register your hotel</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-surface flex transition-colors duration-300">
      <AdminSidebar
        hotelCode={hotelCode}
        pendingCount={pendingCount}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-h-screen md:h-screen min-w-0">
        <Header
          title="Real-Time Dashboard"
          subtitle={`${activeSOS.length} Active Emergencies`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="w-full flex flex-col gap-5">


            {/* ── Stat Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { label: 'Total Incidents', value: todayStatsObj.totalIncidents, icon: 'warning', colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400' },
                { label: 'Resolved', value: todayStatsObj.resolvedCount, icon: 'check_circle', colorClass: 'text-green-500 bg-green-100 dark:bg-green-500/10 dark:text-green-400' },
                { label: 'Avg Response', value: todayStatsObj.avgResponseTime, icon: 'timer', colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400' },
                { label: 'Pending Approvals', value: todayStatsObj.pendingApprovals, icon: 'group_add', colorClass: 'text-amber-500 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-surface-container-low p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex items-center gap-4 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.colorClass}`}>
                    <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main grid: Live Map + Active Alerts ───────────── */}
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Live Facility Map */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white dark:bg-surface-container-low rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50 dark:bg-surface-container-highest transition-colors">
                    <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-blue-500 dark:text-blue-400">grid_on</span>
                      Live Facility Map
                    </h2>
                    <span className="text-xs font-bold px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full tracking-wide transition-colors">
                      System Online
                    </span>
                  </div>
                  <div className="p-4 lg:p-6 overflow-x-auto flex flex-col items-center justify-center">
                    <div className="w-full max-w-4xl">
                      <RoomGrid floorLayout={hotel?.hotelConfig?.floorLayout || {}} activeSOS={activeSOS} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Alerts / Chat */}
              <div className="flex flex-col gap-6 lg:h-[calc(100vh-220px)]">
                {openChatId ? (
                  <div className="flex-1 flex flex-col min-h-0 relative z-20 shadow-2xl rounded-xl">
                    <button
                      onClick={() => setOpenChatId(null)}
                      className="absolute right-3 top-3 z-30 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white/80 dark:bg-surface-container-highest/80 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <ChatWindow
                      channelId={openChatId}
                      currentUser={currentUser}
                      userProfile={userProfile}
                      title={`Emergency Chat`}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-container-low rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-surface-container-highest flex items-center gap-2 shrink-0 transition-colors">
                      <span className="material-symbols-outlined text-red-500">emergency</span>
                      <h2 className="font-bold text-slate-800 dark:text-white transition-colors">Active Alerts</h2>
                      <span className="ml-auto bg-slate-200 dark:bg-surface-bright text-slate-700 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full transition-colors">{activeSOS.length}</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 dark:bg-surface/50 transition-colors">
                      {activeSOS.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
                          <span className="material-symbols-outlined text-5xl mb-3 opacity-30">check_circle</span>
                          <p className="font-medium text-sm">All clear.</p>
                          <p className="text-xs">No active emergencies.</p>
                        </div>
                      ) : (
                        activeSOS.map(sos => (
                          <IncidentCard
                            key={sos.incidentId}
                            sosData={sos}
                            onViewChat={setOpenChatId}
                            onMarkResolved={handleResolve}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AdminAIChatbot
        hotel={hotel}
        activeSOS={activeSOSMap}
        staffList={staffList}
        todayStats={todayStatsObj}
        currentUser={currentUser}
      />
    </div>
  )
}
