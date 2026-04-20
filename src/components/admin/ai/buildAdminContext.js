// src/components/admin/ai/buildAdminContext.js
// Builds a rich, concise context string from live hotel data for Gemini

/**
 * Given live hotel data, returns a formatted plain-text context block.
 * This is injected into every Gemini system prompt so the AI knows
 * exactly what is happening at the hotel right now.
 *
 * @param {object|null}  hotel       - Firestore hotel document
 * @param {object}       activeSOS   - { [roomNumber]: sosData } from Realtime DB
 * @param {array}        staffList   - Array of staff user documents
 * @param {object}       todayStats  - { resolvedCount, avgResponseTime, pendingApprovals }
 */
export const buildAdminContext = (hotel, activeSOS, staffList, todayStats) => {
  if (!hotel) return 'Hotel data is not yet available.'

  const now = new Date().toLocaleTimeString('en-IN', {
    hour:    '2-digit',
    minute:  '2-digit',
    hour12:  true,
  })

  // ── Active SOS block ────────────────────────────────────────────────────────
  const sosEntries = activeSOS ? Object.values(activeSOS) : []
  const sosLines = sosEntries.length > 0
    ? sosEntries.map(s => {
        const ageSec = Math.floor((Date.now() - s.triggeredAt) / 1000)
        const ageMin = Math.floor(ageSec / 60)
        const ageStr = ageMin > 0 ? `${ageMin}m ${ageSec % 60}s ago` : `${ageSec}s ago`
        const assigned = s.assignedStaffName
          ? `Assigned to: ${s.assignedStaffName} (${s.assignedDesignation || s.assignedStaffName}), Status: ${s.status}`
          : 'UNASSIGNED — no staff has accepted yet'
        return `  • Room ${s.roomNumber} | Floor ${s.floor || '?'} | Type: ${s.emergencyType?.toUpperCase()} | Triggered ${ageStr} | ${assigned} | Guests in room: ${s.numberOfGuests || 1}`
      }).join('\n')
    : '  • None — hotel is calm'

  // ── Staff block ─────────────────────────────────────────────────────────────
  const staffEntries = staffList ? staffList.slice(0, 25) : []
  const onDutyStaff  = staffEntries.filter(s => s.staffProfile?.isOnDuty)
  const offDutyStaff = staffEntries.filter(s => !s.staffProfile?.isOnDuty)

  const staffSummary = staffEntries.length === 0
    ? '  • No staff data available'
    : [
        ...onDutyStaff.map(s => {
          const p      = s.staffProfile || {}
          const active = p.activeIncidents?.length > 0 ? `Handling: ${p.activeIncidents[0]}` : 'Free'
          return `  • [ON DUTY] ${s.name} | ${p.designation} | ${active}`
        }),
        ...offDutyStaff.map(s => `  • [Off Duty] ${s.name} | ${s.staffProfile?.designation || 'staff'}`),
      ].join('\n')

  // ── Operations block ────────────────────────────────────────────────────────
  const ops = `  • Incidents resolved today: ${todayStats?.resolvedCount ?? 0}
  • Avg response time: ${todayStats?.avgResponseTime ?? 'N/A'}
  • Pending staff approvals: ${todayStats?.pendingApprovals ?? 0}
  • Staff on duty: ${onDutyStaff.length} of ${staffEntries.length} total`

  return `
╔══════════════════════════════════════════════════╗
  HOTEL: ${hotel.hotelName}
  CODE:  ${hotel.hotelCode}
  TIME:  ${now}
  SIZE:  ${hotel.hotelConfig?.totalFloors || '?'} floors | ${hotel.hotelConfig?.totalRooms || '?'} rooms
╚══════════════════════════════════════════════════╝

ACTIVE EMERGENCIES (${sosEntries.length}):
${sosLines}

STAFF STATUS (${staffEntries.length} total):
${staffSummary}

OPERATIONS TODAY:
${ops}
`.trim()
}
