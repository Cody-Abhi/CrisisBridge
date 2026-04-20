import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { getEmergency } from '../../utils/emergencyHelpers'
import Header from '../../components/layout/Header'

const toDate = (ts) => {
  if (!ts) return null
  if (typeof ts.toDate === 'function') return ts.toDate()
  if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000)
  if (typeof ts === 'number') return new Date(ts)

  const parsed = new Date(ts)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getEmergencyType = (incident) =>
  incident.emergency?.type || incident.emergencyType || incident.type?.toLowerCase?.() || 'common'

const getTriggeredAt = (incident) =>
  incident.emergency?.triggeredAt || incident.triggeredAt || incident.createdAt || null

const getResolvedAt = (incident) =>
  incident.response?.resolvedAt || incident.resolvedAt || null

const getGuestName = (incident) =>
  incident.guest?.name || incident.guestName || '-'

const getResolutionNotes = (incident) =>
  incident.response?.resolutionNotes || incident.resolutionNotes || '-'

const getResolvedBy = (incident) =>
  incident.response?.resolvedByName ||
  incident.response?.assignedStaffName ||
  incident.resolvedByName ||
  incident.resolvedBy ||
  'Admin'

export default function IncidentHistory() {
  const { userProfile } = useAuth()
  const hotelCode = userProfile?.adminProfile?.hotelCode

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!hotelCode) return

    const q = query(
      collection(db, 'incidents'),
      where('hotelCode', '==', hotelCode),
      where('status', '==', 'resolved'),
      orderBy('response.resolvedAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error('Incident history listener error:', err)
      setLoading(false)
    })

    return () => unsub()
  }, [hotelCode])

  const getDuration = (start, end) => {
    const startDate = toDate(start)
    const endDate = toDate(end)

    if (!startDate || !endDate) return '-'

    const mins = Math.round((endDate - startDate) / 60000)
    return `${mins} mins`
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-surface flex transition-colors duration-300">
      <AdminSidebar
        hotelCode={hotelCode}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-h-screen md:h-screen min-w-0">
        <Header
          title="Incident Log"
          subtitle="Historical record of all resolved emergencies."
          showNotifications={false}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="w-full space-y-6">
            {!hotelCode ? (
              <section className="bg-white dark:bg-surface-container-low rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-8 text-center text-slate-500 dark:text-slate-400 transition-colors">
                No hotel registered yet.
              </section>
            ) : loading ? (
              <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
              </div>
            ) : (
              <section className="bg-white dark:bg-surface-container-low rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-surface-container-highest text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50 transition-colors">
                        <th className="p-4 font-bold">Date & Time</th>
                        <th className="p-4 font-bold">Type</th>
                        <th className="p-4 font-bold">Room</th>
                        <th className="p-4 font-bold">Details</th>
                        <th className="p-4 font-bold">Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-sm">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-500 italic transition-colors">
                            No historical records found.
                          </td>
                        </tr>
                      ) : history.map((incident) => {
                        const emergency = getEmergency(getEmergencyType(incident))
                        const triggeredAt = getTriggeredAt(incident)
                        const resolvedAt = getResolvedAt(incident)
                        const triggeredDate = toDate(triggeredAt)
                        const resolutionNotes = getResolutionNotes(incident)

                        return (
                          <tr key={incident.id} className="hover:bg-slate-50/50 dark:hover:bg-surface-bright/50 transition-colors">
                            <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                              {triggeredDate ? triggeredDate.toLocaleDateString() : '-'} <br />
                              <span className="text-xs">
                                {triggeredDate ? triggeredDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{emergency?.icon}</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{emergency?.label}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-800 dark:text-white text-base">
                              {incident.roomNumber || incident.guest?.roomNumber || '-'}
                            </td>
                            <td className="p-4">
                              <p className="text-slate-700 dark:text-slate-300 font-semibold">{getGuestName(incident)}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Duration: {getDuration(triggeredAt, resolvedAt)}
                              </p>
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="text-slate-800 dark:text-slate-300 line-clamp-2" title={resolutionNotes}>
                                {resolutionNotes}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mt-1">
                                By {getResolvedBy(incident)}
                              </p>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
