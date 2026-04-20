import {
  appendIncidentTimeline,
  createIncidentDoc,
  serverTimestamp,
  updateIncidentDoc,
} from '../firebase/firestore'
import { clearSOS, pushChatMessage, writeSOS } from '../firebase/realtime'
import { buildIncidentId, floorFromRoom } from '../utils/helpers'

function getGuestEmergencyContext(currentUser, userProfile) {
  const guestProfile = userProfile?.guestProfile || {}
  const hotelCode = guestProfile.currentHotelCode?.toUpperCase?.() || ''
  const roomNumber = guestProfile.currentRoomNumber || ''

  if (!currentUser?.uid) {
    throw new Error('Guest account is required to trigger SOS.')
  }

  if (!hotelCode || !roomNumber) {
    throw new Error('Hotel and room details are required before sending SOS.')
  }

  return {
    hotelCode,
    roomNumber,
    floor: floorFromRoom(String(roomNumber)),
    guestId: currentUser.uid,
    guestName: userProfile?.name || 'Guest',
    guestPhone: userProfile?.phone || 'N/A',
    numberOfGuests: guestProfile.numberOfGuests || 1,
  }
}

function buildRealtimeSOSPayload({
  incidentId,
  emergencyType,
  triggeredAt,
  guestContext,
}) {
  return {
    incidentId,
    hotelCode: guestContext.hotelCode,
    roomNumber: guestContext.roomNumber,
    floor: guestContext.floor,
    guestId: guestContext.guestId,
    guestName: guestContext.guestName,
    guestPhone: guestContext.guestPhone,
    numberOfGuests: guestContext.numberOfGuests,
    emergencyType,
    triggeredAt,
    timestamp: triggeredAt,
    status: 'active',
    assignedStaffId: null,
    assignedStaffName: null,
    assignedDesignation: null,
    acceptedAt: null,
    arrivedAt: null,
  }
}

function buildIncidentPayload({
  incidentId,
  emergencyType,
  triggeredAt,
  guestContext,
}) {
  return {
    incidentId,
    hotelCode: guestContext.hotelCode,
    roomNumber: guestContext.roomNumber,
    floor: guestContext.floor,
    guestName: guestContext.guestName,
    guestPhone: guestContext.guestPhone,
    emergencyType,
    type: emergencyType.toUpperCase(),
    triggeredAt,
    guest: {
      userId: guestContext.guestId,
      name: guestContext.guestName,
      phone: guestContext.guestPhone,
      roomNumber: guestContext.roomNumber,
      floor: guestContext.floor,
      numberOfGuests: guestContext.numberOfGuests,
    },
    emergency: {
      type: emergencyType,
      triggeredAt,
    },
    response: {
      assignedStaffId: null,
      assignedStaffName: null,
      acceptedAt: null,
      arrivedAt: null,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: '',
    },
    status: 'active',
    timeline: [
      {
        event: 'TRIGGERED',
        timestamp: triggeredAt,
        actor: guestContext.guestId,
        actorName: guestContext.guestName,
        source: 'manual',
      },
    ],
  }
}

async function postSystemMessage(incidentId, message) {
  try {
    await pushChatMessage(incidentId, {
      type: 'system_message',
      message,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.warn('[SOS] Failed to create initial chat message:', error)
  }
}

export async function triggerSOS(currentUser, userProfile, emergencyType = 'common') {
  const guestContext = getGuestEmergencyContext(currentUser, userProfile)
  const triggeredAt = Date.now()
  const incidentId = buildIncidentId(guestContext.roomNumber, emergencyType)

  const realtimePayload = buildRealtimeSOSPayload({
    incidentId,
    emergencyType,
    triggeredAt,
    guestContext,
  })

  const incidentPayload = buildIncidentPayload({
    incidentId,
    emergencyType,
    triggeredAt,
    guestContext,
  })

  await Promise.all([
    writeSOS(guestContext.hotelCode, guestContext.roomNumber, realtimePayload),
    createIncidentDoc(incidentId, incidentPayload),
  ])

  await postSystemMessage(
    incidentId,
    `Guest triggered a ${emergencyType} SOS from Room ${guestContext.roomNumber}.`
  )

  return {
    incidentId,
    sos: realtimePayload,
    incident: incidentPayload,
  }
}

export async function resolveSOSFromGuest(hotelCode, roomNumber, incidentId, guestUid) {
  if (!hotelCode || !roomNumber) {
    throw new Error('Hotel and room details are required to cancel SOS.')
  }

  await clearSOS(hotelCode.toUpperCase(), roomNumber)

  if (!incidentId) {
    return
  }

  await updateIncidentDoc(incidentId, {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    resolvedBy: guestUid,
    resolutionNotes: 'Cancelled by guest from the dashboard.',
    'response.resolvedAt': serverTimestamp(),
    'response.resolvedBy': guestUid,
    'response.resolutionNotes': 'Cancelled by guest from the dashboard.',
  })

  await appendIncidentTimeline(incidentId, {
    event: 'GUEST_CANCELLED',
    actor: guestUid,
    note: 'Guest cancelled the SOS from the dashboard.',
  })

  await postSystemMessage(incidentId, 'Guest cancelled the emergency from the dashboard.')
}
