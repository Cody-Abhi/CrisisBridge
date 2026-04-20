// src/firebase/realtime.js
// Low-level Firebase Realtime Database helpers

import {
  ref, set, update, remove, push, onValue, off
} from 'firebase/database'
import { rtdb } from './config'

// â”€â”€ SOS Node â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Write an SOS record to sos/{hotelCode}/{roomNumber} */
export const writeSOS = (hotelCode, roomNumber, data) =>
  set(ref(rtdb, `sos/${hotelCode}/${roomNumber}`), data)

/** Listen to a specific room's SOS node */
export const listenSOS = (hotelCode, roomNumber, callback) => {
  const r = ref(rtdb, `sos/${hotelCode}/${roomNumber}`)
  onValue(r, snap => callback(snap.val()))
  return () => off(r)
}

/** Listen to all SOS under a hotel (for admin/staff) */
export const listenHotelSOS = (hotelCode, callback) => {
  const r = ref(rtdb, `sos/${hotelCode}`)
  onValue(r, snap => callback(snap.val() || {}))
  return () => off(r)
}

/** Delete the SOS record when resolved */
export const clearSOS = (hotelCode, roomNumber) =>
  remove(ref(rtdb, `sos/${hotelCode}/${roomNumber}`))

/** Update fields inside an SOS record (e.g., assign staff) */
export const patchSOS = (hotelCode, roomNumber, data) =>
  update(ref(rtdb, `sos/${hotelCode}/${roomNumber}`), data)

// â”€â”€ Chat Node â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Push a new chat message to the incident chat room */
export const pushChatMessage = async (incidentId, message) => {
  const msgRef = push(ref(rtdb, `chats/${incidentId}`))
  await set(msgRef, { ...message, messageId: msgRef.key })
  return msgRef.key
}

/** Listen to all messages in a chat room */
export const listenChat = (incidentId, callback) => {
  const r = ref(rtdb, `chats/${incidentId}`)
  onValue(r, snap => {
    const raw = snap.val() || {}
    const msgs = Object.values(raw).sort((a, b) => a.timestamp - b.timestamp)
    callback(msgs)
  })
  return () => off(r)
}

// â”€â”€ Staff Presence Node â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Set/update a staff member's presence record */
export const setStaffPresence = (hotelCode, staffId, data) =>
  set(ref(rtdb, `staff_presence/${hotelCode}/${staffId}`), data)

/** Listen to all staff presence for a hotel */
export const listenStaffPresence = (hotelCode, callback) => {
  const r = ref(rtdb, `staff_presence/${hotelCode}`)
  onValue(r, snap => callback(snap.val() || {}))
  return () => off(r)
}

/** Remove a staff member's presence (offline cleanup) */
export const removeStaffPresence = (hotelCode, staffId) =>
  remove(ref(rtdb, `staff_presence/${hotelCode}/${staffId}`))
