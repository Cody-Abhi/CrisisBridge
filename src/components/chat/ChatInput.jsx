// src/components/chat/ChatInput.jsx
// Message input bar with emoji support and Enter-to-send

import { useState, useRef } from 'react'

export default function ChatInput({ onSend, darkMode, placeholder = 'Type a message...' }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(e)
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`flex gap-2 items-end p-3 border-t
        ${darkMode ? 'border-white/5 bg-[#0A0E1A]' : 'border-slate-200 bg-white'}`}
    >
      <div className={`flex-1 flex items-center rounded-2xl px-4 py-2 border transition-all
        focus-within:ring-2 focus-within:ring-indigo-500/50
        ${darkMode
          ? 'bg-white/[0.04] border-white/10'
          : 'bg-slate-50 border-slate-200'
        }`}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{ resize: 'none', minHeight: '24px', maxHeight: '96px' }}
          className={`flex-1 bg-transparent border-none text-sm focus:outline-none
            leading-relaxed placeholder:opacity-50
            ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
        />
      </div>

      <button
        type="submit"
        disabled={!text.trim()}
        className={`w-10 h-10 rounded-full flex items-center justify-center
          font-bold text-lg transition-all active:scale-95
          ${text.trim()
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
            : darkMode
              ? 'bg-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
      >
        ↑
      </button>
    </form>
  )
}
