// src/components/ai/GeminiChatbot.jsx
// Floating AI chatbot — calls real Gemini 1.5 Flash API
// Auto-opens with emergency context when SOS is active

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const AUTO_MESSAGES = {
  fire: '🔥 FIRE ALERT: Stay low. Do NOT use elevators. Move to the nearest staircase exit. If the door handle is hot, do not open it. Help is on the way.',
  medical: '⚕️ MEDICAL ALERT: Stay calm. Sit or lie down. Do not move if injured. Help has been alerted. Is the person conscious and breathing?',
  security: '🛡️ SECURITY ALERT: Lock your door. Move away from windows. Do not confront anyone. Security personnel are en route.',
  common: '🆘 EMERGENCY ALERT: Stay in place. Help has been dispatched. Please describe what is happening so I can guide you.',
}

export default function GuestGeminiChatbot({ emergencyContext }) {
  const { darkMode } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto-open when emergency starts
  useEffect(() => {
    if (emergencyContext?.type && messages.length === 0) {
      setMessages([{ role: 'bot', text: AUTO_MESSAGES[emergencyContext.type] }])
      setIsOpen(true)
    }
    if (!emergencyContext) {
      setMessages([])
    }
  }, [emergencyContext])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const systemInstruction = {
      role: 'system',
      parts: [{ text: `You are a hotel safety assistant in Crisis Bridge, a real-time emergency response platform.
Give calm, clear, step-by-step safety instructions. Use simple language. Always reassure that help is coming.
${emergencyContext ? `ACTIVE EMERGENCY: Guest triggered a ${emergencyContext.type} alert in room ${emergencyContext.roomNumber}. Help dispatched.` : 'No active emergency.'}
Keep responses under 80 words. Never ask for personal information.` }]
    }

    try {
      // Build strictly alternating contents
      const allMsgs = [
        ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
        { role: 'user', text: userMsg }
      ]
      
      const contents = []
      allMsgs.forEach(m => {
        if (contents.length === 0) {
          if (m.role === 'user') contents.push({ role: 'user', parts: [{ text: m.text }] })
        } else if (contents[contents.length - 1].role !== m.role) {
          contents.push({ role: m.role, parts: [{ text: m.text }] })
        }
      })

      if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
        contents.pop()
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: systemInstruction,
            contents,
            generationConfig: { 
              temperature: 0.4, 
              maxOutputTokens: 250,
              topP: 0.8,
              topK: 40
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
          })
        }
      )
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am specialized in safety guidance. How can I help you stay safe during this event?'
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
    } catch (err) {
      console.error('Chatbot Error:', err)
      setMessages(prev => [...prev, { role: 'bot', text: 'Responders are already on the way. Please stay calm, keep your phone with you, and wait for staff arrival.' }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-4 right-2 z-[100] w-[calc(100vw-1rem)] sm:w-auto sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className={`mb-4 w-full sm:w-96 max-w-[calc(100vw-1rem)] rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 ${darkMode ? 'bg-[#0B0F19]/90 border-white/10' : 'bg-white/90 border-slate-200 shadow-xl'}`}
          style={{ height: 'min(440px, 70vh)' }}>

          <div className={`px-4 py-3 flex items-center justify-between border-b ${darkMode ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-white/5' : 'bg-indigo-50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-base ${darkMode ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-100 border-indigo-200'}`}>🤖</div>
              <div>
                <p className={`font-semibold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Safety Intelligence</p>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className={`text-xl p-1 transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-xs mt-6 px-4">
                <div className="text-3xl mb-3">✨</div>
                <p>Your AI safety guide. Ask me anything about hotel emergency protocols.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm border border-indigo-500/20 shadow-lg shadow-indigo-600/20'
                    : (darkMode ? 'bg-slate-800/80 text-slate-200 rounded-bl-sm border border-white/5' : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200')
                  }`}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`px-4 py-3 rounded-2xl border ${darkMode ? 'bg-slate-800/80 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map(d => <div key={d} className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`} style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={`p-3 border-t ${darkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`flex gap-2 items-center border rounded-full px-2 py-1.5 focus-within:ring-2 ring-indigo-500/50 transition-all ${darkMode ? 'bg-[#0B0F19] border-white/10' : 'bg-white border-slate-300'}`}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask for safety advice…"
                className={`flex-1 bg-transparent border-none px-3 py-1 text-sm placeholder-slate-500 focus:outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`} />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-indigo-500 transition disabled:opacity-40 border border-indigo-400/20">↑</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)}
        className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.6)] border transition-all duration-300 hover:scale-110 active:scale-95 z-50 ${emergencyContext ? 'bg-gradient-to-tr from-red-600 to-rose-500 animate-pulse ring-4 ring-red-500/30 border-white/10' : (darkMode ? 'bg-[#151D2F] border-white/10 hover:border-indigo-500/50 text-white' : 'bg-white border-slate-200 hover:border-indigo-500/50 text-slate-800')
          }`}>
        <span className={`text-xl sm:text-2xl drop-shadow-md`}>{isOpen ? '✕' : '💬'}</span>
        {emergencyContext && !isOpen && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0B0F19] shadow-[0_0_10px_rgba(239,68,68,1)]" />
        )}
      </button>
    </div>
  )
}
