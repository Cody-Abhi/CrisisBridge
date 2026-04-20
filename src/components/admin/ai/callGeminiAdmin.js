// src/components/admin/ai/callGeminiAdmin.js
// Makes the Gemini 1.5 Flash API call for the Admin AI Assistant
// Handles rate limits and network errors with typed throws

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`

/**
 * Calls Gemini with a system prompt containing live hotel context,
 * conversation history for memory, and the user's latest message.
 *
 * @param {string} userMessage         - The admin's latest message
 * @param {string} context             - Output of buildAdminContext()
 * @param {Array}  conversationHistory - Previous { sender, text } messages
 * @returns {Promise<string>}          - Gemini's reply text
 * @throws Error('RATE_LIMIT')         - HTTP 429
 * @throws Error('NETWORK_ERROR')      - Fetch failure
 */
export const callGeminiAdmin = async (userMessage, context, conversationHistory = []) => {
  const systemPrompt = `You are an intelligent AI operations assistant embedded inside Crisis Bridge — a real-time hotel emergency management system.

Your role is to help the HOTEL ADMIN make fast, informed decisions about emergencies, staff, and operations.

RULES (follow strictly):
1. Be concise — maximum 80 words per reply
2. Always reference specific rooms, staff names, and time elapsed from the CONTEXT
3. If there are unassigned active emergencies, ALWAYS mention them even if not asked
4. Use plain text only — no markdown, no asterisks, no bullet dashes, no headers
5. Never say "I don't know" — use context to give your best specific answer
6. If the admin asks something outside hotel operations, politely redirect them
7. Speak with urgency and precision — lives may depend on your guidance

=== LIVE HOTEL CONTEXT ===
${context}
==========================`

  // Include last 10 message turns for conversation memory
  const recentHistory = conversationHistory.slice(-10)

  // Map all messages including the new one
  const allMessages = [
    ...recentHistory.map(m => ({
      role: m.sender === 'admin' ? 'user' : 'model',
      text: m.text
    })),
    { role: 'user', text: userMessage }
  ]

  // Filter to ensure strict user/model alternation
  const contents = []
  allMessages.forEach(m => {
    // Only add if it's the first message (must be user) or alternates role
    if (contents.length === 0) {
      if (m.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: m.text }] })
      }
    } else if (contents[contents.length - 1].role !== m.role) {
      contents.push({ role: m.role, parts: [{ text: m.text }] })
    }
  })

  // Final check: Gemini requires last message from user
  if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
    contents.pop()
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('NETWORK_ERROR') // API key not configured
  }

  let response
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        system_instruction: {
          role: 'system',
          parts: [{ text: systemPrompt }]
        },
        contents,
        generationConfig: {
          temperature:     0.4,
          maxOutputTokens: 300,
          topP:            0.9,
          topK: 40
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
      }),
    })
  } catch {
    throw new Error('NETWORK_ERROR')
  }

  if (response.status === 429) throw new Error('RATE_LIMIT')
  if (!response.ok)            throw new Error(`NETWORK_ERROR`)

  const data = await response.json()
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'I could not generate a response. Your live data is still displaying — please try again.'
  )
}
