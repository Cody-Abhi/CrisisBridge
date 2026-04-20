// src/services/hotelService.js
// Hotel lookup and guest check-in / check-out logic

import { getHotelDoc, updateUserDoc, serverTimestamp } from '../firebase/firestore'

/**
 * Validate that a hotel code exists in Firestore.
 * Returns { valid: true, hotelData } or { valid: false, error }
 */
export const validateHotelCode = async (hotelCode) => {
  try {
    const snap = await getHotelDoc(hotelCode)
    if (!snap.exists()) {
      return { valid: false, error: 'Hotel code not found. Please double-check with your front desk.' }
    }
    return { valid: true, hotelData: snap.data() }
  } catch (err) {
    return { valid: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Register a guest as currently staying.
 * Updates the user's guestProfile in Firestore.
 */
export const checkInGuest = async (uid, { hotelCode, hotelName, roomNumber, guestCount }) => {
  await updateUserDoc(uid, {
    'guestProfile.isCurrentlyStaying': true,
    'guestProfile.currentHotelCode':   hotelCode.toUpperCase(),
    'guestProfile.currentHotelName':   hotelName,
    'guestProfile.currentRoomNumber':  roomNumber,
    'guestProfile.numberOfGuests':     guestCount,
    'guestProfile.checkInDate':        serverTimestamp(),
    'guestProfile.checkOutDate':       null,
  })
}

/**
 * Check the guest out: clears the active stay fields.
 */
export const checkOutGuest = async (uid) => {
  await updateUserDoc(uid, {
    'guestProfile.isCurrentlyStaying': false,
    'guestProfile.currentHotelCode':   null,
    'guestProfile.currentHotelName':   null,
    'guestProfile.currentRoomNumber':  null,
    'guestProfile.checkOutDate':       serverTimestamp(),
  })
}
