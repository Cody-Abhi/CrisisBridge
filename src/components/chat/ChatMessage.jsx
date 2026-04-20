// src/components/chat/ChatMessage.jsx
// Single message bubble — handles text, system messages, own vs others

import { formatTime } from '../../utils/timeHelpers'

const ROLE_COLORS = {
  guest: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  staff: 'bg-teal-100   text-teal-800   dark:bg-teal-900/40   dark:text-teal-300',
  admin: 'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300',
}

export default function ChatMessage({ message, isOwn, darkMode }) {
  // System messages — centered pill
  if (message.type === 'system_message') {
    return (
      <div className="flex justify-center my-2">
        <span className={`text-[10px] font-medium px-3 py-1 rounded-full italic
          ${darkMode
            ? 'bg-white/5 text-slate-500 border border-white/10'
            : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}
        >
          {message.message}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[76%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Role badge + sender name */}
        <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
            ${ROLE_COLORS[message.senderRole] || (darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
            {message.senderRole}
          </span>
          <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {message.senderName}
          </span>
        </div>

        {/* Message bubble */}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all
          ${isOwn
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : darkMode
              ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'
              : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
          }`}>
          {message.message}
        </div>

        {/* Timestamp */}
        <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity
          ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
