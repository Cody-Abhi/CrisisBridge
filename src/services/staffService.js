// src/services/staffService.js
// Staff presence and assignment helpers (used from guest side to read)

import { listenStaffPresence } from '../firebase/realtime'

/**
 * Subscribe to all staff presence for a hotel.
 * Returns an unsubscribe fn.
 * callback receives { [staffId]: { isOnline, isOnDuty, designation, name, lastSeen } }
 */
export const subscribeToStaffPresence = (hotelCode, callback) =>
  listenStaffPresence(hotelCode, callback)
