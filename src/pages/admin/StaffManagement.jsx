import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/timeHelpers'
import Header from '../../components/layout/Header'

const DESIGNATION_COLORS = {
  fire_safety: { bg: 'bg-red-500/10 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
  medical: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  security: { bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  maintenance: { bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  general: { bg: 'bg-purple-500/10 dark:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
}

export default function StaffManagement() {
  const { currentUser, userProfile } = useAuth()
  const hotelCode = userProfile?.adminProfile?.hotelCode

  const [pendingRequests, setPendingRequests] = useState([])
  const [activeStaff, setActiveStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!hotelCode) return

    const qPending = query(
      collection(db, 'staff_requests'),
      where('hotelCode', '==', hotelCode),
      where('status', '==', 'pending')
    )
    const unsubPending = onSnapshot(qPending, (snap) => {
      setPendingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    const qActive = query(
      collection(db, 'users'),
      where('role', '==', 'staff'),
      where('staffProfile.hotelCode', '==', hotelCode),
      where('staffProfile.isApproved', '==', true)
    )
    const unsubActive = onSnapshot(qActive, (snap) => {
      setActiveStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return () => {
      unsubPending()
      unsubActive()
    }
  }, [hotelCode])

  const handleApprove = async (req) => {
    const staffUid = req.staffId || req.id // Fallback in case staffId field is missing
    console.log('--- Approval Diagnostics ---')
    console.log('Target Staff UID:', staffUid)
    console.log('Current Admin UID:', currentUser?.uid)
    console.log('Admin Role from Profile:', userProfile?.role)
    console.log('Admin Hotel Code:', hotelCode)
    
    try {
      const staffDocRef = doc(db, 'users', staffUid)
      const staffDocSnap = await getDoc(staffDocRef)
      
      if (!staffDocSnap.exists()) {
        console.error('CRITICAL ERROR: Staff user profile document does not exist at path: users/' + staffUid)
        toast.error('User profile not found in database. Approval cannot proceed.')
        return
      }

      await updateDoc(staffDocRef, {
        'staffProfile.isApproved': true,
        'staffProfile.approvedBy': currentUser.uid,
        'staffProfile.approvedAt': serverTimestamp(),
      })
      await updateDoc(doc(db, 'staff_requests', req.id), {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
      })
      toast.success(`${req.staffName} approved.`)
    } catch (err) {
      console.error('Approval failed:', err)
      toast.error(`Approval failed: ${err.message || 'Unknown error'}`)
    }
  }

  const handleReject = async (req) => {
    const staffUid = req.staffId || req.id
    console.log('--- Rejection Diagnostics ---')
    console.log('Target Staff UID:', staffUid)
    console.log('Current Admin UID:', currentUser?.uid)
    console.log('Admin Role:', userProfile?.role)

    try {
      const staffDocRef = doc(db, 'users', staffUid)
      const staffDocSnap = await getDoc(staffDocRef)

      if (!staffDocSnap.exists()) {
        console.error('CRITICAL ERROR: Staff user profile document does not exist at path: users/' + staffUid)
        toast.error('User profile not found in database. Rejection cannot proceed.')
        return
      }

      await updateDoc(staffDocRef, {
        'staffProfile.isApproved': false,
        'staffProfile.approvedBy': null,
        'staffProfile.approvedAt': null,
        'staffProfile.rejectedAt': serverTimestamp(),
      })
      await updateDoc(doc(db, 'staff_requests', req.id), {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
      })
      toast.error(`${req.staffName} rejected.`)
    } catch (err) {
      console.error('Rejection failed:', err)
      toast.error(`Rejection failed: ${err.message || 'Unknown error'}`)
    }
  }

  const handleRemove = async (staffUid) => {
    if (!confirm("Are you sure you want to revoke this staff member's access?")) return

    try {
      await updateDoc(doc(db, 'users', staffUid), {
        'staffProfile.isApproved': false,
        'staffProfile.revokedAt': serverTimestamp(),
      })
      await updateDoc(doc(db, 'staff_requests', staffUid), {
        status: 'revoked',
        revokedAt: serverTimestamp(),
      })
      toast.success('Access revoked.')
    } catch (err) {
      console.error('Action failed:', err)
      toast.error(`Action failed: ${err.message || 'Unknown error'}`)
    }
  }

  const DesignationBadge = ({ designation }) => {
    const colors = DESIGNATION_COLORS[designation] || {
      bg: 'bg-slate-100 dark:bg-white/10',
      text: 'text-slate-500 dark:text-slate-400',
      border: 'border-slate-200 dark:border-white/10',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
        {designation?.replace(/_/g, ' ') || '-'}
      </span>
    )
  }

  if (!hotelCode) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
        <AdminSidebar
          hotelCode={hotelCode}
          pendingCount={pendingRequests.length}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 flex items-center justify-center p-6 text-slate-500 dark:text-slate-400">
          No hotel registered yet.
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-black">
        <div className="w-10 h-10 border-4 border-slate-900/10 border-t-slate-900 dark:border-white/10 dark:border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <AdminSidebar
        hotelCode={hotelCode}
        pendingCount={pendingRequests.length}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="Staff Management"
          subtitle="Manage authorizations and facility personnel"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-12 pb-24">
            {pendingRequests.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/20" />
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">Awaiting Approval</h2>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-black px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                    {pendingRequests.length} PENDING
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="glass rounded-[2rem] p-6 border border-slate-200/50 dark:border-white/5 transition-all hover:border-amber-500/30">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-2xl">person_pin</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{req.staffName}</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[150px]">{req.staffEmail}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        <DesignationBadge designation={req.designation} />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-50 dark:bg-white/5 rounded-full">
                          {formatDate(req.requestedAt)}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(req)}
                          className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:opacity-90 transition-opacity"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  Active Staff Registry
                  <span className="text-[10px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-black">
                    {activeStaff.length} TOTAL
                  </span>
                </h2>
              </div>

              <div className="glass rounded-[2rem] overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50 dark:border-white/5">Staff Member</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50 dark:border-white/5">Designation</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50 dark:border-white/5">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50 dark:border-white/5">Active Incident</th>
                        <th className="px-6 py-4 border-b border-slate-200/50 dark:border-white/5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                      {activeStaff.length > 0 ? activeStaff.map((staff) => (
                        <tr key={staff.id} className="group hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm">
                                {staff.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white leading-none">{staff.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">{staff.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <DesignationBadge designation={staff.staffProfile?.designation} />
                          </td>

                          <td className="px-6 py-5">
                            {staff.staffProfile?.isOnDuty ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                On Duty
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 opacity-60">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Idle
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            {(staff.staffProfile?.activeIncidents || []).length > 0 ? (
                              <div className="inline-flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                  Handling {(staff.staffProfile?.activeIncidents || []).length} incident{(staff.staffProfile?.activeIncidents || []).length > 1 ? 's' : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                  #{String(staff.staffProfile.activeIncidents[0]).slice(-6).toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">-</span>
                            )}
                          </td>

                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => handleRemove(staff.id)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Revoke Access"
                            >
                              <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm font-bold italic">
                            No active personnel found for this facility.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
