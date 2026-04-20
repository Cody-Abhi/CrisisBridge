// src/services/chatService.js
// Real-time chat service — wraps Realtime DB chat node

import { pushChatMessage, listenChat } from '../firebase/realtime'

/**
 * Send a text message to an incident chat room.
 * @param {string} incidentId
 * @param {object} sender  — { uid, name, role }
 * @param {string} text
 */
export const sendMessage = (incidentId, sender, text) =>
  pushChatMessage(incidentId, {
    type:       'text',
    senderId:   sender.uid,
    senderName: sender.name,
    senderRole: sender.role,
    message:    text,
    timestamp:  Date.now(),
  })

/**
 * Subscribe to live messages for an incident.
 * callback receives a sorted array of message objects.
 * Returns the unsubscribe function.
 */
export const subscribeToChat = (incidentId, callback) =>
  listenChat(incidentId, callback)
