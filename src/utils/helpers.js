// src/utils/helpers.js
// Shared utility functions across the guest app

/**
 * Generate a unique incident ID.
 * Format: inc_{timestamp}_{room}_{type}
 */
export const buildIncidentId = (roomNumber, emergencyType) =>
  `inc_${Date.now()}_${roomNumber}_${emergencyType}`

/**
 * Derive the floor number from a room number string.
 * Room "305" → floor "3". Defaults to "1".
 */
export const floorFromRoom = (roomNumber) =>
  roomNumber?.length >= 3 ? roomNumber[0] : '1'

/**
 * Format a Unix timestamp (ms) as a human-readable string.
 * e.g. "Apr 15, 2026 11:25 PM"
 */
export const formatTimestamp = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

/**
 * Returns a color class string based on emergency type.
 */
export const emergencyColor = (type) => {
  const map = {
    fire:     'text-red-500',
    medical:  'text-emerald-500',
    security: 'text-amber-400',
    common:   'text-purple-500',
  }
  return map[type] || 'text-slate-400'
}

/**
 * Returns a badge label for an emergency type.
 */
export const emergencyLabel = (type) => {
  const map = {
    fire:     '🔥 Fire',
    medical:  '⚕️ Medical',
    security: '🛡️ Security',
    common:   '🆘 General',
  }
  return map[type] || type
}

/**
 * Convert a Firestore Timestamp or millis number to a Date string.
 */
export const toDateString = (val) => {
  if (!val) return '—'
  const date = val?.seconds ? new Date(val.seconds * 1000) : new Date(val)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
