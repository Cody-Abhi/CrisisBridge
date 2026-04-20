// src/components/admin/ai/AdminAIChatbot.jsx
// Gemini-powered floating AI assistant for hotel admins
// Monitors live SOS data and proactively alerts when action is needed

import { useState, useEffect, useRef } from 'react'
import { buildAdminContext } from './buildAdminContext'
import { callGeminiAdmin }   from './callGeminiAdmin'
import { useTheme }          from '../../../contexts/ThemeContext'

// ── Quick-action chips ──────────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: '📊 Status now',      prompt: 'Give me a brief 3-sentence status of the hotel right now.' },
  { label: '👷 Free staff',      prompt: 'Which staff members are currently on duty and free to respond?' },
  { label: '🚨 Unassigned SOS',  prompt: 'Are there any active emergencies with no staff assigned yet?' },
  { label: '📋 Today summary',   prompt: 'Give me a summary of all incidents and activity today.' },
  { label: '✅ Approve staff?',  prompt: 'Should I approve any pending staff requests? Give your recommendation.' },
]

export default function AdminAIChatbot({
  hotel,
  activeSOS,
  staffList,
  todayStats,
  currentUser,
}) {
  const { darkMode } = useTheme()

  // ── State ───────────────────────────────────────────────────────────────
  const [isOpen,           setIsOpen]           = useState(false)
  const [messages,         setMessages]         = useState([])
  const [inputText,        setInputText]        = useState('')
  const [isLoading,        setIsLoading]        = useState(false)
  const [hasUnread,        setHasUnread]        = useState(false)
  const [unreadCount,      setUnreadCount]      = useState(0)
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0)
  const [proactiveChecked, setProactiveChecked] = useState(new Set())
  const [isAnimatingIn,    setIsAnimatingIn]    = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const hasEmergency = activeSOS && Object.keys(activeSOS).length > 0
  const activeSOSCount = activeSOS ? Object.values(activeSOS).length : 0

  // ── Auto-scroll on new messages ─────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Panel open effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setIsAnimatingIn(true)
      setTimeout(() => setIsAnimatingIn(false), 300)
      setHasUnread(false)
      setUnreadCount(0)
      if (messages.length === 0) {
        setTimeout(() => inputRef.current?.focus(), 350)
        handleSend('Give me a brief 3-sentence status of the hotel right now.', true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // ── Proactive alert: fires when unassigned SOS older than 30s ──────────
  useEffect(() => {
    if (!activeSOS || Object.keys(activeSOS).length === 0) return

    const checkProactive = async () => {
      for (const [, sos] of Object.entries(activeSOS)) {
        const ageSeconds = (Date.now() - sos.triggeredAt) / 1000
        const alertKey   = `${sos.incidentId}_unassigned`

        if (
          !sos.assignedStaffId        &&
          ageSeconds > 30             &&
          !proactiveChecked.has(alertKey) &&
          !isLoading
        ) {
          setProactiveChecked(prev => new Set([...prev, alertKey]))

          try {
            const ctx    = buildAdminContext(hotel, activeSOS, staffList, todayStats)
            const prompt = `URGENT: Room ${sos.roomNumber} has a ${sos.emergencyType} SOS that has been unassigned for ${Math.floor(ageSeconds)} seconds. What should I do right now?`
            const reply  = await callGeminiAdmin(prompt, ctx, messages)

            const proactiveMsg = {
              id:          Date.now(),
              sender:      'ai',
              text:        reply,
              timestamp:   Date.now(),
              isProactive: true,
            }
            setMessages(prev => [...prev, proactiveMsg])

            if (!isOpen) {
              setHasUnread(true)
              setUnreadCount(prev => prev + 1)
            }
          } catch (err) {
            console.error('Proactive alert error:', err)
          }
        }
      }
    }

    const timeout = setTimeout(checkProactive, 1200)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSOS])

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = async (textOverride = null, silent = false) => {
    const text = (textOverride || inputText).trim()
    if (!text || isLoading) return

    setInputText('')

    if (!silent) {
      setMessages(prev => [...prev, {
        id:        Date.now(),
        sender:    'admin',
        text,
        timestamp: Date.now(),
      }])
    }

    setIsLoading(true)

    try {
      const ctx   = buildAdminContext(hotel, activeSOS, staffList, todayStats)
      const reply = await callGeminiAdmin(text, ctx, messages)

      setMessages(prev => [...prev, {
        id:          Date.now() + 1,
        sender:      'ai',
        text:        reply,
        timestamp:   Date.now(),
        isProactive: false,
      }])

    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        let countdown = 10
        setRateLimitSeconds(countdown)
        const interval = setInterval(() => {
          countdown -= 1
          setRateLimitSeconds(countdown)
          if (countdown <= 0) clearInterval(interval)
        }, 1000)
        setMessages(prev => [...prev, {
          id:        Date.now() + 1,
          sender:    'ai',
          text:      'Too many requests. Please wait 10 seconds before asking again.',
          timestamp: Date.now(),
          isError:   true,
        }])
      } else {
        setMessages(prev => [...prev, {
          id:        Date.now() + 1,
          sender:    'ai',
          text:      'Could not reach AI right now. Your live hotel data is still active. Try again in a moment.',
          timestamp: Date.now(),
          isError:   true,
        }])
      }
    }

    setIsLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 right-2 left-2 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col items-end select-none pointer-events-none">

      {/* ── CHAT PANEL ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`mb-4 w-full sm:w-[340px] max-w-[calc(100vw-1rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border pointer-events-auto
            transition-all duration-300
            ${isAnimatingIn ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
            ${darkMode
              ? 'bg-[#0A0E1A] border-white/8 shadow-black/60'
              : 'bg-white border-slate-200 shadow-slate-400/20'
            }`}
          style={{ height: 'min(540px, 72vh)' }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0
            ${darkMode ? 'bg-[#0D1117] border-white/8' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex items-center gap-2.5">
              {/* Gemini G */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg
                ${hasEmergency ? 'bg-red-600 animate-pulse shadow-red-600/40' : 'bg-blue-600 shadow-blue-600/40'}`}>
                <span className="text-white font-black text-base">G</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Admin AI Assistant</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-slate-400 text-[10px]">Powered by Gemini 1.5 Flash</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMessages([])}
                title="Clear history"
                className="text-slate-500 hover:text-slate-300 text-sm transition"
              >
                🗑
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-light leading-none transition"
              >
                ×
              </button>
            </div>
          </div>

          {/* Emergency banner */}
          {hasEmergency && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border-b border-red-500/20 shrink-0">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-red-400 text-xs font-semibold">
                {activeSOSCount} active emergency{activeSOSCount > 1 ? 'ies' : ''} — ask me what to do
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <span className="text-blue-500 font-black text-2xl">G</span>
                </div>
                <p className={`text-sm text-center leading-relaxed
                  ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ask me anything about your hotel operations, active emergencies, or staff status.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} group`}
              >
                {/* AI avatar */}
                {msg.sender === 'ai' && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0 shadow
                    ${msg.isProactive ? 'bg-amber-500' : msg.isError ? 'bg-red-500' : 'bg-blue-600'}`}>
                    <span className="text-white font-black text-xs">
                      {msg.isProactive ? '⚡' : 'G'}
                    </span>
                  </div>
                )}

                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                  {msg.isProactive && (
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider px-1">
                      ⚡ Proactive Alert
                    </span>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${msg.sender === 'admin'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : msg.isProactive
                        ? darkMode
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tl-sm'
                          : 'bg-amber-50 border-l-4 border-amber-500 text-slate-800 rounded-tl-sm'
                        : msg.isError
                          ? darkMode
                            ? 'bg-red-500/10 border border-red-500/30 text-red-300 rounded-tl-sm'
                            : 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm'
                          : darkMode
                            ? 'bg-white/[0.06] border border-white/8 text-slate-200 rounded-tl-sm'
                            : 'bg-blue-50 text-slate-800 rounded-tl-sm'
                    }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity
                    ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mr-2 shrink-0">
                  <span className="text-white font-black text-xs">G</span>
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm
                  ${darkMode ? 'bg-white/[0.06] border border-white/8' : 'bg-blue-50'}`}>
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div className={`px-3 pt-2 pb-1.5 flex gap-1.5 flex-wrap shrink-0 border-t
            ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleSend(chip.prompt)}
                disabled={isLoading || rateLimitSeconds > 0}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${darkMode
                    ? 'border-white/15 text-slate-300 hover:bg-white/10'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600'
                  }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className={`flex gap-2 items-center p-3 border-t shrink-0
            ${darkMode ? 'border-white/5 bg-[#0D1117]' : 'border-slate-200 bg-white'}`}>
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                rateLimitSeconds > 0
                  ? `Wait ${rateLimitSeconds}s...`
                  : 'Ask about your hotel...'
              }
              disabled={isLoading || rateLimitSeconds > 0}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm border transition
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                disabled:opacity-50 disabled:cursor-not-allowed
                ${darkMode
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim() || rateLimitSeconds > 0}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg
                transition-all active:scale-90 disabled:cursor-not-allowed shrink-0
                ${inputText.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : darkMode
                    ? 'bg-white/5 text-slate-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
            >
              ↑
            </button>
          </div>

          {/* Privacy note */}
          <p className={`text-center text-[10px] pb-2 px-3
            ${darkMode ? 'text-slate-700' : 'text-slate-400'}`}>
            Data is not stored · Powered by Google Gemini
          </p>
        </div>
      )}

      {/* ── FLOATING BUBBLE ──────────────────────────────────────────────── */}
      <div className="relative pointer-events-auto">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          title="Admin AI Assistant"
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
            shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95
            ${hasEmergency
              ? 'bg-red-600 shadow-red-600/50 animate-pulse'
              : 'bg-blue-600 shadow-blue-600/40'
            }`}
        >
          {isOpen
            ? <span className="text-white text-xl sm:text-2xl font-light leading-none">×</span>
            : <span className="text-white font-black text-lg sm:text-xl">G</span>
          }
        </button>

        {/* Unread badge */}
        {!isOpen && hasUnread && unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
            flex items-center justify-center border-2 border-white animate-bounce">
            <span className="text-white text-[10px] font-black leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}

        {/* Tooltip when proactive alert waiting */}
        {!isOpen && hasEmergency && hasUnread && (
          <div className="absolute bottom-full right-0 mb-3 bg-slate-900 text-white
            text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl animate-bounce
            border border-white/10">
            ⚡ Emergency needs attention — tap me
            <div className="absolute bottom-0 right-5 translate-y-full
              border-4 border-transparent border-t-slate-900" />
          </div>
        )}
      </div>
    </div>
  )
}

