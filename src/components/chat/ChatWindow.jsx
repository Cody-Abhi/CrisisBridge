// src/components/chat/ChatWindow.jsx
// Reusable real-time chat component — shared by incident chats and staff group chat
// Works with Firebase Realtime Database

import { useState, useEffect, useRef } from 'react'
import { ref, onValue, push, set, off } from 'firebase/database'
import { rtdb } from '../../firebase/config'
import ChatMessage from './ChatMessage'
import ChatInput   from './ChatInput'

/**
 * Props:
 *   channelId      — incidentId or "staff_{hotelCode}"
 *   currentUser    — Firebase Auth user
 *   userProfile    — Firestore user document
 *   title          — Chat panel title string
 *   isReadOnly     — true when incident is resolved
 *   darkMode       — boolean from ThemeContext
 *   onClose        — optional close handler
 *   height         — optional CSS height string (default: "100%")
 */
export default function ChatWindow({
  channelId,
  currentUser,
  userProfile,
  title = 'Chat',
  isReadOnly = false,
  darkMode = false,
  onClose,
  height = '100%',
}) {
  const [messages, setMessages] = useState([])
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef(null)

  // ── Subscribe to Realtime DB channel ─────────────────────────────────────
  useEffect(() => {
    if (!channelId) return
    const chatRef = ref(rtdb, `chats/${channelId}`)
    const unsub = onValue(chatRef, (snapshot) => {
      const raw  = snapshot.val() || {}
      const msgs = Object.values(raw).sort((a, b) => a.timestamp - b.timestamp)
      setMessages(msgs)
    })
    return () => off(chatRef)
  }, [channelId])

  // ── Auto-scroll on new messages ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send a text message ───────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || !channelId || isReadOnly) return
    setSending(true)
    try {
      const chatRef = ref(rtdb, `chats/${channelId}`)
      const newMsg  = push(chatRef)
      await set(newMsg, {
        messageId:  newMsg.key,
        senderId:   currentUser.uid,
        senderName: userProfile.name,
        senderRole: userProfile.role,
        message:    text.trim(),
        timestamp:  Date.now(),
        type:       'text',
      })
    } catch (err) {
      console.error('ChatWindow send error:', err)
    }
    setSending(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border
        ${darkMode
          ? 'bg-[#0A0E1A] border-white/8'
          : 'bg-white border-slate-200'
        }`}
      style={{ height }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0
        ${darkMode
          ? 'bg-[#0D1117] border-white/8'
          : 'bg-slate-800 border-slate-700'
        }`}
      >
        <div>
          <h3 className="text-white font-bold text-sm truncate">{title}</h3>
          {isReadOnly && (
            <p className="text-slate-400 text-xs mt-0.5">
              Incident resolved — read only
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isReadOnly ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`} />
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl font-light leading-none transition"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
              ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              💬
            </div>
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.messageId || `${msg.senderId}-${msg.timestamp}`}
              message={msg}
              isOwn={msg.senderId === currentUser?.uid}
              darkMode={darkMode}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar (hidden if read-only) */}
      {!isReadOnly && (
        <ChatInput
          onSend={sendMessage}
          darkMode={darkMode}
          placeholder={sending ? 'Sending...' : 'Type a message...'}
        />
      )}
    </div>
  )
}
