// src/firebase/firestore.js
// Low-level Firestore helpers — thin wrappers around Firebase SDK

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, orderBy, limit,
  serverTimestamp, arrayUnion, Timestamp
} from 'firebase/firestore'
import { db } from './config'

// ── User Documents ──────────────────────────────────────────────

/** Fetch a user document by UID */
export const getUserDoc = (uid) => getDoc(doc(db, 'users', uid))

/** Create or overwrite a user document */
export const setUserDoc = (uid, data) =>
  setDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() }, { merge: true })

/** Partial update of a user document */
export const updateUserDoc = (uid, data) => updateDoc(doc(db, 'users', uid), data)

// ── Hotel Documents ─────────────────────────────────────────────

/** Look up a hotel by its 6-char code */
export const getHotelDoc = (hotelCode) =>
  getDoc(doc(db, 'hotels', hotelCode.toUpperCase()))

// ── Incident Documents ──────────────────────────────────────────

/** Create a new incident record */
export const createIncidentDoc = (incidentId, data) =>
  setDoc(doc(db, 'incidents', incidentId), {
    ...data,
    createdAt: serverTimestamp(),
  })

/** Fetch a single incident */
export const getIncidentDoc = (incidentId) =>
  getDoc(doc(db, 'incidents', incidentId))

/** Update an incident (e.g., add resolution, change status) */
export const updateIncidentDoc = (incidentId, data) =>
  updateDoc(doc(db, 'incidents', incidentId), data)

/** Append to incident timeline array */
export const appendIncidentTimeline = (incidentId, event) =>
  updateDoc(doc(db, 'incidents', incidentId), {
    timeline: arrayUnion({ ...event, timestamp: Date.now() })
  })

/** Fetch all incidents for a specific guest */
export const getGuestIncidents = async (guestUserId) => {
  const q = query(
    collection(db, 'incidents'),
    where('guest.userId', '==', guestUserId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

// ── Staff Queries ────────────────────────────────────────────────

/**
 * Fetch all approved staff members for a hotel.
 * Returns array of user documents.
 */
export const getStaffForHotel = async (hotelCode) => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'staff'),
    where('staffProfile.hotelCode', '==', hotelCode),
    where('staffProfile.isApproved', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
}

/**
 * Fetch pending staff requests for a hotel.
 * Returns array of staff_request documents.
 */
export const getPendingStaffRequests = async (hotelCode) => {
  const q = query(
    collection(db, 'staff_requests'),
    where('hotelCode', '==', hotelCode),
    where('status', '==', 'pending'),
    orderBy('requestedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Fetch all incidents for a hotel, ordered by newest first.
 * Returns array of incident documents.
 */
export const getHotelIncidents = async (hotelCode, limitCount = 50) => {
  const q = query(
    collection(db, 'incidents'),
    where('hotelCode', '==', hotelCode),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Mark an incident resolved, with resolution notes.
 * Called by staff when they resolve; admin can also call this.
 */
export const resolveIncidentDoc = (incidentId, resolvedByUid, notes = '') =>
  updateDoc(doc(db, 'incidents', incidentId), {
    status:                       'resolved',
    'response.resolvedAt':        serverTimestamp(),
    'response.resolvedBy':        resolvedByUid,
    'response.resolutionNotes':   notes,
    timeline: arrayUnion({
      event:     'RESOLVED',
      timestamp: Date.now(),
      actor:     resolvedByUid,
    }),
  })

export { serverTimestamp, Timestamp }
