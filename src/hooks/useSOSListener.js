// src/hooks/useSOSListener.js
// React hook — subscribes to the current guest's room SOS in Realtime DB
// Automatically re-subscribes when hotelCode/roomNumber change.

import { useEffect, useState, useCallback } from 'react'
import { listenSOS } from '../firebase/realtime'

/**
 * @param {string|null} hotelCode
 * @param {string|null} roomNumber
 * @returns {{ activeSOS: object|null, incidentId: string|null }}
 */
export function useSOSListener(hotelCode, roomNumber) {
  const [activeSOS,  setActiveSOS]  = useState(null)
  const [incidentId, setIncidentId] = useState(null)

  useEffect(() => {
    if (!hotelCode || !roomNumber) {
      setActiveSOS(null)
      setIncidentId(null)
      return
    }

    const unsubscribe = listenSOS(hotelCode, roomNumber, (data) => {
      setActiveSOS(data || null)
      if (data?.incidentId) setIncidentId(data.incidentId)
      if (!data) setIncidentId(null) // resolved
    })

    return unsubscribe
  }, [hotelCode, roomNumber])

  return { activeSOS, incidentId }
}
