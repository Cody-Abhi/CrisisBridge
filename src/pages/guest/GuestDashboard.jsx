import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSOSListener } from '../../hooks/useSOSListener'
import { triggerSOS, resolveSOSFromGuest } from '../../services/sosService'
import { sendMessage, subscribeToChat } from '../../services/chatService'
import { checkOutGuest } from '../../services/hotelService'
import { getHotelDoc } from '../../firebase/firestore'

import GuestSidebar from '../../components/guest/GuestSidebar'
import SOSButton from '../../components/sos/SOSButton'
import GuestGeminiChatbot from '../../components/guest/GuestGeminiChatbot'
import Header from '../../components/layout/Header'

export default function GuestDashboard() {
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const { currentUser, userProfile, refreshProfile } = useAuth()

  const hotelCode = userProfile?.guestProfile?.currentHotelCode
  const roomNumber = userProfile?.guestProfile?.currentRoomNumber

  const { activeSOS, incidentId } = useSOSListener(hotelCode, roomNumber)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hotelData, setHotelData] = useState(null)
  const [emergencyContext, setEmergencyContext] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sosLoading, setSosLoading] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!hotelCode) {
      return
    }

    getHotelDoc(hotelCode).then((snap) => {
      if (snap.exists()) {
        setHotelData(snap.data())
      }
    })
  }, [hotelCode])

  useEffect(() => {
    if (userProfile && !userProfile.guestProfile?.isCurrentlyStaying) {
      navigate('/guest/mode-select', { replace: true })
    }
  }, [navigate, userProfile])

  useEffect(() => {
    if (activeSOS && !emergencyContext) {
      setEmergencyContext({
        type: activeSOS.emergencyType,
        roomNumber: activeSOS.roomNumber,
        guestName: userProfile?.name,
      })
    }

    if (!activeSOS && emergencyContext) {
      toast.success('Emergency resolved. Thank you for your patience.', { duration: 6000 })
      setEmergencyContext(null)
      setShowChat(false)
    }

    if (activeSOS?.status === 'assigned' && activeSOS?.assignedStaffName) {
      toast.success(`${activeSOS.assignedStaffName} is on the way!`, {
        duration: 5000,
        id: 'staff-assigned',
      })
    }
  }, [activeSOS, emergencyContext, userProfile?.name])

  useEffect(() => {
    if (!incidentId) {
      return undefined
    }

    const unsubscribe = subscribeToChat(incidentId, setChatMessages)
    return unsubscribe
  }, [incidentId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleTriggerSOS = async (emergencyType) => {
    if (activeSOS) {
      return
    }

    setSosLoading(true)

    try {
      await triggerSOS(currentUser, userProfile, emergencyType)
      setShowChat(true)
      toast.success('SOS sent! Help is being dispatched immediately.', { duration: 8000 })
    } catch (error) {
      console.error(error)
      toast.error('SOS failed. Check your connection and try again.')
    } finally {
      setSosLoading(false)
    }
  }

  const handleStopSOS = async () => {
    if (!window.confirm('Cancel the emergency SOS?')) {
      return
    }

    setSosLoading(true)

    try {
      await resolveSOSFromGuest(hotelCode, roomNumber, incidentId, currentUser.uid)
      toast.success('SOS canceled successfully.')
    } catch (error) {
      console.error(error)
      toast.error('Failed to cancel SOS. Please try again.')
    } finally {
      setSosLoading(false)
    }
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || !incidentId) {
      return
    }

    try {
      await sendMessage(
        incidentId,
        {
          uid: currentUser.uid,
          name: userProfile.name,
          role: 'guest',
        },
        chatInput.trim()
      )

      setChatInput('')
    } catch {
      toast.error('Message failed to send.')
    }
  }

  const handleCheckOut = async () => {
    if (!window.confirm('Check out and remove emergency access?')) {
      return
    }

    try {
      await checkOutGuest(currentUser.uid)
      await refreshProfile()
      navigate('/guest/mode-select')
      toast.success('Checked out. Stay safe!')
    } catch {
      toast.error('Check-out failed.')
    }
  }

  return (
    <div className={`flex min-h-screen overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-surface text-on-surface' : 'bg-slate-50 text-slate-800'}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <GuestSidebar
        hotelData={hotelData}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCheckOut={handleCheckOut}
      />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden md:h-screen">
        <Header
          title="Emergency Dashboard"
          subtitle={`Room ${roomNumber} • ${hotelData?.hotelName || 'Crisis Bridge'}`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className={`relative z-0 flex-1 overflow-y-auto p-4 md:p-8 ${activeSOS ? '' : 'flex items-center justify-center'}`}>
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {activeSOS ? (
              <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[150px] animate-pulse" />
            ) : (
              <>
                <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
              </>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8">
            {activeSOS && (
              <div className="relative w-full overflow-hidden rounded-[2rem] border border-red-500/30 bg-surface-container-high/80 p-6 shadow-[0_0_60px_rgba(239,68,68,0.15)] backdrop-blur-2xl dark:bg-[#130E14]/80 sm:p-8">
                <div
                  className="absolute left-0 top-0 h-1.5 w-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg,#ef4444,#ef4444 10px,#b91c1c 10px,#b91c1c 20px)',
                  }}
                />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-red-500/50 bg-red-600/20 text-4xl shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse">
                    🚨
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="mb-1 flex items-center justify-center gap-3 text-2xl font-black uppercase text-red-500 md:justify-start md:text-3xl">
                      {activeSOS.emergencyType} emergency
                      <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                    </h2>

                    <p className="mb-5 text-lg font-medium text-slate-300">
                      Dispatch to <span className="font-bold text-white">Room {roomNumber}</span> in progress
                    </p>

                    {activeSOS.status === 'assigned' ? (
                      <div className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 font-bold text-emerald-400 md:justify-start">
                        <span className="text-2xl">✓</span>
                        {activeSOS.assignedStaffName} has accepted and is en route!
                      </div>
                    ) : (
                      <div className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-bold text-red-400 md:justify-start">
                        <span className="h-5 w-5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                        Locating nearest responder...
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => setShowChat((value) => !value)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-white transition-all hover:bg-white/10"
                      >
                        💬 {showChat ? 'Hide Chat' : 'Open Comm Link'}
                      </button>

                      <button
                        onClick={handleStopSOS}
                        disabled={sosLoading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400 bg-red-500 px-5 py-3.5 font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all hover:bg-red-400 disabled:opacity-50"
                      >
                        ⏹ {sosLoading ? 'Stopping...' : 'Stop SOS'}
                      </button>
                    </div>

                    <p className="mt-5 inline-block rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-400">
                      DO NOT LEAVE THE ROOM UNLESS DIRECTED
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showChat && incidentId && (
              <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 border-b border-white/5 bg-gradient-to-r from-slate-800/60 to-slate-900/60 px-6 py-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                  <h3 className="font-bold tracking-wide text-white">Emergency Communication Channel</h3>
                  <span className="ml-auto font-mono text-[10px] tracking-widest text-slate-500">
                    {incidentId.slice(-8).toUpperCase()}
                  </span>
                </div>

                <div className="h-64 space-y-3 overflow-y-auto p-5">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.senderRole === 'guest' ? 'justify-end' : 'justify-start'} ${message.type === 'system_message' ? 'justify-center' : ''}`}
                    >
                      {message.type === 'system_message' ? (
                        <span className="rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[11px] text-slate-500">
                          {message.message}
                        </span>
                      ) : (
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          message.senderRole === 'guest'
                            ? 'rounded-br-sm bg-indigo-600 text-white'
                            : 'rounded-bl-sm border border-white/5 bg-slate-800/80 text-slate-200'
                        }`}>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {message.senderName}
                          </p>
                          {message.message}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2 border-t border-white/5 p-4">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSendChat()
                      }
                    }}
                    placeholder="Type a message to staff..."
                    className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />

                  <button
                    onClick={handleSendChat}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-600 text-white shadow-md transition hover:bg-indigo-500"
                  >
                    ↑
                  </button>
                </div>
              </div>
            )}

            <div className={`w-full transition-all duration-700 ${activeSOS ? 'pointer-events-none scale-[0.98] opacity-20 blur-sm' : 'opacity-100'}`}>
              <div className="mb-16 text-center">
                <div className="mb-6 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  SafeGuard Grid • Online
                </div>

                <h1 className="mb-4 text-5xl font-black tracking-tighter text-white md:text-6xl">
                  Require Assistance?
                </h1>

                <p className="text-lg font-medium text-slate-400">
                  Hold any module for 2 seconds to dispatch immediate support.
                </p>
              </div>

              <div className="relative mb-16 flex justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-600/10 blur-[80px]" />
                <SOSButton
                  type="common"
                  size="large"
                  disabled={Boolean(activeSOS) || sosLoading}
                  onTrigger={handleTriggerSOS}
                />
              </div>

              <div className="mx-auto flex w-full max-w-2xl flex-wrap justify-center gap-6 rounded-[3rem] border border-white/5 bg-[#0B0F19]/40 p-6 shadow-2xl backdrop-blur-2xl sm:gap-8 sm:p-8">
                <SOSButton
                  type="fire"
                  disabled={Boolean(activeSOS) || sosLoading}
                  onTrigger={handleTriggerSOS}
                />
                <SOSButton
                  type="medical"
                  disabled={Boolean(activeSOS) || sosLoading}
                  onTrigger={handleTriggerSOS}
                />
                <SOSButton
                  type="security"
                  disabled={Boolean(activeSOS) || sosLoading}
                  onTrigger={handleTriggerSOS}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <GuestGeminiChatbot emergencyContext={emergencyContext} />
    </div>
  )
}
